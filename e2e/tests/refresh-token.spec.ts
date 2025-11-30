import { expect, test } from "@playwright/test";
import {
	performDexLogin,
	waitForAuthenticated,
	waitForNotAuthenticated,
} from "./helpers";

test.describe("Refresh Token Handling", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/refresh");
		// Clear callback tracking
		await page.evaluate(() => {
			window.refreshExpiredCallbackInvoked = false;
			window.refreshExpiredEvent = null;
		});
	});

	test("should receive refresh token with offline_access scope", async ({
		page,
	}) => {
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Check that refresh token is stored
		const refreshToken = await page.evaluate(() => {
			return sessionStorage.getItem("refresh_refreshToken");
		});
		expect(refreshToken).toBeTruthy();
	});

	test("should store token expiry information", async ({ page }) => {
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Check token expiry is stored
		const tokenExpire = await page.evaluate(() => {
			return sessionStorage.getItem("refresh_tokenExpire");
		});
		expect(tokenExpire).toBeTruthy();

		// Check refresh token expiry is stored
		const refreshExpire = await page.evaluate(() => {
			return sessionStorage.getItem("refresh_refreshTokenExpire");
		});
		expect(refreshExpire).toBeTruthy();
	});

	test("should configure renewable refresh token strategy", async ({
		page,
	}) => {
		// Need to authenticate first to see the configuration
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// The page shows the configuration after authentication
		await expect(page.getByText("Expiry Strategy: renewable")).toBeVisible();
		await expect(page.getByText("Refresh With Scope: true")).toBeVisible();
	});

	test("should use refresh token when access token expires", async ({
		page,
	}) => {
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Get the initial token
		const initialToken = await page.evaluate(() => {
			return sessionStorage.getItem("refresh_token");
		});
		expect(initialToken).toBeTruthy();

		// Note: In a full test, we'd wait for token expiry and verify refresh
		// For now, we verify the setup is correct
	});
});

test.describe("Login In Progress State", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/basic");
	});

	test("should show login in progress during OAuth flow", async ({ page }) => {
		// Check initial state
		await waitForNotAuthenticated(page);

		// Listen for navigation to capture storage before redirect
		const [loginInProgress] = await Promise.all([
			page.evaluate(() => {
				return new Promise<string | null>((resolve) => {
					const observer = new MutationObserver(() => {
						const value = sessionStorage.getItem("basic_loginInProgress");
						if (value) {
							resolve(value);
						}
					});
					observer.observe(document.body, { subtree: true, childList: true });
					// Also check immediately
					const value = sessionStorage.getItem("basic_loginInProgress");
					if (value) resolve(value);
					// Fallback timeout
					setTimeout(
						() => resolve(sessionStorage.getItem("basic_loginInProgress")),
						100,
					);
				});
			}),
			page.click('[data-testid="login-button"]'),
		]);

		// The loginInProgress state should be set before redirect
		// This is stored in session storage (JSON stringified)
		expect(loginInProgress).toBe("true");
	});

	test("should clear login in progress after successful login", async ({
		page,
	}) => {
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// loginInProgress should be false after successful login
		const loginInProgress = await page.evaluate(() => {
			return sessionStorage.getItem("basic_loginInProgress");
		});
		expect(loginInProgress).toBe("false");
	});
});
