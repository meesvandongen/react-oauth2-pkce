import { test, expect } from '@playwright/test'
import { clearBrowserStorage, waitForNotAuthenticated } from './helpers'

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/basic')
    await clearBrowserStorage(page)
    await page.reload()
  })

  test('should handle missing code parameter gracefully', async ({ page }) => {
    // Simulate coming back from OAuth without a code parameter
    // This could happen if user cancels the login

    // Set loginInProgress to simulate mid-flow
    await page.evaluate(() => {
      sessionStorage.setItem('basic_loginInProgress', 'true')
    })

    // Reload without code parameter
    await page.reload()

    // Should show an error
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible()
  })

  test('should handle state mismatch error', async ({ page }) => {
    // Set up a fake state that won't match, and a code verifier
    await page.evaluate(() => {
      sessionStorage.setItem('ROCP_auth_state', 'original-state')
      sessionStorage.setItem('basic_loginInProgress', 'true')
      sessionStorage.setItem('basic_PKCE_code_verifier', 'test-verifier')
    })

    // Navigate with a different state
    await page.goto('/basic?code=fake-code&state=different-state')

    // Should show error (either state mismatch or token exchange error)
    const errorElement = page.locator('[data-testid="auth-error"]')
    await expect(errorElement).toBeVisible()
  })

  test('should display error message when authentication fails', async ({ page }) => {
    // Simulate an auth flow with invalid code
    await page.evaluate(() => {
      sessionStorage.setItem('basic_loginInProgress', 'true')
      sessionStorage.setItem('basic_PKCE_code_verifier', 'test-verifier')
      sessionStorage.setItem('ROCP_auth_state', 'test-state')
    })

    // Navigate with invalid code
    await page.goto('/basic?code=invalid-code&state=test-state')

    // Should show error
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible()
  })
})

test.describe('Token Decoding', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/basic')
    await clearBrowserStorage(page)
    await page.reload()
  })

  test('should not show tokenData when not authenticated', async ({ page }) => {
    await waitForNotAuthenticated(page)
    await expect(page.locator('[data-testid="token-data"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="access-token"]')).not.toBeVisible()
  })
})

test.describe('Storage Key Prefix', () => {
  test('should use custom storage key prefix for basic auth', async ({ page }) => {
    await page.goto('/basic')
    await clearBrowserStorage(page)
    await page.reload()

    // The basic auth page uses 'basic_' prefix
    // When login is initiated, it should use this prefix
    // Listen for navigation to capture storage before redirect
    const [loginInProgress] = await Promise.all([
      page.evaluate(() => {
        return new Promise<string | null>((resolve) => {
          const observer = new MutationObserver(() => {
            const value = sessionStorage.getItem('basic_loginInProgress')
            if (value) {
              resolve(value)
            }
          })
          observer.observe(document.body, { subtree: true, childList: true })
          // Also check immediately
          const value = sessionStorage.getItem('basic_loginInProgress')
          if (value) resolve(value)
          // Fallback timeout
          setTimeout(() => resolve(sessionStorage.getItem('basic_loginInProgress')), 100)
        })
      }),
      page.click('[data-testid="login-button"]'),
    ])

    // Value is JSON stringified, so it's 'true' as a string or the literal true stringified
    expect(loginInProgress).toBe('true')
  })

  test('should use different prefix for localstorage auth', async ({ page }) => {
    await page.goto('/localstorage')
    await clearBrowserStorage(page)
    await page.reload()

    // Listen for navigation to capture storage before redirect
    const [loginInProgress] = await Promise.all([
      page.evaluate(() => {
        return new Promise<string | null>((resolve) => {
          const observer = new MutationObserver(() => {
            const value = localStorage.getItem('localstorage_loginInProgress')
            if (value) {
              resolve(value)
            }
          })
          observer.observe(document.body, { subtree: true, childList: true })
          // Also check immediately
          const value = localStorage.getItem('localstorage_loginInProgress')
          if (value) resolve(value)
          // Fallback timeout
          setTimeout(() => resolve(localStorage.getItem('localstorage_loginInProgress')), 100)
        })
      }),
      page.click('[data-testid="login-button"]'),
    ])

    // Check that loginInProgress is stored with 'localstorage_' prefix
    // Value is JSON stringified
    expect(loginInProgress).toBe('true')
  })
})
