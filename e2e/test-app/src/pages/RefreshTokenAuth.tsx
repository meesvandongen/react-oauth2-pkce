import { useCallback, useContext, useState } from "react";
import {
	AuthContext,
	type IAuthContext,
	type TAuthConfig,
	type TRefreshTokenExpiredEvent,
} from "react-oauth2-code-pkce";
import { AuthActionButtons } from "../components/AuthActionButtons";
import {
	AuthStatusPanel,
	AuthTokenDetails,
} from "../components/AuthInfoPanels";
import { AuthPage } from "../components/AuthPage";

export function RefreshTokenAuth() {
	const [refreshCallbackStatus, setRefreshCallbackStatus] =
		useState("not-invoked");
	const [refreshExpiredEvent, setRefreshExpiredEvent] =
		useState<TRefreshTokenExpiredEvent | null>(null);

	const handleRefreshTokenExpire = useCallback(
		(event: TRefreshTokenExpiredEvent) => {
			console.log("Refresh token expired callback invoked");
			setRefreshCallbackStatus("invoked");
			setRefreshExpiredEvent(event);
		},
		[],
	);

	const authConfig: TAuthConfig = {
		clientId: "test-app",
		authorizationEndpoint: "http://localhost:5556/idp/auth",
		tokenEndpoint: "http://localhost:5556/idp/token",
		redirectUri: "http://localhost:3010/refresh/",
		scope: "openid profile email offline_access",
		decodeToken: true,
		autoLogin: false,
		clearURL: true,
		storage: "session",
		storageKeyPrefix: "refresh_",
		tokenExpiresIn: 30,
		refreshTokenExpiresIn: 120,
		refreshTokenExpiryStrategy: "renewable",
		refreshWithScope: true,
		onRefreshTokenExpire: handleRefreshTokenExpire,
	};

	return (
		<AuthPage authConfig={authConfig} title="Refresh Token Test">
			<RefreshTokenContent
				refreshCallbackStatus={refreshCallbackStatus}
				refreshExpiredEvent={refreshExpiredEvent}
			/>
		</AuthPage>
	);
}

interface AuthStatusProps {
	refreshCallbackStatus: string;
	refreshExpiredEvent: TRefreshTokenExpiredEvent | null;
}

function RefreshTokenContent({
	refreshCallbackStatus,
	refreshExpiredEvent,
}: AuthStatusProps) {
	const { token }: IAuthContext = useContext(AuthContext);

	// Manually trigger login via the callback event
	const triggerCallbackLogin = () => {
		if (refreshExpiredEvent) {
			refreshExpiredEvent.logIn();
		}
	};

	return (
		<div>
			<AuthStatusPanel />
			<AuthActionButtons />

			<div style={{ marginTop: "20px" }}>
				<button onClick={triggerCallbackLogin} data-testid="callback-login">
					Login via Callback
				</button>
			</div>

			<div style={{ marginTop: "20px" }}>
				<h3>Refresh Token Expired Callback</h3>
				<span data-testid="callback-status">{refreshCallbackStatus}</span>
			</div>

			{token && (
				<div style={{ marginTop: "20px" }}>
					<h3>Configuration</h3>
					<ul>
						<li>Token Expires In: 30 seconds</li>
						<li>Refresh Token Expires In: 120 seconds</li>
						<li>Expiry Strategy: renewable</li>
						<li>Refresh With Scope: true</li>
					</ul>

					<AuthTokenDetails />
				</div>
			)}
		</div>
	);
}
