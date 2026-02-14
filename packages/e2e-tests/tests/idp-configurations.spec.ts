import { expect, test } from "../playwright.setup";
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

	await page.goto("/configurable?oidc=false");
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

	await page.goto("/configurable?oidc=false");
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

	await page.goto("/configurable?oidc=false");
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

	await page.goto("/configurable?oidc=false");
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

	await page.goto("/configurable?oidc=false");
	await login(page);
	await expect(page.getByTestId("auth-state")).toHaveText("loading");
	await expect(page.getByTestId("authenticated")).not.toBeVisible();
});

test("supports JWT access_token + userinfo endpoint", async ({ page }) => {
	await page.route("**/token", async (route, request) => {
		if (request.postData()?.includes("authorization_code")) {
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					access_token:
						"eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE5OTk5OTk5OTksInN1YiI6InRlc3QtdXNlciJ9.test",
					token_type: "Bearer",
					expires_in: 3600,
					refresh_token: "refresh",
				}),
			});
		} else {
			await route.continue();
		}
	});

	await page.route("**/userinfo", async (route, request) => {
		const auth = request.headers()["authorization"];
		if (
			auth !==
			"Bearer eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE5OTk5OTk5OTksInN1YiI6InRlc3QtdXNlciJ9.test"
		) {
			await route.fulfill({
				status: 401,
				body: "Missing/invalid Authorization",
			});
			return;
		}

		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				sub: "test-user",
				email: "test@example.com",
				name: "Test User",
			}),
		});
	});

	await page.goto("/configurable?oidc=false&userinfo=true");
	await login(page);
	await expectAuthenticated(page);

	await expect(page.getByTestId("token-data")).toContainText("test-user");
	await expect(page.getByTestId("user-info")).toContainText("test@example.com");
});

test("stays in loading state when required userinfo fetch fails", async ({
	page,
}) => {
	await page.route("**/userinfo", async (route) => {
		await route.fulfill({
			status: 401,
			contentType: "text/plain",
			body: "Unauthorized",
		});
	});

	await page.goto("/configurable?oidc=false&userinfo=true");
	await login(page);

	await expect(page.getByTestId("auth-state")).toHaveText("loading");
	await expect(page.getByTestId("not-authenticated")).not.toBeVisible();
	await expect(page.getByTestId("authenticated")).not.toBeVisible();

	await expect(page.getByTestId("auth-error")).toContainText("Unauthorized");
});
