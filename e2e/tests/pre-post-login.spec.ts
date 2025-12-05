import { expect, test } from "../playwright.setup";
import { login } from "./helpers";

test.describe("Pre/Post Login Hooks", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/prepostlogin");
	});

	test("shows initial callback status", async ({ page }) => {
		await expect(page.getByTestId("prelogin-status")).toHaveText("not-called");
		await expect(page.getByTestId("postlogin-status")).toHaveText("not-called");
	});

	test("calls both hooks during login flow", async ({ page }) => {
		await login(page);

		await expect(page.getByTestId("prelogin-status")).toHaveText("called");
		await expect(page.getByTestId("postlogin-status")).toHaveText("called");
	});
});
