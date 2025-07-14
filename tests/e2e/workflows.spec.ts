/**
 * End-to-End tests for DataPrism workflows
 */

import { test, expect, Page } from '@playwright/test';

test.describe('DataPrism Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page error handling
    page.on('pageerror', (error) => {
      console.error('Page error:', error);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
  });

  test('should load application and initialize DataPrism', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for basic page elements
    await expect(page.locator('h1')).toBeVisible();
    
    // Wait for DataPrism initialization
    await page.waitForFunction(() => {
      return document.querySelector('[data-testid="dataprism-ready"]') !== null;
    }, { timeout: 30000 });
    
    // Verify initialization success
    const initStatus = await page.locator('[data-testid="init-status"]').textContent();
    expect(initStatus).toContain('initialized');
  });

  test('should handle CDN loading with performance monitoring', async ({ page }) => {
    await page.goto('/');
    
    // Monitor network requests
    const cdnRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('dataprism') || url.includes('cdn')) {
        cdnRequests.push(url);
      }
    });
    
    // Wait for DataPrism to load
    await page.waitForFunction(() => {
      return window.DataPrism !== undefined;
    }, { timeout: 30000 });
    
    // Verify CDN requests were made
    expect(cdnRequests.length).toBeGreaterThan(0);
    
    // Check performance metrics
    const performanceMetrics = await page.evaluate(() => {
      return {
        navigation: performance.getEntriesByType('navigation')[0],
        resources: performance.getEntriesByType('resource').filter(r => 
          r.name.includes('dataprism')
        )
      };
    });
    
    expect(performanceMetrics.resources.length).toBeGreaterThan(0);
  });

  test('should display data tables after initialization', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initialization
    await page.waitForSelector('[data-testid="dataprism-ready"]', { timeout: 30000 });
    
    // Navigate to data explorer
    await page.click('[data-testid="nav-data-explorer"]');
    
    // Wait for tables to load
    await page.waitForSelector('[data-testid="tables-list"]', { timeout: 10000 });
    
    // Verify sample tables are present
    const tables = await page.locator('[data-testid="table-item"]').all();
    expect(tables.length).toBeGreaterThan(0);
    
    // Check for specific sample tables
    await expect(page.locator('[data-testid="table-sales"]')).toBeVisible();
    await expect(page.locator('[data-testid="table-analytics"]')).toBeVisible();
    await expect(page.locator('[data-testid="table-products"]')).toBeVisible();
  });

  test('should execute SQL queries', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initialization
    await page.waitForSelector('[data-testid="dataprism-ready"]', { timeout: 30000 });
    
    // Navigate to query lab
    await page.click('[data-testid="nav-query-lab"]');
    
    // Wait for query editor
    await page.waitForSelector('[data-testid="query-editor"]', { timeout: 5000 });
    
    // Enter a simple query
    await page.fill('[data-testid="query-editor"]', 'SELECT COUNT(*) as count FROM sales');
    
    // Execute query
    await page.click('[data-testid="execute-query"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="query-results"]', { timeout: 10000 });
    
    // Verify results are displayed
    const results = await page.locator('[data-testid="query-results"]').textContent();
    expect(results).toContain('count');
  });

  test('should create and display visualizations', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initialization
    await page.waitForSelector('[data-testid="dataprism-ready"]', { timeout: 30000 });
    
    // Navigate to visualization page
    await page.click('[data-testid="nav-visualizations"]');
    
    // Wait for visualization tools
    await page.waitForSelector('[data-testid="chart-controls"]', { timeout: 5000 });
    
    // Select chart type
    await page.selectOption('[data-testid="chart-type"]', 'bar');
    
    // Select data source
    await page.selectOption('[data-testid="data-source"]', 'sales');
    
    // Create chart
    await page.click('[data-testid="create-chart"]');
    
    // Wait for chart to render
    await page.waitForSelector('[data-testid="chart-container"]', { timeout: 10000 });
    
    // Verify chart is visible
    await expect(page.locator('[data-testid="chart-container"]')).toBeVisible();
    
    // Check for chart elements (SVG or Canvas)
    const chartElement = await page.locator('[data-testid="chart-container"] svg, [data-testid="chart-container"] canvas').first();
    await expect(chartElement).toBeVisible();
  });

  test('should handle data import workflow', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initialization
    await page.waitForSelector('[data-testid="dataprism-ready"]', { timeout: 30000 });
    
    // Navigate to data import
    await page.click('[data-testid="nav-data-import"]');
    
    // Wait for import interface
    await page.waitForSelector('[data-testid="import-controls"]', { timeout: 5000 });
    
    // Create test CSV data
    const csvData = 'id,name,value\n1,Test1,100\n2,Test2,200';
    const blob = new Blob([csvData], { type: 'text/csv' });
    
    // Upload file (simulate)
    await page.setInputFiles('[data-testid="file-input"]', {
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvData)
    });
    
    // Start import
    await page.click('[data-testid="import-button"]');
    
    // Wait for import completion
    await page.waitForSelector('[data-testid="import-success"]', { timeout: 10000 });
    
    // Verify import success message
    await expect(page.locator('[data-testid="import-success"]')).toBeVisible();
    
    // Verify data appears in table list
    await page.click('[data-testid="nav-data-explorer"]');
    await page.waitForSelector('[data-testid="table-imported_data"]', { timeout: 5000 });
    await expect(page.locator('[data-testid="table-imported_data"]')).toBeVisible();
  });

  test('should export data successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initialization
    await page.waitForSelector('[data-testid="dataprism-ready"]', { timeout: 30000 });
    
    // Navigate to data explorer
    await page.click('[data-testid="nav-data-explorer"]');
    
    // Select a table
    await page.click('[data-testid="table-sales"]');
    
    // Wait for table data to load
    await page.waitForSelector('[data-testid="table-data"]', { timeout: 5000 });
    
    // Start export
    await page.click('[data-testid="export-button"]');
    
    // Select export format
    await page.selectOption('[data-testid="export-format"]', 'csv');
    
    // Confirm export
    await page.click('[data-testid="confirm-export"]');
    
    // Wait for download to start
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-button"]');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('should handle errors gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for initialization
    await page.waitForSelector('[data-testid="dataprism-ready"]', { timeout: 30000 });
    
    // Navigate to query lab
    await page.click('[data-testid="nav-query-lab"]');
    
    // Enter invalid query
    await page.fill('[data-testid="query-editor"]', 'SELECT * FROM nonexistent_table');
    
    // Execute query
    await page.click('[data-testid="execute-query"]');
    
    // Wait for error message
    await page.waitForSelector('[data-testid="query-error"]', { timeout: 5000 });
    
    // Verify error is displayed
    await expect(page.locator('[data-testid="query-error"]')).toBeVisible();
    
    // Verify error message contains helpful information
    const errorText = await page.locator('[data-testid="query-error"]').textContent();
    expect(errorText).toContain('nonexistent_table');
  });

  test('should meet performance requirements', async ({ page }) => {
    // Start performance monitoring
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for First Contentful Paint
    await page.waitForLoadState('networkidle');
    
    // Measure FCP
    const fcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              resolve(entry.startTime);
            }
          }
        }).observe({ entryTypes: ['paint'] });
      });
    });
    
    // Wait for DataPrism initialization
    await page.waitForSelector('[data-testid="dataprism-ready"]', { timeout: 30000 });
    
    const initTime = Date.now() - startTime;
    
    // Measure bundle size
    const bundleSize = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return resources
        .filter(r => r.name.includes('dataprism'))
        .reduce((sum, r) => sum + (r.transferSize || 0), 0);
    });
    
    // Validate performance requirements
    expect(fcp).toBeLessThan(2000); // FCP < 2s
    expect(initTime).toBeLessThan(5000); // Init < 5s
    expect(bundleSize).toBeLessThan(8 * 1024 * 1024); // Bundle < 8MB
  });

  test('should work across different browsers', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Wait for initialization
    await page.waitForSelector('[data-testid="dataprism-ready"]', { timeout: 30000 });
    
    // Test basic functionality
    await page.click('[data-testid="nav-query-lab"]');
    await page.fill('[data-testid="query-editor"]', 'SELECT 1 as test');
    await page.click('[data-testid="execute-query"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="query-results"]', { timeout: 10000 });
    
    // Verify results
    const results = await page.locator('[data-testid="query-results"]').textContent();
    expect(results).toContain('test');
    
    console.log(`✅ Test passed on ${browserName}`);
  });

  test('should handle offline scenarios', async ({ page, context }) => {
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForSelector('[data-testid="dataprism-ready"]', { timeout: 30000 });
    
    // Go offline
    await context.setOffline(true);
    
    // Try to perform operations
    await page.click('[data-testid="nav-query-lab"]');
    await page.fill('[data-testid="query-editor"]', 'SELECT COUNT(*) FROM sales');
    await page.click('[data-testid="execute-query"]');
    
    // Should still work with cached data
    await page.waitForSelector('[data-testid="query-results"]', { timeout: 10000 });
    
    // Verify offline indicator (if implemented)
    if (await page.locator('[data-testid="offline-indicator"]').isVisible()) {
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    }
  });
});