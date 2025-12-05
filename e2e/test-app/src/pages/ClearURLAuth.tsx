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

// Config with clearURL: false to keep state params in URL
const clearURLConfig: TAuthConfig = {
	clientId: "test-app",
	authorizationEndpoint: "http://localhost:5556/idp/auth",
	tokenEndpoint: "http://localhost:5556/idp/token",
	redirectUri: "http://localhost:3010/clear-url/",
	scope: "openid profile email offline_access",
	decodeToken: true,
	autoLogin: false,
	clearURL: false, // Don't clear URL params
	storage: "session",
	storageKeyPrefix: "clearurl_",
};

function ClearURLContent() {
	const { token }: IAuthContext = useContext(AuthContext);

	return (
		<div>
			<AuthStatusPanel />
			<AuthActionButtons />

			<div style={{ marginTop: "20px" }}>
				<h3>Current URL</h3>
				<pre data-testid="current-url">{window.location.href}</pre>
			</div>

			{token && (
				<div style={{ marginTop: "20px" }}>
					<h3>Configuration</h3>
					<ul>
						<li data-testid="config-clear-url">Clear URL: false</li>
					</ul>

					<AuthTokenDetails
						showAccessToken={false}
						showIdToken={false}
						showDecodedIdToken={false}
					/>
				</div>
			)}
		</div>
	);
}

export function ClearURLAuth() {
	return (
		<AuthPage
			authConfig={clearURLConfig}
			title="Clear URL Test (clearURL: false)"
		>
			<ClearURLContent />
		</AuthPage>
	);
}
