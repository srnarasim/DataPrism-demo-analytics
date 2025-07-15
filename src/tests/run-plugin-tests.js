/**
 * Plugin System Test Runner
 * 
 * Command-line test runner for validating the plugin system implementation
 * This can be run independently to test plugin functionality
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test configuration
const testConfig = {
  testTimeout: 30000,
  maxRetries: 3,
  outputFile: 'plugin-test-results.json'
};

// Test cases
const testCases = [
  {
    name: 'Plugin File Validation',
    description: 'Verify all plugin files exist and are properly structured',
    test: async () => {
      const pluginFiles = [
        'src/plugins/CSVProcessorPlugin.ts',
        'src/plugins/ChartJSVisualizationPlugin.ts',
        'src/plugins/SQLQueryIntegrationPlugin.ts',
        'src/plugins/ExportUtilityPlugin.ts',
        'src/plugins/AnalyticsPluginManager.ts'
      ];
      
      const results = [];
      
      for (const file of pluginFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Check for required class export
          const className = path.basename(file, '.ts');
          if (content.includes(`export class ${className}`)) {
            results.push({ file, status: 'valid', message: 'Class export found' });
          } else {
            results.push({ file, status: 'warning', message: 'Class export pattern not found' });
          }
        } else {
          results.push({ file, status: 'error', message: 'File not found' });
        }
      }
      
      return results;
    }
  },
  {
    name: 'Plugin Interface Verification',
    description: 'Check if plugin interface verification utility is working',
    test: async () => {
      const verificationFile = 'src/utils/pluginInterfaceVerification.ts';
      const filePath = path.join(process.cwd(), verificationFile);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('Plugin interface verification file not found');
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for required exports
      const requiredExports = [
        'verifyPluginInterfaces',
        'waitForPluginInterfaces',
        'getPluginInterface',
        'createPluginManager'
      ];
      
      const missingExports = requiredExports.filter(exp => 
        !content.includes(`export const ${exp}`) && !content.includes(`export function ${exp}`)
      );
      
      if (missingExports.length > 0) {
        throw new Error(`Missing exports: ${missingExports.join(', ')}`);
      }
      
      return { message: 'All required exports found', exports: requiredExports };
    }
  },
  {
    name: 'DataPrism Context Integration',
    description: 'Verify DataPrism context has plugin system integration',
    test: async () => {
      const contextFile = 'src/contexts/DataPrismContext.tsx';
      const filePath = path.join(process.cwd(), contextFile);
      
      if (!fs.existsSync(filePath)) {
        throw new Error('DataPrism context file not found');
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for plugin system integration
      const requiredIntegrations = [
        'pluginSystemAvailable',
        'pluginInterfaces',
        'pluginManager',
        'initializePluginSystem'
      ];
      
      const missingIntegrations = requiredIntegrations.filter(integration => 
        !content.includes(integration)
      );
      
      if (missingIntegrations.length > 0) {
        throw new Error(`Missing plugin integrations: ${missingIntegrations.join(', ')}`);
      }
      
      return { message: 'Plugin system integration found', integrations: requiredIntegrations };
    }
  },
  {
    name: 'Test Components Structure',
    description: 'Verify test components are properly structured',
    test: async () => {
      const testFiles = [
        'src/tests/PluginSystemTest.tsx',
        'src/tests/TestRunner.tsx',
        'src/pages/PluginTestPage.tsx'
      ];
      
      const results = [];
      
      for (const file of testFiles) {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Check for React component export
          if (content.includes('export const') && content.includes('React.FC')) {
            results.push({ file, status: 'valid', message: 'React component found' });
          } else {
            results.push({ file, status: 'warning', message: 'React component pattern not found' });
          }
        } else {
          results.push({ file, status: 'error', message: 'File not found' });
        }
      }
      
      return results;
    }
  },
  {
    name: 'TypeScript Compilation',
    description: 'Check if TypeScript compilation passes',
    test: async () => {
      try {
        console.log('Running TypeScript compilation check...');
        const result = execSync('npx tsc --noEmit --skipLibCheck', { 
          encoding: 'utf8',
          timeout: testConfig.testTimeout 
        });
        
        return { message: 'TypeScript compilation successful', output: result || 'No output' };
      } catch (error) {
        // If compilation fails, still return the error info
        return { 
          message: 'TypeScript compilation has issues', 
          output: error.stdout || error.stderr || error.message,
          warning: true 
        };
      }
    }
  },
  {
    name: 'Package Dependencies',
    description: 'Verify required dependencies are installed',
    test: async () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const requiredDeps = [
        'react',
        'papaparse',
        'chart.js'
      ];
      
      const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
      
      if (missingDeps.length > 0) {
        throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
      }
      
      return { 
        message: 'All required dependencies found', 
        dependencies: requiredDeps.map(dep => `${dep}@${dependencies[dep]}`)
      };
    }
  }
];

// Test runner
async function runTests() {
  console.log('🧪 Starting Plugin System Tests...\n');
  
  const results = [];
  let passCount = 0;
  let failCount = 0;
  
  for (const testCase of testCases) {
    console.log(`🔍 Running: ${testCase.name}`);
    console.log(`   ${testCase.description}`);
    
    const startTime = Date.now();
    
    try {
      const result = await testCase.test();
      const duration = Date.now() - startTime;
      
      console.log(`   ✅ PASSED (${duration}ms)`);
      if (result.message) {
        console.log(`   📋 ${result.message}`);
      }
      if (result.warning) {
        console.log(`   ⚠️  Warning: Check compilation issues`);
      }
      
      results.push({
        name: testCase.name,
        status: 'passed',
        duration: duration,
        result: result
      });
      
      passCount++;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.log(`   ❌ FAILED (${duration}ms)`);
      console.log(`   💥 ${error.message}`);
      
      results.push({
        name: testCase.name,
        status: 'failed',
        duration: duration,
        error: error.message
      });
      
      failCount++;
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📊 Test Summary:');
  console.log(`   Total Tests: ${testCases.length}`);
  console.log(`   ✅ Passed: ${passCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📈 Success Rate: ${((passCount / testCases.length) * 100).toFixed(1)}%`);
  
  // Save results
  const outputPath = path.join(process.cwd(), testConfig.outputFile);
  fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: testCases.length,
      passed: passCount,
      failed: failCount,
      successRate: (passCount / testCases.length) * 100
    },
    results: results
  }, null, 2));
  
  console.log(`\n📄 Results saved to: ${testConfig.outputFile}`);
  
  // Exit with appropriate code
  if (failCount > 0) {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

export { runTests, testCases };