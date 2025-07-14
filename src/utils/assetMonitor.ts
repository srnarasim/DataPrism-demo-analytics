/**
 * Asset Load Monitor for DataPrism Demo Analytics
 * Monitors asset loading performance and provides metrics
 */

import { AssetMetrics } from '@/types/validation';

export class AssetLoadMonitor {
  private metrics: Map<string, AssetMetrics> = new Map();
  private observers: PerformanceObserver[] = [];
  private resourceMetrics: Map<string, PerformanceResourceTiming> = new Map();
  
  constructor() {
    this.setupResourceObserver();
  }
  
  /**
   * Starts tracking an asset load
   */
  startTracking(assetUrl: string): string {
    const trackingId = this.generateTrackingId();
    
    this.metrics.set(trackingId, {
      url: assetUrl,
      startTime: performance.now(),
      status: 'loading'
    });
    
    return trackingId;
  }
  
  /**
   * Records successful asset load
   */
  recordSuccess(trackingId: string, size?: number): void {
    const metric = this.metrics.get(trackingId);
    if (metric) {
      const endTime = performance.now();
      metric.endTime = endTime;
      metric.size = size;
      metric.status = 'success';
      metric.duration = endTime - metric.startTime;
      
      // Try to get additional metrics from Performance API
      this.enrichMetricsFromPerformanceAPI(metric);
    }
  }
  
  /**
   * Records asset load error
   */
  recordError(trackingId: string, error: Error): void {
    const metric = this.metrics.get(trackingId);
    if (metric) {
      const endTime = performance.now();
      metric.endTime = endTime;
      metric.error = error.message;
      metric.status = 'error';
      metric.duration = endTime - metric.startTime;
    }
  }
  
  /**
   * Gets all collected metrics
   */
  getMetrics(): AssetMetrics[] {
    return Array.from(this.metrics.values());
  }
  
  /**
   * Gets metrics for a specific asset URL
   */
  getMetricsForAsset(assetUrl: string): AssetMetrics[] {
    return Array.from(this.metrics.values()).filter(metric => 
      metric.url === assetUrl
    );
  }
  
  /**
   * Gets performance summary
   */
  getPerformanceSummary(): {
    totalAssets: number;
    successfulLoads: number;
    failedLoads: number;
    averageLoadTime: number;
    totalSize: number;
    slowestAsset: AssetMetrics | null;
  } {
    const metrics = this.getMetrics();
    const successfulMetrics = metrics.filter(m => m.status === 'success');
    const failedMetrics = metrics.filter(m => m.status === 'error');
    
    const totalLoadTime = successfulMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageLoadTime = successfulMetrics.length > 0 ? totalLoadTime / successfulMetrics.length : 0;
    
    const totalSize = successfulMetrics.reduce((sum, m) => sum + (m.size || 0), 0);
    
    const slowestAsset = successfulMetrics.reduce((slowest, current) => {
      if (!slowest || (current.duration || 0) > (slowest.duration || 0)) {
        return current;
      }
      return slowest;
    }, null as AssetMetrics | null);
    
    return {
      totalAssets: metrics.length,
      successfulLoads: successfulMetrics.length,
      failedLoads: failedMetrics.length,
      averageLoadTime,
      totalSize,
      slowestAsset
    };
  }
  
  /**
   * Monitors DataPrism-specific assets
   */
  monitorDataPrismAssets(): void {
    const dataPrismAssets = Array.from(this.resourceMetrics.values())
      .filter(resource => resource.name.includes('dataprism') || resource.name.includes('duckdb'));
    
    dataPrismAssets.forEach(resource => {
      const trackingId = this.generateTrackingId();
      this.metrics.set(trackingId, {
        url: resource.name,
        startTime: resource.startTime,
        endTime: resource.responseEnd,
        duration: resource.duration,
        size: resource.transferSize,
        status: 'success'
      });
    });
  }
  
  /**
   * Gets CDN cache hit ratio
   */
  getCacheHitRatio(): number {
    const cdnAssets = Array.from(this.resourceMetrics.values())
      .filter(resource => resource.name.includes('cdn') || resource.name.includes('jsdelivr'));
    
    if (cdnAssets.length === 0) return 0;
    
    const cachedAssets = cdnAssets.filter(resource => 
      resource.transferSize === 0 || resource.transferSize < resource.decodedBodySize
    );
    
    return cachedAssets.length / cdnAssets.length;
  }
  
  /**
   * Validates performance thresholds
   */
  validatePerformanceThresholds(): {
    bundleSizeOk: boolean;
    loadTimeOk: boolean;
    cacheHitRatioOk: boolean;
    violations: string[];
  } {
    const summary = this.getPerformanceSummary();
    const cacheHitRatio = this.getCacheHitRatio();
    const violations: string[] = [];
    
    // Check bundle size (8MB limit)
    const bundleSizeOk = summary.totalSize <= 8 * 1024 * 1024;
    if (!bundleSizeOk) {
      violations.push(`Bundle size ${(summary.totalSize / 1024 / 1024).toFixed(2)}MB exceeds 8MB limit`);
    }
    
    // Check average load time (2s limit)
    const loadTimeOk = summary.averageLoadTime <= 2000;
    if (!loadTimeOk) {
      violations.push(`Average load time ${summary.averageLoadTime.toFixed(0)}ms exceeds 2000ms limit`);
    }
    
    // Check cache hit ratio (95% target)
    const cacheHitRatioOk = cacheHitRatio >= 0.95;
    if (!cacheHitRatioOk) {
      violations.push(`Cache hit ratio ${(cacheHitRatio * 100).toFixed(1)}% below 95% target`);
    }
    
    return {
      bundleSizeOk,
      loadTimeOk,
      cacheHitRatioOk,
      violations
    };
  }
  
  /**
   * Clears all collected metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.resourceMetrics.clear();
  }
  
  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
  
  /**
   * Sets up performance observer for resource timing
   */
  private setupResourceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        entries.forEach(entry => {
          this.resourceMetrics.set(entry.name, entry);
        });
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
  }
  
  /**
   * Enriches metrics with additional performance data
   */
  private enrichMetricsFromPerformanceAPI(metric: AssetMetrics): void {
    const resourceTiming = this.resourceMetrics.get(metric.url);
    if (resourceTiming) {
      metric.size = resourceTiming.transferSize;
      metric.duration = resourceTiming.duration;
      
      // Add additional timing information
      (metric as any).dnsLookupTime = resourceTiming.domainLookupEnd - resourceTiming.domainLookupStart;
      (metric as any).connectTime = resourceTiming.connectEnd - resourceTiming.connectStart;
      (metric as any).responseTime = resourceTiming.responseEnd - resourceTiming.responseStart;
    }
  }
  
  /**
   * Generates unique tracking ID
   */
  private generateTrackingId(): string {
    return `asset-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}