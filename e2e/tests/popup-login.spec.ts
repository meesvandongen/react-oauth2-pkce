import { HttpResponse, http } from "msw";
import { expect, test } from "../playwright.setup";
import { expectAuthenticated } from "./helpers";

test("opens popup for login", async ({ context, page, network }) => {
	network.use(
		http.get("**/auth", async ({ request }) => {
			return HttpResponse.html("<h1>Login Page</h1>");
		}),
	);
	await page.goto("http://localhost:3010/configurable");
	const popupPromise = page.waitForEvent("popup");
	await page.getByTestId("login-popup-button").click();

	const popup = await popupPromise;
	await expect(popup.getByText("Login Page")).toBeVisible();
});

test("authenticates via popup", async ({ page }) => {
	await page.goto("http://localhost:3010/configurable?storage=local");
	await page.getByTestId("login-popup-button").click();
	await expectAuthenticated(page);
});

test("falls back to redirect when popup is blocked", async ({ page }) => {
	await page.goto("http://localhost:3010/configurable");

	await page.evaluate(() => {
		window.open = () => null;
	});

	await page.getByTestId("login-popup-button").click();
	await expectAuthenticated(page);
});
