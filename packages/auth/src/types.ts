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

// OpenID Connect UserInfo response is JSON (or occasionally JWT); we model it as a generic record.
export type UserInfo = TokenData;

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

type BaseAuthConfig = {
	clientId: string;
	authorizationEndpoint: string;
	tokenEndpoint: string;
	redirectUri: string;
	scope?: string;
	oidc?: boolean;
	userInfo?: boolean;
	state?: string;
	logoutEndpoint?: string;
	logoutRedirect?: string;
	loginMethod?: LoginMethod;
	/**
	 * OpenID Connect UserInfo endpoint URL.
	 * If set, you can call `auth.fetchUserInfo()` to load user claims.
	 */
	userInfoEndpoint?: string;
	/**
	 * Credentials policy for the UserInfo request.
	 * Note: most providers only require the Authorization header; cookies are typically not needed.
	 */
	userInfoRequestCredentials?: RequestCredentials;
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

type AuthConfigWithUserInfo = BaseAuthConfig & {
	userInfo: true;
	userInfoEndpoint: string;
};

type AuthConfigWithoutUserInfo = BaseAuthConfig & {
	userInfo?: false;
};

// Input from users of the package, some optional values.
// If `userInfo` is true, `userInfoEndpoint` is required and snapshot types include userinfo fields.
export type AuthConfig<
	HasUserInfo extends boolean = boolean,
	HasOidc extends boolean = boolean,
	AccessTokenData extends TokenData = TokenData,
	IdTokenData extends TokenData = TokenData,
	UserInfoData extends UserInfo = UserInfo,
> = AuthConfigTyped<
	HasUserInfo,
	HasOidc,
	AccessTokenData,
	IdTokenData,
	UserInfoData
>;

export type AuthConfigTyped<
	HasUserInfo extends boolean = boolean,
	HasOidc extends boolean = boolean,
	AccessTokenData extends TokenData = TokenData,
	IdTokenData extends TokenData = TokenData,
	UserInfoData extends UserInfo = UserInfo,
> = ([HasUserInfo] extends [true]
	? AuthConfigWithUserInfo
	: [HasUserInfo] extends [false]
		? AuthConfigWithoutUserInfo
		: BaseAuthConfig) &
	([HasOidc] extends [true]
		? { oidc: true }
		: [HasOidc] extends [false]
			? { oidc?: false }
			: { oidc?: boolean });

export type RefreshTokenExpiredEvent = {
	login: (options?: LoginOptions) => void;
};

// The AuthProviders internal config type. All values will be set by user provided, or default values
export type InternalConfig<
	HasUserInfo extends boolean = boolean,
	HasOidc extends boolean = boolean,
	AccessTokenData extends TokenData = TokenData,
	IdTokenData extends TokenData = TokenData,
	UserInfoData extends UserInfo = UserInfo,
> = WithRequired<
	BaseAuthConfig,
	| "loginMethod"
	| "oidc"
	| "userInfo"
	| "userInfoRequestCredentials"
	| "autoLogin"
	| "clearURL"
	| "refreshTokenExpiryStrategy"
	| "storage"
	| "storageKeyPrefix"
	| "refreshWithScope"
	| "tokenRequestCredentials"
> &
	([HasUserInfo] extends [true]
		? {
				userInfo: true;
				userInfoEndpoint: string;
			}
		: [HasUserInfo] extends [false]
			? {
					userInfo: false;
				}
			:
					| {
							userInfo: true;
							userInfoEndpoint: string;
					  }
					| {
							userInfo: false;
					  }) &
	([HasOidc] extends [true]
		? { oidc: true }
		: [HasOidc] extends [false]
			? { oidc: false }
			: { oidc: boolean });

export type InternalState = {
	token?: string;
	tokenExpire?: number;
	refreshToken?: string;
	refreshTokenExpire?: number;
	idToken?: string;
	userInfo?: UserInfo;
	loginInProgress: boolean;
	refreshInProgress: boolean;
	loginMethod: LoginMethod;
	error: string | null;
};

type UserInfoSnapshotFields<
	HasUserInfo extends boolean,
	UserInfoData extends UserInfo,
> = [HasUserInfo] extends [true]
	? {
			userInfo: UserInfoData;
		}
	: [HasUserInfo] extends [false]
		? {
				userInfo?: never;
			}
		:
				| {
						userInfo: UserInfoData;
				  }
				| {
						userInfo?: never;
				  };

type OidcSnapshotFields<
	HasOidc extends boolean,
	IdTokenData extends TokenData,
> = [HasOidc] extends [true]
	? {
			idToken: string;
			idTokenData: IdTokenData;
		}
	: [HasOidc] extends [false]
		? {
				idToken?: never;
				idTokenData?: never;
			}
		:
				| {
						idToken: string;
						idTokenData: IdTokenData;
				  }
				| {
						idToken?: never;
						idTokenData?: never;
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

export type AuthAuthenticatedSnapshot<
	HasUserInfo extends boolean = boolean,
	HasOidc extends boolean = boolean,
> = AuthAuthenticatedSnapshotTyped<
	HasUserInfo,
	HasOidc,
	TokenData,
	TokenData,
	UserInfo
>;

export type AuthAuthenticatedSnapshotTyped<
	HasUserInfo extends boolean = boolean,
	HasOidc extends boolean = boolean,
	AccessTokenData extends TokenData = TokenData,
	IdTokenData extends TokenData = TokenData,
	UserInfoData extends UserInfo = UserInfo,
> = AuthSnapshotBase &
	UserInfoSnapshotFields<HasUserInfo, UserInfoData> &
	OidcSnapshotFields<HasOidc, IdTokenData> & {
		status: "authenticated";
		token: string;
		tokenData: AccessTokenData;
	};

export type AuthSnapshot<
	HasUserInfo extends boolean = boolean,
	HasOidc extends boolean = boolean,
	AccessTokenData extends TokenData = TokenData,
	IdTokenData extends TokenData = TokenData,
	UserInfoData extends UserInfo = UserInfo,
> =
	| AuthLoadingSnapshot
	| AuthUnauthenticatedSnapshot
	| AuthAuthenticatedSnapshotTyped<
			HasUserInfo,
			HasOidc,
			AccessTokenData,
			IdTokenData,
			UserInfoData
	  >;

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
