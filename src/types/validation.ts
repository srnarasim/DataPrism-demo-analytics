/**
 * Type definitions for DataPrism validation system
 */

export interface ValidationResult {
  success: boolean;
  results: {
    manifest: AssetValidationResult;
    coreBundle: AssetValidationResult;
    plugins: AssetValidationResult;
    integrity: AssetValidationResult;
  };
  timestamp: string;
}

export interface AssetValidationResult {
  success: boolean;
  url?: string;
  error?: string;
  duration?: number;
  size?: number;
  hash?: string;
}

export interface AssetMetrics {
  url: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  size?: number;
  status: 'loading' | 'success' | 'error';
  error?: string;
}

export interface SecurityResult {
  httpsOnly?: boolean;
  mixedContent?: boolean;
  cspPresent?: boolean;
  requiredDirectives?: boolean;
  sriComplete?: boolean;
  violations: string[];
}

export interface ErrorTestResult {
  success: boolean;
  fallbackType?: string;
  gracefulDegradation?: boolean;
  error?: string;
  expectedError?: boolean;
}

export interface WorkflowResult {
  success: boolean;
  duration?: number;
  rowCount?: number;
  charts?: string[];
  error?: string;
}

export interface PluginValidationResult {
  success: boolean;
  plugins: Record<string, PluginResult>;
  timestamp: string;
}

export interface PluginResult {
  success: boolean;
  plugin: string;
  error?: string;
}

export interface PerformanceMetrics {
  fcp: number;
  bundleSize: number;
  wasmInitTime: number;
  apiLatency: number[];
  cacheHitRatio: number;
}

export interface LighthouseResult {
  performance: number;
  accessibility: number;
  bestPractices: number;
  metrics: Record<string, any>;
}

export interface Plugin {
  name: string;
  version: string;
  initialize: () => Promise<void>;
  isValid: () => boolean;
}

export interface ErrorContext {
  type: string;
  plugin?: string;
  url?: string;
  timestamp: string;
}

export interface ErrorReport {
  message: string;
  stack?: string;
  timestamp: string;
  context: ErrorContext;
  userAgent: string;
  url: string;
}

export interface ErrorReporter {
  report: (error: ErrorReport) => void;
}