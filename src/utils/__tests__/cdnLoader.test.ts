/**
 * CDN Loader Tests
 * Tests the CDN asset loading functionality with mocking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CDNAssetLoader } from '../cdnLoader';

describe('CDNAssetLoader', () => {
  let loader: CDNAssetLoader;
  
  beforeEach(() => {
    loader = new CDNAssetLoader({
      baseUrl: 'https://test.cdn.com',
      version: '1.0.0',
      fallback: { enabled: true, retries: 3, timeout: 5000 }
    });

    // Mock fetch
    global.fetch = vi.fn();
    
    // Mock DOM methods
    global.document.createElement = vi.fn();
    Object.defineProperty(global.document, 'head', {
      value: { appendChild: vi.fn() },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadManifest', () => {
    it('should load and cache manifest successfully', async () => {
      const mockManifest = {
        version: '1.0.0',
        buildHash: 'abc123',
        assets: {
          core: { filename: 'dataprism.umd.js' }
        },
        integrity: {}
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockManifest)
      });

      const manifest = await loader.loadManifest();
      
      expect(manifest).toEqual(mockManifest);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.cdn.com/manifest.json',
        expect.objectContaining({
          cache: 'default',
          credentials: 'omit'
        })
      );
    });

    it('should handle manifest fetch errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(loader.loadManifest()).rejects.toThrow(
        'Failed to load CDN manifest: Manifest fetch failed: 404 Not Found'
      );
    });

    it('should cache manifest between calls', async () => {
      const mockManifest = { version: '1.0.0' };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockManifest)
      });

      // First call
      await loader.loadManifest();
      
      // Second call should use cache
      const result = await loader.loadManifest();
      
      expect(result).toEqual(mockManifest);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCDNStatus', () => {
    it('should return available status when CDN is accessible', async () => {
      const mockManifest = { version: '1.0.0' };
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockManifest)
      });

      const status = await loader.getCDNStatus();
      
      expect(status.available).toBe(true);
      expect(status.version).toBe('1.0.0');
      expect(typeof status.latency).toBe('number');
      expect(status.error).toBeUndefined();
    });

    it('should return unavailable status when CDN fails', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const status = await loader.getCDNStatus();
      
      expect(status.available).toBe(false);
      expect(status.version).toBe('unknown');
      expect(status.error).toBe('Network error');
      expect(typeof status.latency).toBe('number');
    });
  });

  describe('loadCoreBundle', () => {
    it('should load script and wait for global DataPrism', async () => {
      const mockManifest = {
        version: '1.0.0',
        assets: { core: { filename: 'dataprism.umd.js' } },
        integrity: { 'dataprism.umd.js': 'sha384-abc123' }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockManifest)
      });

      const mockScript = {
        onload: null as any,
        onerror: null as any,
        src: '',
        crossOrigin: '',
        integrity: ''
      };

      (global.document.createElement as any).mockReturnValue(mockScript);
      
      // Mock global DataPrism availability
      const mockDataPrism = { version: '1.0.0' };
      Object.defineProperty(global.window, 'DataPrism', {
        value: mockDataPrism,
        configurable: true
      });

      // Simulate script loading
      const loadPromise = loader.loadCoreBundle();
      
      // Trigger onload
      setTimeout(() => {
        if (mockScript.onload) mockScript.onload();
      }, 0);

      const result = await loadPromise;
      
      expect(result).toBe(mockDataPrism);
      expect(mockScript.src).toBe('https://test.cdn.com/dataprism.umd.js');
      expect(mockScript.integrity).toBe('sha384-abc123');
    });

    it('should handle script loading failures with fallback', async () => {
      const mockManifest = {
        version: '1.0.0',
        assets: { core: { filename: 'dataprism.umd.js' } },
        integrity: {}
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockManifest)
      });

      const mockScript = {
        onload: null as any,
        onerror: null as any,
        src: '',
        crossOrigin: '',
        integrity: ''
      };

      (global.document.createElement as any).mockReturnValue(mockScript);

      // Start loading
      const loadPromise = loader.loadCoreBundle();
      
      // Trigger error
      setTimeout(() => {
        if (mockScript.onerror) mockScript.onerror();
      }, 0);

      await expect(loadPromise).rejects.toThrow('Failed to load DataPrism from CDN');
    });
  });
});