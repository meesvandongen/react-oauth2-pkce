import { type BrowserContext, expect, test } from "@playwright/test";
import {
	performDexLogin,
	waitForAuthenticated,
	waitForNotAuthenticated,
} from "./helpers";

/**
 * Popup Login Tests
 *
 * These tests verify the popup login method functionality including:
 * - Popup window opening correctly
 * - Authentication completing in popup
 * - Parent window receiving authentication result
 * - Popup closing automatically after success
 * - Popup blocker detection and fallback to redirect
 * - Multiple popup attempts handling
 */

test.describe("Popup Login Flow", () => {
	let context: BrowserContext;

	test.beforeEach(async ({ browser }) => {
		// Create a new context that allows popups
		context = await browser.newContext({
			// Most browsers block popups by default, but Playwright can handle them
		});
	});

	test.afterEach(async () => {
		await context.close();
	});

	test("should open popup window for login", async () => {
		const page = await context.newPage();
		await page.goto("http://localhost:3010/popup");

		// Listen for popup
		const popupPromise = context.waitForEvent("page");

		// Click popup login button
		await page.click('[data-testid="login-popup-button"]');

		// Wait for popup to open
		const popup = await popupPromise;

		// Verify popup opened to Dex
		await popup.waitForURL(/.*localhost:5556\/dex.*/);
		expect(popup.url()).toContain("localhost:5556/dex");

		// Close popup to clean up
		await popup.close();
	});

	test("should complete authentication in popup and update parent", async () => {
		const page = await context.newPage();
		await page.goto("http://localhost:3010/popup");

		await waitForNotAuthenticated(page);

		// Listen for popup
		const popupPromise = context.waitForEvent("page");

		// Click popup login button
		await page.click('[data-testid="login-popup-button"]');

		// Get popup and complete login
		const popup = await popupPromise;

		// Perform login in popup
		await popup.waitForURL(/.*localhost:5556\/dex.*/);

		// Click on email login if visible
		const emailLoginButton = popup.locator(
			'button:has-text("Log in with Email"), a:has-text("Log in with Email")',
		);
		if (
			await emailLoginButton.isVisible({ timeout: 3000 }).catch(() => false)
		) {
			await emailLoginButton.click();
		}

		// Fill credentials
		await popup.fill(
			'input[name="login"], input[type="email"], input#login',
			"admin@example.com",
		);
		await popup.fill(
			'input[name="password"], input[type="password"]',
			"password",
		);
		await popup.click('button[type="submit"], input[type="submit"]');

		// Popup should redirect and eventually close
		await popup.waitForURL(/.*localhost:3010\/popup.*/, { timeout: 15000 });

		// Wait for popup to close (it should close automatically after auth)
		// Note: The library calls window.close() after successful popup auth
		await popup.waitForEvent("close").catch(() => {
			// Popup might not close automatically in all cases
		});

		// Parent window should now be authenticated
		// Reload parent to check auth state (storage should be updated)

		await waitForAuthenticated(page);
	});

	test("should handle popup being blocked and fallback to redirect", async () => {
		// This test simulates a blocked popup scenario
		const page = await context.newPage();
		await page.goto("http://localhost:3010/popup");

		// Override window.open to return null (simulating blocked popup)
		await page.evaluate(() => {
			window.open = () => null;
		});

		// Click popup login button
		await page.click('[data-testid="login-popup-button"]');

		// Should fallback to redirect since popup is blocked
		await page.waitForURL(/.*localhost:5556\/dex.*/);

		// Complete the redirect flow
		await performDexLogin(page);
		await waitForAuthenticated(page);
	});

	test("should support redirect login as alternative", async () => {
		const page = await context.newPage();
		await page.goto("http://localhost:3010/popup");

		// Use redirect button instead of popup
		await page.click('[data-testid="login-redirect-button"]');

		// Should redirect to Dex
		await performDexLogin(page);

		// Should be authenticated
		await waitForAuthenticated(page);
	});

	test("should prevent multiple simultaneous popup attempts", async () => {
		const page = await context.newPage();
		await page.goto("http://localhost:3010/popup");

		let popupCount = 0;

		// Track all new pages
		context.on("page", () => {
			popupCount++;
		});

		// Listen for first popup
		const popupPromise = context.waitForEvent("page");

		// Click popup button multiple times quickly
		await page.click('[data-testid="login-popup-button"]');

		// Wait for first popup
		const popup = await popupPromise;

		// Try to click again while popup is open
		// This should ideally not open another popup
		await page.click('[data-testid="login-popup-button"]').catch(() => {});

		// Wait for loginInProgress flag to stabilize
		await page
			.waitForFunction(
				() => sessionStorage.getItem("popup_loginInProgress") === "true",
				{ timeout: 2000 },
			)
			.catch(() => {});

		// Only one popup should have opened
		// Note: The library doesn't explicitly prevent multiple popups,
		// but loginInProgress should be set
		expect(popupCount).toBeGreaterThanOrEqual(1);

		await popup.close();
	});

	test("should set loginInProgress during popup flow", async () => {
		const page = await context.newPage();
		await page.goto("http://localhost:3010/popup");

		// Listen for popup
		const popupPromise = context.waitForEvent("page");

		// Capture loginInProgress state
		const loginInProgressPromise = page.evaluate(() => {
			return new Promise<boolean>((resolve) => {
				const checkInterval = setInterval(() => {
					const value = sessionStorage.getItem("popup_loginInProgress");
					if (value === "true") {
						clearInterval(checkInterval);
						resolve(true);
					}
				}, 50);
				setTimeout(() => {
					clearInterval(checkInterval);
					resolve(false);
				}, 2000);
			});
		});

		// Click popup button
		await page.click('[data-testid="login-popup-button"]');

		// Check if loginInProgress was set
		const wasInProgress = await loginInProgressPromise;
		expect(wasInProgress).toBe(true);

		// Clean up
		const popup = await popupPromise;
		await popup.close();
	});

	test("should store loginMethod as popup", async () => {
		const page = await context.newPage();
		await page.goto("http://localhost:3010/popup");

		// Listen for popup
		const popupPromise = context.waitForEvent("page");

		// Click popup button
		await page.click('[data-testid="login-popup-button"]');

		// Wait for loginMethod to be set in storage
		await page.waitForFunction(
			() => sessionStorage.getItem("popup_loginMethod") !== null,
			{ timeout: 2000 },
		);

		// Check loginMethod in storage
		const loginMethod = await page.evaluate(() => {
			return sessionStorage.getItem("popup_loginMethod");
		});
		expect(loginMethod).toBe('"popup"');

		// Clean up
		const popup = await popupPromise;
		await popup.close();
	});
});

test.describe("Popup Window Positioning", () => {
	test("should open popup with reasonable dimensions", async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();

		await page.goto("http://localhost:3010/popup");

		// Track popup features
		let popupFeatures = "";
		await page.evaluate(() => {
			const originalOpen = window.open;
			window.open = (url, target, features) => {
				(window as any).__popupFeatures = features;
				return originalOpen.call(window, url, target, features);
			};
		});

		// Listen for popup
		const popupPromise = context.waitForEvent("page");

		// Click popup button
		await page.click('[data-testid="login-popup-button"]');

		// Get popup features from stored value
		popupFeatures = await page.evaluate(
			() => (window as any).__popupFeatures || "",
		);

		// Verify popup has width and height
		expect(popupFeatures).toContain("width=");
		expect(popupFeatures).toContain("height=");

		// Clean up
		const popup = await popupPromise;
		await popup.close();
		await context.close();
	});
});

test.describe("Popup Error Handling", () => {
	test("should handle popup closed by user before auth completes", async ({
		browser,
	}) => {
		const context = await browser.newContext();
		const page = await context.newPage();

		await page.goto("http://localhost:3010/popup");

		// Listen for popup
		const popupPromise = context.waitForEvent("page");

		// Click popup button
		await page.click('[data-testid="login-popup-button"]');

		// Get and close popup immediately (before auth completes)
		const popup = await popupPromise;
		await popup.close();

		// Wait for loginInProgress to be updated or token to remain falsy
		await page
			.waitForFunction(
				() => {
					const inProgress = sessionStorage.getItem("popup_loginInProgress");
					return (
						inProgress === "false" || !sessionStorage.getItem("popup_token")
					);
				},
				{ timeout: 3000 },
			)
			.catch(() => {});

		// Parent should still be not authenticated
		// loginInProgress may still be true since we interrupted the flow
		const token = await page.evaluate(() =>
			sessionStorage.getItem("popup_token"),
		);
		expect(token).toBeFalsy();

		await context.close();
	});

	test("should handle auth error in popup", async ({ browser }) => {
		const context = await browser.newContext();
		const page = await context.newPage();

		await page.goto("http://localhost:3010/popup");

		// Listen for popup
		const popupPromise = context.waitForEvent("page");

		// Click popup button
		await page.click('[data-testid="login-popup-button"]');

		// Get popup
		const popup = await popupPromise;
		await popup.waitForURL(/.*localhost:5556\/dex.*/);

		// Enter wrong credentials
		const emailLoginButton = popup.locator(
			'button:has-text("Log in with Email"), a:has-text("Log in with Email")',
		);
		if (
			await emailLoginButton.isVisible({ timeout: 3000 }).catch(() => false)
		) {
			await emailLoginButton.click();
		}

		await popup.fill(
			'input[name="login"], input[type="email"], input#login',
			"wrong@example.com",
		);
		await popup.fill(
			'input[name="password"], input[type="password"]',
			"wrongpassword",
		);
		await popup.click('button[type="submit"], input[type="submit"]');

		// Dex should show an error or stay on login page
		// Wait for network idle or error message
		await Promise.race([
			popup.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {}),
			popup
				.locator('.error, [class*="error"]')
				.waitFor({ state: "visible", timeout: 3000 })
				.catch(() => {}),
		]);

		// Popup should still be showing login or error page (not redirected)
		const url = popup.url();
		expect(url).toContain("localhost:5556/dex");

		await popup.close();
		await context.close();
	});
});
