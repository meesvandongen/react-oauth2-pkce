import type { Locator, Page } from "@playwright/test";
import { expect } from "../playwright.setup";

/**
 * Assert the auth snapshot status rendered by the UI.
 */
export async function expectAuthState(
	page: Page | Locator,
	state: "loading" | "unauthenticated" | "authenticated",
) {
	await expect(page.getByTestId("auth-state")).toHaveText(state);
}

/**
 * Assert the user is authenticated.
 */
export async function expectAuthenticated(page: Page | Locator) {
	await expectAuthState(page, "authenticated");
	await expect(page.getByTestId("authenticated")).toBeVisible();
}

/**
 * Assert the user is not authenticated.
 */
export async function expectNotAuthenticated(page: Page | Locator) {
	await expectAuthState(page, "unauthenticated");
	await expect(page.getByTestId("not-authenticated")).toBeVisible();
}

/**
 * Assert the authentication process is in progress.
 */
export async function expectLoginInProgress(page: Page | Locator) {
	await expectAuthState(page, "loading");
	await expect(page.getByTestId("login-in-progress")).toBeVisible();
}

/**
 * Assert an auth error is visible.
 */
export async function expectAuthError(page: Page | Locator) {
	await expect(page.getByTestId("auth-error")).toBeVisible();
}

/**
 * Assert no auth error is visible.
 */
export async function expectNoAuthError(page: Page | Locator) {
	await expect(page.getByTestId("auth-error")).not.toBeVisible();
}

/**
 * Perform full login flow.
 */
export async function login(page: Page | Locator) {
	await page.getByTestId("login-button").click();
}

/**
 * Perform logout.
 */
export async function logout(page: Page | Locator) {
	await page.getByTestId("logout-button").click();
	await expectNotAuthenticated(page);
}
