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
	state?: string;
	logoutEndpoint?: string;
	logoutRedirect?: string;
	loginMethod?: LoginMethod;
	decodeToken?: boolean;
	/**
	 * OpenID Connect UserInfo endpoint URL.
	 * If set, you can call `auth.fetchUserInfo()` to load user claims even when access tokens are opaque.
	 */
	userInfoEndpoint?: string;
	/**
	 * If true, userinfo will automatically be fetched after login/refresh (requires `userInfoEndpoint`).
	 */
	autoFetchUserInfo?: boolean;
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
	/**
	 * If true, authenticated snapshots require decoded tokenData/idTokenData (and userInfo when enabled).
	 * This enables non-null payload types in `useAuthenticatedAuth()`.
	 */
	requireData?: boolean;
};

type AuthConfigWithAutoFetchUserInfo = BaseAuthConfig & {
	autoFetchUserInfo: true;
	userInfoEndpoint: string;
};

type AuthConfigWithoutAutoFetchUserInfo = BaseAuthConfig & {
	autoFetchUserInfo?: false;
};

// Input from users of the package, some optional values.
// If `autoFetchUserInfo` is true, `userInfoEndpoint` is required and snapshot types include userinfo fields.
export type AuthConfig<
	HasUserInfo extends boolean = boolean,
	RequireData extends boolean = boolean,
	AccessTokenData extends TokenData = TokenData,
	IdTokenData extends TokenData = TokenData,
	UserInfoData extends UserInfo = UserInfo,
> = AuthConfigTyped<
	HasUserInfo,
	RequireData,
	AccessTokenData,
	IdTokenData,
	UserInfoData
>;

export type AuthConfigTyped<
	HasUserInfo extends boolean = boolean,
	RequireData extends boolean = boolean,
	AccessTokenData extends TokenData = TokenData,
	IdTokenData extends TokenData = TokenData,
	UserInfoData extends UserInfo = UserInfo,
> = ([HasUserInfo] extends [true]
	? AuthConfigWithAutoFetchUserInfo
	: [HasUserInfo] extends [false]
		? AuthConfigWithoutAutoFetchUserInfo
		: BaseAuthConfig) & {
	/**
	 * Optional mapper for decoded access token payload.
	 * Return type is inferred as `tokenData` type in snapshots.
	 */
	mapTokenData?: (tokenData: TokenData) => AccessTokenData;
	/**
	 * Optional mapper for decoded ID token payload.
	 * Return type is inferred as `idTokenData` type in snapshots.
	 */
	mapIdTokenData?: (tokenData: TokenData) => IdTokenData;
	/**
	 * Optional mapper for fetched userinfo payload.
	 * Return type is inferred as `userInfo` type in snapshots.
	 */
	mapUserInfo?: (userInfo: UserInfo) => UserInfoData;
} & ([RequireData] extends [true]
		? { requireData: true }
		: [RequireData] extends [false]
			? { requireData?: false }
			: { requireData?: boolean });

export type RefreshTokenExpiredEvent = {
	login: (options?: LoginOptions) => void;
};

type PayloadMappers<
	AccessTokenData extends TokenData,
	IdTokenData extends TokenData,
	UserInfoData extends UserInfo,
> = {
	mapTokenData?: (tokenData: TokenData) => AccessTokenData;
	mapIdTokenData?: (tokenData: TokenData) => IdTokenData;
	mapUserInfo?: (userInfo: UserInfo) => UserInfoData;
};

// The AuthProviders internal config type. All values will be set by user provided, or default values
export type InternalConfig<
	HasUserInfo extends boolean = boolean,
	RequireData extends boolean = boolean,
	AccessTokenData extends TokenData = TokenData,
	IdTokenData extends TokenData = TokenData,
	UserInfoData extends UserInfo = UserInfo,
> = WithRequired<
	BaseAuthConfig & PayloadMappers<AccessTokenData, IdTokenData, UserInfoData>,
	| "loginMethod"
	| "decodeToken"
	| "autoFetchUserInfo"
	| "userInfoRequestCredentials"
	| "autoLogin"
	| "clearURL"
	| "refreshTokenExpiryStrategy"
	| "storage"
	| "storageKeyPrefix"
	| "refreshWithScope"
	| "tokenRequestCredentials"
	| "requireData"
> &
	([HasUserInfo] extends [true]
		? {
				autoFetchUserInfo: true;
				userInfoEndpoint: string;
			}
		: [HasUserInfo] extends [false]
			? {
					autoFetchUserInfo: false;
				}
			:
					| {
							autoFetchUserInfo: true;
							userInfoEndpoint: string;
					  }
					| {
							autoFetchUserInfo: false;
					  }) &
	([RequireData] extends [true]
		? { requireData: true }
		: [RequireData] extends [false]
			? { requireData: false }
			: { requireData: boolean });

export type InternalState = {
	token?: string;
	tokenExpire?: number;
	refreshToken?: string;
	refreshTokenExpire?: number;
	idToken?: string;
	userInfo?: UserInfo;
	userInfoInProgress: boolean;
	userInfoError: string | null;
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
			userInfo: UserInfoData | null;
			userInfoInProgress: boolean;
			userInfoError: string | null;
		}
	: [HasUserInfo] extends [false]
		? {
				userInfo?: never;
				userInfoInProgress?: never;
				userInfoError?: never;
			}
		:
				| {
						userInfo: UserInfoData | null;
						userInfoInProgress: boolean;
						userInfoError: string | null;
				  }
				| {
						userInfo?: never;
						userInfoInProgress?: never;
						userInfoError?: never;
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

export type AuthAuthenticatedSnapshot<HasUserInfo extends boolean = boolean> =
	AuthAuthenticatedSnapshotTyped<
		HasUserInfo,
		TokenData,
		TokenData,
		UserInfo,
		boolean
	>;

export type AuthAuthenticatedSnapshotTyped<
	HasUserInfo extends boolean = boolean,
	AccessTokenData extends TokenData = TokenData,
	IdTokenData extends TokenData = TokenData,
	UserInfoData extends UserInfo = UserInfo,
	RequireData extends boolean = boolean,
> = AuthSnapshotBase &
	UserInfoSnapshotFields<HasUserInfo, UserInfoData> & {
		status: "authenticated";
		token: string;
		tokenData: [RequireData] extends [true]
			? AccessTokenData
			: AccessTokenData | null;
		idToken: string | null;
		idTokenData: [RequireData] extends [true]
			? IdTokenData
			: IdTokenData | null;
	};

type UserInfoRequiredField<
	HasUserInfo extends boolean,
	UserInfoData extends UserInfo,
> = [HasUserInfo] extends [true] ? { userInfo: UserInfoData } : {};

export type AuthAuthenticatedSnapshotWithRequiredData<
	HasUserInfo extends boolean = boolean,
	AccessTokenData extends TokenData = TokenData,
	IdTokenData extends TokenData = TokenData,
	UserInfoData extends UserInfo = UserInfo,
> = Omit<
	AuthAuthenticatedSnapshotTyped<
		HasUserInfo,
		AccessTokenData,
		IdTokenData,
		UserInfoData,
		true
	>,
	"tokenData" | "idTokenData" | "userInfo"
> & {
	tokenData: AccessTokenData;
	idTokenData: IdTokenData;
} & UserInfoRequiredField<HasUserInfo, UserInfoData>;

export type AuthSnapshot<
	HasUserInfo extends boolean = boolean,
	AccessTokenData extends TokenData = TokenData,
	IdTokenData extends TokenData = TokenData,
	UserInfoData extends UserInfo = UserInfo,
	RequireData extends boolean = boolean,
> =
	| AuthLoadingSnapshot
	| AuthUnauthenticatedSnapshot
	| AuthAuthenticatedSnapshotTyped<
			HasUserInfo,
			AccessTokenData,
			IdTokenData,
			UserInfoData,
			RequireData
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
