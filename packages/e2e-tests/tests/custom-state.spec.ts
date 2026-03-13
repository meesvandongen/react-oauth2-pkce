import { expect, test } from "../playwright.setup";
import { expectAuthenticated, login } from "./helpers";

test.beforeEach(async ({ page }) => {
	await page.goto("/configurable?logout=true");
});

test("passes through round-trip state on login", async ({ page }) => {
	await page.getByTestId("login-custom-state-button").click();
	await expectAuthenticated(page);
	await expect(page.getByTestId("token-data")).toHaveText(
		/login-custom-state-button/,
	);
});
