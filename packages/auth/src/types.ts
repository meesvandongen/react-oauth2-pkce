// Makes only the specified keys required in the provided type
// Source: https://www.emmanuelgautier.com/blog/snippets/typescript-required-properties
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

interface TokenRqBase {
	grant_type: string;
	client_id: string;
	redirect_uri: string;
}

export interface TokenRequestWithCodeAndVerifier extends TokenRqBase {
	code: string;
	code_verifier: string;
}

export interface TokenRequestForRefresh extends TokenRqBase {
	scope?: string;
	refresh_token: string;
}

export type TokenRequest =
	| TokenRequestWithCodeAndVerifier
	| TokenRequestForRefresh;

export type TokenData = {
	// biome-ignore lint: It really can be `any` (almost)
	[x: string]: any;
};

export type TokenResponse = {
	access_token: string;
	scope: string;
	token_type: string;
	expires_in?: number;
	refresh_token?: string;
	refresh_token_expires_in?: number;
	refresh_expires_in?: number;
};

export type LoginMethod = "redirect" | "replace" | "popup";

export type PopupPosition = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export type PrimitiveRecord = { [key: string]: string | boolean | number };

type BaseAuthConfig = {
	clientId: string;
	authorizationEndpoint: string;
	tokenEndpoint: string;
	redirectUri: string;
	scope?: string;
	/**
	 * Optional application-defined round-trip value forwarded to the authorization request.
	 * This library does not store or validate callback state.
	 */
	state?: string;
	logoutEndpoint?: string;
	loginMethod?: LoginMethod;
	autoLogin?: boolean;
	clearURL?: boolean;
	extraAuthParameters?: PrimitiveRecord;
	extraTokenParameters?: PrimitiveRecord;
	tokenExpiresIn?: number;
	refreshTokenExpiresIn?: number;
	refreshTokenExpiryStrategy?: "renewable" | "absolute";
	storage?: "session" | "local";
	storageKeyPrefix?: string;
	refreshWithScope?: boolean;
	tokenRequestCredentials?: RequestCredentials;
};

export type AuthConfig<AccessTokenData extends TokenData = TokenData> =
	BaseAuthConfig;

export type RefreshTokenExpiredEvent = {
	login: (options?: LoginOptions) => void;
};

// The AuthProviders internal config type. All values will be set by user provided, or default values
export type InternalConfig = WithRequired<
	BaseAuthConfig,
	| "loginMethod"
	| "autoLogin"
	| "clearURL"
	| "refreshTokenExpiryStrategy"
	| "storage"
	| "storageKeyPrefix"
	| "refreshWithScope"
	| "tokenRequestCredentials"
>;

export type InternalState = {
	token?: string;
	tokenExpire?: number;
	refreshToken?: string;
	refreshTokenExpire?: number;
	loginInProgress: boolean;
	refreshInProgress: boolean;
	loginMethod: LoginMethod;
	error: string | null;
};

type AuthSnapshotBase = {
	error: string | null;
};

export type AuthLoadingSnapshot = AuthSnapshotBase & {
	status: "loading";
};

export type AuthUnauthenticatedSnapshot = AuthSnapshotBase & {
	status: "unauthenticated";
};

export type AuthAuthenticatedSnapshot =
	AuthAuthenticatedSnapshotTyped<TokenData>;

export type AuthAuthenticatedSnapshotTyped<
	AccessTokenData extends TokenData = TokenData,
> = AuthSnapshotBase & {
	status: "authenticated";
	token: string;
	tokenData: AccessTokenData;
};

export type AuthSnapshot<AccessTokenData extends TokenData = TokenData> =
	| AuthLoadingSnapshot
	| AuthUnauthenticatedSnapshot
	| AuthAuthenticatedSnapshotTyped<AccessTokenData>;

export type LoginOptions = {
	/**
	 * Optional application-defined round-trip value forwarded to the authorization request.
	 */
	state?: string;
	additionalParameters?: PrimitiveRecord;
	method?: LoginMethod;
};
