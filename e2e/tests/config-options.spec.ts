import { HttpResponse, http } from "msw";
import { expect, test } from "../playwright.setup";
import { expectAuthenticated, expectNotAuthenticated, login } from "./helpers";

test("respects storageKeyPrefix", async ({ page }) => {
	await page.goto("/configurable?storage=local");
	await login(page);
	await expectAuthenticated(page);

	const storage = await page.evaluate(() => {
		return JSON.stringify(window.localStorage);
	});

	expect(storage).toContain("config_token");
	expect(storage).toContain("config_refreshToken");
	expect(storage).toContain("config_idToken");
});

test("skips decoding when decodeToken is false", async ({ page }) => {
	await page.goto("/configurable?decodeToken=false");
	await login(page);
	await expectAuthenticated(page);

	await expect(page.getByTestId("token-data")).toBeEmpty();
});

test("preserves URL parameters when clearURL is false", async ({ page }) => {
	await page.goto("/configurable?clearURL=false");
	// Use button that passes custom state
	await page.getByTestId("login-custom-state-button").click();
	await expectAuthenticated(page);

	const url = page.url();
	expect(url).toContain("code=");
	expect(url).toContain("state=");
});

test("does not include scope in refresh request when refreshWithScope is false", async ({
	page,
	network,
	oidc,
}) => {
	oidc.accessTokenLifetimeSeconds = 5; // 5 seconds

	await page.goto("/configurable?refreshWithScope=false");
	await page.clock.install();
	await login(page);
	await expectAuthenticated(page);

	let refreshRequestData: string | null = null;
	network.use(
		http.post("**/token", async ({ request }) => {
			const body = await request.text();
			if (body.includes("grant_type=refresh_token")) {
				refreshRequestData = body;
			}
			return HttpResponse.json({
				access_token: "new-token",
				refresh_token: "new-refresh-token",
				expires_in: 3600,
			});
		}),
	);

	// Fast forward to trigger refresh
	await page.clock.fastForward(6000);

	await expect.poll(() => refreshRequestData).not.toBeNull();
	expect(refreshRequestData).not.toContain("scope=");
});

test("uses manual expiry overrides", async ({ page, network, oidc }) => {
  await page.goto("/configurable?tokenExpiresIn=100");
	await page.clock.install();
	await login(page);
	await expectAuthenticated(page);

	const initialToken = await page.getByTestId("access-token").textContent();

	// tokenExpiresIn: 100
	// Buffer is 30s, so it should refresh after 70s.
	await page.clock.fastForward(75000);

	await expect(page.getByTestId("access-token")).not.toHaveText(initialToken!);
});

test("respects absolute refreshTokenExpiryStrategy", async ({
	page,
	network,
	oidc,
}) => {
	oidc.refreshTokenLifetimeSeconds = 100;
	oidc.accessTokenLifetimeSeconds = 40;

	await page.goto("/configurable?strategy=absolute&onRefreshTokenExpire=called");
	await page.clock.install();
	await login(page);
	await expectAuthenticated(page);

	// First refresh at ~10s (40s - 30s buffer)
	await page.clock.fastForward(15_000);
	await expectAuthenticated(page);

	// Fast forward to near the original refresh token expiry (100s)
	await page.clock.fastForward(100_000);

	// It should have called onRefreshTokenExpire
	await expect(page.getByTestId("refresh-expired-status")).toHaveText("called");
});
