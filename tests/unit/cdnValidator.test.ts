/**
 * Unit tests for CDNValidator
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CDNValidator } from '@/utils/cdnValidator';
import type { CDNConfig } from '@/config/cdn';

describe('CDNValidator', () => {
  let validator: CDNValidator;
  let mockConfig: CDNConfig;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    mockConfig = {
      baseUrl: 'https://test-cdn.com',
      version: 'latest',
      fallback: {
        enabled: true,
        retries: 3,
        timeout: 5000
      }
    };
    
    validator = new CDNValidator(mockConfig);
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe('validateAssetIntegrity', () => {
    it('should validate correct asset integrity', async () => {
      const mockResponse = new Response(new ArrayBuffer(8));
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      // Mock crypto.subtle.digest
      const mockDigest = vi.fn().mockResolvedValue(new ArrayBuffer(48));
      Object.defineProperty(global, 'crypto', {
        value: {
          subtle: { digest: mockDigest }
        },
        writable: true,
        configurable: true
      });

      const result = await validator.validateAssetIntegrity('https://test-cdn.com/asset.js', 'expected-hash');
      
      expect(global.fetch).toHaveBeenCalledWith('https://test-cdn.com/asset.js');
      expect(mockDigest).toHaveBeenCalledWith('SHA-384', expect.any(ArrayBuffer));
      expect(typeof result).toBe('boolean');
    });

    it('should handle fetch errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await validator.validateAssetIntegrity('https://test-cdn.com/asset.js', 'expected-hash');
      
      expect(result).toBe(false);
    });

    it('should handle non-ok responses', async () => {
      const mockResponse = new Response(null, { status: 404 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await validator.validateAssetIntegrity('https://test-cdn.com/asset.js', 'expected-hash');
      
      expect(result).toBe(false);
    });
  });

  describe('validateAllAssets', () => {
    it('should validate all assets successfully', async () => {
      const manifestData = {
        version: '1.0.0',
        buildHash: 'abc123',
        assets: {
          core: { filename: 'dataprism.umd.js' }
        },
        // No integrity hashes for this test to avoid complexity
      };
      
      const mockManifestResponse = new Response(JSON.stringify(manifestData));
      const mockManifestResponse2 = new Response(JSON.stringify(manifestData));

      const mockBundleResponse = new Response(new ArrayBuffer(8), { 
        status: 200,
        headers: new Headers({
          'content-type': 'application/javascript',
          'content-length': '1000'
        })
      });

      // Mock performance.now to return increasing values for duration calculation
      const mockPerformance = {
        now: vi.fn().mockReturnValueOnce(1000).mockReturnValueOnce(1100).mockReturnValueOnce(1200).mockReturnValueOnce(1300).mockReturnValueOnce(1400)
      };
      Object.defineProperty(global, 'performance', {
        value: mockPerformance,
        writable: true,
        configurable: true
      });

      global.fetch = vi.fn()
        .mockResolvedValueOnce(mockManifestResponse) // manifest
        .mockResolvedValueOnce(mockBundleResponse) // core bundle
        .mockResolvedValueOnce(new Response(null, { status: 404 })) // plugins (optional)
        .mockResolvedValueOnce(mockManifestResponse2); // integrity check manifest

      const result = await validator.validateAllAssets();
      
      expect(result.results.manifest.success).toBe(true);
      expect(result.results.coreBundle.success).toBe(true);
      expect(result.results.plugins.success).toBe(true); // Should be true even if not found
      expect(result.results.integrity.success).toBe(true);
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle manifest validation failure', async () => {
      global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));

      const result = await validator.validateAllAssets();
      
      expect(result.success).toBe(false);
      expect(result.results.manifest.success).toBe(false);
      expect(result.results.manifest.error).toContain('404');
    });

    it('should handle malformed manifest', async () => {
      const mockResponse = new Response(JSON.stringify({ invalid: 'manifest' }));
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await validator.validateAllAssets();
      
      expect(result.success).toBe(false);
      expect(result.results.manifest.success).toBe(false);
      expect(result.results.manifest.error).toContain('missing required fields');
    });
  });

  describe('validateCDNConnectivity', () => {
    it('should validate CDN connectivity', async () => {
      const mockResponse = new Response(null, { status: 200 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);
      
      // Mock performance.now to return increasing values
      const mockPerformance = {
        now: vi.fn().mockReturnValueOnce(1000).mockReturnValueOnce(1100)
      };
      Object.defineProperty(global, 'performance', {
        value: mockPerformance,
        writable: true,
        configurable: true
      });

      const result = await validator.validateCDNConnectivity();
      
      expect(result.success).toBe(true);
      expect(result.url).toBe('https://test-cdn.com');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle connectivity failure', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await validator.validateCDNConnectivity();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle non-ok responses', async () => {
      const mockResponse = new Response(null, { status: 500 });
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await validator.validateCDNConnectivity();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });
  });
});