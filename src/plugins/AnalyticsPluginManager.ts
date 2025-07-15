/**
 * Analytics Plugin Manager
 * 
 * Uses the official DataPrism Plugin Manager from CDN and provides
 * analytics-specific functionality for managing plugins in the demo application
 */

import { CSVProcessorPlugin } from './CSVProcessorPlugin';
// import { ChartJSVisualizationPlugin } from './ChartJSVisualizationPlugin'; // Temporarily disabled due to TypeScript JSX issues
import { SQLQueryIntegrationPlugin } from './SQLQueryIntegrationPlugin';
import { ExportUtilityPlugin } from './ExportUtilityPlugin';

export class AnalyticsPluginManager {
  private dataPrismPluginManager: any;
  private registeredPlugins: Map<string, any> = new Map();
  private activePlugins: Map<string, any> = new Map();
  private pluginInstances: Map<string, any> = new Map();
  private context: any;

  constructor(context: any) {
    this.context = context;
    console.log('🔧 Initializing Analytics Plugin Manager...');
  }

  /**
   * Initialize with official DataPrism Plugin Manager
   */
  async initialize(): Promise<void> {
    try {
      // Wait for DataPrism to be available
      if (typeof window.DataPrism === 'undefined' || !window.DataPrism.PluginManager) {
        throw new Error('DataPrism Plugin Manager not available');
      }

      // Initialize with official DataPrism Plugin Manager
      this.dataPrismPluginManager = new window.DataPrism.PluginManager();
      
      // Register built-in plugins
      await this.registerBuiltInPlugins();
      
      console.log('✅ Analytics Plugin Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Analytics Plugin Manager:', error);
      throw error;
    }
  }

  /**
   * Register a plugin with the official DataPrism Plugin Manager
   */
  async registerPlugin(plugin: any): Promise<void> {
    try {
      console.log(`🔌 Registering plugin: ${plugin.name} (${plugin.id})`);
      
      // Register with official DataPrism Plugin Manager
      if (this.dataPrismPluginManager) {
        await this.dataPrismPluginManager.registerPlugin(plugin);
      }
      
      // Track in local registry
      this.registeredPlugins.set(plugin.id, {
        plugin: plugin,
        manifest: {
          id: plugin.id,
          name: plugin.name,
          version: plugin.version,
          type: plugin.type,
          description: plugin.description,
          capabilities: plugin.capabilities,
          registeredAt: new Date()
        }
      });
      
      console.log(`✅ Plugin registered: ${plugin.name}`);
    } catch (error) {
      console.error(`❌ Failed to register plugin ${plugin.name}:`, error);
      throw error;
    }
  }

  /**
   * Load and activate a plugin
   */
  async loadPlugin(pluginId: string): Promise<any> {
    try {
      console.log(`📥 Loading plugin: ${pluginId}`);
      
      const pluginInfo = this.registeredPlugins.get(pluginId);
      if (!pluginInfo) {
        throw new Error(`Plugin not found: ${pluginId}`);
      }

      // Load plugin using official DataPrism Plugin Manager if available
      let pluginInstance;
      if (this.dataPrismPluginManager && this.dataPrismPluginManager.loadPlugin) {
        pluginInstance = await this.dataPrismPluginManager.loadPlugin(pluginInfo.manifest);
      } else {
        // Fallback to direct instantiation
        pluginInstance = pluginInfo.plugin;
      }

      // Initialize plugin
      if (pluginInstance.initialize) {
        await pluginInstance.initialize(this.context);
      }

      // Activate plugin
      if (pluginInstance.activate) {
        await pluginInstance.activate();
      }

      // Store instance
      this.pluginInstances.set(pluginId, pluginInstance);
      this.activePlugins.set(pluginId, {
        instance: pluginInstance,
        loadedAt: new Date(),
        status: 'active'
      });

      console.log(`✅ Plugin loaded and activated: ${pluginId}`);
      return pluginInstance;
    } catch (error) {
      console.error(`❌ Failed to load plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Unload and deactivate a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    try {
      console.log(`📤 Unloading plugin: ${pluginId}`);
      
      const activePlugin = this.activePlugins.get(pluginId);
      if (!activePlugin) {
        throw new Error(`Plugin not active: ${pluginId}`);
      }

      const pluginInstance = activePlugin.instance;

      // Deactivate plugin
      if (pluginInstance.deactivate) {
        await pluginInstance.deactivate();
      }

      // Dispose plugin
      if (pluginInstance.dispose) {
        await pluginInstance.dispose();
      }

      // Remove from active plugins
      this.activePlugins.delete(pluginId);
      this.pluginInstances.delete(pluginId);

      // Unload from official DataPrism Plugin Manager if available
      if (this.dataPrismPluginManager && this.dataPrismPluginManager.unloadPlugin) {
        await this.dataPrismPluginManager.unloadPlugin(pluginId);
      }

      console.log(`✅ Plugin unloaded: ${pluginId}`);
    } catch (error) {
      console.error(`❌ Failed to unload plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Get plugins by type
   */
  async getPluginsByType(type: string): Promise<any[]> {
    try {
      // Use official DataPrism Plugin Manager if available
      if (this.dataPrismPluginManager && this.dataPrismPluginManager.getPluginsByType) {
        return await this.dataPrismPluginManager.getPluginsByType(type);
      }

      // Fallback to local registry
      const plugins = Array.from(this.activePlugins.values())
        .filter(p => p.instance.type === type)
        .map(p => p.instance);

      return plugins;
    } catch (error) {
      console.error(`❌ Failed to get plugins by type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): any {
    const activePlugin = this.activePlugins.get(pluginId);
    return activePlugin ? activePlugin.instance : null;
  }

  /**
   * Get all active plugins
   */
  getActivePlugins(): any[] {
    return Array.from(this.activePlugins.values()).map(p => p.instance);
  }

  /**
   * Get all registered plugins
   */
  getRegisteredPlugins(): any[] {
    return Array.from(this.registeredPlugins.values()).map(p => p.plugin);
  }

  /**
   * Get plugin event bus
   */
  getEventBus(): any {
    if (this.dataPrismPluginManager && this.dataPrismPluginManager.getEventBus) {
      return this.dataPrismPluginManager.getEventBus();
    }
    
    // Fallback to simple event emitter
    return this.createSimpleEventBus();
  }

  /**
   * Get plugin manager status
   */
  getStatus(): any {
    return {
      initialized: !!this.dataPrismPluginManager,
      registeredPlugins: this.registeredPlugins.size,
      activePlugins: this.activePlugins.size,
      pluginTypes: this.getPluginTypeStats(),
      memoryUsage: this.getMemoryUsage(),
      lastActivity: new Date()
    };
  }

  /**
   * Get plugin performance metrics
   */
  getPerformanceMetrics(): any {
    const metrics = {
      totalPlugins: this.registeredPlugins.size,
      activePlugins: this.activePlugins.size,
      pluginsByType: this.getPluginTypeStats(),
      memoryUsage: this.getMemoryUsage(),
      loadTimes: [],
      executionTimes: []
    };

    // Collect performance data from active plugins
    this.activePlugins.forEach((pluginData, pluginId) => {
      const plugin = pluginData.instance;
      if (plugin.getStatus) {
        const status = plugin.getStatus();
        if (status.performance) {
          metrics.executionTimes.push({
            pluginId: pluginId,
            ...status.performance
          });
        }
      }
    });

    return metrics;
  }

  /**
   * Execute plugin function
   */
  async executePluginFunction(pluginId: string, functionName: string, args: any[]): Promise<any> {
    try {
      const plugin = this.getPlugin(pluginId);
      if (!plugin) {
        throw new Error(`Plugin not found or not active: ${pluginId}`);
      }

      // For utility plugins, use executeFunction
      if (plugin.type === 'utility' && plugin.executeFunction) {
        return await plugin.executeFunction(functionName, args);
      }

      // For other plugins, call the function directly
      if (typeof plugin[functionName] === 'function') {
        return await plugin[functionName](...args);
      }

      throw new Error(`Function ${functionName} not found in plugin ${pluginId}`);
    } catch (error) {
      console.error(`❌ Failed to execute plugin function ${functionName} on ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Get plugins by capability
   */
  getPluginsByCapability(capability: string): any[] {
    const plugins = [];
    
    this.activePlugins.forEach((pluginData, pluginId) => {
      const plugin = pluginData.instance;
      if (plugin.capabilities && plugin.capabilities.includes(capability)) {
        plugins.push(plugin);
      }
    });
    
    return plugins;
  }

  /**
   * Search plugins
   */
  searchPlugins(query: string): any[] {
    const searchTerm = query.toLowerCase();
    const results = [];

    this.registeredPlugins.forEach((pluginData, pluginId) => {
      const plugin = pluginData.plugin;
      const manifest = pluginData.manifest;
      
      if (
        manifest.name.toLowerCase().includes(searchTerm) ||
        manifest.description.toLowerCase().includes(searchTerm) ||
        manifest.type.toLowerCase().includes(searchTerm) ||
        manifest.capabilities.some((cap: string) => cap.toLowerCase().includes(searchTerm))
      ) {
        results.push({
          plugin: plugin,
          manifest: manifest,
          isActive: this.activePlugins.has(pluginId)
        });
      }
    });

    return results;
  }

  // Private helper methods

  private async registerBuiltInPlugins(): Promise<void> {
    console.log('📦 Registering built-in plugins...');
    
    try {
      // Register CSV Processor Plugin
      const csvProcessor = new CSVProcessorPlugin();
      await this.registerPlugin(csvProcessor);

      // Register Chart.js Visualization Plugin
      // const chartJSViz = new ChartJSVisualizationPlugin();
      // await this.registerPlugin(chartJSViz); // Temporarily disabled due to TypeScript JSX issues

      // Register SQL Query Integration Plugin
      const sqlQuery = new SQLQueryIntegrationPlugin();
      await this.registerPlugin(sqlQuery);

      // Register Export Utility Plugin
      const exportUtility = new ExportUtilityPlugin();
      await this.registerPlugin(exportUtility);

      console.log('✅ Built-in plugins registered successfully');
    } catch (error) {
      console.error('❌ Failed to register built-in plugins:', error);
      throw error;
    }
  }

  private getPluginTypeStats(): any {
    const stats: any = {};
    
    this.activePlugins.forEach((pluginData, pluginId) => {
      const type = pluginData.instance.type;
      stats[type] = (stats[type] || 0) + 1;
    });
    
    return stats;
  }

  private getMemoryUsage(): any {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize / (1024 * 1024),
        total: memory.totalJSHeapSize / (1024 * 1024),
        limit: memory.jsHeapSizeLimit / (1024 * 1024)
      };
    }
    
    return {
      used: 0,
      total: 0,
      limit: 0,
      note: 'Memory API not available'
    };
  }

  private createSimpleEventBus(): any {
    const events: Map<string, Function[]> = new Map();
    
    return {
      on: (event: string, callback: Function) => {
        if (!events.has(event)) {
          events.set(event, []);
        }
        events.get(event)!.push(callback);
      },
      
      off: (event: string, callback: Function) => {
        if (events.has(event)) {
          const callbacks = events.get(event)!;
          const index = callbacks.indexOf(callback);
          if (index > -1) {
            callbacks.splice(index, 1);
          }
        }
      },
      
      emit: (event: string, ...args: any[]) => {
        if (events.has(event)) {
          events.get(event)!.forEach(callback => {
            try {
              callback(...args);
            } catch (error) {
              console.error('Event handler error:', error);
            }
          });
        }
      }
    };
  }
}