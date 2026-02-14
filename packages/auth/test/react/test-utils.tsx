import { beforeEach, vi } from "vitest";
import { type AuthConfig, createAuth } from "../../src";
import { useAuth } from "../../src/react";

beforeEach(() => {
	localStorage.clear();
	vi.restoreAllMocks();
	vi.spyOn(window.location, "assign").mockImplementation(() => {});
	vi.spyOn(window, "open").mockImplementation(() => ({}) as Window);
});

export const authConfig: AuthConfig = {
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
		client_id: "anotherClientId",
		testTokenKey: "tokenValue",
	},
};

export function createAuthHarness(config: AuthConfig = authConfig) {
	const core = createAuth(config);

	const AuthConsumer = () => {
		const { tokenData, loginInProgress, token, error } = useAuth(core);
		return (
			<>
				<div>{tokenData?.name}</div>
				<button
					type="button"
					onClick={() => core.logout({ state: "logoutState" })}
				>
					Log out
				</button>
				<button
					type="button"
					onClick={() =>
						core.login({
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
