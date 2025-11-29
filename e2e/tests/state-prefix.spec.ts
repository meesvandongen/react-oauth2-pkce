import { expect, test } from '@playwright/test'
import { clearBrowserStorage } from './helpers'

test.describe('State Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/multiauth')
    await clearBrowserStorage(page)
    await page.reload()
  })

  test('should handle empty state from OAuth server gracefully', async ({ page }) => {
    // This test verifies that when no state is configured, and the OAuth server
    // returns an empty state parameter (state=), no error occurs.
    // The fix normalizes empty string and null to be treated as equivalent.

    // Set up auth1 with no state stored (simulating no state configured)
    await page.evaluate(() => {
      sessionStorage.setItem('auth1_loginInProgress', 'true')
      sessionStorage.setItem('auth1_PKCE_code_verifier', 'test-verifier')
      // Deliberately NOT setting ROCP_auth_state
    })

    // Simulate callback with empty state (state=) - this is what some OAuth servers do
    await page.goto('/multiauth?code=test-code&state=')

    // Listen for console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Wait for processing using waitForFunction
    await page
      .waitForFunction(
        () =>
          !sessionStorage.getItem('auth1_loginInProgress') ||
          sessionStorage.getItem('auth1_loginInProgress') === 'false',
        { timeout: 2000 }
      )
      .catch(() => {})

    // Should NOT have state mismatch error (empty string should equal null)
    const stateErrors = consoleErrors.filter((e) => e.toLowerCase().includes('state'))
    // Note: We expect no state errors; there may be token exchange errors which is fine
    expect(stateErrors).toHaveLength(0)
  })

  test('should show state mismatch error when actual tampering occurs', async ({ page }) => {
    // This test verifies that state validation still works correctly
    // when there's an actual mismatch (not just empty vs null)

    // Set up auth1 with a specific state
    await page.evaluate(() => {
      sessionStorage.setItem('auth1_loginInProgress', 'true')
      sessionStorage.setItem('auth1_PKCE_code_verifier', 'test-verifier')
      sessionStorage.setItem('ROCP_auth_state', 'expected-state')
    })

    // Listen for console errors
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Return with a DIFFERENT state than what was stored
    await page.goto('/multiauth?code=test-code&state=tampered-state')

    // Wait for processing using waitForFunction
    await page
      .waitForFunction(
        () =>
          !sessionStorage.getItem('auth1_loginInProgress') ||
          sessionStorage.getItem('auth1_loginInProgress') === 'false',
        { timeout: 3000 }
      )
      .catch(() => {})

    // The state mismatch error should be logged
    const hasStateMismatchError = consoleErrors.some((e) => e.includes('state'))
    expect(hasStateMismatchError).toBe(true)
  })
})
