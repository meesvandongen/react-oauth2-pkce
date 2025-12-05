import { useContext, useEffect, useState } from "react";
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

const authConfig: TAuthConfig = {
	clientId: "test-app",
	authorizationEndpoint: "http://localhost:5556/idp/auth",
	tokenEndpoint: "http://localhost:5556/idp/token",
	redirectUri: "http://localhost:3010/extraparams/",
	logoutEndpoint: "http://localhost:5556/idp/logout",
	logoutRedirect: "http://localhost:3010/extraparams/",
	scope: "openid profile email offline_access",
	decodeToken: true,
	autoLogin: false,
	clearURL: true,
	storage: "session",
	storageKeyPrefix: "extra_",
	// Extra parameters feature
	extraAuthParameters: {
		custom_auth_param: "custom_auth_param",
	},
	extraTokenParameters: {
		custom_token_param: "custom_token_param",
	},
	extraLogoutParameters: {
		custom_logout_param: "custom_logout_param",
	},
};

export function ExtraParamsAuth() {
	return (
		<AuthPage authConfig={authConfig} title="Extra Parameters Test">
			<AuthStatusPanel />
			<AuthActionButtons />
			<AuthTokenDetails />
		</AuthPage>
	);
}
