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
    retries: 3,
    timeout: 10000
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

// CDN Asset URLs
export const getCDNAssetUrls = (config: CDNConfig = getCDNConfig()) => {
  const baseUrl = config.baseUrl;
  
  return {
    manifest: `${baseUrl}/manifest.json`,
    coreBundle: `${baseUrl}/dataprism.umd.js`,
    coreESModule: `${baseUrl}/dataprism.min.js`,
    wasmAssets: `${baseUrl}/assets/`,
    plugins: `${baseUrl}/plugins/manifest.json`
  };
};

// Performance configuration
export const CDN_PERFORMANCE_CONFIG = {
  maxLoadTime: 5000, // 5 seconds as specified in PRP
  maxRetries: 3,
  retryDelay: 1000,
  cacheDuration: 3600000, // 1 hour
} as const;