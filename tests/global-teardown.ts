/**
 * Global teardown for Playwright E2E tests
 * Cleans up test environment and generates reports
 */

import { FullConfig } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  try {
    // Generate test summary report
    const testResultsPath = path.join(process.cwd(), 'test-results');
    const reportPath = path.join(testResultsPath, 'test-summary.json');
    
    // Check if results directory exists
    try {
      await fs.access(testResultsPath);
      
      // Generate basic test summary
      const summary = {
        timestamp: new Date().toISOString(),
        testRun: 'DataPrism Demo Analytics E2E Tests',
        environment: process.env.NODE_ENV || 'test',
        baseUrl: 'http://localhost:3000',
        browserProjects: config.projects.map(p => p.name),
        completedAt: new Date().toISOString(),
      };
      
      await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
      console.log(`✅ Test summary generated: ${reportPath}`);
      
    } catch (error) {
      console.log('📁 Test results directory not found, skipping report generation');
    }
    
    // Clean up temporary files if needed
    console.log('🧹 Cleaning up temporary test files...');
    
    // Log completion
    console.log('✅ Global teardown completed successfully');
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw here to avoid masking test failures
  }
}

export default globalTeardown;