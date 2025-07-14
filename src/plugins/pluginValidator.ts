/**
 * Plugin Validator for DataPrism Demo Analytics
 * Validates plugin loading and registration
 */

import { PluginValidationResult, PluginResult, Plugin } from '@/types/validation';

export class PluginValidator {
  private registeredPlugins: Map<string, Plugin> = new Map();
  private mockPlugins: Map<string, Plugin> = new Map();
  
  constructor() {
    this.initializeMockPlugins();
  }
  
  /**
   * Validates the entire plugin system
   */
  async validatePluginSystem(): Promise<PluginValidationResult> {
    const results = {
      'csv-importer': await this.validatePlugin('csv-importer'),
      'observable-charts': await this.validatePlugin('observable-charts'),
      'openai-llm': await this.validatePlugin('openai-llm'),
      'data-exporter': await this.validatePlugin('data-exporter')
    };
    
    return {
      success: Object.values(results).every(r => r.success),
      plugins: results,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Validates a specific plugin
   */
  private async validatePlugin(pluginName: string): Promise<PluginResult> {
    try {
      const plugin = await this.loadPlugin(pluginName);
      const isValid = await this.testPluginInterface(plugin);
      
      return { 
        success: isValid, 
        plugin: pluginName 
      };
    } catch (error) {
      return { 
        success: false, 
        plugin: pluginName, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Loads a plugin (mock implementation for now)
   */
  private async loadPlugin(pluginName: string): Promise<Plugin> {
    // Since plugins are not yet implemented, use mock plugins
    const mockPlugin = this.mockPlugins.get(pluginName);
    if (!mockPlugin) {
      throw new Error(`Plugin ${pluginName} not found`);
    }
    
    // Simulate plugin loading delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return mockPlugin;
  }
  
  /**
   * Tests plugin interface compliance
   */
  private async testPluginInterface(plugin: Plugin): Promise<boolean> {
    try {
      // Check required properties
      if (!plugin.name || !plugin.version) {
        return false;
      }
      
      // Check required methods
      if (typeof plugin.initialize !== 'function' || typeof plugin.isValid !== 'function') {
        return false;
      }
      
      // Test initialization
      await plugin.initialize();
      
      // Test validity check
      const isValid = plugin.isValid();
      
      return isValid;
    } catch (error) {
      console.error(`Plugin interface test failed for ${plugin.name}:`, error);
      return false;
    }
  }
  
  /**
   * Validates plugin manifest structure
   */
  async validatePluginManifest(manifest: any): Promise<boolean> {
    try {
      // Check required fields
      const requiredFields = ['plugins', 'version', 'metadata'];
      for (const field of requiredFields) {
        if (!manifest[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      // Validate plugins array
      if (!Array.isArray(manifest.plugins)) {
        throw new Error('plugins must be an array');
      }
      
      // Validate each plugin entry
      for (const plugin of manifest.plugins) {
        if (!plugin.name || !plugin.url || !plugin.version) {
          throw new Error(`Invalid plugin entry: ${JSON.stringify(plugin)}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Plugin manifest validation failed:', error);
      return false;
    }
  }
  
  /**
   * Registers a plugin
   */
  registerPlugin(plugin: Plugin): void {
    this.registeredPlugins.set(plugin.name, plugin);
  }
  
  /**
   * Gets a registered plugin
   */
  getPlugin(name: string): Plugin | undefined {
    return this.registeredPlugins.get(name);
  }
  
  /**
   * Gets all registered plugins
   */
  getRegisteredPlugins(): Plugin[] {
    return Array.from(this.registeredPlugins.values());
  }
  
  /**
   * Clears all registered plugins
   */
  clearPlugins(): void {
    this.registeredPlugins.clear();
  }
  
  /**
   * Initializes mock plugins for testing
   */
  private initializeMockPlugins(): void {
    // CSV Importer Mock Plugin
    this.mockPlugins.set('csv-importer', {
      name: 'csv-importer',
      version: '1.0.0',
      initialize: async () => {
        console.log('CSV Importer plugin initialized');
      },
      isValid: () => true
    });
    
    // Observable Charts Mock Plugin
    this.mockPlugins.set('observable-charts', {
      name: 'observable-charts',
      version: '1.0.0',
      initialize: async () => {
        console.log('Observable Charts plugin initialized');
      },
      isValid: () => true
    });
    
    // OpenAI LLM Mock Plugin
    this.mockPlugins.set('openai-llm', {
      name: 'openai-llm',
      version: '1.0.0',
      initialize: async () => {
        console.log('OpenAI LLM plugin initialized');
      },
      isValid: () => true
    });
    
    // Data Exporter Mock Plugin
    this.mockPlugins.set('data-exporter', {
      name: 'data-exporter',
      version: '1.0.0',
      initialize: async () => {
        console.log('Data Exporter plugin initialized');
      },
      isValid: () => true
    });
  }
  
  /**
   * Simulates plugin loading from CDN
   */
  async loadPluginFromCDN(pluginName: string, cdnUrl: string): Promise<Plugin> {
    try {
      // Simulate CDN plugin loading
      const response = await fetch(`${cdnUrl}/plugins/${pluginName}.js`);
      
      if (!response.ok) {
        throw new Error(`Failed to load plugin from CDN: ${response.status}`);
      }
      
      // For now, return mock plugin
      // In real implementation, this would evaluate the plugin code
      const mockPlugin = this.mockPlugins.get(pluginName);
      if (!mockPlugin) {
        throw new Error(`Plugin ${pluginName} not available`);
      }
      
      return mockPlugin;
    } catch (error) {
      throw new Error(`CDN plugin loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}