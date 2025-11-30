import { expect, test } from "@playwright/test";
import {
	performDexLogin,
	waitForAuthenticated,
	waitForNotAuthenticated,
} from "./helpers";

test.describe("Basic Authentication Flow", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/basic");
	});

	test("should show not authenticated state initially", async ({ page }) => {
		await waitForNotAuthenticated(page);
		await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
		await expect(page.locator('[data-testid="logout-button"]')).toBeVisible();
	});

	test("should perform OAuth2 PKCE login flow with redirect", async ({
		page,
	}) => {
		// Click login button
		await page.click('[data-testid="login-button"]');

		// Perform Dex login
		await performDexLogin(page);

		// Verify authenticated state
		await waitForAuthenticated(page);

		// Verify token is displayed
		await expect(page.locator('[data-testid="access-token"]')).toBeVisible();
		await expect(page.locator('[data-testid="token-data"]')).toBeVisible();
	});

	test("should perform OAuth2 PKCE login flow with replace", async ({
		page,
	}) => {
		// Click login replace button
		await page.click('[data-testid="login-replace-button"]');

		// Perform Dex login
		await performDexLogin(page);

		// Verify authenticated state
		await waitForAuthenticated(page);
		await expect(page.locator('[data-testid="access-token"]')).toBeVisible();
	});

	test("should decode access token when decodeToken is true", async ({
		page,
	}) => {
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Check that token data is present and contains expected fields
		const tokenData = await page
			.locator('[data-testid="token-data"]')
			.textContent();
		expect(tokenData).toBeTruthy();

		// Token data should be valid JSON
		const parsed = JSON.parse(tokenData!);
		expect(parsed).toBeDefined();
	});

	test("should display ID token when available", async ({ page }) => {
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// ID token should be present (Dex returns it with openid scope)
		await expect(page.locator('[data-testid="id-token"]')).toBeVisible();
		await expect(page.locator('[data-testid="id-token-data"]')).toBeVisible();
	});

	test("should perform logout", async ({ page }) => {
		// First login
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Then logout
		await page.click('[data-testid="logout-button"]');

		// Should return to not authenticated state
		await waitForNotAuthenticated(page);

		// Token should no longer be visible
		await expect(
			page.locator('[data-testid="access-token"]'),
		).not.toBeVisible();
	});

	test("should clear URL parameters after login", async ({ page }) => {
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// URL should not contain code or state parameters
		const url = page.url();
		expect(url).not.toContain("code=");
		expect(url).not.toContain("state=");
	});

	test("should persist authentication across page reload", async ({ page }) => {
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Reload the page

		// Should still be authenticated
		await waitForAuthenticated(page);
		await expect(page.locator('[data-testid="access-token"]')).toBeVisible();
	});

	test("should use session storage by default", async ({ page }) => {
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);
	});
});
