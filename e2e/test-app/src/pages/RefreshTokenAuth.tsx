import { useCallback, useContext, useState } from "react";
import {
	AuthContext,
	AuthProvider,
	type IAuthContext,
	type TAuthConfig,
	type TRefreshTokenExpiredEvent,
} from "react-oauth2-code-pkce";

export function RefreshTokenAuth() {
	const [refreshCallbackStatus, setRefreshCallbackStatus] =
		useState("not-invoked");
	const [refreshExpiredEvent, setRefreshExpiredEvent] =
		useState<TRefreshTokenExpiredEvent | null>(null);

	const handleRefreshTokenExpire = useCallback(
		(event: TRefreshTokenExpiredEvent) => {
			console.log("Refresh token expired callback invoked");
			setRefreshCallbackStatus("invoked");
			setRefreshExpiredEvent(event);
		},
		[],
	);

	const authConfig: TAuthConfig = {
		clientId: "test-app",
		authorizationEndpoint: "http://localhost:5556/dex/auth",
		tokenEndpoint: "http://localhost:5556/dex/token",
		redirectUri: "http://localhost:3010/refresh/",
		scope: "openid profile email offline_access",
		decodeToken: true,
		autoLogin: false,
		clearURL: true,
		storage: "session",
		storageKeyPrefix: "refresh_",
		// Short expiry times for testing refresh behavior
		tokenExpiresIn: 30, // 30 seconds
		refreshTokenExpiresIn: 120, // 2 minutes
		refreshTokenExpiryStrategy: "renewable",
		refreshWithScope: true,
		onRefreshTokenExpire: handleRefreshTokenExpire,
	};

	return (
		<AuthProvider authConfig={authConfig}>
			<AuthStatus
				refreshCallbackStatus={refreshCallbackStatus}
				refreshExpiredEvent={refreshExpiredEvent}
			/>
		</AuthProvider>
	);
}

interface AuthStatusProps {
	refreshCallbackStatus: string;
	refreshExpiredEvent: TRefreshTokenExpiredEvent | null;
}

function AuthStatus({
	refreshCallbackStatus,
	refreshExpiredEvent,
}: AuthStatusProps) {
	const {
		token,
		tokenData,
		logIn,
		logOut,
		error,
		loginInProgress,
	}: IAuthContext = useContext(AuthContext);

	// Manually trigger login via the callback event
	const triggerCallbackLogin = () => {
		if (refreshExpiredEvent) {
			refreshExpiredEvent.logIn();
		}
	};

	return (
		<div>
			<h2>Refresh Token Test</h2>

			<div data-testid="auth-status">
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
			</div>

			<div style={{ marginTop: "20px" }}>
				<button onClick={() => logIn()} data-testid="login-button">
					Log In
				</button>
				<button onClick={() => logOut()} data-testid="logout-button">
					Log Out
				</button>
				<button onClick={triggerCallbackLogin} data-testid="callback-login">
					Login via Callback
				</button>
			</div>

			{/* Refresh callback status */}
			<div style={{ marginTop: "20px" }}>
				<h3>Refresh Token Expired Callback</h3>
				<span data-testid="callback-status">{refreshCallbackStatus}</span>
			</div>

			{/* Token expiry info */}
			{token && (
				<div style={{ marginTop: "20px" }}>
					<h3>Configuration</h3>
					<ul>
						<li>Token Expires In: 30 seconds</li>
						<li>Refresh Token Expires In: 120 seconds</li>
						<li>Expiry Strategy: renewable</li>
						<li>Refresh With Scope: true</li>
					</ul>

					<h3>Token Data</h3>
					<pre data-testid="token-data">
						{JSON.stringify(tokenData, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}
