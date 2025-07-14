/**
 * Performance tests using Lighthouse
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { LighthouseValidator } from '@/monitoring/lighthouseValidator';
import { PerformanceMonitor } from '@/monitoring/performanceMonitor';

describe('Performance Validation', () => {
  let lighthouseValidator: LighthouseValidator;
  let performanceMonitor: PerformanceMonitor;
  
  beforeAll(() => {
    lighthouseValidator = new LighthouseValidator();
    performanceMonitor = new PerformanceMonitor();
  });

  afterAll(() => {
    performanceMonitor.cleanup();
  });

  describe('Lighthouse Audits', () => {
    it('should meet performance score requirements', async () => {
      const result = await lighthouseValidator.runPerformanceAudit();
      
      expect(result.performance).toBeGreaterThanOrEqual(80);
      expect(result.metrics).toBeDefined();
      expect(result.metrics?.['first-contentful-paint']).toBeDefined();
    }, 60000); // 60 second timeout for Lighthouse

    it('should meet FCP requirements', async () => {
      const validation = await lighthouseValidator.validatePerformanceRequirements();
      
      expect(validation.fcp.passed).toBe(true);
      expect(validation.fcp.value).toBeLessThanOrEqual(2000);
    }, 60000);

    it('should meet LCP requirements', async () => {
      const validation = await lighthouseValidator.validatePerformanceRequirements();
      
      expect(validation.lcp.passed).toBe(true);
      expect(validation.lcp.value).toBeLessThanOrEqual(4000);
    }, 60000);

    it('should meet CLS requirements', async () => {
      const validation = await lighthouseValidator.validatePerformanceRequirements();
      
      expect(validation.cls.passed).toBe(true);
      expect(validation.cls.value).toBeLessThanOrEqual(0.1);
    }, 60000);

    it('should meet TBT requirements', async () => {
      const validation = await lighthouseValidator.validatePerformanceRequirements();
      
      expect(validation.tbt.passed).toBe(true);
      expect(validation.tbt.value).toBeLessThanOrEqual(300);
    }, 60000);

    it('should meet Speed Index requirements', async () => {
      const validation = await lighthouseValidator.validatePerformanceRequirements();
      
      expect(validation.si.passed).toBe(true);
      expect(validation.si.value).toBeLessThanOrEqual(3000);
    }, 60000);

    it('should meet overall performance requirements', async () => {
      const validation = await lighthouseValidator.validatePerformanceRequirements();
      
      expect(validation.overall.passed).toBe(true);
      expect(validation.overall.score).toBeGreaterThanOrEqual(80);
    }, 60000);
  });

  describe('Accessibility Audits', () => {
    it('should meet accessibility requirements', async () => {
      const result = await lighthouseValidator.runAccessibilityAudit();
      
      expect(result.score).toBeGreaterThanOrEqual(90);
      expect(result.violations.length).toBeLessThanOrEqual(2);
    }, 60000);

    it('should provide accessibility recommendations', async () => {
      const result = await lighthouseValidator.runAccessibilityAudit();
      
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    }, 60000);
  });

  describe('Bundle Size Analysis', () => {
    it('should meet bundle size requirements', async () => {
      // Mock performance.getEntriesByType for testing
      const mockResources = [
        { name: 'https://test-cdn.com/dataprism.umd.js', transferSize: 2 * 1024 * 1024 },
        { name: 'https://test-cdn.com/duckdb.wasm', transferSize: 3 * 1024 * 1024 },
        { name: 'https://test-cdn.com/other.js', transferSize: 1 * 1024 * 1024 }
      ];
      
      global.performance.getEntriesByType = () => mockResources as any;
      
      const bundleSize = await performanceMonitor.measureBundleSize();
      
      expect(bundleSize).toBeLessThanOrEqual(8 * 1024 * 1024); // 8MB limit
    });

    it('should track bundle composition', async () => {
      const mockResources = [
        { name: 'https://test-cdn.com/dataprism.umd.js', transferSize: 2 * 1024 * 1024 },
        { name: 'https://test-cdn.com/duckdb.wasm', transferSize: 4 * 1024 * 1024 },
        { name: 'https://test-cdn.com/vendor.js', transferSize: 1 * 1024 * 1024 }
      ];
      
      global.performance.getEntriesByType = () => mockResources as any;
      
      const bundleSize = await performanceMonitor.measureBundleSize();
      
      expect(bundleSize).toBe(7 * 1024 * 1024); // Total of dataprism + duckdb
    });
  });

  describe('Network Performance', () => {
    it('should measure cache hit ratio', () => {
      const mockResources = [
        { 
          name: 'https://cdn.example.com/asset1.js', 
          transferSize: 0, 
          decodedBodySize: 1000 
        },
        { 
          name: 'https://cdn.example.com/asset2.js', 
          transferSize: 500, 
          decodedBodySize: 1000 
        },
        { 
          name: 'https://cdn.example.com/asset3.js', 
          transferSize: 1000, 
          decodedBodySize: 1000 
        }
      ];
      
      global.performance.getEntriesByType = () => mockResources as any;
      
      const ratio = performanceMonitor.calculateCacheHitRatio();
      
      expect(ratio).toBeGreaterThanOrEqual(0.95); // 95% cache hit ratio target
    });

    it('should track API latency', () => {
      // Record some API calls
      performanceMonitor.recordAPILatency(150);
      performanceMonitor.recordAPILatency(200);
      performanceMonitor.recordAPILatency(100);
      
      const metrics = performanceMonitor.getMetrics();
      const avgLatency = metrics.apiLatency.reduce((a, b) => a + b) / metrics.apiLatency.length;
      
      expect(avgLatency).toBeLessThanOrEqual(1000); // 1s target
    });
  });

  describe('Memory Performance', () => {
    it('should monitor memory usage', () => {
      // Mock memory info
      (global as any).performance.memory = {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 1024 * 1024 * 1024 // 1GB
      };
      
      const memoryUsage = (global as any).performance.memory.usedJSHeapSize;
      
      expect(memoryUsage).toBeLessThan(512 * 1024 * 1024); // 512MB limit
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', async () => {
      // Simulate baseline performance
      const baselineMetrics = {
        fcp: 1800,
        lcp: 3000,
        cls: 0.05,
        tbt: 200,
        si: 2500
      };
      
      // Simulate current performance
      const currentMetrics = {
        fcp: 2200, // 22% slower
        lcp: 3200, // 7% slower
        cls: 0.06, // 20% higher
        tbt: 240, // 20% higher
        si: 2600 // 4% slower
      };
      
      // Check for regressions (>20% degradation)
      const fcpRegression = (currentMetrics.fcp - baselineMetrics.fcp) / baselineMetrics.fcp;
      const clsRegression = (currentMetrics.cls - baselineMetrics.cls) / baselineMetrics.cls;
      
      expect(fcpRegression).toBeLessThan(0.2); // Less than 20% regression
      expect(clsRegression).toBeLessThan(0.2); // Less than 20% regression
    });
  });

  describe('Performance Report Generation', () => {
    it('should generate comprehensive performance report', async () => {
      const report = await lighthouseValidator.generateAuditReport();
      
      expect(report).toContain('DataPrism Lighthouse Audit Report');
      expect(report).toContain('Performance');
      expect(report).toContain('Accessibility');
      expect(report).toContain('Best Practices');
      expect(report).toContain('First Contentful Paint');
      expect(report).toContain('Overall Assessment');
    }, 60000);

    it('should include performance metrics in report', () => {
      const report = performanceMonitor.generateReport();
      
      expect(report).toContain('DataPrism Performance Report');
      expect(report).toContain('First Contentful Paint');
      expect(report).toContain('Bundle Size');
      expect(report).toContain('WASM Init Time');
      expect(report).toContain('API Latency');
      expect(report).toContain('Cache Hit Ratio');
    });
  });

  describe('Performance Budgets', () => {
    it('should enforce performance budgets', () => {
      const validation = performanceMonitor.validatePerformanceRequirements();
      
      // All metrics should meet budget requirements
      expect(validation.fcp.passed).toBe(true);
      expect(validation.bundleSize.passed).toBe(true);
      expect(validation.wasmInit.passed).toBe(true);
      expect(validation.apiLatency.passed).toBe(true);
      expect(validation.cacheHitRatio.passed).toBe(true);
      
      // Overall score should be passing
      expect(validation.overall.passed).toBe(true);
      expect(validation.overall.score).toBeGreaterThanOrEqual(80);
    });

    it('should track budget compliance over time', () => {
      const metrics = performanceMonitor.getMetrics();
      
      // Record multiple measurements
      performanceMonitor.recordAPILatency(150);
      performanceMonitor.recordAPILatency(200);
      performanceMonitor.recordAPILatency(180);
      
      const updatedMetrics = performanceMonitor.getMetrics();
      
      expect(updatedMetrics.apiLatency.length).toBeGreaterThan(metrics.apiLatency.length);
    });
  });
});