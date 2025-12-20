import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import { authConfig, createAuthHarness } from "./test-utils";

test("First page visit should redirect to auth provider for login", async () => {
	const { AuthConsumer } = createAuthHarness(authConfig);
	render(<AuthConsumer />);

	await waitFor(() => {
		expect(window.location.assign).toHaveBeenCalledWith(
			expect.stringMatching(
				/^myAuthEndpoint\?response_type=code&client_id=myClientID&redirect_uri=http%3A%2F%2Flocalhost%2F&code_challenge=.{43}&code_challenge_method=S256&scope=someScope\+openid&state=testState/gm,
			),
		);
	});
});

test("First page visit should popup to auth provider for login", async () => {
	// set window size to 1200x800 to make test predictable in different environments
	global.innerWidth = 1200;
	global.innerHeight = 800;
	const { AuthConsumer } = createAuthHarness({
		...authConfig,
		loginMethod: "popup",
	});
	render(<AuthConsumer />);

	await waitFor(() => {
		expect(window.open).toHaveBeenCalledWith(
			expect.stringMatching(
				/^myAuthEndpoint\?response_type=code&client_id=myClientID&redirect_uri=http%3A%2F%2Flocalhost%2F&code_challenge=.{43}&code_challenge_method=S256&scope=someScope\+openid&state=testState/gm,
			),
			"loginPopup",
			"width=600,height=600,top=100,left=300",
		);
	});
});

test("Attempting to log in with an unsecure context should raise error", async () => {
	// @ts-ignore
	window.crypto.subtle.digest = undefined;
	const { AuthConsumer } = createAuthHarness(authConfig);
	render(<AuthConsumer />);

	const errorNode = await waitFor(() => screen.getByTestId("error"));

	await waitFor(() =>
		expect(errorNode).toHaveTextContent(
			"The context/environment is not secure, and does not support the 'crypto.subtle' module. See: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/subtle for details",
		),
	);
	expect(screen.getByTestId("loginInProgress")).toHaveTextContent("false");
});
