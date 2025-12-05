import { expect, test } from "../playwright.setup";
import {
	expectAuthError,
	expectAuthenticated,
	expectNotAuthenticated,
	login,
} from "./helpers";

test.describe("CSRF Protection", () => {
	test("rejects mismatched state parameter", async ({ page }) => {
		await page.goto("/basic?code=test&state=wrong-state");
		await expectAuthError(page);
	});

	test("accepts matching state during normal login", async ({ page }) => {
		await page.goto("/basic");
		await login(page);
		await expectAuthenticated(page);
	});
});

test.describe("Authorization Code Security", () => {
	test("ignores code without active login flow", async ({ page }) => {
		await page.goto("/basic?code=injected&state=injected");
		await expectNotAuthenticated(page);
	});
});

test.describe("PKCE Code Challenge", () => {
	test("uses S256 for code_challenge_method", async ({ page }) => {
		await page.goto("/basic");

		let challengeMethod = "";
		await page.route("**/idp/auth**", async (route, request) => {
			challengeMethod =
				new URL(request.url()).searchParams.get("code_challenge_method") || "";
			await route.continue();
		});

		await page.click('[data-testid="login-button"]');
		await page.waitForURL(/.*localhost:5556\/idp.*/);

		expect(challengeMethod).toBe("S256");
	});

	test("generates unique code_challenge per login", async ({ page }) => {
		await page.goto("/basic");

		const challenges: string[] = [];
		await page.route("**/idp/auth**", async (route, request) => {
			challenges.push(
				new URL(request.url()).searchParams.get("code_challenge") || "",
			);
			await route.continue();
		});

		await page.click('[data-testid="login-button"]');
		await page.waitForURL(/.*localhost:5556\/idp.*/);
		await page.goBack();

		await page.click('[data-testid="login-button"]');
		await page.waitForURL(/.*localhost:5556\/idp.*/);

		expect(challenges[0]).toBeTruthy();
		expect(challenges[1]).toBeTruthy();
		expect(challenges[0]).not.toBe(challenges[1]);
	});
});

test.describe("Storage Isolation", () => {
	test("sessionStorage app cannot see localStorage app tokens", async ({
		page,
	}) => {
		await page.goto("/basic");
		await login(page);
		await expectAuthenticated(page);

		await page.goto("/localstorage");
		await expectNotAuthenticated(page);
	});

	test("localStorage app cannot see sessionStorage app tokens", async ({
		page,
	}) => {
		await page.goto("/localstorage");
		await login(page);
		await expectAuthenticated(page);

		await page.goto("/basic");
		await expectNotAuthenticated(page);
	});
});
