import { expect, type Page } from "@playwright/test";

/**
 * Helper function to perform Dex login
 * Dex uses a simple login form with email and password
 */
export async function performDexLogin(
	page: Page,
	email = "admin@example.com",
	password = "password",
) {
	// Wait for Dex login page to load
	await page.waitForURL(/.*localhost:5556\/dex.*/);

	// Dex shows a "Log in to dex" page with local login option
	// Click on "Log in with Email" if present (for static passwords)
	const emailLoginButton = page.locator(
		'button:has-text("Log in with Email"), a:has-text("Log in with Email")',
	);
	if (await emailLoginButton.isVisible({ timeout: 3000 }).catch(() => false)) {
		await emailLoginButton.click();
	}

	// Fill in credentials
	await page.fill(
		'input[name="login"], input[type="email"], input#login',
		email,
	);
	await page.fill('input[name="password"], input[type="password"]', password);

	// Submit the form
	await page.click('button[type="submit"], input[type="submit"]');

	// Wait for redirect back to the app
	await page.waitForURL(/.*localhost:3010.*/);
}

/**
 * Helper to wait for authentication to complete
 */
export async function waitForAuthenticated(page: Page) {
	await expect(page.locator('[data-testid="authenticated"]')).toBeVisible();
}

/**
 * Helper to wait for not authenticated state
 */
export async function waitForNotAuthenticated(page: Page) {
	await expect(page.locator('[data-testid="not-authenticated"]')).toBeVisible();
}

/**
 * Helper to get storage values for a given prefix
 */
export async function getStorageValues(
	page: Page,
	prefix: string,
	storageType: "session" | "local" = "session",
) {
	return page.evaluate(
		({ prefix, storageType }) => {
			const storage = storageType === "session" ? sessionStorage : localStorage;
			return {
				token: storage.getItem(`${prefix}token`),
				tokenExpire: storage.getItem(`${prefix}tokenExpire`),
				refreshToken: storage.getItem(`${prefix}refreshToken`),
				refreshTokenExpire: storage.getItem(`${prefix}refreshTokenExpire`),
				idToken: storage.getItem(`${prefix}idToken`),
				loginInProgress: storage.getItem(`${prefix}loginInProgress`),
				refreshInProgress: storage.getItem(`${prefix}refreshInProgress`),
				loginMethod: storage.getItem(`${prefix}loginMethod`),
			};
		},
		{ prefix, storageType },
	);
}

/**
 * Helper to check if error is displayed
 */
export async function hasAuthError(page: Page): Promise<boolean> {
	return page
		.locator('[data-testid="auth-error"]')
		.isVisible()
		.catch(() => false);
}

/**
 * Helper to get auth error text
 */
export async function getAuthErrorText(page: Page): Promise<string | null> {
	const errorElement = page.locator('[data-testid="auth-error"]');
	if (await errorElement.isVisible().catch(() => false)) {
		return errorElement.textContent();
	}
	return null;
}
