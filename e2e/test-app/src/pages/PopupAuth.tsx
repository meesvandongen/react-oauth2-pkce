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

// Track popup state for testing
declare global {
	interface Window {
		popupLoginCompleted: boolean;
		popupLoginError: string | null;
	}
}
window.popupLoginCompleted = false;
window.popupLoginError = null;

const authConfig: TAuthConfig = {
	clientId: "test-app",
	authorizationEndpoint: "http://localhost:5556/idp/auth",
	tokenEndpoint: "http://localhost:5556/idp/token",
	redirectUri: "http://localhost:3010/popup/",
	scope: "openid profile email offline_access",
	decodeToken: true,
	autoLogin: false,
	clearURL: true,
	storage: "session",
	storageKeyPrefix: "popup_",
	loginMethod: "popup", // Default to popup login
	postLogin: () => {
		console.log("Popup: Post login callback invoked");
		window.popupLoginCompleted = true;
	},
};

function PopupContent() {
	const { token, error }: IAuthContext = useContext(AuthContext);
	const [popupStatus, setPopupStatus] = useState("idle");

	useEffect(() => {
		if (window.popupLoginCompleted) {
			setPopupStatus("completed");
		}
		if (error) {
			window.popupLoginError = error;
		}
	}, [token, error]);

	return (
		<div>
			<AuthStatusPanel />
			<AuthActionButtons />

			<div style={{ marginTop: "20px" }}>
				<h3>Popup Login Status</h3>
				<span data-testid="popup-status">{popupStatus}</span>
			</div>

			{token && (
				<AuthTokenDetails
					formatAccessToken={(value) => `${value.substring(0, 50)}...`}
				/>
			)}
		</div>
	);
}

export function PopupAuth() {
	return (
		<AuthPage authConfig={authConfig} title="Popup Login Test">
			<PopupContent />
		</AuthPage>
	);
}
