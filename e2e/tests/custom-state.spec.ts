import { test } from "../playwright.setup";
import { expectAuthenticated, expectNoAuthError } from "./helpers";

test.beforeEach(async ({ page }) => {
	await page.goto("/customstate");
});

test("logs in with default state from config", async ({ page }) => {
	await page.getByTestId("login-default-state").click();
	await expectAuthenticated(page);
	await expectNoAuthError(page);
});

test("logs in with custom state passed to logIn", async ({ page }) => {
	await page.getByTestId("state-input").fill("my-custom-state-123");
	await page.getByTestId("login-custom-state").click();
	await expectAuthenticated(page);
	await expectNoAuthError(page);
});
