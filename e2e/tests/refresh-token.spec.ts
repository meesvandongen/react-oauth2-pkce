import { expect, test } from "../playwright.setup";
import { login } from "./helpers";

test("clears login in progress after success", async ({ page }) => {
	await page.goto("/basic");
	await login(page);
	await expect(page.getByTestId("login-in-progress")).not.toBeVisible();
});
