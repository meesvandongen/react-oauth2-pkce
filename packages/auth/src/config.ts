import type { AuthConfig, InternalConfig } from "./types";

function stringIsUnset(value: string | null | undefined) {
	const unset = ["", undefined, null];
	return unset.includes(value);
}

export function createInternalConfig<
	HasUserInfo extends boolean,
	RequireData extends boolean,
	AccessTokenData extends import("./types").TokenData,
	IdTokenData extends import("./types").TokenData,
	UserInfoData extends import("./types").UserInfo,
>(
	passedConfig: AuthConfig<
		HasUserInfo,
		RequireData,
		AccessTokenData,
		IdTokenData,
		UserInfoData
	>,
): InternalConfig<
	HasUserInfo,
	RequireData,
	AccessTokenData,
	IdTokenData,
	UserInfoData
> {
	const config = {
		autoLogin: true,
		clearURL: true,
		decodeToken: true,
		requireData: false,
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
	} as InternalConfig<
		HasUserInfo,
		RequireData,
		AccessTokenData,
		IdTokenData,
		UserInfoData
	>;
	validateConfig(config);
	return config;
}

export function validateConfig<
	HasUserInfo extends boolean,
	RequireData extends boolean,
	AccessTokenData extends import("./types").TokenData,
	IdTokenData extends import("./types").TokenData,
	UserInfoData extends import("./types").UserInfo,
>(
	config: InternalConfig<
		HasUserInfo,
		RequireData,
		AccessTokenData,
		IdTokenData,
		UserInfoData
	>,
) {
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
