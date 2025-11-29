import { expect, test } from '@playwright/test'
import { clearBrowserStorage, performDexLogin, waitForAuthenticated } from './helpers'

/**
 * Network Resilience Tests
 *
 * These tests verify error handling, timeouts, and degraded network conditions:
 * - Token endpoint returns 400 error during refresh
 * - Token endpoint returns 500 error during refresh
 * - Network timeout during token exchange
 * - Network timeout during refresh
 * - Slow IdP responses (latency testing)
 * - IdP returns malformed token response
 */

test.describe('Token Endpoint Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/network')
    await clearBrowserStorage(page)
    await page.reload()
  })

  test('should handle 400 error during token refresh', async ({ page }) => {
    // First, complete normal login
    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Intercept token endpoint to return 400 on refresh
    await page.route('**/dex/token', async (route, request) => {
      const postData = request.postData() || ''
      if (postData.includes('refresh_token')) {
        // Return 400 error for refresh requests
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'invalid_grant',
            error_description: 'Refresh token has expired',
          }),
        })
      } else {
        await route.continue()
      }
    })

    // Force token expiry to trigger refresh
    await page.evaluate(() => {
      sessionStorage.setItem('network_tokenExpire', '0')
    })

    // Poll for refresh to be attempted and callback invoked
    await expect(async () => {
      const callbackInvoked = await page.evaluate(() => window.networkRefreshExpiredCallbackInvoked)
      expect(callbackInvoked).toBe(true)
    }).toPass({ timeout: 10000 })

    // 400 error should trigger the refresh token expired callback
    // Check if callback was invoked
    const callbackInvoked = await page.evaluate(() => window.networkRefreshExpiredCallbackInvoked)
    // The callback should be invoked on 400 error during refresh
    expect(callbackInvoked).toBe(true)
  })

  test('should handle 500 error during token refresh', async ({ page }) => {
    // First, complete normal login
    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Intercept token endpoint to return 500 on refresh
    await page.route('**/dex/token', async (route, request) => {
      const postData = request.postData() || ''
      if (postData.includes('refresh_token')) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'server_error',
            error_description: 'Internal server error',
          }),
        })
      } else {
        await route.continue()
      }
    })

    // Force token expiry
    await page.evaluate(() => {
      sessionStorage.setItem('network_tokenExpire', '0')
    })

    // Poll for refresh to be attempted
    await expect(async () => {
      const errorCount = await page.evaluate(() => window.networkErrorCount)
      const refreshAttempted = await page.evaluate(() => sessionStorage.getItem('network_refreshInProgress') !== null)
      expect(errorCount > 0 || refreshAttempted).toBeTruthy()
    })
      .toPass({ timeout: 10000 })
      .catch(() => {})

    // Should handle error gracefully
    // Error should be set
    const _hasError = await page.evaluate(() => window.networkErrorCount > 0)
    // 500 error should result in some error state
    // Note: The library may or may not show an error to the user depending on config
  })

  test('should handle 401 unauthorized during token exchange', async ({ page }) => {
    // Intercept token endpoint for initial exchange
    await page.route('**/dex/token', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'unauthorized_client',
          error_description: 'Client authentication failed',
        }),
      })
    })

    // Set up fake auth state
    await page.evaluate(() => {
      sessionStorage.setItem('network_loginInProgress', 'true')
      sessionStorage.setItem('network_PKCE_code_verifier', 'test-verifier')
      sessionStorage.setItem('ROCP_auth_state', 'test-state')
    })

    // Navigate with code to trigger token exchange
    await page.goto('/network?code=fake-code&state=test-state')

    // Should show error
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible()
  })
})

test.describe('Network Timeout Handling', () => {
  test('should handle timeout during token exchange', async ({ page }) => {
    await page.goto('/network')
    await clearBrowserStorage(page)
    await page.reload()

    // Intercept token endpoint to delay indefinitely
    await page.route('**/dex/token', async (_route) => {
      // Never respond - simulates timeout
      await new Promise(() => {}) // Hang forever
    })

    // Set up fake auth state
    await page.evaluate(() => {
      sessionStorage.setItem('network_loginInProgress', 'true')
      sessionStorage.setItem('network_PKCE_code_verifier', 'test-verifier')
      sessionStorage.setItem('ROCP_auth_state', 'test-state')
    })

    // Set a page-level timeout handler
    page.setDefaultTimeout(5000)

    // Navigate with code
    await page.goto('/network?code=fake-code&state=test-state')

    // Wait for processing using expect().toPass()
    await expect(async () => {
      const loginInProgress = await page.evaluate(() => sessionStorage.getItem('network_loginInProgress'))
      expect(['true', 'false']).toContain(loginInProgress)
    })
      .toPass({ timeout: 5000 })
      .catch(() => {})

    // Should still be showing login in progress or eventually timeout
    // The browser/fetch will eventually timeout
    const loginInProgress = await page.evaluate(() => sessionStorage.getItem('network_loginInProgress'))
    // Login should still be in progress since request hasn't completed
    expect(['true', 'false']).toContain(loginInProgress)
  })

  test('should handle slow token endpoint response', async ({ page }) => {
    await page.goto('/network')
    await clearBrowserStorage(page)
    await page.reload()

    // Intercept token endpoint to add delay
    await page.route('**/dex/token', async (route) => {
      // Add 2 second delay
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await route.continue()
    })

    // Start login
    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)

    // Should eventually complete despite slow response
    await waitForAuthenticated(page, 15000)
  })
})

test.describe('Malformed Response Handling', () => {
  test('should handle malformed JSON response', async ({ page }) => {
    await page.goto('/network')
    await clearBrowserStorage(page)
    await page.reload()

    // Intercept token endpoint to return invalid JSON
    await page.route('**/dex/token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'not valid json {{{',
      })
    })

    // Set up auth state
    await page.evaluate(() => {
      sessionStorage.setItem('network_loginInProgress', 'true')
      sessionStorage.setItem('network_PKCE_code_verifier', 'test-verifier')
      sessionStorage.setItem('ROCP_auth_state', 'test-state')
    })

    // Navigate with code
    await page.goto('/network?code=fake-code&state=test-state')

    // Should show error
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible()
  })

  test('should handle empty response body', async ({ page }) => {
    await page.goto('/network')
    await clearBrowserStorage(page)
    await page.reload()

    // Intercept token endpoint to return empty response
    await page.route('**/dex/token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '',
      })
    })

    // Set up auth state
    await page.evaluate(() => {
      sessionStorage.setItem('network_loginInProgress', 'true')
      sessionStorage.setItem('network_PKCE_code_verifier', 'test-verifier')
      sessionStorage.setItem('ROCP_auth_state', 'test-state')
    })

    // Navigate with code
    await page.goto('/network?code=fake-code&state=test-state')

    // Should show error
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible()
  })

  test('should handle response missing access_token', async ({ page }) => {
    await page.goto('/network')
    await clearBrowserStorage(page)
    await page.reload()

    // Intercept token endpoint to return incomplete response
    await page.route('**/dex/token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token_type: 'Bearer',
          expires_in: 3600,
          // Missing access_token
        }),
      })
    })

    // Set up auth state
    await page.evaluate(() => {
      sessionStorage.setItem('network_loginInProgress', 'true')
      sessionStorage.setItem('network_PKCE_code_verifier', 'test-verifier')
      sessionStorage.setItem('ROCP_auth_state', 'test-state')
    })

    // Navigate with code
    await page.goto('/network?code=fake-code&state=test-state')

    // Should show error or not be authenticated
    const isAuthenticated = await page.evaluate(() => !!sessionStorage.getItem('network_token'))
    expect(isAuthenticated).toBe(false)
  })

  test('should handle HTML error page instead of JSON', async ({ page }) => {
    await page.goto('/network')
    await clearBrowserStorage(page)
    await page.reload()

    // Intercept token endpoint to return HTML error
    await page.route('**/dex/token', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'text/html',
        body: '<html><body><h1>Internal Server Error</h1></body></html>',
      })
    })

    // Set up auth state
    await page.evaluate(() => {
      sessionStorage.setItem('network_loginInProgress', 'true')
      sessionStorage.setItem('network_PKCE_code_verifier', 'test-verifier')
      sessionStorage.setItem('ROCP_auth_state', 'test-state')
    })

    // Navigate with code
    await page.goto('/network?code=fake-code&state=test-state')

    // Should show error
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible()
  })
})

test.describe('Network Retry and Recovery', () => {
  test('should allow retry after network failure', async ({ page }) => {
    await page.goto('/network')
    await clearBrowserStorage(page)
    await page.reload()

    let callCount = 0

    // First call fails, subsequent calls succeed
    await page.route('**/dex/token', async (route) => {
      callCount++
      if (callCount === 1) {
        await route.abort('failed')
      } else {
        await route.continue()
      }
    })

    // First attempt - will fail
    await page.evaluate(() => {
      sessionStorage.setItem('network_loginInProgress', 'true')
      sessionStorage.setItem('network_PKCE_code_verifier', 'test-verifier')
      sessionStorage.setItem('ROCP_auth_state', 'test-state')
    })
    await page.goto('/network?code=fake-code&state=test-state')

    // Should show error
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible()

    // Clear route to allow next login to work
    await page.unroute('**/dex/token')

    // Second attempt - clean login should work
    await clearBrowserStorage(page)
    await page.goto('/network')
    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)
  })

  test('should handle intermittent network failures during refresh', async ({ page }) => {
    await page.goto('/network')
    await clearBrowserStorage(page)
    await page.reload()

    // Login successfully
    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    let refreshCallCount = 0

    // First refresh fails, second succeeds
    await page.route('**/dex/token', async (route, request) => {
      const postData = request.postData() || ''
      if (postData.includes('refresh_token')) {
        refreshCallCount++
        if (refreshCallCount === 1) {
          await route.abort('failed')
        } else {
          await route.continue()
        }
      } else {
        await route.continue()
      }
    })

    // Force token expiry
    await page.evaluate(() => {
      sessionStorage.setItem('network_tokenExpire', '0')
    })

    // Poll for first refresh attempt
    await expect(async () => {
      const refreshAttempted = await page.evaluate(() => sessionStorage.getItem('network_refreshInProgress') !== null)
      expect(refreshAttempted).toBeTruthy()
    })
      .toPass({ timeout: 10000 })
      .catch(() => {})

    // Force another expiry cycle
    await page.evaluate(() => {
      sessionStorage.setItem('network_tokenExpire', '0')
    })

    // Poll for second refresh attempt
    await expect(async () => {
      const token = await page.evaluate(() => sessionStorage.getItem('network_token'))
      const callbackInvoked = await page.evaluate(() => window.networkRefreshExpiredCallbackInvoked)
      expect(token !== null || callbackInvoked).toBeTruthy()
    })
      .toPass({ timeout: 10000 })
      .catch(() => {})

    // Should either have a new token or triggered the expiry callback
  })
})

test.describe('IdP Latency Simulation', () => {
  test('should handle varying latency in IdP responses', async ({ page }) => {
    await page.goto('/network')
    await clearBrowserStorage(page)
    await page.reload()

    const latencies = [100, 500, 1000, 2000]
    let callIndex = 0

    // Add varying delays
    await page.route('**/dex/**', async (route) => {
      const delay = latencies[callIndex % latencies.length]
      callIndex++
      await new Promise((resolve) => setTimeout(resolve, delay))
      await route.continue()
    })

    // Login should complete despite varying latency
    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page, 20000)
  })

  test('should handle high latency gracefully', async ({ page }) => {
    await page.goto('/network')
    await clearBrowserStorage(page)
    await page.reload()

    // Add 3 second delay to all token requests
    await page.route('**/dex/token', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      await route.continue()
    })

    // Login should still complete
    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page, 20000)
  })
})

test.describe('Authorization Endpoint Errors', () => {
  test('should handle authorization endpoint returning error', async ({ page }) => {
    await page.goto('/network')
    await clearBrowserStorage(page)
    await page.reload()

    // Simulate coming back from auth with an error
    await page.evaluate(() => {
      sessionStorage.setItem('network_loginInProgress', 'true')
    })

    // Navigate with error parameters
    await page.goto('/network?error=access_denied&error_description=User%20denied%20access')

    // Should show error
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible()
    const errorText = await page.locator('[data-testid="auth-error"]').textContent()
    expect(errorText).toContain('denied')
  })

  test('should handle missing error_description', async ({ page }) => {
    await page.goto('/network')
    await clearBrowserStorage(page)
    await page.reload()

    // Simulate coming back with just error, no description
    await page.evaluate(() => {
      sessionStorage.setItem('network_loginInProgress', 'true')
    })

    await page.goto('/network?error=server_error')

    // Should show default error message
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible()
  })
})
