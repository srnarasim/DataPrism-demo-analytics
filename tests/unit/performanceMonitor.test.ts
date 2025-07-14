/**
 * Unit tests for PerformanceMonitor
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PerformanceMonitor } from '@/monitoring/performanceMonitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let mockPerformance: any;

  beforeEach(() => {
    mockPerformance = {
      now: vi.fn().mockReturnValue(1000),
      getEntriesByType: vi.fn().mockReturnValue([])
    };
    // Use Object.defineProperty to override the existing mock
    Object.defineProperty(global, 'performance', {
      value: mockPerformance,
      writable: true,
      configurable: true
    });
    
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.cleanup();
    vi.clearAllMocks();
  });

  describe('measureFCP', () => {
    it('should measure First Contentful Paint', async () => {
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn()
      };
      
      global.PerformanceObserver = vi.fn().mockImplementation((callback) => {
        // Simulate FCP entry
        setTimeout(() => {
          callback({
            getEntries: () => [{ name: 'first-contentful-paint', startTime: 1500 }]
          });
        }, 10);
        return mockObserver;
      });

      const fcp = await monitor.measureFCP();
      
      expect(fcp).toBe(1500);
      expect(mockObserver.observe).toHaveBeenCalledWith({ entryTypes: ['paint'] });
    });

    it('should handle missing PerformanceObserver', async () => {
      global.PerformanceObserver = undefined;

      const fcp = await monitor.measureFCP();
      
      expect(fcp).toBe(0);
    });

    it('should timeout if FCP not found', async () => {
      vi.useFakeTimers();
      
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn()
      };
      
      global.PerformanceObserver = vi.fn().mockImplementation(() => mockObserver);

      const fcpPromise = monitor.measureFCP();
      
      // Fast forward time to trigger timeout
      vi.advanceTimersByTime(10000);
      
      const fcp = await fcpPromise;
      
      expect(fcp).toBe(0);
      
      vi.useRealTimers();
    });
  });

  describe('measureBundleSize', () => {
    it('should measure bundle size from resources', async () => {
      const mockResources = [
        { name: 'https://cdn.example.com/dataprism.js', transferSize: 1000 },
        { name: 'https://cdn.example.com/duckdb.wasm', transferSize: 2000 },
        { name: 'https://example.com/other.js', transferSize: 500 }
      ];

      mockPerformance.getEntriesByType.mockReturnValue(mockResources);

      const bundleSize = await monitor.measureBundleSize();
      
      expect(bundleSize).toBe(3000); // dataprism.js + duckdb.wasm
    });

    it('should handle empty resources', async () => {
      mockPerformance.getEntriesByType.mockReturnValue([]);

      const bundleSize = await monitor.measureBundleSize();
      
      expect(bundleSize).toBe(0);
    });

    it('should handle missing transferSize', async () => {
      const mockResources = [
        { name: 'https://cdn.example.com/dataprism.js', encodedBodySize: 1000 }
      ];

      mockPerformance.getEntriesByType.mockReturnValue(mockResources);

      const bundleSize = await monitor.measureBundleSize();
      
      expect(bundleSize).toBe(1000);
    });
  });

  describe('measureWASMInitTime', () => {
    it('should measure WASM initialization time', async () => {
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1500);
      
      // Mock DataPrism being available
      global.window = { DataPrism: {} } as any;

      const initTime = await monitor.measureWASMInitTime();
      
      expect(initTime).toBe(500);
    });

    it('should handle timeout', async () => {
      vi.useFakeTimers();
      
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1000);
      
      // Don't set DataPrism to simulate timeout
      global.window = {} as any;

      const initTimePromise = monitor.measureWASMInitTime();
      
      // Fast forward time to trigger timeout
      vi.advanceTimersByTime(10000);
      
      const initTime = await initTimePromise;
      
      expect(initTime).toBe(0);
      
      vi.useRealTimers();
    });
  });

  describe('recordAPILatency', () => {
    it('should record API latency', () => {
      monitor.recordAPILatency(250);
      monitor.recordAPILatency(300);
      
      const metrics = monitor.getMetrics();
      
      expect(metrics.apiLatency).toEqual([250, 300]);
    });

    it('should limit to 100 measurements', () => {
      // Record 150 measurements
      for (let i = 0; i < 150; i++) {
        monitor.recordAPILatency(i);
      }
      
      const metrics = monitor.getMetrics();
      
      expect(metrics.apiLatency).toHaveLength(100);
      expect(metrics.apiLatency[0]).toBe(50); // First 50 should be removed
    });
  });

  describe('calculateCacheHitRatio', () => {
    it('should calculate cache hit ratio', () => {
      const mockResources = [
        { name: 'https://cdn.example.com/asset1.js', transferSize: 0, decodedBodySize: 1000 },
        { name: 'https://cdn.example.com/asset2.js', transferSize: 1000, decodedBodySize: 1000 },
        { name: 'https://cdn.example.com/asset3.js', transferSize: 500, decodedBodySize: 1000 }
      ];

      mockPerformance.getEntriesByType.mockReturnValue(mockResources);

      const ratio = monitor.calculateCacheHitRatio();
      
      expect(ratio).toBe(2/3); // 2 out of 3 assets cached
    });

    it('should handle no CDN resources', () => {
      const mockResources = [
        { name: 'https://example.com/asset.js', transferSize: 1000 }
      ];

      mockPerformance.getEntriesByType.mockReturnValue(mockResources);

      const ratio = monitor.calculateCacheHitRatio();
      
      expect(ratio).toBe(0);
    });
  });

  describe('validatePerformanceRequirements', () => {
    it('should validate performance requirements', () => {
      // Set up metrics
      const metrics = {
        fcp: 1500,
        bundleSize: 6 * 1024 * 1024,
        wasmInitTime: 1000,
        apiLatency: [200, 300, 400],
        cacheHitRatio: 0.96
      };

      monitor.getMetrics = vi.fn().mockReturnValue(metrics);

      const validation = monitor.validatePerformanceRequirements();
      
      expect(validation.fcp.passed).toBe(true);
      expect(validation.bundleSize.passed).toBe(true);
      expect(validation.wasmInit.passed).toBe(true);
      expect(validation.apiLatency.passed).toBe(true);
      expect(validation.cacheHitRatio.passed).toBe(true);
      expect(validation.overall.passed).toBe(true);
    });

    it('should detect performance violations', () => {
      const metrics = {
        fcp: 3000, // Exceeds 2000ms
        bundleSize: 10 * 1024 * 1024, // Exceeds 8MB
        wasmInitTime: 2000, // Exceeds 1500ms
        apiLatency: [1500, 1200], // Exceeds 1000ms
        cacheHitRatio: 0.80 // Below 95%
      };

      monitor.getMetrics = vi.fn().mockReturnValue(metrics);

      const validation = monitor.validatePerformanceRequirements();
      
      expect(validation.fcp.passed).toBe(false);
      expect(validation.bundleSize.passed).toBe(false);
      expect(validation.wasmInit.passed).toBe(false);
      expect(validation.apiLatency.passed).toBe(false);
      expect(validation.cacheHitRatio.passed).toBe(false);
      expect(validation.overall.passed).toBe(false);
    });
  });

  describe('generateReport', () => {
    it('should generate performance report', () => {
      const metrics = {
        fcp: 1500,
        bundleSize: 6 * 1024 * 1024,
        wasmInitTime: 1000,
        apiLatency: [200, 300],
        cacheHitRatio: 0.96
      };

      monitor.getMetrics = vi.fn().mockReturnValue(metrics);

      const report = monitor.generateReport();
      
      expect(report).toContain('DataPrism Performance Report');
      expect(report).toContain('First Contentful Paint');
      expect(report).toContain('Bundle Size');
      expect(report).toContain('WASM Init Time');
      expect(report).toContain('✅'); // Should show passed tests
    });
  });
});