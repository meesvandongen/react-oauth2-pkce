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

// Config with decodeToken: false for opaque tokens
const opaqueTokenConfig: TAuthConfig = {
	clientId: "test-app",
	authorizationEndpoint: "http://localhost:5556/idp/auth",
	tokenEndpoint: "http://localhost:5556/idp/token",
	redirectUri: "http://localhost:3010/opaque-token/",
	scope: "openid profile email offline_access",
	decodeToken: false, // Don't decode - for opaque tokens
	autoLogin: false,
	clearURL: true,
	storage: "session",
	storageKeyPrefix: "opaque_",
};

function OpaqueTokenContent() {
	const { token }: IAuthContext = useContext(AuthContext);

	return (
		<div>
			<AuthStatusPanel />
			<AuthActionButtons />

			{token && (
				<div style={{ marginTop: "20px" }}>
					<h3>Configuration</h3>
					<ul>
						<li data-testid="config-decode-token">Decode Token: false</li>
					</ul>

					<AuthTokenDetails decodedAccessTokenFallback="undefined" />
				</div>
			)}
		</div>
	);
}

export function OpaqueTokenAuth() {
	return (
		<AuthPage
			authConfig={opaqueTokenConfig}
			title="Opaque Token Test (decodeToken: false)"
		>
			<OpaqueTokenContent />
		</AuthPage>
	);
}
