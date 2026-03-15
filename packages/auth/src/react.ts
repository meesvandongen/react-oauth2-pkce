import { useSyncExternalStore } from "react";
import { Auth } from "./auth";
import type {
	AuthAuthenticatedSnapshotTyped,
	AuthSnapshot,
	TokenData,
} from "./types";

/**
 * Returns full auth state (loading | unauthenticated | authenticated).
 * Consumers can call this hook directly; no React provider is needed.
 */
export function useAuth<
	AccessTokenData extends TokenData,
	OpaqueAccessToken extends boolean = false,
>(
	auth: Auth<AccessTokenData, OpaqueAccessToken>,
): AuthSnapshot<AccessTokenData, OpaqueAccessToken> {
	return useSyncExternalStore(auth.subscribe, auth.getSnapshot);
}

/**
 * Returns only the authenticated snapshot.
 * Throws if auth is currently loading or unauthenticated.
 */
export function useAuthRequired<
	AccessTokenData extends TokenData,
	OpaqueAccessToken extends boolean = false,
>(
	auth: Auth<AccessTokenData, OpaqueAccessToken>,
): AuthAuthenticatedSnapshotTyped<AccessTokenData, OpaqueAccessToken>;
export function useAuthRequired<
	AccessTokenData extends TokenData,
	OpaqueAccessToken extends boolean = false,
>(
	auth: Auth<AccessTokenData, OpaqueAccessToken>,
): AuthAuthenticatedSnapshotTyped<AccessTokenData, OpaqueAccessToken> {
	const snapshot = useAuth(auth);
	if (snapshot.status !== "authenticated") {
		throw new Error(
			`Expected authenticated auth state, got '${snapshot.status}'. Guard this route/component first or use useAuth().`,
		);
	}

	return snapshot;
}
