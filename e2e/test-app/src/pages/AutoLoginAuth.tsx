import { type TAuthConfig } from "react-oauth2-code-pkce";
import { AuthActionButtons } from "../components/AuthActionButtons";
import {
	AuthStatusPanel,
	AuthTokenDetails,
} from "../components/AuthInfoPanels";
import { AuthPage } from "../components/AuthPage";

const authConfig: TAuthConfig = {
	clientId: "test-app",
	authorizationEndpoint: "http://localhost:5556/idp/auth",
	tokenEndpoint: "http://localhost:5556/idp/token",
	redirectUri: "http://localhost:3010/autologin/",
	scope: "openid profile email offline_access",
	decodeToken: true,
	autoLogin: true, // Key feature: auto-login
	clearURL: true,
	storage: "session",
	storageKeyPrefix: "autologin_",
};

export function AutoLoginAuth() {
	return (
		<AuthPage authConfig={authConfig} title="Auto Login Test">
			<AuthStatusPanel />
			<AuthActionButtons />
			<AuthTokenDetails />
		</AuthPage>
	);
}
