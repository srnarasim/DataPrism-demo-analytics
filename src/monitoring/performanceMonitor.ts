/**
 * Performance Monitor for DataPrism Demo Analytics
 * Monitors and validates performance metrics
 */

import { PerformanceMetrics } from '@/types/validation';

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fcp: 0,
    bundleSize: 0,
    wasmInitTime: 0,
    apiLatency: [],
    cacheHitRatio: 0
  };
  
  private observers: PerformanceObserver[] = [];
  constructor() {
    this.setupPerformanceObservers();
  }
  
  /**
   * Measures First Contentful Paint (FCP)
   */
  async measureFCP(): Promise<number> {
    return new Promise((resolve) => {
      if (typeof PerformanceObserver === 'undefined') {
        console.warn('PerformanceObserver not supported');
        resolve(0);
        return;
      }
      
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            console.log(`📊 FCP: ${entry.startTime.toFixed(2)}ms`);
            paintObserver.disconnect();
            resolve(entry.startTime);
            return;
          }
        }
      });
      
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(paintObserver);
      
      // Fallback timeout
      setTimeout(() => {
        paintObserver.disconnect();
        resolve(0);
      }, 10000);
    });
  }
  
  /**
   * Measures total bundle size
   */
  async measureBundleSize(): Promise<number> {
    try {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      let totalSize = 0;
      
      for (const resource of resources) {
        // Include DataPrism-related resources
        if (resource.name.includes('dataprism') || 
            resource.name.includes('duckdb') || 
            resource.name.includes('cdn')) {
          totalSize += resource.transferSize || resource.encodedBodySize || 0;
        }
      }
      
      this.metrics.bundleSize = totalSize;
      console.log(`📊 Bundle size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
      
      return totalSize;
    } catch (error) {
      console.error('Bundle size measurement failed:', error);
      return 0;
    }
  }
  
  /**
   * Measures WebAssembly initialization time
   */
  async measureWASMInitTime(): Promise<number> {
    const startTime = performance.now();
    
    try {
      // Wait for DataPrism to be ready
      await this.waitForDataPrismReady();
      
      const duration = performance.now() - startTime;
      this.metrics.wasmInitTime = duration;
      console.log(`📊 WASM init time: ${duration.toFixed(2)}ms`);
      
      return duration;
    } catch (error) {
      console.error('WASM init time measurement failed:', error);
      return 0;
    }
  }
  
  /**
   * Records API latency
   */
  recordAPILatency(duration: number): void {
    this.metrics.apiLatency.push(duration);
    
    // Keep only last 100 measurements
    if (this.metrics.apiLatency.length > 100) {
      this.metrics.apiLatency.shift();
    }
    
    console.log(`📊 API latency: ${duration.toFixed(2)}ms`);
  }
  
  /**
   * Calculates cache hit ratio
   */
  calculateCacheHitRatio(): number {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const cdnResources = resources.filter(r => 
      r.name.includes('cdn') || r.name.includes('jsdelivr') || r.name.includes('dataprism')
    );
    
    if (cdnResources.length === 0) return 0;
    
    const cachedResources = cdnResources.filter(r => 
      r.transferSize === 0 || r.transferSize < (r.encodedBodySize || r.decodedBodySize)
    );
    
    const ratio = cachedResources.length / cdnResources.length;
    this.metrics.cacheHitRatio = ratio;
    console.log(`📊 Cache hit ratio: ${(ratio * 100).toFixed(1)}%`);
    
    return ratio;
  }
  
  /**
   * Gets current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Gets performance summary with thresholds
   */
  getPerformanceSummary(): {
    metrics: PerformanceMetrics;
    thresholds: {
      fcpTarget: number;
      fcpMet: boolean;
      bundleSizeTarget: number;
      bundleSizeMet: boolean;
      wasmInitTarget: number;
      wasmInitMet: boolean;
      apiLatencyTarget: number;
      apiLatencyMet: boolean;
      cacheHitRatioTarget: number;
      cacheHitRatioMet: boolean;
    };
    overall: {
      score: number;
      passed: boolean;
    };
  } {
    const metrics = this.getMetrics();
    const avgLatency = metrics.apiLatency.length > 0 
      ? metrics.apiLatency.reduce((a, b) => a + b) / metrics.apiLatency.length 
      : 0;
    
    const thresholds = {
      fcpTarget: 2000,
      fcpMet: metrics.fcp <= 2000,
      bundleSizeTarget: 8 * 1024 * 1024, // 8MB
      bundleSizeMet: metrics.bundleSize <= 8 * 1024 * 1024,
      wasmInitTarget: 1500,
      wasmInitMet: metrics.wasmInitTime <= 1500,
      apiLatencyTarget: 1000,
      apiLatencyMet: avgLatency <= 1000,
      cacheHitRatioTarget: 0.95,
      cacheHitRatioMet: metrics.cacheHitRatio >= 0.95
    };
    
    const passedCount = Object.values(thresholds).filter(v => typeof v === 'boolean' && v).length;
    const totalCount = Object.values(thresholds).filter(v => typeof v === 'boolean').length;
    const score = totalCount > 0 ? (passedCount / totalCount) * 100 : 0;
    
    return {
      metrics,
      thresholds,
      overall: {
        score,
        passed: score >= 80 // 80% threshold
      }
    };
  }
  
  /**
   * Validates performance against PRP requirements
   */
  validatePerformanceRequirements(): {
    fcp: { passed: boolean; value: number; target: number };
    bundleSize: { passed: boolean; value: number; target: number };
    wasmInit: { passed: boolean; value: number; target: number };
    apiLatency: { passed: boolean; value: number; target: number };
    cacheHitRatio: { passed: boolean; value: number; target: number };
    overall: { passed: boolean; score: number };
  } {
    const summary = this.getPerformanceSummary();
    const avgLatency = this.metrics.apiLatency.length > 0 
      ? this.metrics.apiLatency.reduce((a, b) => a + b) / this.metrics.apiLatency.length 
      : 0;
    
    return {
      fcp: {
        passed: summary.thresholds.fcpMet,
        value: this.metrics.fcp,
        target: summary.thresholds.fcpTarget
      },
      bundleSize: {
        passed: summary.thresholds.bundleSizeMet,
        value: this.metrics.bundleSize,
        target: summary.thresholds.bundleSizeTarget
      },
      wasmInit: {
        passed: summary.thresholds.wasmInitMet,
        value: this.metrics.wasmInitTime,
        target: summary.thresholds.wasmInitTarget
      },
      apiLatency: {
        passed: summary.thresholds.apiLatencyMet,
        value: avgLatency,
        target: summary.thresholds.apiLatencyTarget
      },
      cacheHitRatio: {
        passed: summary.thresholds.cacheHitRatioMet,
        value: this.metrics.cacheHitRatio,
        target: summary.thresholds.cacheHitRatioTarget
      },
      overall: {
        passed: summary.overall.passed,
        score: summary.overall.score
      }
    };
  }
  
  /**
   * Starts continuous performance monitoring
   */
  startContinuousMonitoring(interval: number = 5000): void {
    setInterval(() => {
      this.measureBundleSize();
      this.calculateCacheHitRatio();
    }, interval);
  }
  
  /**
   * Generates performance report
   */
  generateReport(): string {
    const validation = this.validatePerformanceRequirements();
    const timestamp = new Date().toISOString();
    
    return `
# DataPrism Performance Report
Generated: ${timestamp}

## Performance Metrics
- **First Contentful Paint**: ${validation.fcp.value.toFixed(2)}ms ${validation.fcp.passed ? '✅' : '❌'} (Target: ${validation.fcp.target}ms)
- **Bundle Size**: ${(validation.bundleSize.value / 1024 / 1024).toFixed(2)}MB ${validation.bundleSize.passed ? '✅' : '❌'} (Target: ${(validation.bundleSize.target / 1024 / 1024).toFixed(2)}MB)
- **WASM Init Time**: ${validation.wasmInit.value.toFixed(2)}ms ${validation.wasmInit.passed ? '✅' : '❌'} (Target: ${validation.wasmInit.target}ms)
- **API Latency**: ${validation.apiLatency.value.toFixed(2)}ms ${validation.apiLatency.passed ? '✅' : '❌'} (Target: ${validation.apiLatency.target}ms)
- **Cache Hit Ratio**: ${(validation.cacheHitRatio.value * 100).toFixed(1)}% ${validation.cacheHitRatio.passed ? '✅' : '❌'} (Target: ${(validation.cacheHitRatio.target * 100).toFixed(1)}%)

## Overall Score: ${validation.overall.score.toFixed(1)}% ${validation.overall.passed ? '✅ PASSED' : '❌ FAILED'}
`;
  }
  
  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
  
  /**
   * Sets up performance observers
   */
  private setupPerformanceObservers(): void {
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('PerformanceObserver not supported');
      return;
    }
    
    // Navigation timing observer
    const navigationObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'navigation') {
          console.log(`📊 Navigation: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
        }
      });
    });
    
    navigationObserver.observe({ entryTypes: ['navigation'] });
    this.observers.push(navigationObserver);
    
    // Resource timing observer
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.name.includes('dataprism')) {
          console.log(`📊 Resource: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
        }
      });
    });
    
    resourceObserver.observe({ entryTypes: ['resource'] });
    this.observers.push(resourceObserver);
  }
  
  /**
   * Waits for DataPrism to be ready
   */
  private async waitForDataPrismReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('DataPrism initialization timeout'));
      }, 10000);
      
      const checkReady = () => {
        if (typeof window !== 'undefined' && window.DataPrism) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      
      checkReady();
    });
  }
}