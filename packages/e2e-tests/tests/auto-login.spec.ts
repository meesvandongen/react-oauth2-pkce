import { expect, test } from "../playwright.setup";
import { expectAuthenticated } from "./helpers";

test("auto login", async ({ page }) => {
	await page.goto("/configurable?autoLogin=true");
	await expect(page.getByTestId("pre-login-status")).toHaveText("called");
	await expectAuthenticated(page);

	await page.reload();
	await expectAuthenticated(page);
});
