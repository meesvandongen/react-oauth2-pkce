export { createInternalConfig, validateConfig } from "./authConfig";
export type { AuthCoreSnapshot, AuthCoreStore } from "./authCore";
export { createAuthCore } from "./authCore";
export {
	codeVerifierStorageKey,
	fetchTokens,
	fetchWithRefreshToken,
	redirectToLogin,
	redirectToLogout,
	stateStorageKey,
	urlHashStorageKey,
	validateState,
} from "./authentication";
export {
	decodeAccessToken,
	decodeIdToken,
	decodeJWT,
} from "./decodeJWT";
export { FetchError } from "./errors";
export { postWithXForm } from "./httpUtils";
export {
	generateCodeChallenge,
	generateRandomString,
	getRandomInteger,
} from "./pkceUtils";
export { calculatePopupPosition } from "./popupUtils";
export {
	epochAtSecondsFromNow,
	epochTimeIsPast,
	FALLBACK_EXPIRE_TIME,
	getRefreshExpiresIn,
} from "./timeUtils";
export type {
	TAuthConfig,
	TInternalConfig,
	TLoginMethod,
	TPopupPosition,
	TPrimitiveRecord,
	TRefreshTokenExpiredEvent,
	TTokenData,
	TTokenRequest,
	TTokenRequestForRefresh,
	TTokenRequestWithCodeAndVerifier,
	TTokenResponse,
} from "./types";
