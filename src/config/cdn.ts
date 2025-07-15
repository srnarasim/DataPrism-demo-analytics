/**
 * CDN Configuration for DataPrism Demo Analytics
 * Handles version-controlled CDN consumption with fallback strategies
 */

export interface CDNConfig {
  baseUrl: string;
  version: string;
  integrity?: {
    core?: string;
    orchestration?: string;
    plugins?: Record<string, string>;
  };
  fallback?: {
    enabled: boolean;
    retries: number;
    timeout: number;
  };
}

export const defaultCDNConfig: CDNConfig = {
  baseUrl: 'https://srnarasim.github.io/DataPrism',
  version: 'latest',
  fallback: {
    enabled: true,
    retries: 5, // Increased retries for enhanced dependency management
    timeout: 30000 // Extended timeout for enhanced dependency management
  }
};

// Environment-based configuration
export const getCDNConfig = (): CDNConfig => {
  return {
    ...defaultCDNConfig,
    baseUrl: import.meta.env.VITE_DATAPRISM_CDN_URL || defaultCDNConfig.baseUrl,
    version: import.meta.env.VITE_DATAPRISM_VERSION || defaultCDNConfig.version,
  };
};

// CDN Asset URLs for Hybrid Architecture
export const getCDNAssetUrls = (config: CDNConfig = getCDNConfig()) => {
  const baseUrl = config.baseUrl;
  
  return {
    manifest: `${baseUrl}/cdn/manifest.json`,
    coreBundle: `${baseUrl}/cdn/dataprism.umd.js`, // ~29KB with hybrid loading
    coreESModule: `${baseUrl}/cdn/dataprism.min.js`, // ~36KB with hybrid loading
    wasmAssets: `${baseUrl}/cdn/assets/`, // Auto-detects CDN base URL
    plugins: `${baseUrl}/cdn/plugins/manifest.json`,
    workers: `${baseUrl}/cdn/workers/` // DuckDB workers (~3MB)
  };
};

// Performance configuration for Hybrid Architecture with Enhanced Dependency Management
export const CDN_PERFORMANCE_CONFIG = {
  maxLoadTime: 8000, // Increased for hybrid loading with workers
  maxRetries: 5, // Increased retries for enhanced dependency management
  retryDelay: 1000,
  cacheDuration: 3600000, // 1 hour
  hybridLoadingTimeout: 30000, // Extended timeout for enhanced dependency management
  workerLoadTimeout: 10000, // Timeout for DuckDB worker loading
  dependencyTimeout: 30000, // Timeout for dependency readiness checking
  progressTracking: true, // Enable progress tracking for enhanced dependency management
} as const;