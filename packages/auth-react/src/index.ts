import { Auth, AuthSnapshot } from "@mvd/auth-core";
import { useSyncExternalStore } from "react";

/**
 * Creates a hook bound to a specific AuthCore store instance.
 * Consumers can call this hook directly; no React provider is needed.
 */
export function useAuth(core: Auth): AuthSnapshot {
	return useSyncExternalStore(core.subscribe, core.getSnapshot);
}
