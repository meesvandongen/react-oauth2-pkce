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

// Config using localStorage for cross-tab testing
const authConfig: TAuthConfig = {
	clientId: "test-app",
	authorizationEndpoint: "http://localhost:5556/idp/auth",
	tokenEndpoint: "http://localhost:5556/idp/token",
	redirectUri: "http://localhost:3010/multitab/",
	scope: "openid profile email offline_access",
	decodeToken: true,
	autoLogin: false,
	clearURL: true,
	storage: "local", // localStorage for cross-tab sync
	storageKeyPrefix: "multitab_",
	tokenExpiresIn: 30,
	refreshTokenExpiresIn: 120,
	refreshTokenExpiryStrategy: "renewable",
};

function MultiTabContent() {
	const { token }: IAuthContext = useContext(AuthContext);

	const getStorageInfo = () => {
		return {
			token: localStorage.getItem("multitab_token")?.substring(0, 30) + "...",
			tokenExpire: localStorage.getItem("multitab_tokenExpire"),
			refreshToken:
				localStorage.getItem("multitab_refreshToken")?.substring(0, 30) + "...",
			refreshInProgress: localStorage.getItem("multitab_refreshInProgress"),
			loginInProgress: localStorage.getItem("multitab_loginInProgress"),
			currentTime: Math.round(Date.now() / 1000),
		};
	};

	return (
		<div>
			<AuthStatusPanel />
			<AuthActionButtons />

			<div style={{ marginTop: "20px" }}>
				<h3>Storage Info</h3>
				<pre data-testid="storage-info">
					{JSON.stringify(getStorageInfo(), null, 2)}
				</pre>
			</div>

			{token && (
				<div style={{ marginTop: "20px" }}>
					<h3>Configuration</h3>
					<ul>
						<li>Storage: localStorage (cross-tab)</li>
						<li>Token Expires In: 30 seconds</li>
						<li>Refresh Token Expires In: 120 seconds</li>
					</ul>

					<AuthTokenDetails
						formatAccessToken={(value) => `${value.substring(0, 50)}...`}
					/>
				</div>
			)}
		</div>
	);
}

export function MultiTabAuth() {
	return (
		<AuthPage authConfig={authConfig} title="Multi-Tab Test">
			<MultiTabContent />
		</AuthPage>
	);
}
