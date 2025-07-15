/**
 * DataPrism Plugin Interface Loader
 * 
 * Loads and provides access to the official DataPrism plugin interfaces
 * from the CDN without reimplementing them.
 */

import { useDataPrism } from '@/contexts/DataPrismContext';

// Type definitions for what we expect from DataPrism
export interface DataPrismPluginModule {
  IPlugin: any;
  IDataProcessorPlugin: any;
  IVisualizationPlugin: any;
  IIntegrationPlugin: any;
  IUtilityPlugin: any;
  IPluginManager: any;
  PluginManifest: any;
  PluginContext: any;
  PluginSecurityManager: any;
  PluginEventBus: any;
}

// Cache for plugin interfaces
let pluginInterfacesCache: DataPrismPluginModule | null = null;

/**
 * Get the official DataPrism plugin interfaces from the loaded engine
 */
export const getDataPrismPluginInterfaces = async (): Promise<DataPrismPluginModule> => {
  if (pluginInterfacesCache) {
    return pluginInterfacesCache;
  }

  // Check if DataPrism is available globally
  const globalDataPrism = (window as any).DataPrism;
  if (!globalDataPrism) {
    throw new Error('DataPrism not loaded. Plugin interfaces unavailable.');
  }

  // Extract plugin interfaces from DataPrism
  const pluginInterfaces: DataPrismPluginModule = {
    IPlugin: globalDataPrism.IPlugin || globalDataPrism.plugins?.IPlugin,
    IDataProcessorPlugin: globalDataPrism.IDataProcessorPlugin || globalDataPrism.plugins?.IDataProcessorPlugin,
    IVisualizationPlugin: globalDataPrism.IVisualizationPlugin || globalDataPrism.plugins?.IVisualizationPlugin,
    IIntegrationPlugin: globalDataPrism.IIntegrationPlugin || globalDataPrism.plugins?.IIntegrationPlugin,
    IUtilityPlugin: globalDataPrism.IUtilityPlugin || globalDataPrism.plugins?.IUtilityPlugin,
    IPluginManager: globalDataPrism.IPluginManager || globalDataPrism.plugins?.IPluginManager,
    PluginManifest: globalDataPrism.PluginManifest || globalDataPrism.plugins?.PluginManifest,
    PluginContext: globalDataPrism.PluginContext || globalDataPrism.plugins?.PluginContext,
    PluginSecurityManager: globalDataPrism.PluginSecurityManager || globalDataPrism.plugins?.PluginSecurityManager,
    PluginEventBus: globalDataPrism.PluginEventBus || globalDataPrism.plugins?.PluginEventBus,
  };

  // Validate that we have the interfaces we need
  if (!pluginInterfaces.IPlugin) {
    console.warn('⚠️ DataPrism plugin interfaces not found. Using fallback approach.');
    // If DataPrism doesn't provide plugin interfaces, we'll need to create minimal ones
    return createFallbackPluginInterfaces();
  }

  pluginInterfacesCache = pluginInterfaces;
  return pluginInterfaces;
};

/**
 * Create fallback plugin interfaces if DataPrism doesn't provide them
 */
const createFallbackPluginInterfaces = (): DataPrismPluginModule => {
  console.log('🔄 Creating fallback plugin interfaces...');
  
  // Base Plugin Interface
  const IPlugin = {
    // This will be a base class that plugins can extend
    initialize: async (context: any) => {},
    activate: async () => {},
    deactivate: async () => {},
    dispose: async () => {},
    isValid: () => true,
    getStatus: () => ({ state: 'active', lastUpdate: new Date() }),
  };

  // Data Processor Plugin Interface
  const IDataProcessorPlugin = {
    ...IPlugin,
    processData: async (input: any) => ({ data: [], schema: { columns: [] }, metadata: {} }),
    validateData: async (data: any[]) => ({ valid: true, errors: [], warnings: [] }),
    transformData: async (data: any[], config: any) => data,
    processStream: async (stream: ReadableStream) => stream,
    getBatchSize: () => 1000,
  };

  // Visualization Plugin Interface
  const IVisualizationPlugin = {
    ...IPlugin,
    renderComponent: (props: any) => null,
    getComponentProps: () => ({}),
    getSupportedChartTypes: () => [],
    validateChartConfig: (config: any) => true,
    exportChart: async (format: string) => ({ format, data: new Blob(), filename: 'chart' }),
    getSupportedExports: () => ['png', 'svg', 'csv'],
  };

  // Integration Plugin Interface
  const IIntegrationPlugin = {
    ...IPlugin,
    connect: async (config: any) => ({ id: 'conn1', type: 'test', status: 'connected' }),
    disconnect: async () => {},
    executeQuery: async (query: any) => ({ data: [], metadata: { rowCount: 0, executionTime: 0, columns: [] } }),
    loadData: async (source: any) => ({ rowCount: 0, columns: [], duration: 0 }),
    subscribeToUpdates: (callback: any) => ({ unsubscribe: () => {}, isActive: () => true }),
  };

  // Utility Plugin Interface
  const IUtilityPlugin = {
    ...IPlugin,
    executeFunction: async (name: string, args: any[]) => null,
    getAvailableFunctions: () => [],
    getSystemInfo: () => ({ platform: 'web', version: '1.0.0', memory: 0, cpuCount: 1, uptime: 0 }),
    performMaintenance: async () => ({ success: true, message: 'No maintenance needed', duration: 0, actionsPerformed: [] }),
  };

  // Plugin Manager Interface
  const IPluginManager = {
    registerPlugin: async (plugin: any) => {},
    unregisterPlugin: async (id: string) => {},
    loadPlugin: async (manifest: any) => null,
    discoverPlugins: async () => [],
    getPlugin: async (id: string) => null,
    getPluginsByType: async (type: string) => [],
    getPluginsByCapability: async (capability: string) => [],
    getAllPlugins: async () => [],
    activatePlugin: async (id: string) => {},
    deactivatePlugin: async (id: string) => {},
    updatePlugin: async (id: string, version: string) => {},
    removePlugin: async (id: string) => {},
    getEventBus: () => ({ emit: () => {}, on: () => {}, off: () => {}, once: () => {} }),
    executePluginMethod: async (pluginId: string, method: string, args: any[]) => null,
  };

  return {
    IPlugin,
    IDataProcessorPlugin,
    IVisualizationPlugin,
    IIntegrationPlugin,
    IUtilityPlugin,
    IPluginManager,
    PluginManifest: {},
    PluginContext: {},
    PluginSecurityManager: {},
    PluginEventBus: {},
  };
};

/**
 * Hook to access DataPrism plugin interfaces
 */
export const useDataPrismPluginInterfaces = () => {
  const { engine, isInitialized } = useDataPrism();

  const getInterfaces = async () => {
    if (!isInitialized || !engine) {
      throw new Error('DataPrism engine not initialized');
    }
    return await getDataPrismPluginInterfaces();
  };

  return { getInterfaces };
};

/**
 * Check if DataPrism provides plugin interfaces
 */
export const hasDataPrismPluginSupport = (): boolean => {
  const globalDataPrism = (window as any).DataPrism;
  return !!(globalDataPrism && (globalDataPrism.IPlugin || globalDataPrism.plugins?.IPlugin));
};

/**
 * Get the plugin manager instance from DataPrism
 */
export const getDataPrismPluginManager = async (): Promise<any> => {
  const interfaces = await getDataPrismPluginInterfaces();
  const globalDataPrism = (window as any).DataPrism;
  
  // Try to get plugin manager from DataPrism
  if (globalDataPrism && globalDataPrism.pluginManager) {
    return globalDataPrism.pluginManager;
  }

  // Create a new plugin manager using the interface
  if (interfaces.IPluginManager) {
    return new interfaces.IPluginManager();
  }

  throw new Error('Plugin manager not available');
};