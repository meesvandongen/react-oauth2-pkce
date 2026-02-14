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
export function useAuthState<
	HasUserInfo extends boolean,
	HasOidc extends boolean,
	AccessTokenData extends TokenData,
	IdTokenData extends TokenData,
	UserInfoData extends UserInfo,
>(
	core: Auth<HasUserInfo, HasOidc, AccessTokenData, IdTokenData, UserInfoData>,
): AuthSnapshot<
	HasUserInfo,
	HasOidc,
	AccessTokenData,
	IdTokenData,
	UserInfoData
> {
	return useSyncExternalStore(core.subscribe, core.getSnapshot);
}

/**
 * Returns only the authenticated snapshot.
 * Throws if auth is currently loading or unauthenticated.
 */
export function useAuth<
	HasUserInfo extends boolean,
	HasOidc extends boolean,
	AccessTokenData extends TokenData,
	IdTokenData extends TokenData,
	UserInfoData extends UserInfo,
>(
	core: Auth<HasUserInfo, HasOidc, AccessTokenData, IdTokenData, UserInfoData>,
): AuthAuthenticatedSnapshotTyped<
	HasUserInfo,
	HasOidc,
	AccessTokenData,
	IdTokenData,
	UserInfoData
>;
export function useAuth<
	HasUserInfo extends boolean,
	HasOidc extends boolean,
	AccessTokenData extends TokenData,
	IdTokenData extends TokenData,
	UserInfoData extends UserInfo,
>(
	core: Auth<HasUserInfo, HasOidc, AccessTokenData, IdTokenData, UserInfoData>,
): AuthAuthenticatedSnapshotTyped<
	HasUserInfo,
	HasOidc,
	AccessTokenData,
	IdTokenData,
	UserInfoData
> {
	const snapshot = useAuthState(core);
	if (snapshot.status !== "authenticated") {
		throw new Error(
			`Expected authenticated auth state, got '${snapshot.status}'. Guard this route/component first or use useAuthState().`,
		);
	}

	return snapshot;
}
