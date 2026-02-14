import { HttpResponse, http } from "msw";
import { expect, test } from "../playwright.setup";
import {
	expectAuthError,
	expectAuthenticated,
	expectNoAuthError,
	login,
} from "./helpers";

test("refresh after expiry", async ({ page, oidc }) => {
	oidc.accessTokenLifetimeSeconds = 5 * 60; // 5 minutes
	await page.goto("/configurable");

	await page.clock.install();
	await login(page);
	await expectAuthenticated(page);

	const initialAccessToken = await page
		.getByTestId("access-token")
		.textContent();
	const initialIdToken = await page.getByTestId("id-token").textContent();
	expect(initialAccessToken).toBeTruthy();
	expect(initialIdToken).toBeTruthy();

	await page.clock.fastForward("06:00");

	await expect(page.getByTestId("access-token")).not.toHaveText(
		initialAccessToken!,
	);
	await expect(page.getByTestId("id-token")).not.toHaveText(initialIdToken!);
});

test("Logs in again when refresh token expires", async ({ page, oidc }) => {
	oidc.refreshTokenLifetimeSeconds = 10 * 60; // 10 minutes
	await page.goto("/configurable?onRefreshTokenExpire=login");

	await page.clock.install();
	await login(page);
	await expectAuthenticated(page);

	const initialAccessToken = await page
		.getByTestId("access-token")
		.textContent();
	expect(initialAccessToken).toBeTruthy();

	await page.clock.fastForward("11:00");

	await expectAuthenticated(page);
	await expect(page.getByTestId("access-token")).not.toHaveText(
		initialAccessToken!,
	);
});

test("Logs in again when refresh token is invalid", async ({
	page,
	network,
	oidc,
}) => {
	oidc.accessTokenLifetimeSeconds = 5 * 60; // 5 minutes

	await page.goto("/configurable");
	await page.clock.install();
	await login(page);
	await expectAuthenticated(page);

	let tokenEndpointCalled = false;

	network.use(
		http.post(
			"**/token",
			(req) => {
				tokenEndpointCalled = true;
				return new HttpResponse(null, { status: 400 });
			},
			{
				once: true,
			},
		),
	);

	await page.clock.fastForward("05:05");

	// Make sure we are not immediately authenticated again
	await expect.poll(() => tokenEndpointCalled).toBe(true);

	await expectAuthenticated(page);
	await expectNoAuthError(page);
});

test("re-use refresh token", async ({ page, network, oidc }) => {
	oidc.refreshTokenReuse = true;
	oidc.refreshTokenRotation = false;
	oidc.accessTokenLifetimeSeconds = 5 * 60; // 5 minutes
	await page.goto("/configurable");

	await page.clock.install();
	await login(page);
	await expectAuthenticated(page);

	const initialAccessToken = await page
		.getByTestId("access-token")
		.textContent();

	// Fast forward to trigger refresh
	await page.clock.fastForward("05:05");
	// We validate that refresh happened by checking that access token changed
	await expect(page.getByTestId("access-token")).not.toHaveText(
		initialAccessToken!,
	);
	// And that we are still authenticated
	await expectAuthenticated(page);
	// Store the new access token
	const secondAccessToken = await page
		.getByTestId("access-token")
		.textContent();

	// Fast forward to trigger another refresh
	await page.clock.fastForward("05:05");
	// We validate that refresh happened by checking that access token changed
	await expect(page.getByTestId("access-token")).not.toHaveText(
		secondAccessToken!,
	);
	// And that we are still authenticated
	await expectAuthenticated(page);
});

test("Retries refresh after transient error", async ({
	page,
	network,
	oidc,
}) => {
	oidc.accessTokenLifetimeSeconds = 5 * 60; // 5 minutes
	await page.goto("/configurable");

	await page.clock.install();
	await login(page);
	await expectAuthenticated(page);

	let refreshAttempted = false;

	network.use(
		http.post(
			"**/token",
			() => {
				refreshAttempted = true;
				return HttpResponse.json(
					{
						error: "server_error",
						error_description: "Temporary server error",
					},
					{ status: 500 },
				);
			},
			{
				once: true,
			},
		),
	);

	await page.clock.fastForward("05:05");

	await expect.poll(() => refreshAttempted).toBe(true);
	await expectAuthError(page);
	await expectAuthenticated(page);

	// Fast forward enough to trigger next check (interval is 5s + random)
	await page.clock.fastForward("00:20");
	await expectNoAuthError(page);
	await expectAuthenticated(page);
});
