import type { TAuthConfig, TInternalConfig } from "./types";

function stringIsUnset(value: string | null | undefined) {
	const unset = ["", undefined, null];
	return unset.includes(value);
}

export function createInternalConfig(
	passedConfig: TAuthConfig,
): TInternalConfig {
	// Set default values for internal config object
	const {
		autoLogin = true,
		clearURL = true,
		decodeToken = true,
		scope = undefined,
		preLogin = () => null,
		postLogin = () => null,
		loginMethod = "redirect",
		onRefreshTokenExpire = undefined,
		storage = "local",
		storageKeyPrefix = "ROCP_",
		refreshWithScope = true,
		refreshTokenExpiryStrategy = "renewable",
		tokenRequestCredentials = "same-origin",
	}: TAuthConfig = passedConfig;

	const config: TInternalConfig = {
		...passedConfig,
		autoLogin: autoLogin,
		clearURL: clearURL,
		decodeToken: decodeToken,
		scope: scope,
		preLogin: preLogin,
		postLogin: postLogin,
		loginMethod: loginMethod,
		onRefreshTokenExpire: onRefreshTokenExpire,
		storage: storage,
		storageKeyPrefix: storageKeyPrefix,
		refreshWithScope: refreshWithScope,
		refreshTokenExpiryStrategy: refreshTokenExpiryStrategy,
		tokenRequestCredentials: tokenRequestCredentials,
	};
	validateConfig(config);
	return config;
}

export function validateConfig(config: TInternalConfig) {
	if (stringIsUnset(config?.clientId))
		throw Error(
			"'clientId' must be set in the 'AuthConfig' object passed to '@mvd/auth-react' AuthProvider",
		);
	if (stringIsUnset(config?.authorizationEndpoint))
		throw Error(
			"'authorizationEndpoint' must be set in the 'AuthConfig' object passed to '@mvd/auth-react' AuthProvider",
		);
	if (stringIsUnset(config?.tokenEndpoint))
		throw Error(
			"'tokenEndpoint' must be set in the 'AuthConfig' object passed to '@mvd/auth-react' AuthProvider",
		);
	if (stringIsUnset(config?.redirectUri))
		throw Error(
			"'redirectUri' must be set in the 'AuthConfig' object passed to '@mvd/auth-react' AuthProvider",
		);
	if (!["session", "local"].includes(config.storage))
		throw Error("'storage' must be one of ('session', 'local')");
}
