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

// Config for logout testing with logoutEndpoint
const logoutConfig: TAuthConfig = {
	clientId: "test-app",
	authorizationEndpoint: "http://localhost:5556/idp/auth",
	tokenEndpoint: "http://localhost:5556/idp/token",
	redirectUri: "http://localhost:3010/logout-test/",
	logoutEndpoint: "http://localhost:5556/idp/logout",
	logoutRedirect: "http://localhost:3010/logout-test/",
	scope: "openid profile email offline_access",
	decodeToken: true,
	autoLogin: false,
	clearURL: true,
	storage: "session",
	storageKeyPrefix: "logouttest_",
	extraLogoutParameters: {
		custom_logout_param: "test_value",
	},
};

function LogoutTestContent() {
	const { token, idToken, logOut }: IAuthContext = useContext(AuthContext);

	return (
		<div>
			<AuthStatusPanel />
			<AuthActionButtons />

			<div style={{ marginTop: "20px" }}>
				<button
					onClick={() => logOut("logout-state-123")}
					data-testid="logout-with-state-button"
				>
					Log Out (With State)
				</button>
				<button
					onClick={() => logOut(undefined, "user@example.com")}
					data-testid="logout-with-hint-button"
				>
					Log Out (With Hint)
				</button>
				<button
					onClick={() =>
						logOut("state-123", "user@example.com", { extra_param: "value" })
					}
					data-testid="logout-full-button"
				>
					Log Out (Full Params)
				</button>
			</div>

			<div style={{ marginTop: "20px" }}>
				<h3>Logout Configuration</h3>
				<ul>
					<li data-testid="config-logout-endpoint">
						Logout Endpoint: http://localhost:5556/idp/logout
					</li>
					<li data-testid="config-logout-redirect">
						Logout Redirect: http://localhost:3010/logout-test/
					</li>
					<li data-testid="config-extra-params">
						Extra Logout Params: custom_logout_param=test_value
					</li>
				</ul>
			</div>

			{token && (
				<div style={{ marginTop: "20px" }}>
					<AuthTokenDetails />

					<h3>ID Token Available</h3>
					<span data-testid="id-token-available">{idToken ? "yes" : "no"}</span>
				</div>
			)}
		</div>
	);
}

export function LogoutTestAuth() {
	return (
		<AuthPage authConfig={logoutConfig} title="Logout Scenarios Test">
			<LogoutTestContent />
		</AuthPage>
	);
}
