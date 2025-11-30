import { useCallback, useContext, useEffect, useState } from "react";
import {
	AuthContext,
	AuthProvider,
	type IAuthContext,
	type TAuthConfig,
} from "react-oauth2-code-pkce";

const PRELOGIN_STORAGE_KEY = "prepost_test_preLoginCalled";

export function PrePostLoginAuth() {
	const [preLoginStatus, setPreLoginStatus] = useState("not-called");
	const [postLoginStatus, setPostLoginStatus] = useState("not-called");

	// Restore callback status from sessionStorage on mount
	useEffect(() => {
		const preLoginCalled = sessionStorage.getItem(PRELOGIN_STORAGE_KEY);

		if (preLoginCalled === "true") {
			setPreLoginStatus("called");
		}
	}, []);

	const handlePreLogin = useCallback(() => {
		// Persist to sessionStorage so it survives navigation
		sessionStorage.setItem(PRELOGIN_STORAGE_KEY, "true");
		setPreLoginStatus("called");
	}, []);

	const handlePostLogin = useCallback(() => {
		setPostLoginStatus("called");
	}, []);

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
		preLogin: handlePreLogin,
		postLogin: handlePostLogin,
	};

	return (
		<AuthProvider authConfig={authConfig}>
			<AuthStatus
				preLoginStatus={preLoginStatus}
				postLoginStatus={postLoginStatus}
			/>
		</AuthProvider>
	);
}

interface AuthStatusProps {
	preLoginStatus: string;
	postLoginStatus: string;
}

function AuthStatus({ preLoginStatus, postLoginStatus }: AuthStatusProps) {
	const {
		token,
		tokenData,
		logIn,
		logOut,
		error,
		loginInProgress,
	}: IAuthContext = useContext(AuthContext);

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
			</div>

			{/* Callback status */}
			<div style={{ marginTop: "20px" }}>
				<h3>Callback Status</h3>
				<div>
					<span>preLogin: </span>
					<span data-testid="prelogin-status">{preLoginStatus}</span>
				</div>
				<div>
					<span>postLogin: </span>
					<span data-testid="postlogin-status">{postLoginStatus}</span>
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
