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
	scope: "someScope",
	state: "testState",
	loginMethod: "redirect",
	extraTokenParameters: {
		client_id: "anotherClientId",
		testTokenKey: "tokenValue",
	},
};

export function createAuthHarness(config: AuthConfig = authConfig) {
	const auth = createAuth(config);

	const AuthConsumer = () => {
		const snapshot = useAuth(auth);
		const loginInProgress = snapshot.status === "loading";
		const token =
			snapshot.status === "authenticated" ? snapshot.token : undefined;
		const tokenData =
			snapshot.status === "authenticated" ? snapshot.tokenData : null;
		const error = snapshot.error;
		return (
			<>
				<div>{tokenData?.name}</div>
				<button type="button" onClick={() => auth.logout()}>
					Log out
				</button>
				<button
					type="button"
					onClick={() =>
						auth.login({
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

	return { auth, AuthConsumer };
}
