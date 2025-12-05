import { useContext } from "react";
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

// Track network-related events
declare global {
	interface Window {
		networkRefreshExpiredCallbackInvoked: boolean;
		networkRefreshExpiredEvent: TRefreshTokenExpiredEvent | null;
		networkErrorCount: number;
	}
}
window.networkRefreshExpiredCallbackInvoked = false;
window.networkRefreshExpiredEvent = null;
window.networkErrorCount = 0;

const authConfig: TAuthConfig = {
	clientId: "test-app",
	authorizationEndpoint: "http://localhost:5556/idp/auth",
	tokenEndpoint: "http://localhost:5556/idp/token",
	redirectUri: "http://localhost:3010/network/",
	scope: "openid profile email offline_access",
	decodeToken: true,
	autoLogin: false,
	clearURL: true,
	storage: "session",
	storageKeyPrefix: "network_",
	tokenExpiresIn: 10,
	refreshTokenExpiresIn: 60,
	onRefreshTokenExpire: (event: TRefreshTokenExpiredEvent) => {
		console.log("Network: Refresh token expired callback invoked");
		window.networkRefreshExpiredCallbackInvoked = true;
		window.networkRefreshExpiredEvent = event;
	},
};

function NetworkContent() {
	const { token, error }: IAuthContext = useContext(AuthContext);

	if (error) {
		window.networkErrorCount++;
	}

	return (
		<div>
			<AuthStatusPanel />
			<AuthActionButtons />

			<div style={{ marginTop: "20px" }}>
				<h3>Error Count</h3>
				<span data-testid="error-count">{window.networkErrorCount}</span>

				<h3>Refresh Expired Callback</h3>
				<span data-testid="callback-status">
					{window.networkRefreshExpiredCallbackInvoked
						? "invoked"
						: "not-invoked"}
				</span>
			</div>

			{token && <AuthTokenDetails />}
		</div>
	);
}

export function NetworkAuth() {
	return (
		<AuthPage authConfig={authConfig} title="Network Resilience Test">
			<NetworkContent />
		</AuthPage>
	);
}
