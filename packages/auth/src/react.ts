import { useSyncExternalStore } from "react";
import { Auth } from "./auth";
import type {
	AuthAuthenticatedSnapshotTyped,
	AuthSnapshot,
	TokenData,
	UserInfo,
} from "./types";

/**
 * Returns full auth state (loading | unauthenticated | authenticated).
 * Consumers can call this hook directly; no React provider is needed.
 */
export function useAuth<
	HasUserInfo extends boolean,
	HasOidc extends boolean,
	AccessTokenData extends TokenData,
	IdTokenData extends TokenData,
	UserInfoData extends UserInfo,
>(
	auth: Auth<HasUserInfo, HasOidc, AccessTokenData, IdTokenData, UserInfoData>,
): AuthSnapshot<
	HasUserInfo,
	HasOidc,
	AccessTokenData,
	IdTokenData,
	UserInfoData
> {
	return useSyncExternalStore(auth.subscribe, auth.getSnapshot);
}

/**
 * Returns only the authenticated snapshot.
 * Throws if auth is currently loading or unauthenticated.
 */
export function useAuthRequired<
	HasUserInfo extends boolean,
	HasOidc extends boolean,
	AccessTokenData extends TokenData,
	IdTokenData extends TokenData,
	UserInfoData extends UserInfo,
>(
	auth: Auth<HasUserInfo, HasOidc, AccessTokenData, IdTokenData, UserInfoData>,
): AuthAuthenticatedSnapshotTyped<
	HasUserInfo,
	HasOidc,
	AccessTokenData,
	IdTokenData,
	UserInfoData
>;
export function useAuthRequired<
	HasUserInfo extends boolean,
	HasOidc extends boolean,
	AccessTokenData extends TokenData,
	IdTokenData extends TokenData,
	UserInfoData extends UserInfo,
>(
	auth: Auth<HasUserInfo, HasOidc, AccessTokenData, IdTokenData, UserInfoData>,
): AuthAuthenticatedSnapshotTyped<
	HasUserInfo,
	HasOidc,
	AccessTokenData,
	IdTokenData,
	UserInfoData
> {
	const snapshot = useAuth(auth);
	if (snapshot.status !== "authenticated") {
		throw new Error(
			`Expected authenticated auth state, got '${snapshot.status}'. Guard this route/component first or use useAuth().`,
		);
	}

	return snapshot;
}
