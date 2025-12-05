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
	redirectUri: "http://localhost:3010/localstorage/",
	scope: "openid profile email offline_access",
	decodeToken: true,
	autoLogin: false,
	clearURL: true,
	storage: "local", // Key feature: localStorage
	storageKeyPrefix: "localstorage_",
};

function LocalStorageContent() {
	const { token }: IAuthContext = useContext(AuthContext);
	const [storageContents, setStorageContents] = useState<
		Record<string, string>
	>({});

	useEffect(() => {
		const updateStorage = () => {
			const contents: Record<string, string> = {};
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith("localstorage_")) {
					contents[key] = localStorage.getItem(key) || "";
				}
			}
			setStorageContents(contents);
		};

		updateStorage();
		window.addEventListener("storage", updateStorage);
		const interval = setInterval(updateStorage, 500);

		return () => {
			window.removeEventListener("storage", updateStorage);
			clearInterval(interval);
		};
	}, [token]);

	return (
		<div>
			<AuthStatusPanel />
			<AuthActionButtons />

			<div style={{ marginTop: "20px" }}>
				<h3>LocalStorage Contents (prefixed with localstorage_)</h3>
				<pre data-testid="storage-contents">
					{JSON.stringify(storageContents, null, 2)}
				</pre>
			</div>

			{token && <AuthTokenDetails />}
		</div>
	);
}

export function LocalStorageAuth() {
	return (
		<AuthPage authConfig={authConfig} title="Local Storage Test">
			<LocalStorageContent />
		</AuthPage>
	);
}
