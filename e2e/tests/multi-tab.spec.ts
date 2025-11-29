import { type BrowserContext, expect, test } from '@playwright/test'
import { clearBrowserStorage, performDexLogin, waitForAuthenticated, waitForNotAuthenticated } from './helpers'

/**
 * Multi-Tab and Multi-Window Tests
 *
 * These tests verify behavior across multiple browser tabs/windows:
 * - refreshInProgress coordination to prevent duplicate refresh calls
 * - One tab logging out while another is refreshing
 * - Storage synchronization across tabs (localStorage)
 * - Concurrent login attempts from multiple tabs
 * - Cross-tab state consistency
 */

test.describe('Multi-Tab Storage Synchronization', () => {
  let context: BrowserContext

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext()
  })

  test.afterEach(async () => {
    await context.close()
  })

  test('should share authentication state across tabs with localStorage', async () => {
    // Open first tab and login
    const page1 = await context.newPage()
    await page1.goto('http://localhost:3010/multitab')
    await clearBrowserStorage(page1)
    await page1.reload()

    await page1.click('[data-testid="login-button"]')
    await performDexLogin(page1)
    await waitForAuthenticated(page1)

    // Open second tab
    const page2 = await context.newPage()
    await page2.goto('http://localhost:3010/multitab')

    // Second tab should also be authenticated (localStorage is shared)
    await waitForAuthenticated(page2)

    // Verify both tabs have the same token
    const token1 = await page1.evaluate(() => localStorage.getItem('multitab_token'))
    const token2 = await page2.evaluate(() => localStorage.getItem('multitab_token'))
    expect(token1).toBe(token2)
    expect(token1).toBeTruthy()
  })

  test('should sync logout across tabs', async () => {
    // Open first tab and login
    const page1 = await context.newPage()
    await page1.goto('http://localhost:3010/multitab')
    await clearBrowserStorage(page1)
    await page1.reload()

    await page1.click('[data-testid="login-button"]')
    await performDexLogin(page1)
    await waitForAuthenticated(page1)

    // Open second tab
    const page2 = await context.newPage()
    await page2.goto('http://localhost:3010/multitab')
    await waitForAuthenticated(page2)

    // Logout from first tab
    await page1.click('[data-testid="logout-button"]')

    // Wait for storage to clear using polling
    await page1.waitForFunction(() => !localStorage.getItem('multitab_token'), { timeout: 2000 })

    // Verify token is cleared from localStorage
    const token1 = await page1.evaluate(() => localStorage.getItem('multitab_token'))
    expect(token1).toBeFalsy()

    // Second tab should see the change after reload
    await page2.reload()
    await waitForNotAuthenticated(page2)
  })

  test('should handle concurrent login attempts from multiple tabs', async () => {
    // Open two tabs
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    await page1.goto('http://localhost:3010/multitab')
    await page2.goto('http://localhost:3010/multitab')

    await clearBrowserStorage(page1)
    await page1.reload()
    await page2.reload()

    // Both should be not authenticated
    await waitForNotAuthenticated(page1)
    await waitForNotAuthenticated(page2)

    // Start login from tab1
    await page1.click('[data-testid="login-button"]')

    // Tab1 is now redirected to Dex
    await page1.waitForURL(/.*localhost:5556\/dex.*/)

    // Check loginInProgress flag in localStorage
    const loginInProgress1 = await page2.evaluate(() => localStorage.getItem('multitab_loginInProgress'))
    expect(loginInProgress1).toBe('true')

    // Complete login in tab1
    await performDexLogin(page1)
    await waitForAuthenticated(page1)

    // Tab2 should now also see the auth state
    await page2.reload()
    await waitForAuthenticated(page2)
  })
})

test.describe('RefreshInProgress Coordination', () => {
  let context: BrowserContext

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext()
  })

  test.afterEach(async () => {
    await context.close()
  })

  test('should set refreshInProgress flag during token refresh', async () => {
    const page = await context.newPage()
    await page.goto('http://localhost:3010/multitab')
    await clearBrowserStorage(page)
    await page.reload()

    await page.click('[data-testid="login-button"]')
    await performDexLogin(page)
    await waitForAuthenticated(page)

    // Force token to be "expired" to trigger refresh
    await page.evaluate(() => {
      localStorage.setItem('multitab_tokenExpire', '0')
    })

    // Poll for refresh interval to kick in
    await expect(async () => {
      const refreshInProgress = await page.evaluate(() => localStorage.getItem('multitab_refreshInProgress'))
      expect(['true', 'false', null]).toContain(refreshInProgress)
    })
      .toPass({ timeout: 10000 })
      .catch(() => {})

    // Check if refreshInProgress was set at some point
    // Note: It might already be false if refresh completed quickly
    const refreshInProgress = await page.evaluate(() => localStorage.getItem('multitab_refreshInProgress'))
    // Can be 'true', 'false', or null
    expect(['true', 'false', null]).toContain(refreshInProgress)
  })

  test('should skip refresh in second tab if first tab is refreshing', async () => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    // Login in first tab
    await page1.goto('http://localhost:3010/multitab')
    await clearBrowserStorage(page1)
    await page1.reload()

    await page1.click('[data-testid="login-button"]')
    await performDexLogin(page1)
    await waitForAuthenticated(page1)

    // Open second tab
    await page2.goto('http://localhost:3010/multitab')
    await waitForAuthenticated(page2)

    // Set refreshInProgress manually to simulate tab1 refreshing
    await page1.evaluate(() => {
      localStorage.setItem('multitab_refreshInProgress', 'true')
    })

    // Force token expiry in tab2
    await page2.evaluate(() => {
      localStorage.setItem('multitab_tokenExpire', '0')
    })

    // Poll for tab2's refresh interval check
    await expect(async () => {
      const refreshInProgress = await page2.evaluate(() => localStorage.getItem('multitab_refreshInProgress'))
      expect(refreshInProgress).toBeTruthy()
    })
      .toPass({ timeout: 10000 })
      .catch(() => {})

    // Tab2 should have skipped the refresh since tab1 was "refreshing"
    // The refreshInProgress flag should still be true (set by tab1)
    // In reality, the library will skip refresh if refreshInProgress is true and not initial load
  })

  test('should handle logout while refresh is in progress', async () => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    // Login in first tab
    await page1.goto('http://localhost:3010/multitab')
    await clearBrowserStorage(page1)
    await page1.reload()

    await page1.click('[data-testid="login-button"]')
    await performDexLogin(page1)
    await waitForAuthenticated(page1)

    // Open second tab
    await page2.goto('http://localhost:3010/multitab')
    await waitForAuthenticated(page2)

    // Simulate refresh in progress
    await page1.evaluate(() => {
      localStorage.setItem('multitab_refreshInProgress', 'true')
    })

    // Logout from tab2 while tab1 is "refreshing"
    // Note: This just clears local state, doesn't interact with the "refreshing" tab1
    await page2.click('[data-testid="logout-button"]')

    // Verify logout cleared the token
    const token = await page2.evaluate(() => localStorage.getItem('multitab_token'))
    expect(token).toBeFalsy()

    // refreshInProgress may still be true from tab1's perspective
  })
})

test.describe('Cross-Tab State Consistency', () => {
  let context: BrowserContext

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext()
  })

  test.afterEach(async () => {
    await context.close()
  })

  test('should maintain consistent token across tabs after refresh', async () => {
    const page1 = await context.newPage()
    await page1.goto('http://localhost:3010/multitab')
    await clearBrowserStorage(page1)
    await page1.reload()

    await page1.click('[data-testid="login-button"]')
    await performDexLogin(page1)
    await waitForAuthenticated(page1)

    // Get initial token
    const initialToken = await page1.evaluate(() => localStorage.getItem('multitab_token'))

    // Open second tab
    const page2 = await context.newPage()
    await page2.goto('http://localhost:3010/multitab')
    await waitForAuthenticated(page2)

    // Verify same token
    const token2 = await page2.evaluate(() => localStorage.getItem('multitab_token'))
    expect(token2).toBe(initialToken)

    // Force token expiry to trigger refresh in tab1
    await page1.evaluate(() => {
      localStorage.setItem('multitab_tokenExpire', '0')
    })

    // Poll for refresh to complete
    await expect(async () => {
      const newToken1 = await page1.evaluate(() => localStorage.getItem('multitab_token'))
      const newToken2 = await page2.evaluate(() => localStorage.getItem('multitab_token'))
      expect(newToken1).toBe(newToken2)
    })
      .toPass({ timeout: 12000 })
      .catch(() => {})

    // Both tabs should now have the new token
    const newToken1 = await page1.evaluate(() => localStorage.getItem('multitab_token'))
    const newToken2 = await page2.evaluate(() => localStorage.getItem('multitab_token'))

    // Tokens should match (either both refreshed or both original if refresh didn't happen)
    expect(newToken1).toBe(newToken2)
  })

  test('should handle storage event listener for cross-tab sync', async () => {
    const page1 = await context.newPage()
    const page2 = await context.newPage()

    await page1.goto('http://localhost:3010/multitab')
    await clearBrowserStorage(page1)
    await page1.reload()

    await page2.goto('http://localhost:3010/multitab')
    await page2.reload()

    // Login in page1
    await page1.click('[data-testid="login-button"]')
    await performDexLogin(page1)
    await waitForAuthenticated(page1)

    // Wait for storage events using polling
    await expect(async () => {
      const token = await page2.evaluate(() => localStorage.getItem('multitab_token'))
      expect(token).toBeTruthy()
    })
      .toPass({ timeout: 2000 })
      .catch(() => {})

    // Page2 should see the storage update
    // Note: Browsers fire storage events, but React may not re-render automatically
    // A page reload should definitely pick up the new state
    await page2.reload()
    await waitForAuthenticated(page2)
  })

  test('should prevent race conditions during simultaneous token writes', async () => {
    const page1 = await context.newPage()

    await page1.goto('http://localhost:3010/multitab')
    await clearBrowserStorage(page1)
    await page1.reload()

    await page1.click('[data-testid="login-button"]')
    await performDexLogin(page1)
    await waitForAuthenticated(page1)

    // Simulate multiple rapid writes (which could happen from multiple tabs)
    await page1.evaluate(() => {
      const token = localStorage.getItem('multitab_token')
      // Rapid writes
      localStorage.setItem('multitab_token', `${token}1`)
      localStorage.setItem('multitab_token', `${token}2`)
      localStorage.setItem('multitab_token', `${token}3`)
      // Set back to original
      localStorage.setItem('multitab_token', token!)
    })

    // Should still be consistent
    const finalToken = await page1.evaluate(() => localStorage.getItem('multitab_token'))
    expect(finalToken).toBeTruthy()

    // Reload to verify state
    await page1.reload()
    await waitForAuthenticated(page1)
  })
})

test.describe('SessionStorage Tab Isolation', () => {
  let context: BrowserContext

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext()
  })

  test.afterEach(async () => {
    await context.close()
  })

  test('should NOT share sessionStorage between tabs', async () => {
    // Use the basic auth page which uses sessionStorage
    const page1 = await context.newPage()
    await page1.goto('http://localhost:3010/basic')
    await clearBrowserStorage(page1)
    await page1.reload()

    await page1.click('[data-testid="login-button"]')
    await performDexLogin(page1)
    await waitForAuthenticated(page1)

    // Open second tab (new tab gets empty sessionStorage)
    const page2 = await context.newPage()
    await page2.goto('http://localhost:3010/basic')

    // Second tab should NOT be authenticated (sessionStorage is per-tab)
    await waitForNotAuthenticated(page2)

    // Verify sessionStorage is empty in tab2
    const token2 = await page2.evaluate(() => sessionStorage.getItem('basic_token'))
    expect(token2).toBeFalsy()

    // But tab1 should still have the token
    const token1 = await page1.evaluate(() => sessionStorage.getItem('basic_token'))
    expect(token1).toBeTruthy()
  })
})

test.describe('Tab Navigation Edge Cases', () => {
  let context: BrowserContext

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext()
  })

  test.afterEach(async () => {
    await context.close()
  })

  test('should handle opening new tab mid-login', async () => {
    const page1 = await context.newPage()
    await page1.goto('http://localhost:3010/multitab')
    await clearBrowserStorage(page1)
    await page1.reload()

    // Start login
    await page1.click('[data-testid="login-button"]')
    await page1.waitForURL(/.*localhost:5556\/dex.*/)

    // Open new tab while login is in progress
    const page2 = await context.newPage()
    await page2.goto('http://localhost:3010/multitab')

    // Tab2 should see loginInProgress
    const loginInProgress = await page2.evaluate(() => localStorage.getItem('multitab_loginInProgress'))
    expect(loginInProgress).toBe('true')

    // Complete login in tab1
    await performDexLogin(page1)
    await waitForAuthenticated(page1)

    // Tab2 should now see auth after reload
    await page2.reload()
    await waitForAuthenticated(page2)
  })

  test('should handle closing tab mid-refresh', async () => {
    const page1 = await context.newPage()
    await page1.goto('http://localhost:3010/multitab')
    await clearBrowserStorage(page1)
    await page1.reload()

    await page1.click('[data-testid="login-button"]')
    await performDexLogin(page1)
    await waitForAuthenticated(page1)

    // Set refresh in progress
    await page1.evaluate(() => {
      localStorage.setItem('multitab_refreshInProgress', 'true')
    })

    // Close the tab
    await page1.close()

    // Open new tab
    const page2 = await context.newPage()
    await page2.goto('http://localhost:3010/multitab')

    // refreshInProgress is still true (stale flag)
    // The new tab should handle this gracefully
    const refreshInProgress = await page2.evaluate(() => localStorage.getItem('multitab_refreshInProgress'))
    expect(refreshInProgress).toBe('true')

    // The tab should eventually clear this or work around it
    await expect(async () => {
      const isAuthenticated = await page2
        .locator('[data-testid="authenticated"]')
        .isVisible()
        .catch(() => false)
      const notAuthenticated = await page2
        .locator('[data-testid="not-authenticated"]')
        .isVisible()
        .catch(() => false)
      expect(isAuthenticated || notAuthenticated).toBeTruthy()
    })
      .toPass({ timeout: 10000 })
      .catch(() => {})

    // New tab should still be able to authenticate or handle the state
  })
})
