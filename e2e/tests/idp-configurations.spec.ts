import { test } from "../playwright.setup";
import { expectAuthenticated, login } from "./helpers";

test("handles response without refresh_token", async ({ page }) => {
	await page.route("**/token", async (route, request) => {
		if (request.postData()?.includes("authorization_code")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					access_token: "eyJhbGciOiJSUzI1NiJ9.eyJleHAiOjE5OTk5OTk5OTl9.test",
					token_type: "Bearer",
					expires_in: 3600,
				}),
			});
		} else {
			await route.continue();
		}
	});

	await page.goto("/configurable");
	await login(page);
	await expectAuthenticated(page);
});

test("handles KeyCloak style refresh_expires_in", async ({ page }) => {
	await page.route("**/token", async (route, request) => {
		if (request.postData()?.includes("authorization_code")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					access_token: "eyJhbGciOiJSUzI1NiJ9.eyJleHAiOjE5OTk5OTk5OTl9.test",
					token_type: "Bearer",
					expires_in: 300,
					refresh_token: "refresh",
					refresh_expires_in: 1800,
				}),
			});
		} else {
			await route.continue();
		}
	});

	await page.goto("/configurable");
	await login(page);
	await expectAuthenticated(page);
});

test("handles string expires_in", async ({ page }) => {
	await page.route("**/token", async (route, request) => {
		if (request.postData()?.includes("authorization_code")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					access_token: "eyJhbGciOiJSUzI1NiJ9.eyJleHAiOjE5OTk5OTk5OTl9.test",
					token_type: "Bearer",
					expires_in: "3600",
					refresh_token: "refresh",
				}),
			});
		} else {
			await route.continue();
		}
	});

	await page.goto("/configurable");
	await login(page);
	await expectAuthenticated(page);
});

test("handles extra custom fields in response", async ({ page }) => {
	await page.route("**/token", async (route, request) => {
		if (request.postData()?.includes("authorization_code")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					access_token: "eyJhbGciOiJSUzI1NiJ9.eyJleHAiOjE5OTk5OTk5OTl9.test",
					token_type: "Bearer",
					expires_in: 3600,
					custom_field: "value",
					session_state: "abc123",
				}),
			});
		} else {
			await route.continue();
		}
	});

	await page.goto("/configurable");
	await login(page);
	await expectAuthenticated(page);
});

test("handles invalid JWT gracefully", async ({ page }) => {
	await page.route("**/token", async (route, request) => {
		if (request.postData()?.includes("authorization_code")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					access_token: "not.valid.jwt",
					token_type: "Bearer",
					expires_in: 3600,
				}),
			});
		} else {
			await route.continue();
		}
	});

	await page.goto("/configurable");
	await login(page);
	await expectAuthenticated(page);
});
