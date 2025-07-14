/**
 * CDN Asset Validator for DataPrism Demo Analytics
 * Validates CDN assets and integrity verification
 */

import { CDNConfig, getCDNAssetUrls } from '@/config/cdn';
import { ValidationResult, AssetValidationResult } from '@/types/validation';

export class CDNValidator {
  private config: CDNConfig;
  
  constructor(config: CDNConfig) {
    this.config = config;
  }
  
  /**
   * Validates asset integrity using SHA-384 hash
   */
  async validateAssetIntegrity(url: string, expectedHash: string): Promise<boolean> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch asset: ${response.status} ${response.statusText}`);
      }
      
      const content = await response.arrayBuffer();
      const hash = await this.calculateSHA384(content);
      return hash === expectedHash;
    } catch (error) {
      console.error('Asset integrity validation failed:', error);
      return false;
    }
  }
  
  /**
   * Validates all CDN assets comprehensively
   */
  async validateAllAssets(): Promise<ValidationResult> {
    const startTime = performance.now();
    
    const results = {
      manifest: await this.validateManifest(),
      coreBundle: await this.validateCoreBundle(),
      plugins: await this.validatePlugins(),
      integrity: await this.validateIntegrity()
    };
    
    const duration = performance.now() - startTime;
    
    return {
      success: Object.values(results).every(r => r.success),
      results,
      timestamp: new Date().toISOString(),
      duration
    } as ValidationResult & { duration: number };
  }
  
  /**
   * Validates CDN manifest availability and structure
   */
  private async validateManifest(): Promise<AssetValidationResult> {
    const urls = getCDNAssetUrls(this.config);
    const startTime = performance.now();
    
    try {
      const response = await fetch(urls.manifest, {
        cache: 'no-cache',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`Manifest fetch failed: ${response.status} ${response.statusText}`);
      }
      
      const manifest = await response.json();
      const duration = performance.now() - startTime;
      
      // Validate manifest structure
      const requiredFields = ['version', 'buildHash', 'assets'];
      const missingFields = requiredFields.filter(field => !manifest[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Manifest missing required fields: ${missingFields.join(', ')}`);
      }
      
      return {
        success: true,
        url: urls.manifest,
        duration,
        size: JSON.stringify(manifest).length
      };
    } catch (error) {
      return {
        success: false,
        url: urls.manifest,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime
      };
    }
  }
  
  /**
   * Validates core bundle availability and basic structure
   */
  private async validateCoreBundle(): Promise<AssetValidationResult> {
    const urls = getCDNAssetUrls(this.config);
    const startTime = performance.now();
    
    try {
      const response = await fetch(urls.coreBundle, {
        method: 'HEAD',
        cache: 'no-cache',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`Core bundle fetch failed: ${response.status} ${response.statusText}`);
      }
      
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      const duration = performance.now() - startTime;
      
      // Validate content type
      if (contentType && !contentType.includes('javascript')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }
      
      return {
        success: true,
        url: urls.coreBundle,
        duration,
        size: contentLength ? parseInt(contentLength) : undefined
      };
    } catch (error) {
      return {
        success: false,
        url: urls.coreBundle,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime
      };
    }
  }
  
  /**
   * Validates plugin manifest and availability
   */
  private async validatePlugins(): Promise<AssetValidationResult> {
    const urls = getCDNAssetUrls(this.config);
    const startTime = performance.now();
    
    try {
      const response = await fetch(urls.plugins, {
        cache: 'no-cache',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        // Plugin manifest might not exist yet - this is not critical
        return {
          success: true,
          url: urls.plugins,
          error: 'Plugin manifest not available (optional)',
          duration: performance.now() - startTime
        };
      }
      
      const pluginManifest = await response.json();
      const duration = performance.now() - startTime;
      
      return {
        success: true,
        url: urls.plugins,
        duration,
        size: JSON.stringify(pluginManifest).length
      };
    } catch (error) {
      // Plugin validation is optional for now
      return {
        success: true,
        url: urls.plugins,
        error: `Plugin validation skipped: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: performance.now() - startTime
      };
    }
  }
  
  /**
   * Validates asset integrity against manifest hashes
   */
  private async validateIntegrity(): Promise<AssetValidationResult> {
    const startTime = performance.now();
    
    try {
      // First get the manifest to check for integrity hashes
      const urls = getCDNAssetUrls(this.config);
      const manifestResponse = await fetch(urls.manifest);
      
      if (!manifestResponse.ok) {
        throw new Error('Cannot validate integrity without manifest');
      }
      
      const manifest = await manifestResponse.json();
      
      // Check if integrity information is available
      if (!manifest.integrity) {
        return {
          success: true,
          error: 'No integrity hashes available in manifest',
          duration: performance.now() - startTime
        };
      }
      
      // Validate core bundle integrity if hash is available
      const coreHash = manifest.integrity['dataprism.umd.js'];
      if (coreHash) {
        const isValid = await this.validateAssetIntegrity(urls.coreBundle, coreHash);
        if (!isValid) {
          throw new Error('Core bundle integrity validation failed');
        }
      }
      
      return {
        success: true,
        duration: performance.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime
      };
    }
  }
  
  /**
   * Calculates SHA-384 hash of content
   */
  private async calculateSHA384(buffer: ArrayBuffer): Promise<string> {
    try {
      const hash = await crypto.subtle.digest('SHA-384', buffer);
      return btoa(String.fromCharCode(...new Uint8Array(hash)));
    } catch (error) {
      console.error('Hash calculation failed:', error);
      throw error;
    }
  }
  
  /**
   * Validates CDN connectivity and basic availability
   */
  async validateCDNConnectivity(): Promise<AssetValidationResult> {
    const startTime = performance.now();
    
    try {
      // Test basic connectivity to CDN
      const testUrl = new URL(this.config.baseUrl);
      const response = await fetch(testUrl.origin, {
        method: 'HEAD',
        cache: 'no-cache',
        credentials: 'omit'
      });
      
      return {
        success: response.ok,
        url: testUrl.origin,
        duration: performance.now() - startTime,
        error: response.ok ? undefined : `CDN connectivity failed: ${response.status}`
      };
    } catch (error) {
      return {
        success: false,
        url: this.config.baseUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - startTime
      };
    }
  }
}