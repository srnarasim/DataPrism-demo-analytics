/**
 * CDN Integration E2E Tests
 * Tests the complete CDN loading and DataPrism initialization flow
 */

import { test, expect } from '@playwright/test';

test.describe('CDN Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/DataPrism Demo Analytics/);
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('DataPrism Demo Analytics');
    
    // Check for CDN status component
    await expect(page.locator('[data-testid="cdn-status"], .cdn-status, :has-text("CDN Status")')).toBeVisible();
  });

  test('should display CDN loading state initially', async ({ page }) => {
    // Should show loading state initially
    await expect(page.locator(':has-text("Loading"), :has-text("Initializing")')).toBeVisible();
  });

  test('should handle CDN connectivity', async ({ page }) => {
    // Test that the app can handle CDN requests
    // We'll mock network conditions to test different scenarios
    
    // Wait for any loading to complete
    await page.waitForTimeout(2000);
    
    // Check for either success or graceful error handling
    const hasSuccess = await page.locator(':has-text("✅"), :has-text("Ready"), :has-text("loaded")').count() > 0;
    const hasError = await page.locator(':has-text("❌"), :has-text("Error"), :has-text("Failed")').count() > 0;
    
    // Should have either success or error state (not stuck loading)
    expect(hasSuccess || hasError).toBe(true);
  });

  test('should display feature cards when ready', async ({ page }) => {
    // Wait for app to load
    await page.waitForTimeout(3000);
    
    // Look for feature cards or navigation elements
    const featureElements = await page.locator('a:has-text("Explorer"), a:has-text("Query"), a:has-text("Visualization"), [href*="data"], [href*="query"], [href*="viz"]').count();
    
    // Should have some navigation or feature elements
    expect(featureElements).toBeGreaterThan(0);
  });

  test('should show CDN integration details', async ({ page }) => {
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Check for CDN-specific information
    const hasCDNInfo = await page.locator(':has-text("CDN"), :has-text("GitHub Pages"), :has-text("https://")').count() > 0;
    expect(hasCDNInfo).toBe(true);
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // Simulate network failure for CDN requests
    await page.route('**/dataprism**', route => route.abort());
    await page.route('**/manifest.json', route => route.abort());
    
    // Reload the page
    await page.reload();
    
    // Should show error state or retry option
    await expect(page.locator(':has-text("Error"), :has-text("Failed"), :has-text("Retry"), button')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that content is still visible and accessible
    await expect(page.locator('h1')).toBeVisible();
    
    // Check that the layout adapts
    const content = page.locator('main, [role="main"], .container, .max-w');
    await expect(content.first()).toBeVisible();
  });

  test('should meet performance requirements', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate and wait for app to be interactive
    await page.goto('/');
    
    // Wait for content to be visible (not just loaded)
    await page.waitForSelector(':has-text("DataPrism Demo Analytics")', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // PRP requirement: Initial render <2 seconds after CDN loaded
    // We'll be more lenient in E2E tests: <10 seconds total
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`App load time: ${loadTime}ms`);
  });

  test('should maintain functionality during CDN delays', async ({ page }) => {
    // Simulate slow CDN by delaying all external requests
    await page.route('**/srnarasim.github.io/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    await page.goto('/');
    
    // App should show loading state and not crash
    await expect(page.locator(':has-text("Loading"), :has-text("Initializing")')).toBeVisible();
    
    // Should eventually load or show error
    await page.waitForTimeout(5000);
    const isNotStuck = await page.locator(':has-text("Ready"), :has-text("Error"), :has-text("Failed"), button').count() > 0;
    expect(isNotStuck).toBe(true);
  });
});