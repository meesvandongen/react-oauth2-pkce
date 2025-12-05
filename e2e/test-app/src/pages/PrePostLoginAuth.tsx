import { useCallback, useContext, useEffect, useState } from "react";
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

const PRELOGIN_STORAGE_KEY = "prepost_test_preLoginCalled";

export function PrePostLoginAuth() {
	const [preLoginStatus, setPreLoginStatus] = useState("not-called");
	const [postLoginStatus, setPostLoginStatus] = useState("not-called");

	useEffect(() => {
		const preLoginCalled = sessionStorage.getItem(PRELOGIN_STORAGE_KEY);
		if (preLoginCalled === "true") {
			setPreLoginStatus("called");
		}
	}, []);

	const handlePreLogin = useCallback(() => {
		sessionStorage.setItem(PRELOGIN_STORAGE_KEY, "true");
		setPreLoginStatus("called");
	}, []);

	const handlePostLogin = useCallback(() => {
		setPostLoginStatus("called");
	}, []);

	const authConfig: TAuthConfig = {
		clientId: "test-app",
		authorizationEndpoint: "http://localhost:5556/idp/auth",
		tokenEndpoint: "http://localhost:5556/idp/token",
		redirectUri: "http://localhost:3010/prepostlogin/",
		scope: "openid profile email offline_access",
		decodeToken: true,
		autoLogin: false,
		clearURL: true,
		storage: "session",
		storageKeyPrefix: "prepost_",
		preLogin: handlePreLogin,
		postLogin: handlePostLogin,
	};

	return (
		<AuthPage authConfig={authConfig} title="Pre/Post Login Hooks Test">
			<PrePostLoginContent
				preLoginStatus={preLoginStatus}
				postLoginStatus={postLoginStatus}
			/>
		</AuthPage>
	);
}

interface AuthStatusProps {
	preLoginStatus: string;
	postLoginStatus: string;
}

function PrePostLoginContent({
	preLoginStatus,
	postLoginStatus,
}: AuthStatusProps) {
	const { token }: IAuthContext = useContext(AuthContext);

	return (
		<div>
			<AuthStatusPanel />
			<AuthActionButtons />

			<div style={{ marginTop: "20px" }}>
				<h3>Callback Status</h3>
				<div>
					<span>preLogin: </span>
					<span data-testid="prelogin-status">{preLoginStatus}</span>
				</div>
				<div>
					<span>postLogin: </span>
					<span data-testid="postlogin-status">{postLoginStatus}</span>
				</div>
			</div>

			{token && <AuthTokenDetails />}
		</div>
	);
}
