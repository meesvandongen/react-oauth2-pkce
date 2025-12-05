import { useContext, useEffect, useState } from "react";
import {
	AuthContext,
	type IAuthContext,
	type TAuthConfig,
	type TRefreshTokenExpiredEvent,
} from "react-oauth2-code-pkce";
import { AuthActionButtons } from "../components/AuthActionButtons";
import {
	AuthStatusPanel,
	AuthTokenDetails,
} from "../components/AuthInfoPanels";
import { AuthPage } from "../components/AuthPage";

// Track callback invocations for testing
declare global {
	interface Window {
		timingRefreshExpiredCallbackInvoked: boolean;
		timingRefreshExpiredEvent: TRefreshTokenExpiredEvent | null;
		timingTokenRefreshCount: number;
		timingLastTokenRefreshTime: number | null;
	}
}
window.timingRefreshExpiredCallbackInvoked = false;
window.timingRefreshExpiredEvent = null;
window.timingTokenRefreshCount = 0;
window.timingLastTokenRefreshTime = null;

const authConfig: TAuthConfig = {
	clientId: "test-app",
	authorizationEndpoint: "http://localhost:5556/idp/auth",
	tokenEndpoint: "http://localhost:5556/idp/token",
	redirectUri: "http://localhost:3010/timing/",
	scope: "openid profile email offline_access",
	decodeToken: true,
	autoLogin: false,
	clearURL: true,
	storage: "session",
	storageKeyPrefix: "timing_",
	// Very short expiry times for timing tests
	tokenExpiresIn: 5, // 5 seconds - triggers refresh buffer behavior
	refreshTokenExpiresIn: 60, // 60 seconds
	refreshTokenExpiryStrategy: "renewable",
	refreshWithScope: true,
	onRefreshTokenExpire: (event: TRefreshTokenExpiredEvent) => {
		console.log("Timing: Refresh token expired callback invoked");
		window.timingRefreshExpiredCallbackInvoked = true;
		window.timingRefreshExpiredEvent = event;
	},
};

function TimingContent() {
	const { token }: IAuthContext = useContext(AuthContext);
	const [refreshCallbackStatus, setRefreshCallbackStatus] =
		useState("not-invoked");
	const [tokenRefreshCount, setTokenRefreshCount] = useState(0);
	const [lastToken, setLastToken] = useState("");

	// Track token changes to count refreshes
	useEffect(() => {
		if (token && token !== lastToken && lastToken !== "") {
			window.timingTokenRefreshCount++;
			window.timingLastTokenRefreshTime = Date.now();
			setTokenRefreshCount(window.timingTokenRefreshCount);
		}
		setLastToken(token);
	}, [token, lastToken]);

	// Check callback status periodically
	const checkCallback = () => {
		if (window.timingRefreshExpiredCallbackInvoked) {
			setRefreshCallbackStatus("invoked");
		}
	};

	// Manually trigger login via the callback event
	const triggerCallbackLogin = () => {
		if (window.timingRefreshExpiredEvent) {
			window.timingRefreshExpiredEvent.logIn();
		}
	};

	// Get storage values for debugging
	const getStorageInfo = () => {
		return {
			tokenExpire: sessionStorage.getItem("timing_tokenExpire"),
			refreshTokenExpire: sessionStorage.getItem("timing_refreshTokenExpire"),
			refreshInProgress: sessionStorage.getItem("timing_refreshInProgress"),
			currentTime: Math.round(Date.now() / 1000),
		};
	};

	const [storageInfo, setStorageInfo] = useState(getStorageInfo());

	useEffect(() => {
		const interval = setInterval(() => {
			setStorageInfo(getStorageInfo());
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div>
			<AuthStatusPanel />
			<AuthActionButtons />

			<div style={{ marginTop: "20px" }}>
				<button onClick={checkCallback} data-testid="check-callback">
					Check Callback Status
				</button>
				<button onClick={triggerCallbackLogin} data-testid="callback-login">
					Login via Callback
				</button>
			</div>

			<div style={{ marginTop: "20px" }}>
				<h3>Refresh Token Expired Callback</h3>
				<span data-testid="callback-status">{refreshCallbackStatus}</span>

				<h3>Token Refresh Count</h3>
				<span data-testid="refresh-count">{tokenRefreshCount}</span>
			</div>

			<div style={{ marginTop: "20px" }}>
				<h3>Storage Info</h3>
				<pre data-testid="storage-info">
					{JSON.stringify(storageInfo, null, 2)}
				</pre>
			</div>

			{token && (
				<div style={{ marginTop: "20px" }}>
					<h3>Configuration</h3>
					<ul>
						<li data-testid="config-token-expires">
							Token Expires In: 5 seconds
						</li>
						<li data-testid="config-refresh-expires">
							Refresh Token Expires In: 60 seconds
						</li>
						<li data-testid="config-strategy">Expiry Strategy: renewable</li>
					</ul>

					<AuthTokenDetails
						formatAccessToken={(value) => `${value.substring(0, 50)}...`}
					/>
				</div>
			)}
		</div>
	);
}

export function TimingAuth() {
	return (
		<AuthPage authConfig={authConfig} title="Timing and Token Expiry Test">
			<TimingContent />
		</AuthPage>
	);
}
