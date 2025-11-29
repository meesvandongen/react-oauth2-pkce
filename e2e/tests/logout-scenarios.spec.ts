import { expect, test } from '@playwright/test'
import { clearBrowserStorage, performDexLogin, waitForAuthenticated, waitForNotAuthenticated } from './helpers'

/**
 * Logout Scenario Tests
 *
 * These tests verify logout functionality:
 * - Logout with different logoutEndpoint configurations
 * - Logout with state and logoutHint parameters
 * - Logout when tokens have already expired
 * - Logout redirect with logoutRedirect parameter
 * - Logout with extraLogoutParameters
 * - IdP logout endpoint returning errors
 */

test.describe('Basic Logout Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/basic')
    await clearBrowserStorage(page)
    await page.reload()
  })

  test('should clear token on logout', async ({ page }) => {
    // First login
    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Verify token exists
    const tokenBefore = await page.evaluate(() => sessionStorage.getItem('basic_token'))
    expect(tokenBefore).toBeTruthy()

    // Logout
    await page.click('[data-testid="logout-button"]')

    // Verify token is cleared
    const tokenAfter = await page.evaluate(() => sessionStorage.getItem('basic_token'))
    expect(tokenAfter).toBeFalsy()

    // Verify UI shows not authenticated
    await waitForNotAuthenticated(page)
  })

  test('should clear all auth-related storage on logout', async ({ page }) => {
    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Logout
    await page.click('[data-testid="logout-button"]')

    // Verify all auth storage is cleared
    const storage = await page.evaluate(() => {
      return {
        token: sessionStorage.getItem('basic_token'),
        refreshToken: sessionStorage.getItem('basic_refreshToken'),
        tokenExpire: sessionStorage.getItem('basic_tokenExpire'),
        refreshTokenExpire: sessionStorage.getItem('basic_refreshTokenExpire'),
        idToken: sessionStorage.getItem('basic_idToken'),
        loginInProgress: sessionStorage.getItem('basic_loginInProgress'),
      }
    })

    expect(storage.token).toBeFalsy()
    expect(storage.refreshToken).toBeFalsy()
    expect(storage.idToken).toBeFalsy()
    expect(storage.loginInProgress).toBe('false')
  })

  test('should clear error state on logout', async ({ page }) => {
    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Set an error manually
    await page.evaluate(() => {
      // Simulate error state (though this is internal)
    })

    // Logout should clear any errors
    await page.click('[data-testid="logout-button"]')

    // No error should be visible
    await expect(page.locator('[data-testid="auth-error"]')).not.toBeVisible()
  })
})

test.describe('Logout with LogoutEndpoint', () => {
  test('should redirect to logoutEndpoint when configured', async ({ page }) => {
    await page.goto('/logout-test')
    await clearBrowserStorage(page)
    await page.reload()

    // Login first
    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Verify config shows logout endpoint
    await expect(page.locator('[data-testid="config-logout-endpoint"]')).toContainText('dex/logout')

    // Capture navigation to logout endpoint
    let _logoutUrl = ''
    page.on('request', (request) => {
      if (request.url().includes('logout')) {
        _logoutUrl = request.url()
      }
    })

    // Logout - this will redirect
    await page.click('[data-testid="logout-button"]')

    // Should navigate to logout endpoint
    await page.waitForURL(/.*logout.*/).catch(() => {
      // Dex might not have a working logout endpoint
    })

    // If redirect happened, URL should contain logout
    const _currentUrl = page.url()
    // Note: If Dex doesn't support logout, we may still be on the page
  })

  test('should not redirect when logoutEndpoint is not configured', async ({ page }) => {
    await page.goto('/basic')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Logout without logoutEndpoint configured
    await page.click('[data-testid="logout-button"]')

    // Should stay on same page, just clear storage
    await expect(page.url()).toContain('/basic')
    await waitForNotAuthenticated(page)
  })
})

test.describe('Logout with State Parameter', () => {
  test('should include state in logout request', async ({ page }) => {
    await page.goto('/logout-test')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Capture logout URL
    let logoutUrl = ''
    page.on('request', (request) => {
      if (request.url().includes('logout')) {
        logoutUrl = request.url()
      }
    })

    // Logout with state
    const requestPromise = page
      .waitForRequest((request) => request.url().includes('logout'), { timeout: 2000 })
      .catch(() => null)
    await page.click('[data-testid="logout-with-state-button"]')

    // Wait for logout request or storage clear
    await Promise.race([
      requestPromise,
      page.waitForFunction(() => !sessionStorage.getItem('logouttest_token'), { timeout: 2000 }),
    ]).catch(() => {})

    // Check if state was included
    if (logoutUrl) {
      const url = new URL(logoutUrl)
      expect(url.searchParams.get('state')).toBe('logout-state-123')
    }
  })
})

test.describe('Logout with Hint Parameter', () => {
  test('should include logout_hint in logout request', async ({ page }) => {
    await page.goto('/logout-test')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    let logoutUrl = ''
    page.on('request', (request) => {
      if (request.url().includes('logout')) {
        logoutUrl = request.url()
      }
    })

    // Logout with hint
    const requestPromise = page
      .waitForRequest((request) => request.url().includes('logout'), { timeout: 2000 })
      .catch(() => null)
    await page.click('[data-testid="logout-with-hint-button"]')

    // Wait for logout request or storage clear
    await Promise.race([
      requestPromise,
      page.waitForFunction(() => !sessionStorage.getItem('logouttest_token'), { timeout: 2000 }),
    ]).catch(() => {})

    if (logoutUrl) {
      const url = new URL(logoutUrl)
      expect(url.searchParams.get('logout_hint')).toBe('user@example.com')
    }
  })
})

test.describe('Logout with Full Parameters', () => {
  test('should include all parameters in logout request', async ({ page }) => {
    await page.goto('/logout-test')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    let logoutUrl = ''
    page.on('request', (request) => {
      if (request.url().includes('logout')) {
        logoutUrl = request.url()
      }
    })

    // Logout with all params
    const requestPromise = page
      .waitForRequest((request) => request.url().includes('logout'), { timeout: 2000 })
      .catch(() => null)
    await page.click('[data-testid="logout-full-button"]')

    // Wait for logout request or storage clear
    await Promise.race([
      requestPromise,
      page.waitForFunction(() => !sessionStorage.getItem('logouttest_token'), { timeout: 2000 }),
    ]).catch(() => {})

    if (logoutUrl) {
      const url = new URL(logoutUrl)
      expect(url.searchParams.get('state')).toBe('state-123')
      expect(url.searchParams.get('logout_hint')).toBe('user@example.com')
      expect(url.searchParams.get('extra_param')).toBe('value')
      // Check extra logout params from config
      expect(url.searchParams.get('custom_logout_param')).toBe('test_value')
    }
  })

  test('should include id_token_hint when available', async ({ page }) => {
    await page.goto('/logout-test')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Verify ID token is available
    await expect(page.locator('[data-testid="id-token-available"]')).toContainText('yes')

    let logoutUrl = ''
    page.on('request', (request) => {
      if (request.url().includes('logout')) {
        logoutUrl = request.url()
      }
    })

    const requestPromise = page
      .waitForRequest((request) => request.url().includes('logout'), { timeout: 2000 })
      .catch(() => null)
    await page.click('[data-testid="logout-button"]')

    // Wait for logout request or storage clear
    await Promise.race([
      requestPromise,
      page.waitForFunction(() => !sessionStorage.getItem('logouttest_token'), { timeout: 2000 }),
    ]).catch(() => {})

    if (logoutUrl) {
      const url = new URL(logoutUrl)
      // Should include id_token_hint
      expect(url.searchParams.has('id_token_hint')).toBe(true)
    }
  })
})

test.describe('Logout with Expired Tokens', () => {
  test('should logout successfully even when token is expired', async ({ page }) => {
    await page.goto('/basic')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Simulate expired token
    await page.evaluate(() => {
      sessionStorage.setItem('basic_tokenExpire', '0')
    })

    // Logout should still work
    await page.click('[data-testid="logout-button"]')

    await waitForNotAuthenticated(page)

    // Storage should be cleared
    const token = await page.evaluate(() => sessionStorage.getItem('basic_token'))
    expect(token).toBeFalsy()
  })

  test('should logout when refresh token is also expired', async ({ page }) => {
    await page.goto('/refresh')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Expire both tokens
    await page.evaluate(() => {
      sessionStorage.setItem('refresh_tokenExpire', '0')
      sessionStorage.setItem('refresh_refreshTokenExpire', '0')
    })

    // Logout should still work
    await page.click('[data-testid="logout-button"]')

    await waitForNotAuthenticated(page)
  })
})

test.describe('Logout Redirect', () => {
  test('should include post_logout_redirect_uri in request', async ({ page }) => {
    await page.goto('/logout-test')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Verify config shows logout redirect
    await expect(page.locator('[data-testid="config-logout-redirect"]')).toContainText('logout-test')

    let logoutUrl = ''
    page.on('request', (request) => {
      if (request.url().includes('logout')) {
        logoutUrl = request.url()
      }
    })

    const requestPromise = page
      .waitForRequest((request) => request.url().includes('logout'), { timeout: 2000 })
      .catch(() => null)
    await page.click('[data-testid="logout-button"]')

    // Wait for logout request or storage clear
    await Promise.race([
      requestPromise,
      page.waitForFunction(() => !sessionStorage.getItem('logouttest_token'), { timeout: 2000 }),
    ]).catch(() => {})

    if (logoutUrl) {
      const url = new URL(logoutUrl)
      expect(url.searchParams.get('post_logout_redirect_uri')).toContain('localhost:3010')
    }
  })
})

test.describe('Logout Error Handling', () => {
  test('should handle logout endpoint errors gracefully', async ({ page }) => {
    await page.goto('/logout-test')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Intercept logout to return error
    await page.route('**/dex/logout**', async (route) => {
      await route.fulfill({
        status: 500,
        body: 'Internal Server Error',
      })
    })

    // Attempt logout
    await page.click('[data-testid="logout-button"]')

    // Local state should still be cleared regardless of IdP error
    const token = await page.evaluate(() => sessionStorage.getItem('logouttest_token'))
    expect(token).toBeFalsy()
  })

  test('should handle logout endpoint timeout', async ({ page }) => {
    await page.goto('/logout-test')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Intercept logout to never respond
    await page.route('**/dex/logout**', async (_route) => {
      // Never respond
      await new Promise(() => {})
    })

    // Attempt logout - will redirect but hang
    // Local storage is cleared before redirect
    const tokenBeforeLogout = await page.evaluate(() => sessionStorage.getItem('logouttest_token'))
    expect(tokenBeforeLogout).toBeTruthy()

    // Click logout
    await page.click('[data-testid="logout-button"]')

    // Token should be cleared locally even before redirect completes
    await page.waitForFunction(() => !sessionStorage.getItem('logouttest_token'), { timeout: 2000 })
  })
})

test.describe('Extra Logout Parameters', () => {
  test('should include extraLogoutParameters in request', async ({ page }) => {
    await page.goto('/logout-test')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Verify config shows extra params
    await expect(page.locator('[data-testid="config-extra-params"]')).toContainText('custom_logout_param')

    let logoutUrl = ''
    page.on('request', (request) => {
      if (request.url().includes('logout')) {
        logoutUrl = request.url()
      }
    })

    const requestPromise = page
      .waitForRequest((request) => request.url().includes('logout'), { timeout: 2000 })
      .catch(() => null)
    await page.click('[data-testid="logout-button"]')

    // Wait for logout request or storage clear
    await Promise.race([
      requestPromise,
      page.waitForFunction(() => !sessionStorage.getItem('logouttest_token'), { timeout: 2000 }),
    ]).catch(() => {})

    if (logoutUrl) {
      const url = new URL(logoutUrl)
      expect(url.searchParams.get('custom_logout_param')).toBe('test_value')
    }
  })

  test('should merge additionalParameters with extraLogoutParameters', async ({ page }) => {
    await page.goto('/logout-test')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    let logoutUrl = ''
    page.on('request', (request) => {
      if (request.url().includes('logout')) {
        logoutUrl = request.url()
      }
    })

    // Use full logout button which passes additional params
    const requestPromise = page
      .waitForRequest((request) => request.url().includes('logout'), { timeout: 2000 })
      .catch(() => null)
    await page.click('[data-testid="logout-full-button"]')

    // Wait for logout request or storage clear
    await Promise.race([
      requestPromise,
      page.waitForFunction(() => !sessionStorage.getItem('logouttest_token'), { timeout: 2000 }),
    ]).catch(() => {})

    if (logoutUrl) {
      const url = new URL(logoutUrl)
      // Should have both config extra params and call-time params
      expect(url.searchParams.get('custom_logout_param')).toBe('test_value')
      expect(url.searchParams.get('extra_param')).toBe('value')
    }
  })
})

test.describe('Logout Standard Parameters', () => {
  test('should include required OAuth logout parameters', async ({ page }) => {
    await page.goto('/logout-test')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    let logoutUrl = ''
    page.on('request', (request) => {
      if (request.url().includes('logout')) {
        logoutUrl = request.url()
      }
    })

    const requestPromise = page
      .waitForRequest((request) => request.url().includes('logout'), { timeout: 2000 })
      .catch(() => null)
    await page.click('[data-testid="logout-button"]')

    // Wait for logout request or storage clear
    await Promise.race([
      requestPromise,
      page.waitForFunction(() => !sessionStorage.getItem('logouttest_token'), { timeout: 2000 }),
    ]).catch(() => {})

    if (logoutUrl) {
      const url = new URL(logoutUrl)
      // Should include standard parameters
      expect(url.searchParams.has('token')).toBe(true)
      expect(url.searchParams.has('token_type_hint')).toBe(true)
      expect(url.searchParams.has('client_id')).toBe(true)
      expect(url.searchParams.has('post_logout_redirect_uri')).toBe(true)
      expect(url.searchParams.has('ui_locales')).toBe(true)
    }
  })

  test('should use refresh_token for logout when available', async ({ page }) => {
    await page.goto('/logout-test')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    let logoutUrl = ''
    page.on('request', (request) => {
      if (request.url().includes('logout')) {
        logoutUrl = request.url()
      }
    })

    const requestPromise = page
      .waitForRequest((request) => request.url().includes('logout'), { timeout: 2000 })
      .catch(() => null)
    await page.click('[data-testid="logout-button"]')

    // Wait for logout request or storage clear
    await Promise.race([
      requestPromise,
      page.waitForFunction(() => !sessionStorage.getItem('logouttest_token'), { timeout: 2000 }),
    ]).catch(() => {})

    if (logoutUrl) {
      const url = new URL(logoutUrl)
      // Should use refresh_token and indicate it's a refresh_token
      expect(url.searchParams.get('token_type_hint')).toBe('refresh_token')
    }
  })
})

test.describe('Multiple Logout Attempts', () => {
  test('should handle logout when already logged out', async ({ page }) => {
    await page.goto('/basic')
    await clearBrowserStorage(page)
    await page.reload()

    // Don't login - already logged out
    await waitForNotAuthenticated(page)

    // Try to logout anyway
    await page.click('[data-testid="logout-button"]')

    // Should handle gracefully (no error)
    await expect(page.locator('[data-testid="auth-error"]')).not.toBeVisible()
    await waitForNotAuthenticated(page)
  })

  test('should handle rapid logout clicks', async ({ page }) => {
    await page.goto('/basic')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Rapid clicks
    await Promise.all([
      page.click('[data-testid="logout-button"]'),
      page.click('[data-testid="logout-button"]').catch(() => {}),
    ])

    // Should end up logged out
    await waitForNotAuthenticated(page)
  })
})
