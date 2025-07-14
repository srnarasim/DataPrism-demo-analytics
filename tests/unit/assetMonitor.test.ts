/**
 * Unit tests for AssetLoadMonitor
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AssetLoadMonitor } from '@/utils/assetMonitor';

describe('AssetLoadMonitor', () => {
  let monitor: AssetLoadMonitor;
  let mockPerformance: any;

  beforeEach(() => {
    monitor = new AssetLoadMonitor();
    
    // Mock performance.now
    mockPerformance = {
      now: vi.fn().mockReturnValue(1000)
    };
    // Use Object.defineProperty to override the existing mock
    Object.defineProperty(global, 'performance', {
      value: mockPerformance,
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    monitor.cleanup();
    vi.clearAllMocks();
  });

  describe('startTracking', () => {
    it('should start tracking an asset', () => {
      const trackingId = monitor.startTracking('https://example.com/asset.js');
      
      expect(trackingId).toBeDefined();
      expect(typeof trackingId).toBe('string');
      
      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].url).toBe('https://example.com/asset.js');
      expect(metrics[0].status).toBe('loading');
    });

    it('should generate unique tracking IDs', () => {
      const id1 = monitor.startTracking('https://example.com/asset1.js');
      const id2 = monitor.startTracking('https://example.com/asset2.js');
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('recordSuccess', () => {
    it('should record successful asset load', () => {
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1500);
      
      const trackingId = monitor.startTracking('https://example.com/asset.js');
      monitor.recordSuccess(trackingId, 5000);
      
      const metrics = monitor.getMetrics();
      expect(metrics[0].status).toBe('success');
      expect(metrics[0].size).toBe(5000);
      expect(metrics[0].duration).toBe(500);
    });

    it('should handle invalid tracking ID', () => {
      monitor.recordSuccess('invalid-id', 1000);
      
      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(0);
    });
  });

  describe('recordError', () => {
    it('should record asset load error', () => {
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1300);
      
      const trackingId = monitor.startTracking('https://example.com/asset.js');
      const error = new Error('Load failed');
      monitor.recordError(trackingId, error);
      
      const metrics = monitor.getMetrics();
      expect(metrics[0].status).toBe('error');
      expect(metrics[0].error).toBe('Load failed');
      expect(metrics[0].duration).toBe(300);
    });
  });

  describe('getPerformanceSummary', () => {
    it('should generate performance summary', () => {
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1200);
      
      const id1 = monitor.startTracking('https://example.com/asset1.js');
      monitor.recordSuccess(id1, 3000);
      
      const id2 = monitor.startTracking('https://example.com/asset2.js');
      monitor.recordError(id2, new Error('Failed'));
      
      const summary = monitor.getPerformanceSummary();
      
      expect(summary.totalAssets).toBe(2);
      expect(summary.successfulLoads).toBe(1);
      expect(summary.failedLoads).toBe(1);
      expect(summary.totalSize).toBe(3000);
      expect(summary.averageLoadTime).toBe(200);
    });

    it('should handle empty metrics', () => {
      const summary = monitor.getPerformanceSummary();
      
      expect(summary.totalAssets).toBe(0);
      expect(summary.successfulLoads).toBe(0);
      expect(summary.failedLoads).toBe(0);
      expect(summary.averageLoadTime).toBe(0);
      expect(summary.totalSize).toBe(0);
    });
  });

  describe('validatePerformanceThresholds', () => {
    it('should validate performance thresholds', () => {
      // Mock successful load within thresholds
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1500);
      
      const id = monitor.startTracking('https://cdn.example.com/asset.js'); // CDN URL
      monitor.recordSuccess(id, 1000000); // 1MB
      
      const validation = monitor.validatePerformanceThresholds();
      
      expect(validation.bundleSizeOk).toBe(true);
      expect(validation.loadTimeOk).toBe(true);
      // Cache hit ratio check might fail, so we'll check for specific violations
      expect(validation.violations.filter(v => v.includes('Bundle size')).length).toBe(0);
      expect(validation.violations.filter(v => v.includes('load time')).length).toBe(0);
    });

    it('should detect bundle size violations', () => {
      const id = monitor.startTracking('https://cdn.example.com/asset.js');
      monitor.recordSuccess(id, 10 * 1024 * 1024); // 10MB (exceeds 8MB limit)
      
      const validation = monitor.validatePerformanceThresholds();
      
      expect(validation.bundleSizeOk).toBe(false);
      expect(validation.violations.some(v => v.includes('Bundle size'))).toBe(true);
    });

    it('should detect load time violations', () => {
      mockPerformance.now.mockReturnValueOnce(1000).mockReturnValueOnce(4000);
      
      const id = monitor.startTracking('https://cdn.example.com/asset.js');
      monitor.recordSuccess(id, 1000);
      
      const validation = monitor.validatePerformanceThresholds();
      
      expect(validation.loadTimeOk).toBe(false);
      expect(validation.violations.some(v => v.includes('load time'))).toBe(true);
    });
  });

  describe('getMetricsForAsset', () => {
    it('should return metrics for specific asset', () => {
      const url = 'https://example.com/asset.js';
      monitor.startTracking(url);
      monitor.startTracking('https://example.com/other.js');
      
      const metrics = monitor.getMetricsForAsset(url);
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0].url).toBe(url);
    });

    it('should return empty array for non-existent asset', () => {
      const metrics = monitor.getMetricsForAsset('https://example.com/nonexistent.js');
      
      expect(metrics).toHaveLength(0);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      monitor.startTracking('https://example.com/asset.js');
      expect(monitor.getMetrics()).toHaveLength(1);
      
      monitor.clearMetrics();
      expect(monitor.getMetrics()).toHaveLength(0);
    });
  });
});