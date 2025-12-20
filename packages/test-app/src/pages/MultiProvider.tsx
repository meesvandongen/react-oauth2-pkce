import { AuthProvider, type TAuthConfig } from "@mvd/auth-react";
import { AuthActionButtons } from "../components/AuthActionButtons";
import { AuthStatusPanel } from "../components/AuthInfoPanels";

const baseConfig: TAuthConfig = {
	clientId: "test-app",
	authorizationEndpoint: "http://localhost:5556/idp/auth",
	tokenEndpoint: "http://localhost:5556/idp/token",
	redirectUri: window.location.origin + "/multi-provider",
	scope: "openid profile email offline_access",
	storage: "session",
	autoLogin: false,
};

const config1: TAuthConfig = {
	...baseConfig,
	storageKeyPrefix: "auth1_",
};

const config2: TAuthConfig = {
	...baseConfig,
	storageKeyPrefix: "auth2_",
};

export function MultiProvider() {
	return (
		<div>
			<h1>Multi Provider Test</h1>
			<div data-testid="provider-1">
				<h2>Provider 1 (auth1_)</h2>
				<AuthProvider authConfig={config1}>
					<AuthStatusPanel />
					<AuthActionButtons />
				</AuthProvider>
			</div>
			<hr />
			<div data-testid="provider-2">
				<h2>Provider 2 (auth2_)</h2>
				<AuthProvider authConfig={config2}>
					<AuthStatusPanel />
					<AuthActionButtons />
				</AuthProvider>
			</div>
		</div>
	);
}
