#!/usr/bin/env node

/**
 * Validation Script for DataPrism Demo Analytics
 * Validates all PRP requirements and success criteria
 */

import { execSync } from 'child_process';
import { readFileSync, statSync } from 'fs';
import { resolve } from 'path';

const VALIDATION_CRITERIA = {
  // PRP Performance Requirements
  MAX_BUNDLE_SIZE: 500 * 1024, // 500KB
  MAX_CDN_LOAD_TIME: 5000, // 5 seconds
  MAX_INITIAL_RENDER_TIME: 2000, // 2 seconds after CDN loaded
  
  // Success Criteria
  REQUIRED_FEATURES: [
    'CDN Asset Loading',
    'Fallback Strategies',
    'Version Configuration',
    'Independent Deployment'
  ]
};

async function main() {
  console.log('🔍 Validating DataPrism Demo Analytics Implementation...\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test categories
  await validateBundleSize(results);
  await validateDependencies(results);
  await validateCDNConnectivity(results);
  await validateBuildOutput(results);
  await validateTypeScript(results);
  await validateTests(results);
  await validateDocumentation(results);

  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📝 Total: ${results.total}`);
  
  const successRate = (results.passed / results.total) * 100;
  console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\n❌ Validation failed. Please address the issues above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All validations passed! Ready for deployment.');
    process.exit(0);
  }
}

async function validateBundleSize(results) {
  console.log('📦 Validating Bundle Size...');
  
  try {
    // Check if dist directory exists
    const distPath = resolve(process.cwd(), 'dist');
    
    try {
      statSync(distPath);
    } catch {
      console.log('⚠️  No build found. Run `npm run build` first.');
      results.total++;
      results.failed++;
      return;
    }

    // Find main bundle
    const indexFiles = execSync('find dist/assets -name "index-*.js" 2>/dev/null || echo ""', { encoding: 'utf8' })
      .trim().split('\n').filter(Boolean);
    
    if (indexFiles.length === 0) {
      console.log('❌ No main bundle found in dist/assets/');
      results.total++;
      results.failed++;
      return;
    }

    let totalSize = 0;
    for (const file of indexFiles) {
      const stats = statSync(file);
      totalSize += stats.size;
    }

    console.log(`   Bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
    
    if (totalSize <= VALIDATION_CRITERIA.MAX_BUNDLE_SIZE) {
      console.log(`   ✅ Bundle size within ${VALIDATION_CRITERIA.MAX_BUNDLE_SIZE / 1024}KB limit`);
      results.passed++;
    } else {
      console.log(`   ❌ Bundle size exceeds ${VALIDATION_CRITERIA.MAX_BUNDLE_SIZE / 1024}KB limit`);
      results.failed++;
    }
    results.total++;

  } catch (error) {
    console.log(`   ❌ Bundle size validation failed: ${error.message}`);
    results.total++;
    results.failed++;
  }
}

async function validateDependencies(results) {
  console.log('\n📋 Validating Dependencies...');
  
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    
    // Check that no DataPrism packages are in dependencies
    const dataPrismDeps = Object.keys(packageJson.dependencies || {})
      .filter(dep => dep.includes('dataprism'));
    
    if (dataPrismDeps.length === 0) {
      console.log('   ✅ No DataPrism package dependencies found (CDN-only)');
      results.passed++;
    } else {
      console.log(`   ❌ Found DataPrism dependencies: ${dataPrismDeps.join(', ')}`);
      results.failed++;
    }
    results.total++;

    // Check for required dependencies
    const requiredDeps = ['react', 'react-dom'];
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
    
    if (missingDeps.length === 0) {
      console.log('   ✅ All required dependencies present');
      results.passed++;
    } else {
      console.log(`   ❌ Missing dependencies: ${missingDeps.join(', ')}`);
      results.failed++;
    }
    results.total++;

  } catch (error) {
    console.log(`   ❌ Dependency validation failed: ${error.message}`);
    results.total++;
    results.failed++;
  }
}

async function validateCDNConnectivity(results) {
  console.log('\n🌐 Validating CDN Connectivity...');
  
  try {
    // Test CDN manifest availability
    const response = await fetch('https://srnarasim.github.io/DataPrism/cdn/manifest.json');
    
    if (response.ok) {
      const manifest = await response.json();
      console.log(`   ✅ CDN manifest accessible (v${manifest.version})`);
      results.passed++;
    } else {
      console.log(`   ❌ CDN manifest not accessible: ${response.status}`);
      results.failed++;
    }
    results.total++;

    // Test core bundle availability
    const coreResponse = await fetch('https://srnarasim.github.io/DataPrism/cdn/dataprism.umd.js');
    
    if (coreResponse.ok) {
      console.log('   ✅ CDN core bundle accessible');
      results.passed++;
    } else {
      console.log(`   ❌ CDN core bundle not accessible: ${coreResponse.status}`);
      results.failed++;
    }
    results.total++;

  } catch (error) {
    console.log(`   ❌ CDN connectivity validation failed: ${error.message}`);
    results.total += 2;
    results.failed += 2;
  }
}

async function validateBuildOutput(results) {
  console.log('\n🏗️  Validating Build Output...');
  
  try {
    // Check for required files
    const requiredFiles = [
      'dist/index.html',
      'dist/assets'
    ];

    for (const file of requiredFiles) {
      try {
        statSync(file);
        console.log(`   ✅ ${file} exists`);
        results.passed++;
      } catch {
        console.log(`   ❌ ${file} missing`);
        results.failed++;
      }
      results.total++;
    }

    // Check HTML content
    try {
      const htmlContent = readFileSync('dist/index.html', 'utf8');
      
      if (htmlContent.includes('DataPrism') && htmlContent.includes('root')) {
        console.log('   ✅ HTML content valid');
        results.passed++;
      } else {
        console.log('   ❌ HTML content invalid');
        results.failed++;
      }
      results.total++;
    } catch (error) {
      console.log(`   ❌ HTML validation failed: ${error.message}`);
      results.total++;
      results.failed++;
    }

  } catch (error) {
    console.log(`   ❌ Build output validation failed: ${error.message}`);
    results.total++;
    results.failed++;
  }
}

async function validateTypeScript(results) {
  console.log('\n🔧 Validating TypeScript...');
  
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    console.log('   ✅ TypeScript compilation successful');
    results.passed++;
  } catch (error) {
    console.log('   ❌ TypeScript compilation failed');
    console.log(`   Error: ${error.message}`);
    results.failed++;
  }
  results.total++;
}

async function validateTests(results) {
  console.log('\n🧪 Validating Tests...');
  
  try {
    execSync('npm test -- --run', { stdio: 'pipe' });
    console.log('   ✅ Unit tests passed');
    results.passed++;
  } catch (error) {
    console.log('   ❌ Unit tests failed');
    results.failed++;
  }
  results.total++;
}

async function validateDocumentation(results) {
  console.log('\n📚 Validating Documentation...');
  
  try {
    const readmeContent = readFileSync('README.md', 'utf8');
    
    const requiredSections = [
      'CDN Integration',
      'Quick Start',
      'Performance',
      'Deployment'
    ];

    for (const section of requiredSections) {
      if (readmeContent.includes(section)) {
        console.log(`   ✅ README contains ${section} section`);
        results.passed++;
      } else {
        console.log(`   ❌ README missing ${section} section`);
        results.failed++;
      }
      results.total++;
    }

  } catch (error) {
    console.log(`   ❌ Documentation validation failed: ${error.message}`);
    results.total++;
    results.failed++;
  }
}

// Global fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = (await import('node-fetch')).default;
}

main().catch(console.error);