import { expect, test } from "../playwright.setup";
import { expectAuthenticated, expectNotAuthenticated, login } from "./helpers";

test.beforeEach(async ({ page }) => {
	await page.goto("/configurable?logout=true");
});

test("shows not authenticated initially", async ({ page }) => {
	await expectNotAuthenticated(page);
});

test("can log in with redirect", async ({ page }) => {
	await page.getByTestId("login-button").click();
	await expectAuthenticated(page);
});

test("can log in with replace navigation", async ({ page }) => {
	await page.getByTestId("login-replace-button").click();
	await expectAuthenticated(page);
});

test("has tokens after login", async ({ page }) => {
	await login(page);
	await expect(
		page.getByTestId("access-token"),
		"displays access token",
	).toBeVisible();
	await expect(
		page.getByTestId("token-data"),
		"displays decoded token data",
	).toBeVisible();

	await expect(page.getByTestId("id-token"), "displays ID token").toBeVisible();
	await expect(
		page.getByTestId("id-token-data"),
		"displays decoded ID token data",
	).toBeVisible();
});

test("clears URL parameters after login", async ({ page }) => {
	await login(page);
	await expectAuthenticated(page);
	expect.poll(() => page.url()).not.toContain("code=");
	expect.poll(() => page.url()).not.toContain("state=");
});

test("stays authenticated after page reload", async ({ page }) => {
	await login(page);
	await page.reload();
	await expectAuthenticated(page);
});
