import { useSyncExternalStore } from "react";
import { Auth } from "./auth";
import type {
	AuthAuthenticatedSnapshotTyped,
	AuthSnapshot,
	TokenData,
	UserInfo,
} from "./types";

/**
 * Creates a hook bound to a specific Auth store instance.
 * Consumers can call this hook directly; no React provider is needed.
 */
export function useAuth<
	HasUserInfo extends boolean,
	AccessTokenData extends TokenData,
	IdTokenData extends TokenData,
	UserInfoData extends UserInfo,
	RequireData extends boolean,
>(
	core: Auth<
		HasUserInfo,
		AccessTokenData,
		IdTokenData,
		UserInfoData,
		RequireData
	>,
): AuthSnapshot<
	HasUserInfo,
	AccessTokenData,
	IdTokenData,
	UserInfoData,
	RequireData
> {
	return useSyncExternalStore(core.subscribe, core.getSnapshot);
}

/**
 * Returns only the authenticated snapshot.
 * Throws if auth is currently loading or unauthenticated.
 */
export function useAuthenticatedAuth<
	HasUserInfo extends boolean,
	AccessTokenData extends TokenData,
	IdTokenData extends TokenData,
	UserInfoData extends UserInfo,
	RequireData extends boolean,
>(
	core: Auth<
		HasUserInfo,
		AccessTokenData,
		IdTokenData,
		UserInfoData,
		RequireData
	>,
): AuthAuthenticatedSnapshotTyped<
	HasUserInfo,
	AccessTokenData,
	IdTokenData,
	UserInfoData,
	RequireData
>;
export function useAuthenticatedAuth<
	HasUserInfo extends boolean,
	AccessTokenData extends TokenData,
	IdTokenData extends TokenData,
	UserInfoData extends UserInfo,
	RequireData extends boolean,
>(
	core: Auth<
		HasUserInfo,
		AccessTokenData,
		IdTokenData,
		UserInfoData,
		RequireData
	>,
): AuthAuthenticatedSnapshotTyped<
	HasUserInfo,
	AccessTokenData,
	IdTokenData,
	UserInfoData,
	RequireData
> {
	const snapshot = useAuth(core);
	if (snapshot.status !== "authenticated") {
		throw new Error(
			`Expected authenticated auth state, got '${snapshot.status}'. Guard this route/component first or use useAuth().`,
		);
	}

	if (core.requiresData) {
		if (snapshot.tokenData === null) {
			throw new Error(
				"Expected non-null tokenData. Ensure decodeToken is enabled and access token is a decodable JWT.",
			);
		}
		if (snapshot.idTokenData === null) {
			throw new Error(
				"Expected non-null idTokenData. Ensure the provider returns an id_token and it is a decodable JWT.",
			);
		}
		if ("userInfo" in snapshot && snapshot.userInfo === null) {
			throw new Error(
				"Expected non-null userInfo. Ensure autoFetchUserInfo is enabled and userinfo has completed successfully.",
			);
		}
	}

	return snapshot;
}
