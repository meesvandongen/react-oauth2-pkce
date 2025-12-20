import { createAuthCore, TAuthConfig } from "@mvd/auth-core";
import { beforeEach, vi } from "vitest";
import { useAuth } from "../src";

beforeEach(() => {
	localStorage.clear();
	vi.restoreAllMocks();
	vi.spyOn(window.location, "assign").mockImplementation(() => {});
	vi.spyOn(window, "open").mockImplementation(() => ({}) as Window);
});

export const authConfig: TAuthConfig = {
	autoLogin: true,
	clientId: "myClientID",
	authorizationEndpoint: "myAuthEndpoint",
	tokenEndpoint: "myTokenEndpoint",
	logoutEndpoint: "myLogoutEndpoint",
	redirectUri: "http://localhost/",
	logoutRedirect: "primary-logout-redirect",
	scope: "someScope openid",
	decodeToken: false,
	state: "testState",
	loginMethod: "redirect",
	extraLogoutParameters: {
		testLogoutKey: "logoutValue",
	},
	extraTokenParameters: {
		testTokenKey: "tokenValue",
	},
};

export function createAuthHarness(config: TAuthConfig = authConfig) {
	const core = createAuthCore(config);

	const AuthConsumer = () => {
		const { tokenData, logOut, loginInProgress, logIn, token, error } =
			useAuth(core);
		return (
			<>
				<div>{tokenData?.name}</div>
				<button type="button" onClick={() => logOut({ state: "logoutState" })}>
					Log out
				</button>
				<button
					type="button"
					onClick={() =>
						logIn({
							state: "loginState",
						})
					}
				>
					Log in
				</button>
				<p data-testid={"loginInProgress"}>{JSON.stringify(loginInProgress)}</p>
				<p data-testid={"error"}>{error}</p>
				<p data-testid={"token"}>{token}</p>
			</>
		);
	};

	return { core, AuthConsumer, useAuth };
}
