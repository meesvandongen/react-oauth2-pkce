import { TypedEventTarget } from "@mvd/event-target";
import {
	calculatePKCECodeChallenge,
	generateRandomCodeVerifier,
} from "oauth4webapi";
import {
	codeVerifierStorageKey,
	fetchTokens,
	fetchWithRefreshToken,
	redirectToLogout,
	stateStorageKey,
	urlHashStorageKey,
	validateState,
} from "./authentication";
import { createInternalConfig } from "./config";
import { decodeAccessToken, decodeIdToken, decodeJWT } from "./decodeJWT";
import { FetchError } from "./errors";
import { calculatePopupPosition } from "./popupUtils";
import {
	epochAtSecondsFromNow,
	epochTimeIsPast,
	FALLBACK_EXPIRE_TIME,
	getRefreshExpiresIn,
} from "./timeUtils";
import type {
	AuthConfig,
	AuthSnapshot,
	InternalConfig,
	InternalState,
	LoginMethod,
	LoginOptions,
	LogoutOptions,
	PrimitiveRecord,
	RefreshTokenExpiredEvent,
	TokenData,
	TokenResponse,
} from "./types";
import { fetchUserInfo } from "./userInfo";

interface EventMap {
	"pre-login": undefined;
	"post-login": TokenResponse;
	"refresh-token-expired": RefreshTokenExpiredEvent;
	error: Error;
	"state-change": AuthSnapshot;
}

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

export function createAuth(authConfig: AuthConfig): Auth {
	return new Auth(authConfig);
}

export class Auth extends TypedEventTarget<EventMap> {
	#storage: Storage;
	#state: InternalState;
	#snapshot: AuthSnapshot;
	#didFetchTokens = false;
	#userInfoForToken?: string;
	readonly #config: InternalConfig;

	constructor(authConfig: AuthConfig) {
		super();
		this.#config = createInternalConfig(authConfig);
		this.#storage =
			this.#config.storage === "session" ? sessionStorage : localStorage;
		this.#state = this.#loadInitialState();
		this.#snapshot = this.#computeSnapshot(this.#state);

		this.#startRefreshInterval();
		window.addEventListener("storage", this.#handleStorageEvent);
		// Handle initial load after current call stack is complete.
		// This gives consumers a chance to subscribe to events before any are emitted.
		// e.g. autoLogin might emit events immediately.
		queueMicrotask(() => {
			this.#handleInitialLoad();
		});
	}

	public subscribe = (callback: () => void) => {
		this.addEventListener("state-change", callback);
		return () => this.removeEventListener("state-change", callback);
	};

	public getSnapshot = () => {
		return this.#snapshot;
	};

	public login = (options?: LoginOptions): void => {
		this.#clearSession();
		this.#setState(
			{ loginInProgress: true, loginMethod: options?.method ?? "redirect" },
			{ persist: true },
		);
		this.dispatchTypedEvent("pre-login");
		this.#redirectToLogin(options).catch((error) => {
			console.error(error);
			this.#setState(
				{ error: error.message, loginInProgress: false },
				{ persist: true },
			);
			this.dispatchTypedEvent("error", { detail: error });
		});
	};

	public logout({
		state,
		logoutHint,
		additionalParameters,
	}: LogoutOptions = {}): void {
		const token = this.#state.token;
		const refreshToken = this.#state.refreshToken;
		const idToken = this.#state.idToken;
		this.#clearSession();
		this.#setState({ error: null }, { persist: true });
		if (this.#config?.logoutEndpoint && token) {
			redirectToLogout(
				this.#config,
				token,
				refreshToken,
				idToken,
				state,
				logoutHint,
				additionalParameters,
			);
		}
	}

	#loadInitialState(): InternalState {
		return {
			token: parseStoredValue<string | undefined>(
				this.#storage.getItem(this.#key("token")),
				"",
			),
			tokenExpire: parseStoredValue<number | undefined>(
				this.#storage.getItem(this.#key("tokenExpire")),
				epochAtSecondsFromNow(FALLBACK_EXPIRE_TIME),
			),
			refreshToken: parseStoredValue<string | undefined>(
				this.#storage.getItem(this.#key("refreshToken")),
				undefined,
			),
			refreshTokenExpire: parseStoredValue<number | undefined>(
				this.#storage.getItem(this.#key("refreshTokenExpire")),
				undefined,
			),
			idToken: parseStoredValue<string | undefined>(
				this.#storage.getItem(this.#key("idToken")),
				undefined,
			),
			userInfo: undefined,
			userInfoInProgress: false,
			userInfoError: null,
			loginInProgress: parseStoredValue<boolean>(
				this.#storage.getItem(this.#key("loginInProgress")),
				false,
			),
			refreshInProgress: parseStoredValue<boolean>(
				this.#storage.getItem(this.#key("refreshInProgress")),
				false,
			),
			loginMethod: parseStoredValue<LoginMethod>(
				this.#storage.getItem(this.#key("loginMethod")),
				"redirect",
			),
			error: null,
		};
	}

	#setState(
		partial: Partial<InternalState>,
		options: { persist?: boolean } = { persist: true },
	) {
		const next: InternalState = { ...this.#state, ...partial };
		if (shallowEqual(this.#state, next)) {
			return;
		}
		this.#state = next;
		this.#snapshot = this.#computeSnapshot(next);

		if (options.persist) {
			for (const key of Object.keys(partial) as Array<keyof InternalState>) {
				if (PERSISTED_KEYS.includes(key as any)) {
					const storageKey = this.#key(
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
		this.dispatchTypedEvent("state-change", { detail: this.#snapshot });
	}

	#computeSnapshot(state: InternalState): AuthSnapshot {
		const tokenData = this.#config.decodeToken
			? decodeAccessToken(state.token)
			: undefined;
		const idTokenData = decodeIdToken(state.idToken);
		return {
			token: state.token,
			tokenData,
			idToken: state.idToken,
			idTokenData,
			userInfo: state.userInfo,
			userInfoInProgress: state.userInfoInProgress,
			userInfoError: state.userInfoError,
			error: state.error,
			loginInProgress: state.loginInProgress,
		};
	}

	public fetchUserInfo = async (): Promise<TokenData | undefined> => {
		if (!this.#config.userInfoEndpoint) {
			throw new Error("'userInfoEndpoint' must be set to fetch user info");
		}
		if (!this.#state.token) {
			return undefined;
		}
		const token = this.#state.token;
		this.#setState(
			{ userInfoInProgress: true, userInfoError: null },
			{ persist: false },
		);
		try {
			const userInfo = await fetchUserInfo({
				userInfoEndpoint: this.#config.userInfoEndpoint,
				accessToken: token,
				credentials: this.#config.userInfoRequestCredentials,
			});
			this.#userInfoForToken = token;
			this.#setState(
				{ userInfo, userInfoInProgress: false, userInfoError: null },
				{ persist: false },
			);
			return userInfo;
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			this.#setState(
				{ userInfoInProgress: false, userInfoError: message },
				{ persist: false },
			);
			throw error;
		}
	};

	#autoFetchUserInfoIfEnabled(): void {
		if (!this.#config.autoFetchUserInfo) return;
		if (!this.#config.userInfoEndpoint) return;
		if (!this.#state.token) return;
		if (this.#state.userInfoInProgress) return;
		if (this.#userInfoForToken === this.#state.token && this.#state.userInfo) {
			return;
		}
		this.fetchUserInfo().catch((error: unknown) => {
			console.error(error);
			if (error instanceof Error) {
				this.dispatchTypedEvent("error", { detail: error });
			}
		});
	}

	#key(key: string): string {
		return `${this.#config.storageKeyPrefix}${key}`;
	}

	#clearSession() {
		this.#setState(
			{
				refreshToken: undefined,
				token: undefined,
				tokenExpire: undefined,
				refreshTokenExpire: undefined,
				idToken: undefined,
				userInfo: undefined,
				userInfoInProgress: false,
				userInfoError: null,
				loginInProgress: false,
				refreshInProgress: false,
			},
			{ persist: true },
		);
	}

	#handleTokenResponse(response: TokenResponse) {
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
			this.#config.tokenExpiresIn ?? response.expires_in ?? tokenExp;
		const refreshTokenExpiresIn =
			this.#config.refreshTokenExpiresIn ??
			getRefreshExpiresIn(tokenExpiresIn, response);

		const nextState: Partial<InternalState> = {
			token: response.access_token,
			tokenExpire: epochAtSecondsFromNow(tokenExpiresIn),
			userInfo: undefined,
			userInfoInProgress: false,
			userInfoError: null,
			error: null,
		};
		if (response.id_token) {
			nextState.idToken = response.id_token;
		}
		if (response.refresh_token) {
			nextState.refreshToken = response.refresh_token;
			if (
				!this.#state.refreshTokenExpire ||
				this.#config.refreshTokenExpiryStrategy !== "absolute"
			) {
				nextState.refreshTokenExpire = epochAtSecondsFromNow(
					refreshTokenExpiresIn,
				);
			}
		}
		this.#setState(nextState, { persist: true });
		this.#autoFetchUserInfoIfEnabled();
	}

	#handleExpiredRefreshToken(initial = false): void {
		if (this.#config.autoLogin && initial) {
			return this.login({
				method: this.#config.loginMethod,
			});
		}

		const eventData: RefreshTokenExpiredEvent = {
			login: this.login.bind(this),
		};

		this.dispatchTypedEvent("refresh-token-expired", { detail: eventData });
	}

	#refreshAccessToken(initial = false): void {
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
			return this.#handleExpiredRefreshToken(initial);
		}

		if (
			this.#state.refreshTokenExpire &&
			epochTimeIsPast(this.#state.refreshTokenExpire)
		) {
			return this.#handleExpiredRefreshToken(initial);
		}

		this.#setState({ refreshInProgress: true }, { persist: true });
		fetchWithRefreshToken({
			config: this.#config,
			refreshToken: this.#state.refreshToken,
		})
			.then((result: TokenResponse) => this.#handleTokenResponse(result))
			.catch((error: unknown) => {
				if (error instanceof FetchError) {
					if (error.status === 400) {
						this.#handleExpiredRefreshToken(initial);
						return;
					}
					console.error(error);
					this.#setState({ error: error.message });
					this.dispatchTypedEvent("error", { detail: error });
					if (initial) {
						this.login({ method: this.#config.loginMethod });
					}
				} else if (error instanceof Error) {
					console.error(error);
					this.#setState({ error: error.message });
					this.dispatchTypedEvent("error", { detail: error });
					if (initial) {
						this.login({ method: this.#config.loginMethod });
					}
				}
			})
			.finally(() => {
				this.#setState({ refreshInProgress: false }, { persist: true });
			});
	}

	#startRefreshInterval() {
		const randomStagger = 10000 * Math.random();
		setInterval(() => this.#refreshAccessToken(), 5000 + randomStagger);
	}

	async #handleInitialLoad() {
		if (this.#state.loginInProgress) {
			const urlParams = new URLSearchParams(window.location.search);
			if (!urlParams.get("code")) {
				const error_description =
					urlParams.get("error_description") ||
					"Bad authorization state. Refreshing the page and log in again might solve the issue.";
				console.error(
					`${error_description}\nExpected  to find a '?code=' parameter in the URL by now. Did the authentication get aborted or interrupted?`,
				);
				this.#setState({ error: error_description });
				this.#clearSession();
				return;
			}

			if (!this.#didFetchTokens) {
				this.#didFetchTokens = true;
				try {
					validateState(urlParams, this.#config.storage);
				} catch (e: unknown) {
					console.error(e);
					this.#setState(
						{ error: (e as Error).message, loginInProgress: false },
						{ persist: true },
					);
					return;
				}

				fetchTokens(this.#config)
					.then((tokens: TokenResponse) => {
						this.#handleTokenResponse(tokens);
						this.dispatchTypedEvent("post-login", { detail: tokens });
						if (this.#state.loginMethod === "popup") {
							window.close();
						}
					})
					.catch((error: Error) => {
						console.error(error);
						this.#setState({ error: error.message });
						this.dispatchTypedEvent("error", { detail: error });
					})
					.finally(() => {
						if (this.#config.clearURL) {
							const hash = this.#storage.getItem(
								this.#config.storageKeyPrefix + urlHashStorageKey,
							);
							this.#storage.removeItem(
								this.#config.storageKeyPrefix + urlHashStorageKey,
							);
							window.history.replaceState(
								null,
								"",
								`${window.location.pathname}${hash || window.location.hash}`,
							);
						}
						this.#setState({ loginInProgress: false }, { persist: true });
					});
			}
			return;
		}

		if (!this.#state.token && this.#config.autoLogin) {
			return this.login({ method: this.#config.loginMethod });
		}
		this.#refreshAccessToken(true);
	}

	#handleStorageEvent = (event: StorageEvent) => {
		if (event.storageArea !== this.#storage) {
			return;
		}
		if (!event.key || !event.key.startsWith(this.#config.storageKeyPrefix)) {
			return;
		}
		const key = event.key.replace(
			this.#config.storageKeyPrefix,
			"",
		) as (typeof PERSISTED_KEYS)[number];

		if (!PERSISTED_KEYS.includes(key)) {
			return;
		}

		const nextValue =
			event.newValue === null
				? undefined
				: parseStoredValue(event.newValue, undefined);
		const partial: Partial<InternalState> = {};
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
					(nextValue as LoginMethod | undefined) ?? "redirect";
				break;
			default:
				return;
		}
		this.#setState(partial, { persist: false });
	};

	async #redirectToLogin(options?: LoginOptions): Promise<void> {
		// PKCE requires WebCrypto and secure randomness.
		// In some test environments (and in non-secure browser contexts), crypto may be missing or partial.
		const cryptoObj = globalThis.crypto as Crypto | undefined;
		const hasSubtleDigest = typeof cryptoObj?.subtle?.digest === "function";
		const hasGetRandomValues = typeof cryptoObj?.getRandomValues === "function";
		if (!hasSubtleDigest || !hasGetRandomValues) {
			throw new Error(
				"The context/environment is not secure, and does not support the 'crypto.subtle' module. See: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/subtle for details",
			);
		}

		const navigationMethod =
			options?.method === "replace" ? "replace" : "assign";

		// Create and store a random string in storage, used as the 'code_verifier'
		const codeVerifier = generateRandomCodeVerifier();
		// Prefix the code verifier key name to prevent multi-application collisions
		const codeVerifierStorageKeyName =
			this.#config.storageKeyPrefix + codeVerifierStorageKey;
		this.#storage.setItem(codeVerifierStorageKeyName, codeVerifier);

		// Hash and Base64URL encode the code_verifier, used as the 'code_challenge'
		const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
		// Set query parameters and redirect user to OAuth2 authentication endpoint
		const params = new URLSearchParams({
			response_type: "code",
			client_id: this.#config.clientId,
			redirect_uri: this.#config.redirectUri,
			code_challenge: codeChallenge,
			code_challenge_method: "S256",
			...this.#config.extraAuthParameters,
			...options?.additionalParameters,
		});
		if (this.#config.scope !== undefined && !params.has("scope")) {
			params.append("scope", this.#config.scope);
		}
		this.#storage.removeItem(stateStorageKey);
		this.#storage.removeItem(this.#config.storageKeyPrefix + urlHashStorageKey);
		const state = options?.state ?? this.#config.state;
		if (state) {
			this.#storage.setItem(stateStorageKey, state);
			params.append("state", state);
		}
		if (window.location.hash) {
			this.#storage.setItem(
				this.#config.storageKeyPrefix + urlHashStorageKey,
				window.location.hash,
			);
		}
		const loginUrl = `${this.#config.authorizationEndpoint}?${params.toString()}`;
		this.dispatchTypedEvent("pre-login");
		if (options?.method === "popup") {
			const { width, height, left, top } = calculatePopupPosition(600, 600);
			const handle: null | WindowProxy = window.open(
				loginUrl,
				"loginPopup",
				`width=${width},height=${height},top=${top},left=${left}`,
			);
			if (handle) return;
			console.warn(
				"Popup blocked. Redirecting to login page. Disable popup blocker to use popup login.",
			);
		}
		window.location[navigationMethod](loginUrl);
	}
}

function shallowEqual(a: InternalState, b: InternalState): boolean {
	const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
	for (const key of keys) {
		// biome-ignore lint/suspicious/noExplicitAny: generic shallow compare
		if ((a as any)[key] !== (b as any)[key]) return false;
	}
	return true;
}
