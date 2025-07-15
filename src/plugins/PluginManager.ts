/**
 * Analytics Plugin Manager
 * 
 * Implements the DataPrism Plugin Manager interface to manage plugins
 * for the analytics application. Uses official DataPrism plugin interfaces.
 */

import { getDataPrismPluginInterfaces, getDataPrismPluginManager } from '@/utils/pluginInterfaces';

export class AnalyticsPluginManager {
  private plugins: Map<string, any> = new Map();
  private pluginStates: Map<string, string> = new Map();
  private eventBus: any;
  private securityManager: any;
  private dataPrismManager: any;
  private interfaces: any;

  constructor() {
    this.eventBus = this.createEventBus();
    this.securityManager = this.createSecurityManager();
  }

  /**
   * Initialize the plugin manager with DataPrism plugin interfaces
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing Analytics Plugin Manager...');
      
      // Get the official DataPrism plugin interfaces
      this.interfaces = await getDataPrismPluginInterfaces();
      
      // Try to get DataPrism's plugin manager
      try {
        this.dataPrismManager = await getDataPrismPluginManager();
        console.log('✅ Using DataPrism plugin manager');
      } catch (error) {
        console.warn('⚠️ DataPrism plugin manager not available, using fallback');
        this.dataPrismManager = null;
      }
      
      console.log('✅ Analytics Plugin Manager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Analytics Plugin Manager:', error);
      throw error;
    }
  }

  /**
   * Register a plugin with the manager
   */
  async registerPlugin(plugin: any): Promise<void> {
    try {
      console.log(`🔄 Registering plugin: ${plugin.id}`);
      
      // Validate plugin interface
      if (!this.validatePlugin(plugin)) {
        throw new Error(`Plugin ${plugin.id} does not implement required interface`);
      }

      // Register with DataPrism plugin manager if available
      if (this.dataPrismManager && this.dataPrismManager.registerPlugin) {
        await this.dataPrismManager.registerPlugin(plugin);
      }

      // Store plugin locally
      this.plugins.set(plugin.id, plugin);
      this.pluginStates.set(plugin.id, 'registered');
      
      // Initialize plugin context
      const context = await this.createPluginContext(plugin);
      await plugin.initialize(context);
      
      this.pluginStates.set(plugin.id, 'initialized');
      this.eventBus.emit('plugin:registered', { pluginId: plugin.id, plugin });
      
      console.log(`✅ Plugin registered: ${plugin.id}`);
    } catch (error) {
      console.error(`❌ Failed to register plugin ${plugin.id}:`, error);
      throw error;
    }
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(id: string): Promise<void> {
    try {
      console.log(`🔄 Unregistering plugin: ${id}`);
      
      const plugin = this.plugins.get(id);
      if (!plugin) {
        throw new Error(`Plugin ${id} not found`);
      }

      // Deactivate if active
      if (this.pluginStates.get(id) === 'active') {
        await this.deactivatePlugin(id);
      }

      // Dispose plugin
      if (plugin.dispose) {
        await plugin.dispose();
      }

      // Unregister from DataPrism plugin manager if available
      if (this.dataPrismManager && this.dataPrismManager.unregisterPlugin) {
        await this.dataPrismManager.unregisterPlugin(id);
      }

      // Remove from local storage
      this.plugins.delete(id);
      this.pluginStates.delete(id);
      
      this.eventBus.emit('plugin:unregistered', { pluginId: id });
      console.log(`✅ Plugin unregistered: ${id}`);
    } catch (error) {
      console.error(`❌ Failed to unregister plugin ${id}:`, error);
      throw error;
    }
  }

  /**
   * Load a plugin from manifest
   */
  async loadPlugin(manifest: any): Promise<any> {
    try {
      console.log(`🔄 Loading plugin from manifest: ${manifest.id}`);
      
      // Use DataPrism plugin manager if available
      if (this.dataPrismManager && this.dataPrismManager.loadPlugin) {
        const plugin = await this.dataPrismManager.loadPlugin(manifest);
        if (plugin) {
          await this.registerPlugin(plugin);
          return plugin;
        }
      }

      // Fallback: Load plugin from URL
      const plugin = await this.loadPluginFromUrl(manifest.url);
      
      // Validate manifest matches plugin
      if (plugin.id !== manifest.id) {
        throw new Error(`Plugin ID mismatch: expected ${manifest.id}, got ${plugin.id}`);
      }

      await this.registerPlugin(plugin);
      return plugin;
    } catch (error) {
      console.error(`❌ Failed to load plugin ${manifest.id}:`, error);
      throw error;
    }
  }

  /**
   * Discover available plugins
   */
  async discoverPlugins(): Promise<any[]> {
    try {
      console.log('🔄 Discovering plugins...');
      
      // Use DataPrism plugin manager if available
      if (this.dataPrismManager && this.dataPrismManager.discoverPlugins) {
        return await this.dataPrismManager.discoverPlugins();
      }

      // Fallback: Return built-in plugin manifests
      return this.getBuiltInPluginManifests();
    } catch (error) {
      console.error('❌ Failed to discover plugins:', error);
      return [];
    }
  }

  /**
   * Get a specific plugin
   */
  async getPlugin(id: string): Promise<any | null> {
    return this.plugins.get(id) || null;
  }

  /**
   * Get plugins by type
   */
  async getPluginsByType(type: string): Promise<any[]> {
    const plugins: any[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.type === type) {
        plugins.push(plugin);
      }
    }
    return plugins;
  }

  /**
   * Get plugins by capability
   */
  async getPluginsByCapability(capability: string): Promise<any[]> {
    const plugins: any[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.capabilities && plugin.capabilities.includes(capability)) {
        plugins.push(plugin);
      }
    }
    return plugins;
  }

  /**
   * Get all plugins
   */
  async getAllPlugins(): Promise<any[]> {
    return Array.from(this.plugins.values());
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(id: string): Promise<void> {
    try {
      console.log(`🔄 Activating plugin: ${id}`);
      
      const plugin = this.plugins.get(id);
      if (!plugin) {
        throw new Error(`Plugin ${id} not found`);
      }

      if (this.pluginStates.get(id) === 'active') {
        console.log(`⚠️ Plugin ${id} already active`);
        return;
      }

      // Activate plugin
      if (plugin.activate) {
        await plugin.activate();
      }

      this.pluginStates.set(id, 'active');
      this.eventBus.emit('plugin:activated', { pluginId: id, plugin });
      
      console.log(`✅ Plugin activated: ${id}`);
    } catch (error) {
      console.error(`❌ Failed to activate plugin ${id}:`, error);
      this.pluginStates.set(id, 'error');
      throw error;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(id: string): Promise<void> {
    try {
      console.log(`🔄 Deactivating plugin: ${id}`);
      
      const plugin = this.plugins.get(id);
      if (!plugin) {
        throw new Error(`Plugin ${id} not found`);
      }

      if (this.pluginStates.get(id) !== 'active') {
        console.log(`⚠️ Plugin ${id} not active`);
        return;
      }

      // Deactivate plugin
      if (plugin.deactivate) {
        await plugin.deactivate();
      }

      this.pluginStates.set(id, 'inactive');
      this.eventBus.emit('plugin:deactivated', { pluginId: id, plugin });
      
      console.log(`✅ Plugin deactivated: ${id}`);
    } catch (error) {
      console.error(`❌ Failed to deactivate plugin ${id}:`, error);
      this.pluginStates.set(id, 'error');
      throw error;
    }
  }

  /**
   * Update a plugin
   */
  async updatePlugin(id: string, version: string): Promise<void> {
    // This would typically involve downloading new plugin version
    console.log(`🔄 Updating plugin ${id} to version ${version}`);
    throw new Error('Plugin updates not yet implemented');
  }

  /**
   * Remove a plugin
   */
  async removePlugin(id: string): Promise<void> {
    await this.unregisterPlugin(id);
  }

  /**
   * Get event bus
   */
  getEventBus(): any {
    return this.eventBus;
  }

  /**
   * Execute plugin method
   */
  async executePluginMethod(pluginId: string, method: string, args: any[]): Promise<any> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (typeof plugin[method] !== 'function') {
      throw new Error(`Method ${method} not found on plugin ${pluginId}`);
    }

    return await plugin[method](...args);
  }

  /**
   * Get plugin status
   */
  getPluginStatus(id: string): string {
    return this.pluginStates.get(id) || 'unknown';
  }

  /**
   * Get all plugin statuses
   */
  getAllPluginStatuses(): Map<string, string> {
    return new Map(this.pluginStates);
  }

  // Private helper methods

  private validatePlugin(plugin: any): boolean {
    // Check required properties
    if (!plugin.id || !plugin.name || !plugin.version || !plugin.type) {
      return false;
    }

    // Check required methods
    if (typeof plugin.initialize !== 'function' || typeof plugin.isValid !== 'function') {
      return false;
    }

    return true;
  }

  private async createPluginContext(plugin: any): Promise<any> {
    const globalDataPrism = (window as any).DataPrism;
    
    return {
      dataprism: globalDataPrism,
      eventBus: this.eventBus,
      securityManager: this.securityManager,
      config: {},
      logger: {
        debug: (msg: string, data?: any) => console.debug(`[${plugin.id}] ${msg}`, data),
        info: (msg: string, data?: any) => console.info(`[${plugin.id}] ${msg}`, data),
        warn: (msg: string, data?: any) => console.warn(`[${plugin.id}] ${msg}`, data),
        error: (msg: string, data?: any) => console.error(`[${plugin.id}] ${msg}`, data),
      },
    };
  }

  private createEventBus(): any {
    const listeners = new Map<string, ((data: any) => void)[]>();

    return {
      emit: (event: string, data: any) => {
        const eventListeners = listeners.get(event) || [];
        eventListeners.forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            console.error(`Event listener error for ${event}:`, error);
          }
        });
      },

      on: (event: string, handler: (data: any) => void) => {
        if (!listeners.has(event)) {
          listeners.set(event, []);
        }
        listeners.get(event)!.push(handler);
      },

      off: (event: string, handler: (data: any) => void) => {
        const eventListeners = listeners.get(event);
        if (eventListeners) {
          const index = eventListeners.indexOf(handler);
          if (index > -1) {
            eventListeners.splice(index, 1);
          }
        }
      },

      once: (event: string, handler: (data: any) => void) => {
        const onceHandler = (data: any) => {
          handler(data);
          this.off(event, onceHandler);
        };
        this.on(event, onceHandler);
      },
    };
  }

  private createSecurityManager(): any {
    const capabilities = new Map<string, string[]>();
    const quotas = new Map<string, any>();

    return {
      grantCapability: (pluginId: string, capability: string) => {
        if (!capabilities.has(pluginId)) {
          capabilities.set(pluginId, []);
        }
        capabilities.get(pluginId)!.push(capability);
      },

      revokeCapability: (pluginId: string, capability: string) => {
        const pluginCapabilities = capabilities.get(pluginId);
        if (pluginCapabilities) {
          const index = pluginCapabilities.indexOf(capability);
          if (index > -1) {
            pluginCapabilities.splice(index, 1);
          }
        }
      },

      checkCapability: (pluginId: string, capability: string) => {
        const pluginCapabilities = capabilities.get(pluginId);
        return pluginCapabilities ? pluginCapabilities.includes(capability) : false;
      },

      setResourceQuota: (pluginId: string, quota: any) => {
        quotas.set(pluginId, quota);
      },

      monitorResourceUsage: (pluginId: string) => {
        // Return mock resource usage for now
        return {
          memory: 10, // MB
          cpu: 1, // %
          networkRequests: 0,
          diskSpace: 0,
        };
      },

      verifyPluginSignature: async (plugin: any) => {
        // For now, always return true
        // In production, this would verify cryptographic signatures
        return true;
      },

      validatePluginCode: async (code: string) => {
        // For now, always return valid
        // In production, this would perform static analysis
        return {
          valid: true,
          errors: [],
          warnings: [],
        };
      },
    };
  }

  private async loadPluginFromUrl(url: string): Promise<any> {
    // This would load a plugin from a URL
    // For now, throw an error as this is complex to implement
    throw new Error(`Plugin loading from URL not yet implemented: ${url}`);
  }

  private getBuiltInPluginManifests(): any[] {
    return [
      {
        id: 'csv-processor',
        name: 'CSV File Processor',
        version: '2.0.0',
        description: 'Process CSV files with advanced validation and schema detection',
        type: 'data-processor',
        capabilities: ['file-upload', 'data-validation', 'schema-detection'],
        url: '/plugins/csv-processor.js',
        metadata: {
          author: 'DataPrism Team',
          license: 'MIT',
          tags: ['csv', 'data-processing', 'validation'],
        },
      },
      {
        id: 'chartjs-renderer',
        name: 'Chart.js Visualization Plugin',
        version: '2.0.0',
        description: 'Render charts using Chart.js library',
        type: 'visualization',
        capabilities: ['bar-charts', 'line-charts', 'pie-charts', 'export'],
        url: '/plugins/chartjs-renderer.js',
        metadata: {
          author: 'DataPrism Team',
          license: 'MIT',
          tags: ['charts', 'visualization', 'chartjs'],
        },
      },
      {
        id: 'sql-query-engine',
        name: 'SQL Query Engine',
        version: '2.0.0',
        description: 'Execute SQL queries with optimization and caching',
        type: 'integration',
        capabilities: ['sql-execution', 'query-optimization', 'result-caching'],
        url: '/plugins/sql-query-engine.js',
        metadata: {
          author: 'DataPrism Team',
          license: 'MIT',
          tags: ['sql', 'query', 'optimization'],
        },
      },
      {
        id: 'export-utility',
        name: 'Data Export Utility',
        version: '2.0.0',
        description: 'Export data in various formats',
        type: 'utility',
        capabilities: ['csv-export', 'json-export', 'excel-export', 'pdf-export'],
        url: '/plugins/export-utility.js',
        metadata: {
          author: 'DataPrism Team',
          license: 'MIT',
          tags: ['export', 'utility', 'csv', 'json'],
        },
      },
    ];
  }
}

// Singleton instance
let pluginManagerInstance: AnalyticsPluginManager | null = null;

/**
 * Get the singleton plugin manager instance
 */
export const getPluginManager = (): AnalyticsPluginManager => {
  if (!pluginManagerInstance) {
    pluginManagerInstance = new AnalyticsPluginManager();
  }
  return pluginManagerInstance;
};

/**
 * Initialize the plugin manager
 */
export const initializePluginManager = async (): Promise<AnalyticsPluginManager> => {
  const manager = getPluginManager();
  await manager.initialize();
  return manager;
};