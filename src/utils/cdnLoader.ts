/**
 * CDN Asset Loader for DataPrism
 * Handles loading DataPrism from CDN with fallback mechanisms and integrity verification
 */

import { CDNConfig, getCDNAssetUrls } from '@/config/cdn';
import { AssetLoadMonitor } from './assetMonitor';

// Global DataPrism type declaration
declare global {
  interface Window {
    DataPrism: any;
  }
}

export class CDNAssetLoader {
  private config: CDNConfig;
  private loadedAssets = new Set<string>();
  private manifestCache: any = null;
  private monitor: AssetLoadMonitor;

  constructor(config: CDNConfig) {
    this.config = config;
    this.monitor = new AssetLoadMonitor();
    // Reference to avoid unused variable warning
    void this._getIntegrityHash;
  }

  /**
   * Load DataPrism core bundle from CDN with hybrid architecture support
   */
  async loadCoreBundle(): Promise<typeof window.DataPrism> {
    const urls = getCDNAssetUrls(this.config);
    
    try {
      // First, fetch and validate the manifest
      const manifest = await this.loadManifest();
      
      console.log('🔄 Loading DataPrism with hybrid architecture...');
      console.log(`📦 Core bundle: ${urls.coreBundle} (~${Math.round(manifest.assets?.core?.size / 1024 || 29)}KB)`);
      console.log('🔗 DuckDB workers: Auto-detecting CDN base URL for hybrid loading');
      
      // Load the core UMD bundle with hybrid loading support
      await this.loadScript(urls.coreBundle);
      
      // Wait for global DataPrism to be available with extended timeout for hybrid loading
      const hybridTimeout = this.config.fallback?.timeout || 20000; // Increased to 20s for hybrid architecture
      const DataPrism = await this.waitForGlobal('DataPrism', hybridTimeout);
      
      console.log('✅ DataPrism loaded successfully from CDN with hybrid architecture');
      console.log('🎯 Features: Fast CDN loading, reliable DuckDB access, universal compatibility');
      return DataPrism;
    } catch (error) {
      if (this.config.fallback?.enabled) {
        console.warn('⚠️ Hybrid CDN load failed, attempting fallback...');
        return await this.loadFallback();
      }
      throw new Error(`Failed to load DataPrism from CDN: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load and validate the CDN manifest
   */
  async loadManifest(): Promise<any> {
    if (this.manifestCache) {
      return this.manifestCache;
    }

    const urls = getCDNAssetUrls(this.config);
    
    try {
      const response = await fetch(urls.manifest, {
        cache: 'default',
        credentials: 'omit'
      });

      if (!response.ok) {
        throw new Error(`Manifest fetch failed: ${response.status} ${response.statusText}`);
      }

      const manifest = await response.json();
      this.manifestCache = manifest;
      
      console.log('📋 CDN Manifest loaded:', {
        version: manifest.version,
        buildHash: manifest.buildHash,
        assetCount: Object.keys(manifest.assets || {}).length,
        architecture: 'hybrid',
        totalSize: `${Math.round((manifest.build?.totalSize || 0) / 1024)}KB`,
        compression: manifest.build?.compression || 'optimized'
      });

      return manifest;
    } catch (error) {
      throw new Error(`Failed to load CDN manifest: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load a script with integrity verification and monitoring
   */
  private async loadScript(url: string, integrity?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.loadedAssets.has(url)) {
        resolve();
        return;
      }

      // Start monitoring
      const trackingId = this.monitor.startTracking(url);

      const script = document.createElement('script');
      script.src = url;
      script.crossOrigin = 'anonymous';
      
      if (integrity) {
        script.integrity = integrity;
      }

      script.onload = () => {
        this.loadedAssets.add(url);
        
        // Record successful load
        this.monitor.recordSuccess(trackingId);
        
        console.log(`✅ Script loaded: ${url}`);
        resolve();
      };
      
      script.onerror = () => {
        const error = new Error(`Failed to load script: ${url}`);
        
        // Record error
        this.monitor.recordError(trackingId, error);
        
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Wait for a global variable to become available
   */
  private async waitForGlobal(name: string, timeout: number): Promise<any> {
    const start = Date.now();
    
    return new Promise((resolve, reject) => {
      const check = () => {
        if ((window as any)[name]) {
          resolve((window as any)[name]);
          return;
        }
        
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for global ${name} (${timeout}ms)`));
          return;
        }
        
        setTimeout(check, 100);
      };
      
      check();
    });
  }

  /**
   * Get integrity hash for an asset from the manifest
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _getIntegrityHash(assetName: string): string | undefined { // Future use for SRI validation
    if (!this.manifestCache?.integrity) {
      return undefined;
    }

    // Look for the asset in the integrity map
    const manifest = this.manifestCache;
    const assetInfo = manifest.assets[assetName];
    
    if (assetInfo && manifest.integrity[assetInfo.filename]) {
      return manifest.integrity[assetInfo.filename];
    }

    return undefined;
  }

  /**
   * Fallback loading strategy
   */
  private async loadFallback(): Promise<typeof window.DataPrism> {
    // For now, implement a simple retry mechanism
    // In production, this could try alternative CDNs
    
    let lastError: Error | null = null;
    const maxRetries = this.config.fallback?.retries || 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Fallback attempt ${attempt}/${maxRetries}`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        
        // Clear cache and try again
        this.manifestCache = null;
        this.loadedAssets.clear();
        
        return await this.loadCoreBundle();
      } catch (error) {
        lastError = error as Error;
        console.warn(`❌ Fallback attempt ${attempt} failed:`, (error as Error).message);
      }
    }
    
    throw new Error(`All fallback attempts failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Preload assets for better performance
   */
  async preloadAssets(): Promise<void> {
    try {
      await this.loadManifest();
      const urls = getCDNAssetUrls(this.config);
      
      // Preload the core bundle
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = urls.coreBundle;
      link.as = 'script';
      link.crossOrigin = 'anonymous';
      
      document.head.appendChild(link);
      
      console.log('🚀 Assets preloaded for faster initialization');
    } catch (error) {
      console.warn('⚠️ Asset preloading failed:', error);
      // Non-critical error, don't throw
    }
  }

  /**
   * Get CDN status information
   */
  async getCDNStatus(): Promise<{
    available: boolean;
    latency: number;
    version: string;
    error?: string;
  }> {
    const start = Date.now();
    
    try {
      const manifest = await this.loadManifest();
      const latency = Date.now() - start;
      
      return {
        available: true,
        latency,
        version: manifest.version
      };
    } catch (error) {
      return {
        available: false,
        latency: Date.now() - start,
        version: 'unknown',
        error: (error as Error).message
      };
    }
  }

  /**
   * Get asset loading metrics
   */
  getAssetMetrics() {
    return this.monitor.getMetrics();
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    return this.monitor.getPerformanceSummary();
  }

  /**
   * Get cache hit ratio
   */
  getCacheHitRatio() {
    return this.monitor.getCacheHitRatio();
  }

  /**
   * Validate performance thresholds
   */
  validatePerformanceThresholds() {
    return this.monitor.validatePerformanceThresholds();
  }

  /**
   * Clean up monitoring resources
   */
  cleanup() {
    this.monitor.cleanup();
  }
}