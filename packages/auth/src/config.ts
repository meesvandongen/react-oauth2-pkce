import type { AuthConfig, InternalConfig } from "./types";

function stringIsUnset(value: string | null | undefined) {
	const unset = ["", undefined, null];
	return unset.includes(value);
}

export function createInternalConfig<
	AccessTokenData extends import("./types").TokenData,
	OpaqueAccessToken extends boolean = false,
>(
	passedConfig: AuthConfig<AccessTokenData, OpaqueAccessToken>,
): InternalConfig {
	const config = {
		autoLogin: true,
		clearURL: true,
		scope: undefined,
		loginMethod: "redirect",
		opaqueAccessToken: false,
		storage: "local",
		storageKeyPrefix: "ROCP_",
		refreshWithScope: true,
		refreshTokenExpiryStrategy: "renewable",
		tokenRequestCredentials: "same-origin",
		...passedConfig,
	} as InternalConfig;
	validateConfig(config);
	return config;
}

export function validateConfig(config: InternalConfig) {
	if (stringIsUnset(config?.clientId)) {
		throw Error("'clientId' must be set");
	}
	if (stringIsUnset(config?.authorizationEndpoint)) {
		throw Error("'authorizationEndpoint' must be set");
	}
	if (stringIsUnset(config?.tokenEndpoint)) {
		throw Error("'tokenEndpoint' must be set");
	}
	if (stringIsUnset(config?.redirectUri)) {
		throw Error("'redirectUri' must be set");
	}
}
