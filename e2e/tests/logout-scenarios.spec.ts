import { expect, test } from "../playwright.setup";
import {
	expectAuthenticated,
	expectNoAuthError,
	expectNotAuthenticated,
	login,
	logout,
} from "./helpers";

test.beforeEach(async ({ page }) => {
	await page.goto("/basic");
});

test("can log out", async ({ page }) => {
	await login(page);
	await expectAuthenticated(page);
	await logout(page);
	await expectNoAuthError(page);
});

test("handles logout when not logged in", async ({ page }) => {
	await expectNotAuthenticated(page);
	await logout(page);
	await expectNoAuthError(page);
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

test("stays on same page after logout", async ({ page }) => {
	await page.goto("/basic");
	await login(page);
	await logout(page);
	expect(page.url()).toContain("/basic");
});
