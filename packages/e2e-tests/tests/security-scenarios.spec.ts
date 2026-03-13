import { expect, test } from "../playwright.setup";
import {
	expectAuthenticated,
	expectNoAuthError,
	expectNotAuthenticated,
	login,
	logout,
} from "./helpers";

test("ignores code without active login flow", async ({ page }) => {
	await page.goto("/configurable?code=injected&state=injected");
	await expectNotAuthenticated(page);
	await expectNoAuthError(page);
});

test("uses S256 for code_challenge_method", async ({ page }) => {
	await page.goto("/configurable");
	await login(page);
	await expectAuthenticated(page);
	const tokenData = JSON.parse(
		await page.getByTestId("token-data").innerText(),
	);
	expect(tokenData.authParameters.code_challenge_method).toBe("S256");
});

test("generates unique code_challenge per login", async ({ page }) => {
	await page.goto("/configurable");
	await login(page);
	await expectAuthenticated(page);
	const tokenData = JSON.parse(
		await page.getByTestId("token-data").innerText(),
	);
	const codeChallenge1 = tokenData.authParameters.code_challenge;

	await logout(page);

	await login(page);
	await expectAuthenticated(page);
	const tokenData2 = JSON.parse(
		await page.getByTestId("token-data").innerText(),
	);
	const codeChallenge2 = tokenData2.authParameters.code_challenge;

	expect(codeChallenge1).not.toBe(codeChallenge2);
});
