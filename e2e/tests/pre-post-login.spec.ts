import { expect, test } from "@playwright/test";
import { performDexLogin, waitForAuthenticated } from "./helpers";

test.describe("Pre/Post Login Hooks", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/prepostlogin");
		// Also clear the callback tracking in sessionStorage
		await page.evaluate(() => {
			sessionStorage.removeItem("preLoginCalled");
			sessionStorage.removeItem("postLoginCalled");
		});
	});

	test("should call preLogin before redirecting to auth provider", async ({
		page,
	}) => {
		// Clear callback status first
		await page.click('[data-testid="clear-status"]');

		// Verify initial state
		await expect(page.locator('[data-testid="prelogin-status"]')).toHaveText(
			"not-called",
		);

		// Click login - preLogin should be called before redirect
		await page.click('[data-testid="login-button"]');

		// preLogin should have been called (stored in sessionStorage before redirect)
		// We'll verify this after completing the login flow
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Refresh status and check preLogin was called
		await page.click('[data-testid="refresh-status"]');
		await expect(page.locator('[data-testid="prelogin-status"]')).toHaveText(
			"called",
		);
	});

	test("should call postLogin after successful token exchange", async ({
		page,
	}) => {
		// Clear callback status first
		await page.click('[data-testid="clear-status"]');

		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// postLogin should have been called
		await page.click('[data-testid="refresh-status"]');
		await expect(page.locator('[data-testid="postlogin-status"]')).toHaveText(
			"called",
		);
	});

	test("should call both preLogin and postLogin in correct order", async ({
		page,
	}) => {
		await page.click('[data-testid="clear-status"]');

		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		await page.click('[data-testid="refresh-status"]');

		// Both should be called
		await expect(page.locator('[data-testid="prelogin-status"]')).toHaveText(
			"called",
		);
		await expect(page.locator('[data-testid="postlogin-status"]')).toHaveText(
			"called",
		);

		// Verify timestamps - preLogin should be before postLogin
		const preTimestamp = await page.evaluate(() =>
			sessionStorage.getItem("preLoginTimestamp"),
		);
		const postTimestamp = await page.evaluate(() =>
			sessionStorage.getItem("postLoginTimestamp"),
		);

		expect(Number(preTimestamp)).toBeLessThan(Number(postTimestamp));
	});
});
