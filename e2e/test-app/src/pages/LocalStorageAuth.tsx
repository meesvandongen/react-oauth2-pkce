import { type TAuthConfig } from "react-oauth2-code-pkce";
import { AuthActionButtons } from "../components/AuthActionButtons";
import {
	AuthStatusPanel,
	AuthStorageDetails,
	AuthTokenDetails,
} from "../components/AuthInfoPanels";
import { AuthPage } from "../components/AuthPage";

const authConfig: TAuthConfig = {
	clientId: "test-app",
	authorizationEndpoint: "http://localhost:5556/idp/auth",
	tokenEndpoint: "http://localhost:5556/idp/token",
	redirectUri: "http://localhost:3010/localstorage/",
	scope: "openid profile email offline_access",
	decodeToken: true,
	autoLogin: false,
	clearURL: true,
	storage: "local", // Key feature: localStorage
	storageKeyPrefix: "localstorage_",
};

export function LocalStorageAuth() {
	return (
		<AuthPage authConfig={authConfig} title="Local Storage Test">
			<AuthStatusPanel />
			<AuthActionButtons />
			<AuthTokenDetails />
			<AuthStorageDetails />
		</AuthPage>
	);
}
