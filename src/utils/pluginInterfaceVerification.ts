/**
 * DataPrism Plugin Interface Verification
 * 
 * Verifies that the official DataPrism plugin interfaces are available
 * via CDN as resolved in GitHub Issue #18
 */

// Global type declaration for DataPrism plugin interfaces
declare global {
  interface Window {
    DataPrism: any;
  }
}

export interface PluginInterfaceVerificationResult {
  available: boolean;
  interfaces: {
    IPlugin: boolean;
    IDataProcessorPlugin: boolean;
    IVisualizationPlugin: boolean;
    IIntegrationPlugin: boolean;
    IUtilityPlugin: boolean;
    ILLMIntegrationPlugin: boolean;
    ISecurityUtilityPlugin: boolean;
  };
  managers: {
    PluginManager: boolean;
    PluginRegistry: boolean;
    DataPrismPluginSystem: boolean;
    BasePlugin: boolean;
  };
  utilities: {
    PluginUtils: boolean;
    SecurityManager: boolean;
    PluginSandbox: boolean;
    ResourceManager: boolean;
    EventBus: boolean;
    EventBusFactory: boolean;
  };
  error?: string;
}

/**
 * Verify that DataPrism plugin interfaces are available via CDN
 */
export const verifyPluginInterfaces = (): PluginInterfaceVerificationResult => {
  try {
    console.log('🔍 Verifying DataPrism plugin interfaces availability...');
    
    // Check if DataPrism is loaded
    if (typeof window.DataPrism === 'undefined') {
      return {
        available: false,
        interfaces: {
          IPlugin: false,
          IDataProcessorPlugin: false,
          IVisualizationPlugin: false,
          IIntegrationPlugin: false,
          IUtilityPlugin: false,
          ILLMIntegrationPlugin: false,
          ISecurityUtilityPlugin: false,
        },
        managers: {
          PluginManager: false,
          PluginRegistry: false,
          DataPrismPluginSystem: false,
          BasePlugin: false,
        },
        utilities: {
          PluginUtils: false,
          SecurityManager: false,
          PluginSandbox: false,
          ResourceManager: false,
          EventBus: false,
          EventBusFactory: false,
        },
        error: 'DataPrism not loaded from CDN'
      };
    }

    // Check plugin interfaces
    const interfaces = {
      IPlugin: typeof window.DataPrism.IPlugin !== 'undefined',
      IDataProcessorPlugin: typeof window.DataPrism.IDataProcessorPlugin !== 'undefined',
      IVisualizationPlugin: typeof window.DataPrism.IVisualizationPlugin !== 'undefined',
      IIntegrationPlugin: typeof window.DataPrism.IIntegrationPlugin !== 'undefined',
      IUtilityPlugin: typeof window.DataPrism.IUtilityPlugin !== 'undefined',
      ILLMIntegrationPlugin: typeof window.DataPrism.ILLMIntegrationPlugin !== 'undefined',
      ISecurityUtilityPlugin: typeof window.DataPrism.ISecurityUtilityPlugin !== 'undefined',
    };

    // Check plugin managers
    const managers = {
      PluginManager: typeof window.DataPrism.PluginManager !== 'undefined',
      PluginRegistry: typeof window.DataPrism.PluginRegistry !== 'undefined',
      DataPrismPluginSystem: typeof window.DataPrism.DataPrismPluginSystem !== 'undefined',
      BasePlugin: typeof window.DataPrism.BasePlugin !== 'undefined',
    };

    // Check plugin utilities
    const utilities = {
      PluginUtils: typeof window.DataPrism.PluginUtils !== 'undefined',
      SecurityManager: typeof window.DataPrism.SecurityManager !== 'undefined',
      PluginSandbox: typeof window.DataPrism.PluginSandbox !== 'undefined',
      ResourceManager: typeof window.DataPrism.ResourceManager !== 'undefined',
      EventBus: typeof window.DataPrism.EventBus !== 'undefined',
      EventBusFactory: typeof window.DataPrism.EventBusFactory !== 'undefined',
    };

    // Check if all core interfaces are available
    const coreInterfacesAvailable = interfaces.IPlugin && 
                                   interfaces.IDataProcessorPlugin && 
                                   interfaces.IVisualizationPlugin && 
                                   interfaces.IIntegrationPlugin && 
                                   interfaces.IUtilityPlugin;

    // Check if plugin manager is available
    const pluginManagerAvailable = managers.PluginManager;

    const available = coreInterfacesAvailable && pluginManagerAvailable;

    const result: PluginInterfaceVerificationResult = {
      available,
      interfaces,
      managers,
      utilities
    };

    if (available) {
      console.log('✅ DataPrism plugin interfaces verified successfully!');
      console.log('📋 Available interfaces:', Object.keys(interfaces).filter(k => interfaces[k as keyof typeof interfaces]));
      console.log('🛠️ Available managers:', Object.keys(managers).filter(k => managers[k as keyof typeof managers]));
      console.log('🔧 Available utilities:', Object.keys(utilities).filter(k => utilities[k as keyof typeof utilities]));
    } else {
      console.warn('⚠️ Some DataPrism plugin interfaces are missing');
      console.warn('Missing interfaces:', Object.keys(interfaces).filter(k => !interfaces[k as keyof typeof interfaces]));
      console.warn('Missing managers:', Object.keys(managers).filter(k => !managers[k as keyof typeof managers]));
    }

    return result;

  } catch (error) {
    console.error('❌ Error verifying plugin interfaces:', error);
    return {
      available: false,
      interfaces: {
        IPlugin: false,
        IDataProcessorPlugin: false,
        IVisualizationPlugin: false,
        IIntegrationPlugin: false,
        IUtilityPlugin: false,
        ILLMIntegrationPlugin: false,
        ISecurityUtilityPlugin: false,
      },
      managers: {
        PluginManager: false,
        PluginRegistry: false,
        DataPrismPluginSystem: false,
        BasePlugin: false,
      },
      utilities: {
        PluginUtils: false,
        SecurityManager: false,
        PluginSandbox: false,
        ResourceManager: false,
        EventBus: false,
        EventBusFactory: false,
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get plugin interface constructor
 */
export const getPluginInterface = (interfaceName: string): any => {
  const verification = verifyPluginInterfaces();
  
  if (!verification.available) {
    throw new Error('DataPrism plugin interfaces not available');
  }

  const interface_ = (window.DataPrism as any)[interfaceName];
  if (!interface_) {
    throw new Error(`Plugin interface ${interfaceName} not found`);
  }

  return interface_;
};

/**
 * Create plugin manager instance
 */
export const createPluginManager = (): any => {
  const verification = verifyPluginInterfaces();
  
  if (!verification.available || !verification.managers.PluginManager) {
    throw new Error('DataPrism PluginManager not available');
  }

  return new window.DataPrism.PluginManager();
};

/**
 * Create plugin registry instance
 */
export const createPluginRegistry = (): any => {
  const verification = verifyPluginInterfaces();
  
  if (!verification.available || !verification.managers.PluginRegistry) {
    throw new Error('DataPrism PluginRegistry not available');
  }

  return new window.DataPrism.PluginRegistry();
};

/**
 * Create DataPrism plugin system instance
 */
export const createDataPrismPluginSystem = (): any => {
  const verification = verifyPluginInterfaces();
  
  if (!verification.available || !verification.managers.DataPrismPluginSystem) {
    throw new Error('DataPrism DataPrismPluginSystem not available');
  }

  return new window.DataPrism.DataPrismPluginSystem();
};

/**
 * Wait for DataPrism plugin interfaces to be available
 */
export const waitForPluginInterfaces = async (timeout: number = 10000): Promise<boolean> => {
  const start = Date.now();
  
  return new Promise((resolve) => {
    const check = () => {
      const verification = verifyPluginInterfaces();
      
      if (verification.available) {
        resolve(true);
        return;
      }
      
      if (Date.now() - start > timeout) {
        console.warn('⚠️ Timeout waiting for DataPrism plugin interfaces');
        resolve(false);
        return;
      }
      
      setTimeout(check, 100);
    };
    
    check();
  });
};