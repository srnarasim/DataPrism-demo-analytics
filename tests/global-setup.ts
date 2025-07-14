/**
 * Global setup for Playwright E2E tests
 * Configures test environment and validates prerequisites
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🧪 Starting global test setup...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Validate that the development server is running
    await page.goto('http://localhost:3000', { timeout: 30000 });
    console.log('✅ Development server is running');
    
    // Wait for basic page load
    await page.waitForLoadState('domcontentloaded');
    
    // Validate that the page loads without critical errors
    const title = await page.title();
    if (!title) {
      throw new Error('Page title is empty - potential loading issue');
    }
    console.log(`✅ Page loaded successfully: ${title}`);
    
    // Check for any critical JavaScript errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    // Wait a bit for any immediate errors to surface
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.warn('⚠️ JavaScript errors detected:', errors);
    }
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;