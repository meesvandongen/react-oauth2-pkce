import { test, expect } from '@playwright/test'
import { performDexLogin, clearBrowserStorage, waitForAuthenticated, waitForNotAuthenticated } from './helpers'

test.describe('Extra Parameters Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/extraparams')
    await clearBrowserStorage(page)
    await page.reload()
  })

  test('should display configured extra parameters', async ({ page }) => {
    const configParams = await page.locator('[data-testid="config-params"]').textContent()
    const config = JSON.parse(configParams!)

    expect(config.extraAuthParameters).toEqual({
      prompt: 'consent',
      custom_auth_param: 'auth_value',
    })
    expect(config.extraTokenParameters).toEqual({
      custom_token_param: 'token_value',
    })
    expect(config.extraLogoutParameters).toEqual({
      custom_logout_param: 'logout_value',
    })
  })

  test('should include extra auth parameters in authorization URL', async ({ page }) => {
    // Set up request interception to capture the auth URL
    let authUrl = ''
    await page.route('**/dex/auth**', async (route) => {
      authUrl = route.request().url()
      await route.continue()
    })

    await page.click('[data-testid="login-button"]')

    // Wait for navigation to Dex
    await page.waitForURL(/.*localhost:5556\/dex.*/)

    // Check that extra auth parameters are in the URL
    expect(authUrl).toContain('prompt=consent')
    expect(authUrl).toContain('custom_auth_param=auth_value')

    // Complete login
    await performDexLogin(page)
    await waitForAuthenticated(page)
  })

  test('should include runtime additional parameters in authorization URL', async ({ page }) => {
    let authUrl = ''
    await page.route('**/dex/auth**', async (route) => {
      authUrl = route.request().url()
      await route.continue()
    })

    // Set login hint
    await page.fill('[data-testid="login-hint-input"]', 'test@example.com')

    await page.click('[data-testid="login-additional-params"]')

    await page.waitForURL(/.*localhost:5556\/dex.*/)

    // Check that both config and runtime params are in URL
    expect(authUrl).toContain('prompt=consent')
    expect(authUrl).toContain('login_hint=test%40example.com')

    await performDexLogin(page)
    await waitForAuthenticated(page)
  })

  test('should successfully authenticate with extra parameters', async ({ page }) => {
    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Verify token data is present
    await expect(page.locator('[data-testid="token-data"]')).toBeVisible()
  })
})
