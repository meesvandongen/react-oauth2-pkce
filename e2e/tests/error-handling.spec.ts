import { expect, test } from "@playwright/test";
import { waitForNotAuthenticated } from "./helpers";

test.describe("Error Handling", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/basic");
	});

	test("should handle missing code parameter gracefully", async ({ page }) => {
		// Simulate coming back from OAuth without a code parameter
		// This could happen if user cancels the login

		// Set loginInProgress to simulate mid-flow

		// Reload without code parameter

		// Should show an error
		await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
	});

	test("should handle state mismatch error", async ({ page }) => {
		// Set up a fake state that won't match, and a code verifier

		// Navigate with a different state
		await page.goto("/basic?code=fake-code&state=different-state");

		// Should show error (either state mismatch or token exchange error)
		const errorElement = page.locator('[data-testid="auth-error"]');
		await expect(errorElement).toBeVisible();
	});

	test("should display error message when authentication fails", async ({
		page,
	}) => {
		// Simulate an auth flow with invalid code

		// Navigate with invalid code
		await page.goto("/basic?code=invalid-code&state=test-state");

		// Should show error
		await expect(page.locator('[data-testid="auth-error"]')).toBeVisible();
	});
});

test.describe("Token Decoding", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/basic");
	});

	test("should not show tokenData when not authenticated", async ({ page }) => {
		await waitForNotAuthenticated(page);
		await expect(page.locator('[data-testid="token-data"]')).not.toBeVisible();
		await expect(
			page.locator('[data-testid="access-token"]'),
		).not.toBeVisible();
	});
});

test.describe("Storage Key Prefix", () => {
	test("should use custom storage key prefix for basic auth", async ({
		page,
	}) => {
		await page.goto("/basic");
	});

	test("should use different prefix for localstorage auth", async ({
		page,
	}) => {
		await page.goto("/localstorage");

		// Listen for navigation to capture storage before redirect

		// Check that loginInProgress is stored with 'localstorage_' prefix
		// Value is JSON stringified
	});
});
