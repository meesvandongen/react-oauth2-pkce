import { expect, test } from "@playwright/test";
import {
	performDexLogin,
	waitForAuthenticated,
	waitForNotAuthenticated,
} from "./helpers";

test.describe("Local Storage Feature", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/localstorage");
	});

	test("should store tokens in localStorage when configured", async ({
		page,
	}) => {
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Check localStorage for token with correct prefix
		const localToken = await page.evaluate(() => {
			return localStorage.getItem("localstorage_token");
		});
		expect(localToken).toBeTruthy();

		// Session storage should NOT have the token
		const sessionToken = await page.evaluate(() => {
			return sessionStorage.getItem("localstorage_token");
		});
		expect(sessionToken).toBeNull();
	});

	test("should display localStorage contents for verification", async ({
		page,
	}) => {
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// The page shows localStorage contents
		const storageContents = await page
			.locator('[data-testid="storage-contents"]')
			.textContent();
		expect(storageContents).toContain("localstorage_token");
	});

	test("should persist across browser sessions (simulated)", async ({
		page,
		context,
	}) => {
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Create a new page in the same context (simulates new tab)
		const newPage = await context.newPage();
		await newPage.goto("/localstorage");

		// Should be authenticated (localStorage persists)
		await waitForAuthenticated(newPage);

		await newPage.close();
	});

	test("should clear localStorage on logout", async ({ page }) => {
		await page.click('[data-testid="login-button"]');
		await performDexLogin(page);
		await waitForAuthenticated(page);

		// Verify token exists
		let localToken = await page.evaluate(() =>
			localStorage.getItem("localstorage_token"),
		);
		expect(localToken).toBeTruthy();

		// Logout
		await page.click('[data-testid="logout-button"]');
		await waitForNotAuthenticated(page);

		// Token should be cleared (empty string when JSON stringified is '""')
		localToken = await page.evaluate(() =>
			localStorage.getItem("localstorage_token"),
		);
		expect(
			localToken === null || localToken === '""' || localToken === "",
		).toBeTruthy();
	});
});
