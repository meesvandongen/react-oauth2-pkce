import { expect, test } from "../playwright.setup";
import { login } from "./helpers";

test.describe("Refresh Token", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/refresh");
	});

	test("displays configuration after login", async ({ page }) => {
		await login(page);

		await expect(page.getByText("Expiry Strategy: renewable")).toBeVisible();
		await expect(page.getByText("Refresh With Scope: true")).toBeVisible();
		await expect(page.getByTestId("callback-status")).toBeVisible();
	});
});

test.describe("Login In Progress", () => {
	test("clears login in progress after success", async ({ page }) => {
		await page.goto("/basic");
		await login(page);
		await expect(page.getByTestId("login-in-progress")).not.toBeVisible();
	});
});
