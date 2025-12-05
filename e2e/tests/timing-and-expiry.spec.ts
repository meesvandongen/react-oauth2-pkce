import { expect, test } from "../playwright.setup";
import { login } from "./helpers";

test.describe("Token Timing", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/timing");
	});

	test("shows timing configuration and UI elements after login", async ({
		page,
	}) => {
		await login(page);

		await expect(page.getByTestId("config-token-expires")).toContainText(
			"5 seconds",
		);
		await expect(page.getByTestId("config-refresh-expires")).toContainText(
			"60 seconds",
		);
		await expect(page.getByTestId("config-strategy")).toContainText(
			"renewable",
		);
		await expect(page.getByTestId("storage-info")).toBeVisible();
		await expect(page.getByTestId("callback-status")).toBeVisible();
		await expect(page.getByTestId("refresh-count")).toBeVisible();
		await expect(page.getByTestId("check-callback")).toBeVisible();
		await expect(page.getByTestId("callback-login")).toBeVisible();
	});
});
