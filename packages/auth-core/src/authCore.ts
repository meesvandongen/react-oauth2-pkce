import { createInternalConfig } from "./authConfig";
import {
	fetchTokens,
	fetchWithRefreshToken,
	redirectToLogin,
	redirectToLogout,
	urlHashStorageKey,
	validateState,
} from "./authentication";
import { decodeAccessToken, decodeIdToken, decodeJWT } from "./decodeJWT";
import { FetchError } from "./errors";
import {
	epochAtSecondsFromNow,
	epochTimeIsPast,
	FALLBACK_EXPIRE_TIME,
	getRefreshExpiresIn,
} from "./timeUtils";
import type {
	TAuthConfig,
	TInternalConfig,
	TLoginMethod,
	TPrimitiveRecord,
	TRefreshTokenExpiredEvent,
	TTokenData,
	TTokenResponse,
} from "./types";

const PERSISTED_KEYS = [
	"token",
	"tokenExpire",
	"refreshToken",
	"refreshTokenExpire",
	"idToken",
	"loginInProgress",
	"refreshInProgress",
	"loginMethod",
] as const;

const STORAGE_KEY_MAP: Record<(typeof PERSISTED_KEYS)[number], string> = {
	token: "token",
	tokenExpire: "tokenExpire",
	refreshToken: "refreshToken",
	refreshTokenExpire: "refreshTokenExpire",
	idToken: "idToken",
	loginInProgress: "loginInProgress",
	refreshInProgress: "refreshInProgress",
	loginMethod: "loginMethod",
};

function parseStoredValue<T>(value: string | null, fallback: T): T {
	if (value === null || value === undefined) return fallback;
	try {
		return JSON.parse(value) as T;
	} catch (_err) {
		console.warn(
			`Failed to parse stored value '${value}'. Falling back to default.`,
		);
		return fallback;
	}
}

type Listener = () => void;

type AuthCoreInternalState = {
	token?: string;
	tokenExpire?: number;
	refreshToken?: string;
	refreshTokenExpire?: number;
	idToken?: string;
	loginInProgress: boolean;
	refreshInProgress: boolean;
	loginMethod: TLoginMethod;
	error: string | null;
};

export type AuthCoreSnapshot = {
	token: string;
	tokenData?: TTokenData;
	idToken?: string;
	idTokenData?: TTokenData;
	error: string | null;
	loginInProgress: boolean;
	logIn: LoginHandler;
	logOut: LogoutHandler;
};

type LoginOptions = {
	state?: string;
	additionalParameters?: TPrimitiveRecord;
	method?: TLoginMethod;
};
type LoginHandler = (options?: LoginOptions) => void;
type LogoutOptions = {
	state?: string;
	logoutHint?: string;
	additionalParameters?: TPrimitiveRecord;
};
type LogoutHandler = (options?: LogoutOptions) => void;

export interface AuthCoreStore {
	readonly config: TInternalConfig;
	getSnapshot(): AuthCoreSnapshot;
	subscribe(listener: Listener): () => void;
	logIn: LoginHandler;
	logOut: LogoutHandler;
}

export function createAuthCore(authConfig: TAuthConfig): AuthCoreStore {
	return new AuthCore(authConfig);
}

class AuthCore implements AuthCoreStore {
	#storage: Storage;
	#state: AuthCoreInternalState;
	#snapshot: AuthCoreSnapshot;
	#listeners: Set<Listener> = new Set();
	#refreshInterval?: number;
	#didFetchTokens = false;
	readonly config: TInternalConfig;

	constructor(authConfig: TAuthConfig) {
		this.config = createInternalConfig(authConfig);
		this.#storage =
			this.config.storage === "session" ? sessionStorage : localStorage;
		this.#state = this.loadInitialState();
		this.#snapshot = this.computeSnapshot(this.#state);

		this.startRefreshInterval();
		this.handleInitialLoad();
		window.addEventListener("storage", this.handleStorageEvent);
	}

	subscribe = (listener: Listener): (() => void) => {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	};

	getSnapshot = (): AuthCoreSnapshot => this.#snapshot;

	logIn({
		additionalParameters,
		method = "redirect",
		state,
	}: LoginOptions = {}): void {
		this.clearSession();
		this.setState(
			{ loginInProgress: true, loginMethod: method },
			{ persist: true },
		);
		let typeSafeState = state;
		if (state && typeof state !== "string") {
			const jsonState = JSON.stringify(state);
			console.warn(
				`Passed login state must be of type 'string'. Received '${jsonState}'. Ignoring value. In a future version, an error will be thrown here.`,
			);
			typeSafeState = undefined;
		}
		redirectToLogin(
			this.config,
			typeSafeState,
			additionalParameters,
			method,
		).catch((error) => {
			console.error(error);
			this.setState(
				{ error: error.message, loginInProgress: false },
				{ persist: true },
			);
		});
	}

	logOut({
		state,
		logoutHint,
		additionalParameters,
	}: LogoutOptions = {}): void {
		const token = this.#state.token;
		const refreshToken = this.#state.refreshToken;
		const idToken = this.#state.idToken;
		this.clearSession();
		this.setState({ error: null }, { persist: true });
		if (this.config?.logoutEndpoint && token) {
			redirectToLogout(
				this.config,
				token,
				refreshToken,
				idToken,
				state,
				logoutHint,
				additionalParameters,
			);
		}
	}

	private loadInitialState(): AuthCoreInternalState {
		return {
			token: parseStoredValue<string | undefined>(
				this.#storage.getItem(this.key("token")),
				"",
			),
			tokenExpire: parseStoredValue<number | undefined>(
				this.#storage.getItem(this.key("tokenExpire")),
				epochAtSecondsFromNow(FALLBACK_EXPIRE_TIME),
			),
			refreshToken: parseStoredValue<string | undefined>(
				this.#storage.getItem(this.key("refreshToken")),
				undefined,
			),
			refreshTokenExpire: parseStoredValue<number | undefined>(
				this.#storage.getItem(this.key("refreshTokenExpire")),
				undefined,
			),
			idToken: parseStoredValue<string | undefined>(
				this.#storage.getItem(this.key("idToken")),
				undefined,
			),
			loginInProgress: parseStoredValue<boolean>(
				this.#storage.getItem(this.key("loginInProgress")),
				false,
			),
			refreshInProgress: parseStoredValue<boolean>(
				this.#storage.getItem(this.key("refreshInProgress")),
				false,
			),
			loginMethod: parseStoredValue<TLoginMethod>(
				this.#storage.getItem(this.key("loginMethod")),
				"redirect",
			),
			error: null,
		};
	}

	private setState(
		partial: Partial<AuthCoreInternalState>,
		options: { persist?: boolean } = { persist: true },
	) {
		const next: AuthCoreInternalState = { ...this.#state, ...partial };
		if (shallowEqual(this.#state, next)) {
			return;
		}
		this.#state = next;
		this.#snapshot = this.computeSnapshot(next);

		if (options.persist) {
			for (const key of Object.keys(partial) as Array<
				keyof AuthCoreInternalState
			>) {
				if (PERSISTED_KEYS.includes(key as any)) {
					const storageKey = this.key(
						STORAGE_KEY_MAP[key as (typeof PERSISTED_KEYS)[number]],
					);
					const value = partial[key];
					if (value === undefined) {
						this.#storage.removeItem(storageKey);
					} else {
						this.#storage.setItem(storageKey, JSON.stringify(value));
					}
				}
			}
		}
		this.notify();
	}

	private computeSnapshot(state: AuthCoreInternalState): AuthCoreSnapshot {
		const tokenData = this.config.decodeToken
			? decodeAccessToken(state.token)
			: undefined;
		const idTokenData = decodeIdToken(state.idToken);
		return {
			token: state.token ?? "",
			tokenData,
			idToken: state.idToken,
			idTokenData,
			error: state.error,
			loginInProgress: state.loginInProgress,
			logIn: this.logIn.bind(this),
			logOut: this.logOut.bind(this),
		};
	}

	private notify() {
		this.#listeners.forEach((listener) => listener());
	}

	private key(key: string): string {
		return `${this.config.storageKeyPrefix}${key}`;
	}

	private clearSession() {
		this.setState(
			{
				refreshToken: undefined,
				token: undefined,
				tokenExpire: undefined,
				refreshTokenExpire: undefined,
				idToken: undefined,
				loginInProgress: false,
				refreshInProgress: false,
			},
			{ persist: true },
		);
	}

	private handleTokenResponse(response: TTokenResponse) {
		let tokenExp = FALLBACK_EXPIRE_TIME;
		try {
			if (response.id_token) {
				const decodedToken = decodeJWT(response.id_token);
				tokenExp = Math.round(Number(decodedToken.exp) - Date.now() / 1000);
			}
		} catch (e) {
			console.warn(`Failed to decode idToken: ${(e as Error).message}`);
		}

		const tokenExpiresIn =
			this.config.tokenExpiresIn ?? response.expires_in ?? tokenExp;
		const refreshTokenExpiresIn =
			this.config.refreshTokenExpiresIn ??
			getRefreshExpiresIn(tokenExpiresIn, response);

		const nextState: Partial<AuthCoreInternalState> = {
			token: response.access_token,
			tokenExpire: epochAtSecondsFromNow(tokenExpiresIn),
			error: null,
		};
		if (response.id_token) {
			nextState.idToken = response.id_token;
		}
		if (response.refresh_token) {
			nextState.refreshToken = response.refresh_token;
			if (
				!this.#state.refreshTokenExpire ||
				this.config.refreshTokenExpiryStrategy !== "absolute"
			) {
				nextState.refreshTokenExpire = epochAtSecondsFromNow(
					refreshTokenExpiresIn,
				);
			}
		}
		this.setState(nextState, { persist: true });
	}

	private handleExpiredRefreshToken(initial = false): void {
		if (this.config.autoLogin && initial) {
			return this.logIn({
				method: this.config.loginMethod,
			});
		}

		if (!this.config.onRefreshTokenExpire) {
			return this.logIn({
				method: this.config.loginMethod,
			});
		}

		this.config.onRefreshTokenExpire?.({
			login: this.logIn,
			logIn: this.logIn,
		} as TRefreshTokenExpiredEvent);
	}

	private refreshAccessToken(initial = false): void {
		if (!this.#state.token) {
			return;
		}
		if (!epochTimeIsPast(this.#state.tokenExpire)) {
			return;
		}

		if (this.#state.refreshInProgress && !initial) {
			return;
		}

		if (!this.#state.refreshToken) {
			return this.handleExpiredRefreshToken(initial);
		}

		if (
			this.#state.refreshTokenExpire &&
			epochTimeIsPast(this.#state.refreshTokenExpire)
		) {
			return this.handleExpiredRefreshToken(initial);
		}

		this.setState({ refreshInProgress: true }, { persist: true });
		fetchWithRefreshToken({
			config: this.config,
			refreshToken: this.#state.refreshToken,
		})
			.then((result: TTokenResponse) => this.handleTokenResponse(result))
			.catch((error: unknown) => {
				if (error instanceof FetchError) {
					if (error.status === 400) {
						this.handleExpiredRefreshToken(initial);
						return;
					}
					console.error(error);
					this.setState({ error: error.message });
					if (initial) {
						this.logIn({ method: this.config.loginMethod });
					}
				} else if (error instanceof Error) {
					console.error(error);
					this.setState({ error: error.message });
					if (initial) {
						this.logIn({ method: this.config.loginMethod });
					}
				}
			})
			.finally(() => {
				this.setState({ refreshInProgress: false }, { persist: true });
			});
	}

	private startRefreshInterval() {
		const randomStagger = 10000 * Math.random();
		this.#refreshInterval = window.setInterval(
			() => this.refreshAccessToken(),
			5000 + randomStagger,
		);
	}

	private async handleInitialLoad() {
		if (this.#state.loginInProgress) {
			const urlParams = new URLSearchParams(window.location.search);
			if (!urlParams.get("code")) {
				const error_description =
					urlParams.get("error_description") ||
					"Bad authorization state. Refreshing the page and log in again might solve the issue.";
				console.error(
					`${error_description}\nExpected  to find a '?code=' parameter in the URL by now. Did the authentication get aborted or interrupted?`,
				);
				this.setState({ error: error_description });
				this.clearSession();
				return;
			}

			if (!this.#didFetchTokens) {
				this.#didFetchTokens = true;
				try {
					validateState(urlParams, this.config.storage);
				} catch (e: unknown) {
					console.error(e);
					this.setState(
						{ error: (e as Error).message, loginInProgress: false },
						{ persist: true },
					);
					return;
				}

				fetchTokens(this.config)
					.then((tokens: TTokenResponse) => {
						this.handleTokenResponse(tokens);
						this.config.postLogin?.();
						if (this.#state.loginMethod === "popup") {
							window.close();
						}
					})
					.catch((error: Error) => {
						console.error(error);
						this.setState({ error: error.message });
					})
					.finally(() => {
						if (this.config.clearURL) {
							const hash = this.#storage.getItem(
								this.config.storageKeyPrefix + urlHashStorageKey,
							);
							this.#storage.removeItem(
								this.config.storageKeyPrefix + urlHashStorageKey,
							);
							window.history.replaceState(
								null,
								"",
								`${window.location.pathname}${hash || window.location.hash}`,
							);
						}
						this.setState({ loginInProgress: false }, { persist: true });
					});
			}
			return;
		}

		if (!this.#state.token && this.config.autoLogin) {
			return this.logIn({ method: this.config.loginMethod });
		}
		this.refreshAccessToken(true);
	}

	private handleStorageEvent = (event: StorageEvent) => {
		if (event.storageArea !== this.#storage) {
			return;
		}
		if (!event.key || !event.key.startsWith(this.config.storageKeyPrefix)) {
			return;
		}
		const key = event.key.replace(
			this.config.storageKeyPrefix,
			"",
		) as (typeof PERSISTED_KEYS)[number];

		if (!PERSISTED_KEYS.includes(key as any)) {
			return;
		}

		const nextValue =
			event.newValue === null
				? undefined
				: parseStoredValue(event.newValue, undefined);
		const partial: Partial<AuthCoreInternalState> = {};
		switch (key) {
			case "token":
				partial.token = nextValue as string | undefined;
				break;
			case "tokenExpire":
				partial.tokenExpire = nextValue as number | undefined;
				break;
			case "refreshToken":
				partial.refreshToken = nextValue as string | undefined;
				break;
			case "refreshTokenExpire":
				partial.refreshTokenExpire = nextValue as number | undefined;
				break;
			case "idToken":
				partial.idToken = nextValue as string | undefined;
				break;
			case "loginInProgress":
				partial.loginInProgress = Boolean(nextValue);
				break;
			case "refreshInProgress":
				partial.refreshInProgress = Boolean(nextValue);
				break;
			case "loginMethod":
				partial.loginMethod =
					(nextValue as TLoginMethod | undefined) ?? "redirect";
				break;
			default:
				return;
		}
		this.setState(partial, { persist: false });
	};
}

function shallowEqual(
	a: AuthCoreInternalState,
	b: AuthCoreInternalState,
): boolean {
	const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
	for (const key of keys) {
		// biome-ignore lint/suspicious/noExplicitAny: generic shallow compare
		if ((a as any)[key] !== (b as any)[key]) return false;
	}
	return true;
}
