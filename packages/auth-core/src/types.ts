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
	id_token?: string;
};

export type LoginMethod = "redirect" | "replace" | "popup";

export type PopupPosition = {
	left: number;
	top: number;
	width: number;
	height: number;
};

export type PrimitiveRecord = { [key: string]: string | boolean | number };

// Input from users of the package, some optional values
export type AuthConfig = {
	clientId: string;
	authorizationEndpoint: string;
	tokenEndpoint: string;
	redirectUri: string;
	scope?: string;
	state?: string;
	logoutEndpoint?: string;
	logoutRedirect?: string;
	loginMethod?: LoginMethod;
	decodeToken?: boolean;
	autoLogin?: boolean;
	clearURL?: boolean;
	extraAuthParameters?: PrimitiveRecord;
	extraTokenParameters?: PrimitiveRecord;
	extraLogoutParameters?: PrimitiveRecord;
	tokenExpiresIn?: number;
	refreshTokenExpiresIn?: number;
	refreshTokenExpiryStrategy?: "renewable" | "absolute";
	storage?: "session" | "local";
	storageKeyPrefix?: string;
	refreshWithScope?: boolean;
	tokenRequestCredentials?: RequestCredentials;
};

export type RefreshTokenExpiredEvent = {
	login: (options?: LoginOptions) => void;
};

// The AuthProviders internal config type. All values will be set by user provided, or default values
export type InternalConfig = WithRequired<
	AuthConfig,
	| "loginMethod"
	| "decodeToken"
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
	idToken?: string;
	loginInProgress: boolean;
	refreshInProgress: boolean;
	loginMethod: LoginMethod;
	error: string | null;
};

export type AuthSnapshot = {
	token?: string;
	tokenData?: TokenData;
	idToken?: string;
	idTokenData?: TokenData;
	error: string | null;
	loginInProgress: boolean;
};

export type LoginOptions = {
	state?: string;
	additionalParameters?: PrimitiveRecord;
	method?: LoginMethod;
};
export type LogoutOptions = {
	state?: string;
	logoutHint?: string;
	additionalParameters?: PrimitiveRecord;
};
