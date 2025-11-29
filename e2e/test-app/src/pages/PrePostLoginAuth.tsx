import { useContext, useState } from "react";
import {
	AuthContext,
	AuthProvider,
	type IAuthContext,
	type TAuthConfig,
} from "react-oauth2-code-pkce";

// Track callback invocations for testing
declare global {
	interface Window {
		preLoginCalled: boolean;
		postLoginCalled: boolean;
		preLoginTimestamp: number;
		postLoginTimestamp: number;
	}
}
window.preLoginCalled = false;
window.postLoginCalled = false;
window.preLoginTimestamp = 0;
window.postLoginTimestamp = 0;

const authConfig: TAuthConfig = {
	clientId: "test-app",
	authorizationEndpoint: "http://localhost:5556/dex/auth",
	tokenEndpoint: "http://localhost:5556/dex/token",
	redirectUri: "http://localhost:3010/prepostlogin/",
	scope: "openid profile email offline_access",
	decodeToken: true,
	autoLogin: false,
	clearURL: true,
	storage: "session",
	storageKeyPrefix: "prepost_",
	preLogin: () => {
		console.log("preLogin callback invoked");
	},
	postLogin: () => {
		console.log("postLogin callback invoked");
	},
};

function AuthStatus() {
	const {
		token,
		tokenData,
		logIn,
		logOut,
		error,
		loginInProgress,
	}: IAuthContext = useContext(AuthContext);
	const [callbackStatus, _setCallbackStatus] = useState({
		preLogin: sessionStorage.getItem("preLoginCalled") === "true",
		postLogin: sessionStorage.getItem("postLoginCalled") === "true",
	});

	return (
		<div>
			<h2>Pre/Post Login Hooks Test</h2>

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
				<button onClick={refreshStatus} data-testid="refresh-status">
					Refresh Status
				</button>
				<button onClick={clearCallbackStatus} data-testid="clear-status">
					Clear Callback Status
				</button>
			</div>

			{/* Callback status */}
			<div style={{ marginTop: "20px" }}>
				<h3>Callback Status</h3>
				<div>
					<span>preLogin: </span>
					<span data-testid="prelogin-status">
						{callbackStatus.preLogin ? "called" : "not-called"}
					</span>
				</div>
				<div>
					<span>postLogin: </span>
					<span data-testid="postlogin-status">
						{callbackStatus.postLogin ? "called" : "not-called"}
					</span>
				</div>
			</div>

			{token && tokenData && (
				<div style={{ marginTop: "20px" }}>
					<h3>Token Data</h3>
					<pre data-testid="token-data">
						{JSON.stringify(tokenData, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
}

export function PrePostLoginAuth() {
	return (
		<AuthProvider authConfig={authConfig}>
			<AuthStatus />
		</AuthProvider>
	);
}
