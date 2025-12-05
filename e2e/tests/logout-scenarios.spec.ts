import { expect, test } from "../playwright.setup";
import {
	expectNoAuthError,
	expectNotAuthenticated,
	login,
	logout,
} from "./helpers";

test.describe("Logout", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/basic");
	});

	test("clears error state on logout", async ({ page }) => {
		await login(page);
		await logout(page);
		await expectNoAuthError(page);
	});

	test("handles logout when not logged in", async ({ page }) => {
		await expectNotAuthenticated(page);
		await page.getByTestId("logout-button").click();
		await expectNoAuthError(page);
		await expectNotAuthenticated(page);
	});
});

test.describe("Logout with Endpoint", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/logout-test");
	});

	test("shows logout configuration", async ({ page }) => {
		await expect(page.getByTestId("config-logout-endpoint")).toContainText(
			"idp/logout",
		);
		await expect(page.getByTestId("config-logout-redirect")).toContainText(
			"logout-test",
		);
	});

	test("shows ID token availability after login", async ({ page }) => {
		await login(page);
		await expect(page.getByTestId("id-token-available")).toContainText("yes");
	});

	test("logs out with state parameter", async ({ page }) => {
		await login(page);
		await page.getByTestId("logout-with-state-button").click();
		// Logout clears local state regardless of IdP response
		await expectNotAuthenticated(page);
	});

	test("logs out with hint parameter", async ({ page }) => {
		await login(page);
		await page.getByTestId("logout-with-hint-button").click();
		await expectNotAuthenticated(page);
	});

	test("logs out with full parameters", async ({ page }) => {
		await login(page);
		await page.getByTestId("logout-full-button").click();
		await expectNotAuthenticated(page);
	});
});

test.describe("Logout without Endpoint", () => {
	test("stays on same page after logout", async ({ page }) => {
		await page.goto("/basic");
		await login(page);
		await logout(page);
		expect(page.url()).toContain("/basic");
	});
});
