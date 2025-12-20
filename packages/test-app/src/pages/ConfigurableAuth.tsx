import { AuthCoreStore, createAuthCore } from "@mvd/auth-core";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthActionButtons } from "../components/AuthActionButtons";
import {
	AuthStatusPanel,
	AuthStorageDetails,
	AuthTokenDetails,
} from "../components/AuthInfoPanels";
import { AuthPage } from "../components/AuthPage";

export function ConfigurableAuth() {
	const [searchParams] = useSearchParams();
	const [expiredCalled, setExpiredCalled] = useState(false);
	const [preLoginCalled, setPreLoginCalled] = useState(false);
	const [postLoginCalled, setPostLoginCalled] = useState(false);

	// Filter out auth-related params from the redirectUri to keep it stable
	const configParams = new URLSearchParams();
	for (const [key, value] of searchParams.entries()) {
		if (
			![
				"code",
				"state",
				"session_state",
				"error",
				"error_description",
			].includes(key)
		) {
			configParams.append(key, value);
		}
	}
	const search = configParams.toString();
	const redirectUri =
		window.location.origin +
		window.location.pathname +
		(search ? `?${search}` : "");

	const [store] = useState(
		(): AuthCoreStore =>
			createAuthCore({
				clientId: "test-app",
				authorizationEndpoint: "http://localhost:5556/idp/auth",
				tokenEndpoint: "http://localhost:5556/idp/token",
				logoutEndpoint:
					searchParams.get("logout") === "true"
						? "http://localhost:5556/idp/logout"
						: undefined,
				logoutRedirect: searchParams.get("logoutRedirect") || undefined,
				redirectUri,
				scope: "openid profile email offline_access",
				decodeToken: searchParams.get("decodeToken") !== "false",
				autoLogin: searchParams.get("autoLogin") === "true",
				clearURL: searchParams.get("clearURL") !== "false",
				storage:
					(searchParams.get("storage") as "local" | "session") || "session",
				storageKeyPrefix: searchParams.get("prefix") || "config_",
				refreshWithScope: searchParams.get("refreshWithScope") !== "false",
				refreshTokenExpiryStrategy:
					(searchParams.get("strategy") as "renewable" | "absolute") ||
					"renewable",
				tokenExpiresIn: searchParams.get("tokenExpiresIn")
					? Number(searchParams.get("tokenExpiresIn"))
					: undefined,
				refreshTokenExpiresIn: searchParams.get("refreshTokenExpiresIn")
					? Number(searchParams.get("refreshTokenExpiresIn"))
					: undefined,
				onRefreshTokenExpire:
					searchParams.get("onRefreshTokenExpire") === "called"
						? () => setExpiredCalled(true)
						: undefined,
				preLogin: () => {
					setPreLoginCalled(true);
					sessionStorage.setItem("configurable_preLoginCalled", "true");
				},
				postLogin: () => setPostLoginCalled(true),
				extraAuthParameters:
					searchParams.get("extraParams") === "true"
						? { custom_auth_param: "custom_auth_param" }
						: undefined,
				extraTokenParameters:
					searchParams.get("extraParams") === "true"
						? { custom_token_param: "custom_token_param" }
						: undefined,
				extraLogoutParameters:
					searchParams.get("extraParams") === "true"
						? { custom_logout_param: "custom_logout_param" }
						: undefined,
			}),
	);

	useEffect(() => {
		if (sessionStorage.getItem("configurable_preLoginCalled") === "true") {
			setPreLoginCalled(true);
		}
	}, []);

	return (
		<AuthPage title="Configurable Auth Test">
			<AuthStatusPanel store={store}>
				<div data-testid="refresh-expired-status">
					{expiredCalled ? "called" : "not-called"}
				</div>
				<div data-testid="pre-login-status">
					{preLoginCalled ? "called" : "not-called"}
				</div>
				<div data-testid="post-login-status">
					{postLoginCalled ? "called" : "not-called"}
				</div>
			</AuthStatusPanel>
			<AuthActionButtons store={store} />
			<AuthTokenDetails store={store} />
			<AuthStorageDetails />
		</AuthPage>
	);
}
