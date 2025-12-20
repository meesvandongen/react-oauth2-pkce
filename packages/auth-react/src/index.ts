import { AuthCoreSnapshot, AuthCoreStore } from "@mvd/auth-core";
import { useSyncExternalStore } from "react";

/**
 * Creates a hook bound to a specific AuthCore store instance.
 * Consumers can call this hook directly; no React provider is needed.
 */
export function useAuth(core: AuthCoreStore): AuthCoreSnapshot {
	return useSyncExternalStore(
		core.subscribe,
		core.getSnapshot,
		core.getSnapshot,
	);
}
