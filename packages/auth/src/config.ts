import type { AuthConfig, InternalConfig } from "./types";

function stringIsUnset(value: string | null | undefined) {
	const unset = ["", undefined, null];
	return unset.includes(value);
}

export function createInternalConfig(passedConfig: AuthConfig): InternalConfig {
	const config: InternalConfig = {
		autoLogin: true,
		clearURL: true,
		decodeToken: true,
		autoFetchUserInfo: false,
		userInfoRequestCredentials: "same-origin",
		scope: undefined,
		loginMethod: "redirect",
		storage: "local",
		storageKeyPrefix: "ROCP_",
		refreshWithScope: true,
		refreshTokenExpiryStrategy: "renewable",
		tokenRequestCredentials: "same-origin",
		...passedConfig,
	};
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
	if (config.autoFetchUserInfo && stringIsUnset(config?.userInfoEndpoint)) {
		throw Error(
			"'userInfoEndpoint' must be set when 'autoFetchUserInfo' is true",
		);
	}
}
