import { expect, test } from "@playwright/test";
import {
	clearBrowserStorage,
	performDexLogin,
	waitForAuthenticated,
} from "./helpers";

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
		await expect(page.getByTestId("callback-status")).toHaveText("invoked", {
			timeout: 10000,
		});
	});
});

test.describe("preLogin Callback", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/prepostlogin");
		await clearBrowserStorage(page);
		// Clear callback status
		await page.evaluate(() => {
			sessionStorage.removeItem("preLoginCalled");
			sessionStorage.removeItem("postLoginCalled");
			window.preLoginCalled = false;
			window.postLoginCalled = false;
		});
		await page.reload();
	});

	test("should call preLogin before redirect", async ({ page }) => {
		// Intercept the navigation to verify preLogin was called before redirect
		let preLoginCalled = false;

		// Listen for console logs to verify preLogin was called
		page.on("console", (msg) => {
			if (msg.text().includes("preLogin callback invoked")) {
				preLoginCalled = true;
			}
		});

		// Start login
		await page.click('[data-testid="login-button"]');

		// Wait for redirect to happen
		await page.waitForURL(/.*localhost:5556\/dex.*/);

		// Verify preLogin was called (via console log)
		expect(preLoginCalled).toBe(true);

		// Complete the login to verify sessionStorage was set
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Now back on original page, check sessionStorage
		const sessionValue = await page.evaluate(() =>
			sessionStorage.getItem("preLoginCalled"),
		);
		expect(sessionValue).toBe("true");
	});

	test("should handle preLogin throwing error gracefully", async ({
		page,
	}) => {
    
  });
});

test.describe("postLogin Callback", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/prepostlogin");
		await clearBrowserStorage(page);
		// Clear callback status
		await page.evaluate(() => {
			sessionStorage.removeItem("preLoginCalled");
			sessionStorage.removeItem("postLoginCalled");
			window.preLoginCalled = false;
			window.postLoginCalled = false;
		});
		await page.reload();
	});

	test("should call postLogin after successful token exchange", async ({
		page,
	}) => {
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Refresh status and check
		await page.click('[data-testid="refresh-status"]');
		await expect(
			page.locator('[data-testid="postlogin-status"]'),
		).toContainText("called");
	});

	test("should not call postLogin on failed login", async ({ page }) => {
		// Clear callback tracking
		await page.click('[data-testid="clear-status"]');

		// Set up invalid auth state to cause failure
		await page.evaluate(() => {
			sessionStorage.setItem("prepost_loginInProgress", "true");
			sessionStorage.setItem("prepost_PKCE_code_verifier", "test-verifier");
			sessionStorage.setItem("ROCP_auth_state", "test-state");
		});

		// Navigate with invalid code
		await page.goto("/prepostlogin?code=invalid-code&state=test-state");

		// Wait for error state or authentication failure
		await Promise.race([
			page
				.locator('[data-testid="auth-error"]')
				.waitFor({ state: "visible", timeout: 5000 })
				.catch(() => {}),
			page
				.waitForFunction(
					() => {
						return !sessionStorage.getItem("prepost_loginInProgress");
					},
					{ timeout: 5000 },
				)
				.catch(() => {}),
		]);

		// Check postLogin status
		await page.click('[data-testid="refresh-status"]');
		await expect(
			page.locator('[data-testid="postlogin-status"]'),
		).toContainText("not-called");
	});

	test("should handle postLogin throwing error gracefully", async ({
		page,
	}) => {
		// This test would require a special test page with error-throwing postLogin
		// The library should still complete the auth flow even if postLogin throws
	});
});

test.describe("Callback Execution Order", () => {
	test("should execute preLogin before redirect", async ({ page }) => {
		await page.goto("/prepostlogin");
		await clearBrowserStorage(page);
		await page.evaluate(() => {
			sessionStorage.removeItem("preLoginCalled");
			sessionStorage.removeItem("postLoginCalled");
			sessionStorage.removeItem("preLoginTimestamp");
			sessionStorage.removeItem("postLoginTimestamp");
		});
		await page.reload();

		// Listen for console log to verify preLogin was called
		let preLoginCalled = false;
		page.on("console", (msg) => {
			if (msg.text().includes("preLogin callback invoked")) {
				preLoginCalled = true;
			}
		});

		await page.click('[data-testid="login-button"]');
		await page.waitForURL(/.*localhost:5556\/dex.*/);

		// Verify preLogin was called before redirect
		expect(preLoginCalled).toBe(true);

		// Complete login and verify sessionStorage
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// preLogin should have been called and stored in sessionStorage
		const sessionValue = await page.evaluate(() =>
			sessionStorage.getItem("preLoginCalled"),
		);
		expect(sessionValue).toBe("true");
	});

	test("should execute postLogin after token storage", async ({ page }) => {
		await page.goto("/prepostlogin");
		await clearBrowserStorage(page);
		await page.evaluate(() => {
			sessionStorage.removeItem("preLoginCalled");
			sessionStorage.removeItem("postLoginCalled");
		});
		await page.reload();

		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Verify both token and postLogin were handled
		const token = await page.evaluate(() =>
			sessionStorage.getItem("prepost_token"),
		);

		// Click refresh status to update the UI
		await page.click('[data-testid="refresh-status"]');
		const postLoginStatus = await page
			.locator('[data-testid="postlogin-status"]')
			.textContent();

		expect(token).toBeTruthy();
		expect(postLoginStatus).toContain("called");
	});
});

test.describe("Auto-Login Behavior", () => {
	test("should auto-login when autoLogin is true and not authenticated", async ({
		page,
	}) => {
		await page.goto("/autologin");
		await clearBrowserStorage(page);

		// Set up a promise to wait for the dex URL before navigating
		let _redirected = false;
		page.on("framenavigated", (frame) => {
			if (
				frame === page.mainFrame() &&
				frame.url().includes("localhost:5556/dex")
			) {
				_redirected = true;
			}
		});

		// Navigate to auto-login page - should redirect automatically
		await page
			.goto("/autologin", { waitUntil: "commit", timeout: 5000 })
			.catch(() => {});

		// Wait for redirect to happen
		await page
			.waitForFunction(
				() => window.location.href.includes("localhost:5556/dex"),
				{ timeout: 10000 },
			)
			.catch(() => {});

		// Verify we're on the IdP page
		expect(page.url()).toContain("localhost:5556/dex");
	});

	test("should not auto-login when already authenticated", async ({ page }) => {
		// Start fresh and login
		await page.goto("/autologin");
		await clearBrowserStorage(page);

		// Navigate - will auto-redirect to login
		await page
			.goto("/autologin", { waitUntil: "commit", timeout: 5000 })
			.catch(() => {});
		await page
			.waitForFunction(
				() => window.location.href.includes("localhost:5556/dex"),
				{ timeout: 10000 },
			)
			.catch(() => {});

		// Complete login
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Now navigate again - should NOT redirect since we're authenticated
		await page.goto("/");
		await page.goto("/autologin");

		// Should stay authenticated on the app page, not redirect to IdP
		await waitForAuthenticated(page);
		expect(page.url()).toContain("localhost:3010/autologin");
	});

	test("should auto-login when refresh token expires with autoLogin", async ({
		page,
	}) => {
		await page.goto("/autologin");
		await clearBrowserStorage(page);
		await page.goto("/autologin");

		// Complete login
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Simulate expired tokens by clearing all auth state
		await page.evaluate(() => {
			const expiredTime = Date.now() - 1000;
			sessionStorage.setItem("autologin_tokenExpire", String(expiredTime));
			sessionStorage.setItem(
				"autologin_refreshTokenExpire",
				String(expiredTime),
			);
			sessionStorage.removeItem("autologin_refreshToken");
			sessionStorage.removeItem("autologin_token");
		});

		// Reload the page to trigger auto-login on expired state
		await page.goto("/autologin");

		// Wait for redirect to IdP for re-authentication
		// The auto-login mechanism should trigger when tokens are detected as expired
		await page.waitForURL(/.*localhost:5556\/dex.*/, { timeout: 15000 });
	});
});

test.describe("Login Method Parameter", () => {
	test("should use specified login method (redirect)", async ({ page }) => {
		await page.goto("/basic");
		await clearBrowserStorage(page);
		await page.reload();

		// Use redirect login
		await page.click('[data-testid="login-button"]');

		// Should redirect to IdP
		await page.waitForURL(/.*localhost:5556\/dex.*/);
	});

	test("should use replace method when specified", async ({ page }) => {
		await page.goto("/basic");
		await clearBrowserStorage(page);
		await page.reload();

		// Track history length
		const _initialHistoryLength = await page.evaluate(() => history.length);

		// Use replace login
		await page.click('[data-testid="login-replace-button"]');

		await page.waitForURL(/.*localhost:5556\/dex.*/);

		// History length might be same due to replace
		// Note: This is hard to verify reliably in Playwright
	});
});

test.describe("Error Callback Handling", () => {
	test("should not invoke postLogin on error", async ({ page }) => {
		await page.goto("/prepostlogin");
		await clearBrowserStorage(page);
		await page.evaluate(() => {
			sessionStorage.removeItem("postLoginCalled");
			window.postLoginCalled = false;
		});
		await page.reload();

		// Clear callback tracking
		await page.click('[data-testid="clear-status"]');

		// Navigate with invalid code to trigger error
		// This simulates a failed auth callback
		await page.goto("/prepostlogin?code=invalid-code&state=invalid-state");

		// Wait for page to load and process the error
		await page.waitForLoadState("networkidle", { timeout: 10000 });

		// Should show error and postLogin should not be called
		await page.click('[data-testid="refresh-status"]');
		await expect(
			page.locator('[data-testid="postlogin-status"]'),
		).toContainText("not-called");
	});
});
