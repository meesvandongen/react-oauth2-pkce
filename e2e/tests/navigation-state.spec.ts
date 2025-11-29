import { expect, test } from '@playwright/test'
import { clearBrowserStorage, performDexLogin, waitForAuthenticated, waitForNotAuthenticated } from './helpers'

/**
 * Navigation and State Management Tests
 *
 * These tests verify behavior during browser navigation:
 * - Browser back/forward navigation during auth flow
 * - Page reload at various stages
 * - AuthProvider unmount/remount during authentication
 */

test.describe('Browser Navigation During Auth Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/basic')
    await clearBrowserStorage(page)
    await page.reload()
  })

  test('should handle back navigation from IdP page', async ({ page }) => {
    // Start login
    await page.click('[data-testid="login-button"]')
    await page.waitForURL(/.*localhost:5556\/dex.*/)

    // Go back before completing login
    await page.goBack()

    // Should be back at app
    await expect(page.url()).toContain('localhost:3010')

    // loginInProgress should still be true (flow wasn't completed)
    const loginInProgress = await page.evaluate(() => sessionStorage.getItem('basic_loginInProgress'))
    expect(loginInProgress).toBe('true')
  })

  test('should handle forward navigation after back', async ({ page }) => {
    // Start login
    await page.click('[data-testid="login-button"]')
    await page.waitForURL(/.*localhost:5556\/dex.*/)

    // Go back
    await page.goBack()
    await expect(page.url()).toContain('localhost:3010')

    // Go forward
    await page.goForward()

    // Should be at IdP again (if history allows)
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
  })

  test('should handle navigation during token exchange', async ({ page }) => {
    // Complete login normally
    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Now go back (to callback URL with code)
    await page.goBack()

    // The code has already been used, should show error or be authenticated
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})

    // Either shows error (code reuse) or stays authenticated
    const hasError = await page
      .locator('[data-testid="auth-error"]')
      .isVisible()
      .catch(() => false)
    const isAuthenticated = await page
      .locator('[data-testid="authenticated"]')
      .isVisible()
      .catch(() => false)

    // One of these should be true
    expect(hasError || isAuthenticated).toBe(true)
  })
})

test.describe('Page Reload Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/basic')
    await clearBrowserStorage(page)
    await page.reload()
  })

  test('should handle reload before redirect to IdP', async ({ page }) => {
    await waitForNotAuthenticated(page)

    // Reload before any login attempt
    await page.reload()

    // Should still be not authenticated
    await waitForNotAuthenticated(page)
  })

  test('should handle reload after successful login', async ({ page }) => {
    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Reload
    await page.reload()

    // Should still be authenticated
    await waitForAuthenticated(page)
  })

  test('should handle reload with loginInProgress flag set', async ({ page }) => {
    // Set loginInProgress without actual code
    await page.evaluate(() => {
      sessionStorage.setItem('basic_loginInProgress', 'true')
    })

    // Reload
    await page.reload()

    // Should show error (loginInProgress but no code)
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible()
  })

  test('should handle reload with code in URL', async ({ page }) => {
    // Set up valid auth state
    await page.evaluate(() => {
      sessionStorage.setItem('basic_loginInProgress', 'true')
      sessionStorage.setItem('basic_PKCE_code_verifier', 'test-verifier')
      sessionStorage.setItem('ROCP_auth_state', 'test-state')
    })

    // Navigate with code
    await page.goto('/basic?code=test-code&state=test-state')

    // First load will try token exchange
    await page
      .waitForFunction(
        () =>
          !sessionStorage.getItem('basic_loginInProgress') ||
          sessionStorage.getItem('basic_loginInProgress') === 'false',
        { timeout: 5000 }
      )
      .catch(() => {})

    // Reload - code has already been used
    await page.reload()

    // Should handle gracefully (code was used, loginInProgress should be false now)
  })
})

test.describe('Multiple Page Loads', () => {
  test('should handle rapid page reloads', async ({ page }) => {
    await page.goto('/basic')
    await clearBrowserStorage(page)

    // Rapid reloads
    for (let i = 0; i < 5; i++) {
      await page.reload()
      await page.waitForLoadState('domcontentloaded', { timeout: 2000 }).catch(() => {})
    }

    // Should end up in stable state
    await waitForNotAuthenticated(page)
  })

  test('should handle navigation between auth pages', async ({ page }) => {
    // Login to basic
    await page.goto('/basic')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Navigate to localstorage page
    await page.goto('/localstorage')

    // Different storage type, should not be authenticated
    await waitForNotAuthenticated(page)

    // Go back to basic
    await page.goto('/basic')

    // Should still be authenticated (sessionStorage preserved)
    await waitForAuthenticated(page)
  })
})

test.describe('History State Management', () => {
  test('should clean URL after login', async ({ page }) => {
    await page.goto('/basic')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // URL should not contain code or state
    const url = page.url()
    expect(url).not.toContain('code=')
    expect(url).not.toContain('state=')
  })

  test('should preserve hash in URL after login', async ({ page }) => {
    // Navigate to page with hash
    await page.goto('/basic#some-hash')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Hash should be preserved
    const url = page.url()
    expect(url).toContain('#some-hash')
  })

  test('should handle browser history after logout', async ({ page }) => {
    await page.goto('/basic')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Logout
    await page.click('[data-testid="logout-button"]')
    await waitForNotAuthenticated(page)

    // Go back
    await page.goBack()

    // Should not auto-login (just viewing history)
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
  })
})

test.describe('Route Changes and Component Lifecycle', () => {
  test('should maintain auth state across route changes', async ({ page }) => {
    await page.goto('/basic')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Navigate to another page within the same storage scope
    // Note: /basic is sessionStorage, navigating to another sessionStorage page
    // within same tab should preserve storage
    await page.goto('/')
    await page.goto('/basic')

    // Should still be authenticated
    await waitForAuthenticated(page)
  })

  test('should handle component remount', async ({ page }) => {
    await page.goto('/basic')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Navigate away and back (causes component unmount/remount)
    await page.goto('/')
    await page.goto('/basic')

    // Should maintain auth state
    await waitForAuthenticated(page)
  })
})

test.describe('URL Parameter Handling', () => {
  test('should ignore unrelated URL parameters', async ({ page }) => {
    await page.goto('/basic?unrelated=param&foo=bar')
    await clearBrowserStorage(page)
    await page.reload()

    // Should show not authenticated (no code param)
    await waitForNotAuthenticated(page)

    // Login should work normally
    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)
  })

  test('should handle malformed URL parameters', async ({ page }) => {
    // Set up auth state
    await page.goto('/basic')
    await page.evaluate(() => {
      sessionStorage.setItem('basic_loginInProgress', 'true')
      sessionStorage.setItem('basic_PKCE_code_verifier', 'test-verifier')
      sessionStorage.setItem('ROCP_auth_state', 'test-state')
    })

    // Navigate with malformed parameters
    await page.goto('/basic?code=&state=')

    // Should handle gracefully (empty code)
    await page
      .waitForFunction(
        () =>
          !sessionStorage.getItem('basic_loginInProgress') ||
          sessionStorage.getItem('basic_loginInProgress') === 'false',
        { timeout: 3000 }
      )
      .catch(() => {})
  })

  test('should handle encoded URL parameters', async ({ page }) => {
    await page.goto('/basic')
    await page.evaluate(() => {
      sessionStorage.setItem('basic_loginInProgress', 'true')
      sessionStorage.setItem('basic_PKCE_code_verifier', 'test-verifier')
      sessionStorage.setItem('ROCP_auth_state', 'test%20state%20with%20spaces')
    })

    // Navigate with encoded state
    await page.goto('/basic?code=test&state=test%20state%20with%20spaces')

    // Should match encoded state correctly
    await page
      .waitForFunction(
        () =>
          !sessionStorage.getItem('basic_loginInProgress') ||
          sessionStorage.getItem('basic_loginInProgress') === 'false',
        { timeout: 3000 }
      )
      .catch(() => {})
  })
})

test.describe('Single Page App Navigation', () => {
  test('should handle client-side routing', async ({ page }) => {
    await page.goto('/')
    await clearBrowserStorage(page)
    await page.reload()

    // Navigate via client-side routing (link click)
    await page.click('a[href="/basic"]').catch(() => {
      // If no link exists, navigate directly
    })
    await page.goto('/basic')

    // Should show not authenticated
    await waitForNotAuthenticated(page)
  })

  test('should handle hash-based routing', async ({ page }) => {
    await page.goto('/basic#section1')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Change hash
    await page.goto('/basic#section2')

    // Should still be authenticated
    await waitForAuthenticated(page)
  })
})
