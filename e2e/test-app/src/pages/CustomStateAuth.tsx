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
	redirectUri: "http://localhost:3010/customstate/",
	scope: "openid profile email offline_access",
	decodeToken: true,
	autoLogin: false,
	clearURL: true,
	storage: "session",
	storageKeyPrefix: "customstate_",
	state: "default-state-value", // Default state in config
};

function CustomStateContent() {
	const { token, logIn }: IAuthContext = useContext(AuthContext);
	const [customState, setCustomState] = useState("my-custom-state");
	const [receivedState, setReceivedState] = useState<string | null>(null);

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const state = urlParams.get("state");
		if (state) {
			setReceivedState(state);
		}
		const savedState = sessionStorage.getItem("ROCP_auth_state");
		if (savedState) {
			setReceivedState(savedState);
		}
	}, []);

	return (
		<div>
			<AuthStatusPanel />
			<AuthActionButtons />

			<div style={{ marginTop: "20px" }}>
				<label>
					Custom State Value:
					<input
						type="text"
						value={customState}
						onChange={(e) => setCustomState(e.target.value)}
						data-testid="state-input"
						style={{ marginLeft: "10px", padding: "5px" }}
					/>
				</label>
			</div>

			<div style={{ marginTop: "20px" }}>
				<button onClick={() => logIn()} data-testid="login-default-state">
					Log In (default state)
				</button>
				<button
					onClick={() => logIn(customState)}
					data-testid="login-custom-state"
				>
					Log In (custom state)
				</button>
			</div>

			{receivedState && (
				<div style={{ marginTop: "20px" }}>
					<h3>Received State</h3>
					<pre data-testid="received-state">{receivedState}</pre>
				</div>
			)}

			{token && <AuthTokenDetails />}
		</div>
	);
}

export function CustomStateAuth() {
	return (
		<AuthPage authConfig={authConfig} title="Custom State Test">
			<CustomStateContent />
		</AuthPage>
	);
}
