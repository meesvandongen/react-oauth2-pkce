import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { authConfig, createAuthHarness } from "./test-utils";

const jwt =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJpYXQiOjE1MTYyMzkwMjJ9.Sfl";

test("Full featured logout requests", async () => {
	localStorage.setItem("ROCP_loginInProgress", "false");
	localStorage.setItem("ROCP_token", JSON.stringify(jwt));
	localStorage.setItem("ROCP_refreshToken", '"test-refresh-value"');
	const user = userEvent.setup();

	const { AuthConsumer } = createAuthHarness(authConfig);
	render(<AuthConsumer />);

	await user.click(screen.getByText("Log out"));

	await waitFor(() =>
		expect(window.location.assign).toHaveBeenCalledWith(
			"myLogoutEndpoint?token=test-refresh-value&token_type_hint=refresh_token&client_id=myClientID&post_logout_redirect_uri=primary-logout-redirect&ui_locales=en-US+en&testLogoutKey=logoutValue&state=logoutState",
		),
	);
	expect(window.location.assign).toHaveBeenCalledTimes(1);
});

test("No refresh token, no logoutRedirect, logout request", async () => {
	localStorage.setItem("ROCP_loginInProgress", "false");
	localStorage.setItem("ROCP_token", JSON.stringify(jwt));
	const user = userEvent.setup();

	const { AuthConsumer } = createAuthHarness({
		...authConfig,
		logoutRedirect: undefined,
	});
	render(<AuthConsumer />);

	await user.click(screen.getByText("Log out"));

	await waitFor(() =>
		expect(window.location.assign).toHaveBeenCalledWith(
			`myLogoutEndpoint?token=${encodeURIComponent(jwt)}&token_type_hint=access_token&client_id=myClientID&post_logout_redirect_uri=http%3A%2F%2Flocalhost%2F&ui_locales=en-US+en&testLogoutKey=logoutValue&state=logoutState`,
		),
	);
	expect(window.location.assign).toHaveBeenCalledTimes(1);
});
