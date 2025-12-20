import { expect, test } from "../playwright.setup";
import { login } from "./helpers";

test.beforeEach(async ({ page }) => {
	await page.goto("/configurable");
});

test("shows initial callback status", async ({ page }) => {
	await expect(page.getByTestId("pre-login-status")).toHaveText("not-called");
	await expect(page.getByTestId("post-login-status")).toHaveText("not-called");
});

test("calls both hooks during login flow", async ({ page }) => {
	await login(page);

	await expect(page.getByTestId("pre-login-status")).toHaveText("called");
	await expect(page.getByTestId("post-login-status")).toHaveText("called");
});
