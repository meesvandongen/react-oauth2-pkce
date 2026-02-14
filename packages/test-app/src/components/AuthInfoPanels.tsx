import { Auth } from "@mvd/auth";
import { useAuth, useAuthState } from "@mvd/auth/react";
import { useEffect, useState } from "react";

interface AuthStatusPanelProps {
	store: Auth;
	children?: React.ReactNode;
}

export function AuthStatusPanel({ store, children }: AuthStatusPanelProps) {
	const snapshot = useAuthState(store);
	const loginInProgress = snapshot.status === "loading";
	const token = snapshot.status === "authenticated" ? snapshot.token : null;
	const error = snapshot.error;

	return (
		<div data-testid="auth-status">
			<div data-testid="auth-state">{snapshot.status}</div>
			{loginInProgress && (
				<span data-testid="login-in-progress">Login in progress...</span>
			)}
			{error && (
				<div className="error" data-testid="auth-error">
					{error}
				</div>
			)}
			{token && <span data-testid="authenticated">Authenticated</span>}
			{!token && !loginInProgress && (
				<span data-testid="not-authenticated">Not authenticated</span>
			)}
			{children}
		</div>
	);
}

function AuthTokenDetailsAuthenticated({ store }: AuthStatusPanelProps) {
	const auth = useAuth(store);

	return (
		<div style={{ marginTop: "20px" }}>
			<h3>Access Token</h3>
			<pre data-testid="access-token">{auth.token}</pre>

			<h3>Decoded Token Data</h3>
			<pre data-testid="token-data">
				{JSON.stringify(auth.tokenData, null, 2)}
			</pre>

			<h3>ID Token</h3>
			<pre data-testid="id-token">{auth.idToken}</pre>

			<h3>Decoded ID Token Data</h3>
			<pre data-testid="id-token-data">
				{JSON.stringify(auth.idTokenData, null, 2)}
			</pre>

			{"userInfo" in auth && (
				<>
					<h3>UserInfo</h3>
					<pre data-testid="user-info">
						{JSON.stringify(auth.userInfo, null, 2)}
					</pre>
				</>
			)}
		</div>
	);
}

export function AuthTokenDetails({ store }: AuthStatusPanelProps) {
	const snapshot = useAuthState(store);
	if (snapshot.status !== "authenticated") {
		return null;
	}
	return <AuthTokenDetailsAuthenticated store={store} />;
}

type StorageSnapshot = Record<string, string | null>;

type AuthStorageSnapshot = {
	local: StorageSnapshot;
	session: StorageSnapshot;
};

function readBrowserStorage(storage: Storage): StorageSnapshot {
	const snapshot: StorageSnapshot = {};
	for (let i = 0; i < storage.length; i++) {
		const key = storage.key(i);
		if (key) {
			snapshot[key] = storage.getItem(key);
		}
	}

	return snapshot;
}

const createSnapshot = (): AuthStorageSnapshot => {
	return {
		local: readBrowserStorage(window.localStorage),
		session: readBrowserStorage(window.sessionStorage),
	};
};

export function AuthStorageDetails() {
	const [storageSnapshot, setStorageSnapshot] = useState<AuthStorageSnapshot>(
		() => createSnapshot(),
	);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const refresh = () => {
			setStorageSnapshot(createSnapshot());
		};

		const handleStorageEvent = () => {
			refresh();
		};

		refresh();
		window.addEventListener("storage", handleStorageEvent);
		const interval = window.setInterval(refresh, 500);

		return () => {
			window.removeEventListener("storage", handleStorageEvent);
			window.clearInterval(interval);
		};
	}, []);

	return (
		<div style={{ marginTop: "20px" }}>
			<h3>Local Storage Entries</h3>
			<pre data-testid="local-storage-entries">
				{JSON.stringify(storageSnapshot.local, null, 2)}
			</pre>

			<h3 style={{ marginTop: "20px" }}>Session Storage Entries</h3>
			<pre data-testid="session-storage-entries">
				{JSON.stringify(storageSnapshot.session, null, 2)}
			</pre>
		</div>
	);
}
