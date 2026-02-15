import type { Page } from "@playwright/test";
import { expect, test } from "../playwright.setup";
import {
	expectAuthenticated,
	expectNoAuthError,
	expectNotAuthenticated,
	login,
	logout,
} from "./helpers";

function monitorGuardErrors(page: Page) {
	const pageErrors: string[] = [];
	const consoleErrors: string[] = [];

	page.on("pageerror", (error) => {
		pageErrors.push(error.message);
	});

	page.on("console", (message) => {
		if (message.type() === "error") {
			consoleErrors.push(message.text());
		}
	});

	return {
		getGuardErrors: (guardError: string) => ({
			pageErrors: pageErrors.filter((message) => message.includes(guardError)),
			consoleErrors: consoleErrors.filter((message) =>
				message.includes(guardError),
			),
		}),
	};
}

test("does not throw guard errors during auth transitions with guarded useAuth", async ({
	page,
}) => {
	const guardError = "Expected authenticated auth state";
	const monitor = monitorGuardErrors(page);

	await page.goto("/configurable?tokenExpiresIn=2");
	await page.clock.install();

	await expectNotAuthenticated(page);
	await expectNoAuthError(page);

	await login(page);
	await expectAuthenticated(page);
	await expectNoAuthError(page);

	// Stress re-renders/state updates while authenticated.
	await page.clock.fastForward("00:20");
	await expectAuthenticated(page);
	await expectNoAuthError(page);

	for (let i = 0; i < 3; i++) {
		await logout(page);
		await expectNoAuthError(page);

		await login(page);
		await expectAuthenticated(page);
		await expectNoAuthError(page);
	}

	const guardErrors = monitor.getGuardErrors(guardError);
	expect(guardErrors.pageErrors).toEqual([]);
	expect(guardErrors.consoleErrors).toEqual([]);
});

test("does not throw guard errors across multi-tab localStorage churn", async ({
	page,
	context,
}) => {
	const guardError = "Expected authenticated auth state";
	const tab1Monitor = monitorGuardErrors(page);
	const page2 = await context.newPage();
	const tab2Monitor = monitorGuardErrors(page2);

	await page.goto("/configurable?storage=local");
	await expectNotAuthenticated(page);
	await expectNoAuthError(page);

	await page2.goto("/configurable?storage=local");
	await expectNotAuthenticated(page2);
	await expectNoAuthError(page2);

	for (let i = 0; i < 2; i++) {
		await login(page);
		await expectAuthenticated(page);
		await expectNoAuthError(page);

		await logout(page);
		await expectNotAuthenticated(page);
		await expectNoAuthError(page);

		await login(page2);
		await expectAuthenticated(page2);
		await expectNoAuthError(page2);

		await logout(page2);
		await expectNotAuthenticated(page2);
		await expectNoAuthError(page2);
	}

	const tab1Errors = tab1Monitor.getGuardErrors(guardError);
	const tab2Errors = tab2Monitor.getGuardErrors(guardError);

	expect(tab1Errors.pageErrors).toEqual([]);
	expect(tab1Errors.consoleErrors).toEqual([]);
	expect(tab2Errors.pageErrors).toEqual([]);
	expect(tab2Errors.consoleErrors).toEqual([]);
});
