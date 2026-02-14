import { useSyncExternalStore } from "react";
import { Auth } from "./auth";
import type { AuthSnapshot } from "./types";

/**
 * Creates a hook bound to a specific Auth store instance.
 * Consumers can call this hook directly; no React provider is needed.
 */
export function useAuth(core: Auth): AuthSnapshot {
	return useSyncExternalStore(core.subscribe, core.getSnapshot);
}
