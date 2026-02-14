import { HttpResponse, http } from "msw";
import { expect, test } from "../playwright.setup";
import { expectAuthenticated, login } from "./helpers";

test("calls onRefreshTokenExpire when refresh token expires", async ({
	page,
	oidc,
}) => {
	oidc.refreshTokenLifetimeSeconds = 10; // 10 seconds
	oidc.accessTokenLifetimeSeconds = 5; // 5 seconds

	await page.goto("/configurable?onRefreshTokenExpire=called");
	await page.clock.install();
	await login(page);
	await expectAuthenticated(page);

	await expect(page.getByTestId("refresh-expired-status")).toHaveText(
		"not-called",
	);

	// Fast forward past refresh token expiry and refresh interval jitter
	await page.clock.fastForward(30000);

	await expect(page.getByTestId("refresh-expired-status")).toHaveText("called");
});

test("calls onRefreshTokenExpire when refresh fails with 400", async ({
	page,
	oidc,
	network,
}) => {
	oidc.accessTokenLifetimeSeconds = 5; // 5 seconds

	await page.goto("/configurable?onRefreshTokenExpire=called");
	await page.clock.install();
	await login(page);
	await expectAuthenticated(page);

	network.use(
		http.post("**/token", () => {
			return new HttpResponse(null, { status: 400 });
		}),
	);

	await expect(page.getByTestId("refresh-expired-status")).toHaveText(
		"not-called",
	);

	// Fast forward past access token expiry and refresh interval jitter to trigger refresh
	await page.clock.fastForward(30000);

	await expect(page.getByTestId("refresh-expired-status")).toHaveText("called");
});
