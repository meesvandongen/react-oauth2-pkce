import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { authConfig, createAuthHarness } from "./test-utils";

const jwt =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJpYXQiOjE1MTYyMzkwMjJ9.Sfl";

test("logout clears local auth state and navigates to the configured logout endpoint", async () => {
	localStorage.setItem("ROCP_loginInProgress", "false");
	localStorage.setItem("ROCP_token", JSON.stringify(jwt));
	localStorage.setItem("ROCP_refreshToken", '"test-refresh-value"');
	const user = userEvent.setup();

	const { AuthConsumer } = createAuthHarness(authConfig);
	render(<AuthConsumer />);

	expect(screen.getByTestId("token").textContent).toBe(jwt);
	await user.click(screen.getByText("Log out"));

	await waitFor(() => expect(screen.getByTestId("token").textContent).toBe(""));
	await waitFor(() =>
		expect(window.location.assign).toHaveBeenCalledWith("myLogoutEndpoint"),
	);
	expect(window.location.assign).toHaveBeenCalledTimes(1);
});

test("logout without a refresh token still clears local auth state", async () => {
	localStorage.setItem("ROCP_loginInProgress", "false");
	localStorage.setItem("ROCP_token", JSON.stringify(jwt));
	const user = userEvent.setup();

	const { AuthConsumer } = createAuthHarness(authConfig);
	render(<AuthConsumer />);

	expect(screen.getByTestId("token").textContent).toBe(jwt);
	await user.click(screen.getByText("Log out"));

	await waitFor(() => expect(screen.getByTestId("token").textContent).toBe(""));
	await waitFor(() =>
		expect(window.location.assign).toHaveBeenCalledWith("myLogoutEndpoint"),
	);
	expect(window.location.assign).toHaveBeenCalledTimes(1);
});
