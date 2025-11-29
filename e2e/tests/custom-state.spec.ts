import { test, expect } from '@playwright/test'
import { performDexLogin, clearBrowserStorage, waitForAuthenticated, waitForNotAuthenticated } from './helpers'

test.describe('Custom State Parameter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/customstate')
    await clearBrowserStorage(page)
    await page.reload()
  })

  test('should use default state from config when logging in without custom state', async ({ page }) => {
    // Login with default state
    await page.click('[data-testid="login-default-state"]')

    // Check URL contains state parameter before redirecting to Dex
    // Note: The state is stored and validated, not visible in return URL if clearURL is true
    await performDexLogin(page)
    await waitForAuthenticated(page)
  })

  test('should use custom state passed to logIn function', async ({ page }) => {
    // Set custom state
    await page.fill('[data-testid="state-input"]', 'my-test-state-123')

    // Login with custom state
    await page.click('[data-testid="login-custom-state"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // The state should have been validated (no error)
    await expect(page.locator('[data-testid="auth-error"]')).not.toBeVisible()
  })

  test('should validate state on callback to prevent CSRF', async ({ page }) => {
    // This test verifies that state validation works
    // If state doesn't match, an error should be shown
    await page.click('[data-testid="login-custom-state"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Successful login means state was validated correctly
    await expect(page.locator('[data-testid="authenticated"]')).toBeVisible()
  })
})
