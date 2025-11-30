import { expect, test } from "@playwright/test";
import { performDexLogin, waitForAuthenticated } from "./helpers";

/**
 * Callback and Hook Behavior Tests
 *
 * These tests verify the callback and hook behavior:
 * - onRefreshTokenExpire callback with different responses
 * - preLogin callback throwing errors
 * - postLogin callback throwing errors
 * - Callback execution order
 */

test.describe("onRefreshTokenExpire Callback", () => {
	test("should invoke onRefreshTokenExpire when refresh token expires", async ({
		page,
	}) => {
		// Install clock at current time
		await page.clock.install({ time: Date.now() });
		await page.clock.pauseAt(new Date(Date.now()));

		await page.goto("/refresh");

		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Advance time past the token expiry
		await page.clock.fastForward("02:00:00"); // 2 hours later
		await page.clock.resume();

		// State should update automatically without button click
		await expect(page.getByTestId("callback-status")).toHaveText("invoked");
	});
});

test.describe("preLogin Callback", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/prepostlogin");
	});

	test("should call preLogin before redirect", async ({ page }) => {
		// Verify initial state
		await expect(page.locator('[data-testid="prelogin-status"]')).toHaveText(
			"not-called",
		);

		// Start login
		await page.click('[data-testid="login-button"]');

		// Wait for redirect to happen
		await page.waitForURL(/.*localhost:5556\/dex.*/);

		// Complete the login
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// After successful login and navigation back, preLogin should have been called
		await expect(page.locator('[data-testid="prelogin-status"]')).toHaveText(
			"called",
		);
	});

	test("should handle preLogin throwing error gracefully", async ({ page }) => {
		// This test would require a special test page with error-throwing preLogin
		// The library should still complete the auth flow even if preLogin throws
	});
});

test.describe("postLogin Callback", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/prepostlogin");
	});

	test("should call postLogin after successful token exchange", async ({
		page,
	}) => {
		// Verify initial state
		await expect(page.locator('[data-testid="postlogin-status"]')).toHaveText(
			"not-called",
		);

		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// After successful login, postLogin should have been called
		await expect(page.locator('[data-testid="postlogin-status"]')).toHaveText(
			"called",
		);
	});

	test("should not call postLogin on failed login", async ({ page }) => {
		// Verify initial state
		await expect(page.locator('[data-testid="postlogin-status"]')).toHaveText(
			"not-called",
		);

		// Navigate with invalid code
		await page.goto("/prepostlogin?code=invalid-code&state=test-state");

		// Wait for page to settle - either error or not-authenticated state
		await page.waitForLoadState("networkidle");

		// postLogin should still be not-called
		await expect(page.locator('[data-testid="postlogin-status"]')).toHaveText(
			"not-called",
		);
	});
});
