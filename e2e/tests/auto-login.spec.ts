import { test } from "../playwright.setup";
import { expectAuthenticated } from "./helpers";

test("auto login", async ({ page }) => {
	await page.goto("/autologin");
	await expectAuthenticated(page);

	await page.reload();
	await expectAuthenticated(page);
});
