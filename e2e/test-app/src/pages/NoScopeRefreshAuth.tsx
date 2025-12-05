import { useContext } from "react";
import {
	AuthContext,
	type IAuthContext,
	type TAuthConfig,
} from "react-oauth2-code-pkce";
import { AuthActionButtons } from "../components/AuthActionButtons";
import {
	AuthStatusPanel,
	AuthTokenDetails,
} from "../components/AuthInfoPanels";
import { AuthPage } from "../components/AuthPage";

// Config for testing refreshWithScope: false
const noScopeRefreshConfig: TAuthConfig = {
	clientId: "test-app",
	authorizationEndpoint: "http://localhost:5556/idp/auth",
	tokenEndpoint: "http://localhost:5556/idp/token",
	redirectUri: "http://localhost:3010/no-scope-refresh/",
	scope: "openid profile email offline_access",
	decodeToken: true,
	autoLogin: false,
	clearURL: true,
	storage: "session",
	storageKeyPrefix: "noscope_",
	tokenExpiresIn: 10,
	refreshTokenExpiresIn: 60,
	refreshWithScope: false, // Don't send scope during refresh
};

function NoScopeRefreshContent() {
	const { token }: IAuthContext = useContext(AuthContext);

	return (
		<div>
			<AuthStatusPanel />
			<AuthActionButtons />

			<div style={{ marginTop: "20px" }}>
				<h3>Configuration</h3>
				<ul>
					<li data-testid="config-refresh-with-scope">
						Refresh With Scope: false
					</li>
					<li data-testid="config-token-expires">
						Token Expires In: 10 seconds
					</li>
				</ul>
			</div>

			{token && <AuthTokenDetails />}
		</div>
	);
}

export function NoScopeRefreshAuth() {
	return (
		<AuthPage
			authConfig={noScopeRefreshConfig}
			title="Refresh Without Scope Test"
		>
			<NoScopeRefreshContent />
		</AuthPage>
	);
}
