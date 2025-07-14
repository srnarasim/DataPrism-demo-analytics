# DataPrism Demo Analytics App - Validation Implementation PRP

## Executive Summary

This Product Requirements Prompt (PRP) defines the implementation requirements for validating the decoupled DataPrism Demo Analytics App ("DemoApp"). The validation system ensures the application operates correctly while loading all DataPrism bundles, plugins, and assets exclusively from a CDN, meeting performance, security, and usability benchmarks across supported browsers and devices.

**Primary Objectives:**
- Implement comprehensive CDN asset validation
- Ensure reliable initialization without local dependencies
- Validate core workflows across all supported environments
- Establish performance monitoring and alerting
- Create automated test coverage for all functional requirements

**Architecture Layer Affected:** All layers - CDN Loading, Asset Management, Plugin System, Performance Monitoring, Error Handling

## Context and Background

### Current State
The DataPrism Demo Analytics App currently implements:
- **CDN Loading System**: `CDNAssetLoader` class with manifest-based integrity verification
- **Asset Management**: SHA-384 hash verification and fallback mechanisms
- **Error Handling**: Multi-layer error handling with mock implementation fallback
- **Performance Monitoring**: Basic CDN latency tracking and bundle size validation
- **Testing Infrastructure**: Unit tests with Vitest, E2E tests with Playwright

### Why This Feature is Needed
The validation system is critical for:
1. **Production Readiness**: Ensuring reliable CDN-based deployment
2. **Performance Compliance**: Meeting strict performance benchmarks
3. **Security Validation**: Enforcing HTTPS-only and SRI requirements
4. **Cross-Browser Compatibility**: Validating functionality across all supported browsers
5. **Operational Confidence**: Providing monitoring and alerting for production issues

### Architecture Integration
The validation system integrates with:
- **CDN Asset Loading**: Validates asset retrieval and integrity verification
- **Plugin System**: Tests plugin registration and workflow execution
- **Performance Monitoring**: Implements comprehensive performance tracking
- **Error Handling**: Validates graceful degradation scenarios
- **Testing Infrastructure**: Extends existing test coverage

## Technical Specifications

### Performance Targets
- **First Contentful Paint (FCP)**: < 2s broadband, < 5s 3G
- **Total Bundle Download**: < 8MB compressed
- **WASM Compile + Init**: < 1.5s desktop, < 3s mobile
- **95th-percentile API Latency**: < 1s (excluding network)
- **Asset Cache-Hit Ratio**: ≥ 95% for versioned assets

### Browser Compatibility
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Desktop (Windows/macOS/Linux), Tablet, Mobile
- Cross-Origin-Embedder-Policy and Cross-Origin-Opener-Policy support

### Security Requirements
- HTTPS-only requests with mixed-content blocking
- SRI for all script and link CDN tags
- Content Security Policy headers
- No hard-coded secrets in client code

## Implementation Plan

### Step 1: Environment Setup and Dependencies

**1.1 Install Testing Dependencies**
```bash
npm install --save-dev @playwright/test lighthouse vitest @vitest/coverage-v8
npm install --save-dev puppeteer jest-environment-jsdom
```

**1.2 Configure Test Environment**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

### Step 2: CDN Asset Validation System

**2.1 Enhanced CDN Loader Validation**
```typescript
// src/utils/cdnValidator.ts
export class CDNValidator {
  private config: CDNConfig;
  
  constructor(config: CDNConfig) {
    this.config = config;
  }
  
  async validateAssetIntegrity(url: string, expectedHash: string): Promise<boolean> {
    const response = await fetch(url);
    const content = await response.arrayBuffer();
    const hash = await this.calculateSHA384(content);
    return hash === expectedHash;
  }
  
  async validateAllAssets(): Promise<ValidationResult> {
    const results = {
      manifest: await this.validateManifest(),
      coreBundle: await this.validateCoreBundle(),
      plugins: await this.validatePlugins(),
      integrity: await this.validateIntegrity()
    };
    
    return {
      success: Object.values(results).every(r => r.success),
      results,
      timestamp: new Date().toISOString()
    };
  }
  
  private async calculateSHA384(buffer: ArrayBuffer): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-384', buffer);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
  }
}
```

**2.2 Asset Loading Monitoring**
```typescript
// src/utils/assetMonitor.ts
export class AssetLoadMonitor {
  private metrics: Map<string, AssetMetrics> = new Map();
  
  startTracking(assetUrl: string): string {
    const trackingId = crypto.randomUUID();
    this.metrics.set(trackingId, {
      url: assetUrl,
      startTime: performance.now(),
      status: 'loading'
    });
    return trackingId;
  }
  
  recordSuccess(trackingId: string, size: number): void {
    const metric = this.metrics.get(trackingId);
    if (metric) {
      metric.endTime = performance.now();
      metric.size = size;
      metric.status = 'success';
      metric.duration = metric.endTime - metric.startTime;
    }
  }
  
  recordError(trackingId: string, error: Error): void {
    const metric = this.metrics.get(trackingId);
    if (metric) {
      metric.endTime = performance.now();
      metric.error = error.message;
      metric.status = 'error';
      metric.duration = metric.endTime - metric.startTime;
    }
  }
  
  getMetrics(): AssetMetrics[] {
    return Array.from(this.metrics.values());
  }
}
```

### Step 3: Plugin System Validation

**3.1 Plugin Registration Validator**
```typescript
// src/plugins/pluginValidator.ts
export class PluginValidator {
  private registeredPlugins: Map<string, Plugin> = new Map();
  
  async validatePluginSystem(): Promise<PluginValidationResult> {
    const results = {
      csvImporter: await this.validatePlugin('csv-importer'),
      observableCharts: await this.validatePlugin('observable-charts'),
      openaiLlm: await this.validatePlugin('openai-llm'),
      dataExporter: await this.validatePlugin('data-exporter')
    };
    
    return {
      success: Object.values(results).every(r => r.success),
      plugins: results,
      timestamp: new Date().toISOString()
    };
  }
  
  private async validatePlugin(pluginName: string): Promise<PluginResult> {
    try {
      const plugin = await this.loadPlugin(pluginName);
      const isValid = await this.testPluginInterface(plugin);
      return { success: isValid, plugin: pluginName };
    } catch (error) {
      return { 
        success: false, 
        plugin: pluginName, 
        error: error.message 
      };
    }
  }
}
```

**3.2 Workflow Validation**
```typescript
// src/validation/workflowValidator.ts
export class WorkflowValidator {
  constructor(private engine: DataPrismEngine) {}
  
  async validateImportWorkflow(): Promise<WorkflowResult> {
    const startTime = performance.now();
    
    try {
      // Generate 100k row test dataset
      const testData = this.generateTestData(100000);
      
      // Import via CSV importer plugin
      await this.engine.importCSV(testData);
      
      // Validate import success
      const tables = await this.engine.listTables();
      const hasImportedTable = tables.includes('imported_data');
      
      return {
        success: hasImportedTable,
        duration: performance.now() - startTime,
        rowCount: testData.length
      };
    } catch (error) {
      return {
        success: false,
        duration: performance.now() - startTime,
        error: error.message
      };
    }
  }
  
  async validateVisualizationWorkflow(): Promise<WorkflowResult> {
    try {
      // Test chart rendering
      const barChart = await this.engine.renderChart('bar', 'sales_data');
      const scatterChart = await this.engine.renderChart('scatter', 'analytics_data');
      
      return {
        success: barChart && scatterChart,
        charts: ['bar', 'scatter'],
        duration: performance.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
```

### Step 4: Performance Monitoring Implementation

**4.1 Performance Metrics Collection**
```typescript
// src/monitoring/performanceMonitor.ts
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fcp: 0,
    bundleSize: 0,
    wasmInitTime: 0,
    apiLatency: [],
    cacheHitRatio: 0
  };
  
  async measureFCP(): Promise<number> {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            resolve(entry.startTime);
          }
        }
      }).observe({ entryTypes: ['paint'] });
    });
  }
  
  async measureBundleSize(): Promise<number> {
    const resources = performance.getEntriesByType('resource');
    let totalSize = 0;
    
    for (const resource of resources) {
      if (resource.name.includes('dataprism')) {
        totalSize += resource.transferSize || 0;
      }
    }
    
    this.metrics.bundleSize = totalSize;
    return totalSize;
  }
  
  async measureWASMInitTime(): Promise<number> {
    const startTime = performance.now();
    
    // Wait for WASM initialization
    await this.waitForWASMReady();
    
    const duration = performance.now() - startTime;
    this.metrics.wasmInitTime = duration;
    return duration;
  }
  
  recordAPILatency(duration: number): void {
    this.metrics.apiLatency.push(duration);
    
    // Keep only last 100 measurements
    if (this.metrics.apiLatency.length > 100) {
      this.metrics.apiLatency.shift();
    }
  }
  
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
}
```

**4.2 Lighthouse Integration**
```typescript
// src/monitoring/lighthouseValidator.ts
export class LighthouseValidator {
  async runLighthouseAudit(): Promise<LighthouseResult> {
    const lighthouse = await import('lighthouse');
    const chromeLauncher = await import('chrome-launcher');
    
    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
    });
    
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices'],
      port: chrome.port
    };
    
    const runnerResult = await lighthouse('http://localhost:3000', options);
    await chrome.kill();
    
    return {
      performance: runnerResult.lhr.categories.performance.score * 100,
      accessibility: runnerResult.lhr.categories.accessibility.score * 100,
      bestPractices: runnerResult.lhr.categories['best-practices'].score * 100,
      metrics: runnerResult.lhr.audits
    };
  }
}
```

### Step 5: Error Handling and Security Validation

**5.1 Error Scenario Testing**
```typescript
// src/validation/errorValidator.ts
export class ErrorValidator {
  async testCDNFailure(): Promise<ErrorTestResult> {
    // Mock CDN failure
    const originalFetch = window.fetch;
    window.fetch = async (url) => {
      if (url.includes('dataprism')) {
        throw new Error('CDN_UNAVAILABLE');
      }
      return originalFetch(url);
    };
    
    try {
      const engine = new DataPrismEngine();
      await engine.initialize();
      
      // Should fall back to mock implementation
      const isUsingMock = engine.constructor.name === 'MockDataPrismEngine';
      
      return {
        success: isUsingMock,
        fallbackType: 'mock',
        gracefulDegradation: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        gracefulDegradation: false
      };
    } finally {
      window.fetch = originalFetch;
    }
  }
  
  async testIntegrityFailure(): Promise<ErrorTestResult> {
    // Mock integrity failure
    const loader = new CDNAssetLoader(getCDNConfig());
    const originalGetIntegrityHash = loader.getIntegrityHash;
    
    loader.getIntegrityHash = () => 'invalid-hash';
    
    try {
      await loader.loadCoreBundle();
      return {
        success: false,
        error: 'Should have failed integrity check'
      };
    } catch (error) {
      return {
        success: error.message.includes('integrity'),
        expectedError: true
      };
    }
  }
}
```

**5.2 Security Validation**
```typescript
// src/validation/securityValidator.ts
export class SecurityValidator {
  async validateHTTPS(): Promise<SecurityResult> {
    const isHTTPS = window.location.protocol === 'https:';
    const mixedContent = this.detectMixedContent();
    
    return {
      httpsOnly: isHTTPS,
      mixedContent: mixedContent.length === 0,
      violations: mixedContent
    };
  }
  
  async validateCSP(): Promise<SecurityResult> {
    const cspHeader = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const cspContent = cspHeader?.getAttribute('content') || '';
    
    const requiredDirectives = [
      'script-src',
      'connect-src',
      'worker-src'
    ];
    
    const violations = requiredDirectives.filter(directive => 
      !cspContent.includes(directive)
    );
    
    return {
      cspPresent: !!cspHeader,
      requiredDirectives: violations.length === 0,
      violations
    };
  }
  
  async validateSRI(): Promise<SecurityResult> {
    const scripts = document.querySelectorAll('script[src]');
    const links = document.querySelectorAll('link[href]');
    
    const violations = [];
    
    scripts.forEach(script => {
      const src = script.getAttribute('src');
      if (src?.includes('cdn') && !script.hasAttribute('integrity')) {
        violations.push(`Script missing SRI: ${src}`);
      }
    });
    
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href?.includes('cdn') && !link.hasAttribute('integrity')) {
        violations.push(`Link missing SRI: ${href}`);
      }
    });
    
    return {
      sriComplete: violations.length === 0,
      violations
    };
  }
}
```

## Code Examples and Patterns

### WebAssembly-JavaScript Interop Pattern
```typescript
// src/wasm/wasmManager.ts
export class WASMManager {
  private wasmModule: any;
  
  async loadWASM(wasmUrl: string): Promise<void> {
    const response = await fetch(wasmUrl);
    const bytes = await response.arrayBuffer();
    this.wasmModule = await WebAssembly.instantiate(bytes);
  }
  
  callWASMFunction(functionName: string, ...args: any[]): any {
    if (!this.wasmModule) {
      throw new Error('WASM module not loaded');
    }
    
    const func = this.wasmModule.instance.exports[functionName];
    if (!func) {
      throw new Error(`Function ${functionName} not found in WASM module`);
    }
    
    return func(...args);
  }
}
```

### DuckDB Integration Pattern
```typescript
// src/database/duckdbManager.ts
export class DuckDBManager {
  private db: any;
  
  async initialize(): Promise<void> {
    const duckdb = await import('@duckdb/duckdb-wasm');
    this.db = await duckdb.createDB();
  }
  
  async query(sql: string): Promise<QueryResult> {
    const connection = await this.db.connect();
    
    try {
      const result = await connection.query(sql);
      return {
        data: result.toArray(),
        rowCount: result.length,
        executionTime: performance.now()
      };
    } finally {
      await connection.close();
    }
  }
}
```

### Error Handling Pattern
```typescript
// src/errors/errorHandler.ts
export class ErrorHandler {
  private errorReporters: ErrorReporter[] = [];
  
  handleError(error: Error, context: ErrorContext): void {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.errorReporters.forEach(reporter => {
      reporter.report(errorReport);
    });
    
    // Attempt graceful recovery
    this.attemptRecovery(error, context);
  }
  
  private attemptRecovery(error: Error, context: ErrorContext): void {
    switch (context.type) {
      case 'CDN_LOAD_FAILURE':
        this.fallbackToMock();
        break;
      case 'WASM_INIT_FAILURE':
        this.retryWASMInit();
        break;
      case 'PLUGIN_LOAD_FAILURE':
        this.disablePlugin(context.plugin);
        break;
      default:
        this.showErrorMessage(error);
    }
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
// tests/unit/cdnLoader.test.ts
describe('CDNAssetLoader', () => {
  let loader: CDNAssetLoader;
  let mockConfig: CDNConfig;
  
  beforeEach(() => {
    mockConfig = {
      baseUrl: 'https://test-cdn.com',
      version: 'latest',
      fallback: { enabled: true, retries: 3, timeout: 5000 }
    };
    loader = new CDNAssetLoader(mockConfig);
  });
  
  it('should load core bundle successfully', async () => {
    const mockScript = document.createElement('script');
    jest.spyOn(document, 'createElement').mockReturnValue(mockScript);
    
    const loadPromise = loader.loadCoreBundle();
    
    // Simulate script load
    mockScript.onload();
    
    const result = await loadPromise;
    expect(result).toBeDefined();
  });
  
  it('should handle integrity verification failure', async () => {
    jest.spyOn(loader, 'getIntegrityHash').mockReturnValue('invalid-hash');
    
    await expect(loader.loadCoreBundle()).rejects.toThrow('integrity');
  });
});
```

### Integration Tests
```typescript
// tests/integration/dataprism.test.ts
describe('DataPrism Integration', () => {
  it('should initialize from CDN and execute queries', async () => {
    const { engine, isInitialized } = await initializeDataPrism();
    
    expect(isInitialized).toBe(true);
    expect(engine).toBeDefined();
    
    const result = await engine.query('SELECT 1 as test');
    expect(result.data).toEqual([{ test: 1 }]);
  });
  
  it('should fallback to mock on CDN failure', async () => {
    // Mock CDN failure
    jest.spyOn(window, 'fetch').mockRejectedValue(new Error('CDN_UNAVAILABLE'));
    
    const { engine, isInitialized } = await initializeDataPrism();
    
    expect(isInitialized).toBe(true);
    expect(engine.constructor.name).toBe('MockDataPrismEngine');
  });
});
```

### E2E Tests
```typescript
// tests/e2e/workflows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('DataPrism Workflows', () => {
  test('complete data import and visualization workflow', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for DataPrism initialization
    await page.waitForSelector('[data-testid="dataprism-ready"]');
    
    // Import data
    await page.click('[data-testid="import-button"]');
    await page.setInputFiles('[data-testid="file-input"]', 'test-data.csv');
    await page.click('[data-testid="import-submit"]');
    
    // Verify import success
    await expect(page.locator('[data-testid="import-success"]')).toBeVisible();
    
    // Create visualization
    await page.click('[data-testid="visualize-button"]');
    await page.selectOption('[data-testid="chart-type"]', 'bar');
    await page.click('[data-testid="create-chart"]');
    
    // Verify chart rendering
    await expect(page.locator('[data-testid="chart-container"]')).toBeVisible();
  });
});
```

### Performance Tests
```typescript
// tests/performance/lighthouse.test.ts
describe('Performance Validation', () => {
  it('should meet FCP targets', async () => {
    const lighthouse = new LighthouseValidator();
    const result = await lighthouse.runLighthouseAudit();
    
    expect(result.performance).toBeGreaterThanOrEqual(90);
    expect(result.metrics['first-contentful-paint'].numericValue).toBeLessThan(2000);
  });
  
  it('should meet bundle size targets', async () => {
    const monitor = new PerformanceMonitor();
    const bundleSize = await monitor.measureBundleSize();
    
    expect(bundleSize).toBeLessThan(8 * 1024 * 1024); // 8MB
  });
});
```

## Success Criteria

### Functional Requirements
- [ ] **F-01**: All DataPrism assets load from CDN (0 local paths)
- [ ] **F-02**: SRI hash verification passes for all assets
- [ ] **F-03**: DataPrism initializes within 3 seconds
- [ ] **F-04**: 100k row CSV import works without errors
- [ ] **F-05**: Bar and scatter charts render successfully
- [ ] **F-06**: LLM plugin returns label suggestions
- [ ] **F-07**: Labeled dataset exports to CSV
- [ ] **F-08**: Graceful degradation on CDN failure

### Performance Requirements
- [ ] **P-01**: FCP < 2s broadband, < 5s 3G
- [ ] **P-02**: Total bundle < 8MB compressed
- [ ] **P-03**: WASM init < 1.5s desktop, < 3s mobile
- [ ] **P-04**: API latency < 1s (95th percentile)
- [ ] **P-05**: Cache hit ratio ≥ 95%

### Security Requirements
- [ ] HTTPS-only requests enforced
- [ ] SRI implemented for all CDN assets
- [ ] CSP headers properly configured
- [ ] No hard-coded secrets in client

### Testing Requirements
- [ ] Unit test coverage ≥ 80%
- [ ] Integration tests cover all workflows
- [ ] E2E tests validate complete user journeys
- [ ] Performance tests validate all metrics
- [ ] Security tests validate all requirements

## Validation Commands

### Build Commands
```bash
# Build the application
npm run build

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run security audit
npm audit
```

### Test Commands
```bash
# Run all tests
npm test

# Run unit tests with coverage
npm run test:unit -- --coverage

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run performance tests
npm run test:performance

# Run security tests
npm run test:security
```

### Validation Commands
```bash
# Run complete validation suite
npm run validate

# Run PRP compliance check
npm run validate:prp

# Run Lighthouse audit
npm run audit:lighthouse

# Run CDN connectivity test
npm run test:cdn

# Run bundle size check
npm run check:bundle-size
```

### Monitoring Commands
```bash
# Start performance monitoring
npm run monitor:performance

# Check CDN status
npm run status:cdn

# Generate validation report
npm run report:validation

# Run health check
npm run health:check
```

## Deliverables

### 1. Test Scripts
- `tests/unit/` - Unit test suites
- `tests/integration/` - Integration test suites  
- `tests/e2e/` - End-to-end test suites
- `tests/performance/` - Performance validation tests
- `tests/security/` - Security validation tests

### 2. CI/CD Pipeline
- `.github/workflows/ci.yml` - Complete CI pipeline
- `.github/workflows/performance.yml` - Performance monitoring
- `.github/workflows/security.yml` - Security scanning

### 3. Documentation
- `/docs/qa-manual.md` - Manual QA checklist
- `/docs/validation-report.md` - Validation report template
- `/docs/monitoring.md` - Monitoring and alerting setup

### 4. Monitoring Setup
- `src/monitoring/` - Performance monitoring implementation
- `src/validation/` - Validation utilities
- `dashboards/` - Grafana dashboard configurations

### 5. Configuration Files
- `lighthouse.config.js` - Lighthouse configuration
- `playwright.config.ts` - E2E test configuration
- `vitest.config.ts` - Unit test configuration

This comprehensive PRP provides all necessary context, implementation details, and validation criteria for successfully implementing the DataPrism Demo Analytics App validation system. The implementation follows established patterns in the codebase and provides robust testing coverage for all requirements.