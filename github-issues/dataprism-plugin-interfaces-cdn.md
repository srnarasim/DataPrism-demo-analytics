# Enhancement Request: Expose Plugin Interfaces via CDN

## Summary
Request to expose DataPrism plugin system interfaces via CDN to enable proper plugin development in CDN-based applications.

## Background
We are implementing the Phase 2 Plugin Transformation for the DataPrism Analytics Demo application (based on the PRP at `/PRPs/analytics-demo-phase2-plugin-transformation.md`). The goal is to transform the current direct integration to a fully plugin-based architecture that showcases the complete capabilities of the DataPrism engine.

## Current Issue
The DataPrism CDN bundle does not expose the plugin system interfaces that are defined in the official Plugin System PRP (https://github.com/srnarasim/DataPrism/blob/main/PRPs/plugin-system.md). This makes it impossible to properly implement plugins that conform to the official DataPrism plugin specification.

## Expected Plugin Interfaces
According to the Plugin System PRP, these interfaces should be available:

### Core Interfaces
```typescript
// From packages/plugins/src/interfaces/plugin.ts
export interface IPlugin {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly capabilities: string[];
  
  initialize(context: PluginContext): Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  dispose(): Promise<void>;
  
  isValid(): boolean;
  getStatus(): PluginStatus;
}

// From packages/plugins/src/interfaces/data-processor.ts
export interface IDataProcessorPlugin extends IPlugin {
  readonly type: 'data-processor';
  
  processData(input: DataProcessorInput): Promise<DataProcessorOutput>;
  validateData(data: any[]): Promise<ValidationResult>;
  transformData(data: any[], config: TransformConfig): Promise<any[]>;
  
  processStream(stream: ReadableStream): Promise<ReadableStream>;
  getBatchSize(): number;
}

// From packages/plugins/src/interfaces/visualization.ts
export interface IVisualizationPlugin extends IPlugin {
  readonly type: 'visualization';
  
  renderComponent(props: VisualizationProps): React.ReactElement;
  getComponentProps(): VisualizationPropTypes;
  
  getSupportedChartTypes(): ChartType[];
  validateChartConfig(config: ChartConfig): boolean;
  
  exportChart(format: ExportFormat): Promise<ExportResult>;
  getSupportedExports(): ExportFormat[];
}

// Additional interfaces for Integration and Utility plugins
export interface IIntegrationPlugin extends IPlugin { /* ... */ }
export interface IUtilityPlugin extends IPlugin { /* ... */ }
```

### Plugin Manager Interface
```typescript
export interface IPluginManager {
  registerPlugin(plugin: IPlugin): Promise<void>;
  unregisterPlugin(id: string): Promise<void>;
  
  loadPlugin(manifest: PluginManifest): Promise<IPlugin>;
  discoverPlugins(): Promise<PluginManifest[]>;
  
  getPlugin(id: string): Promise<IPlugin | null>;
  getPluginsByType(type: string): Promise<IPlugin[]>;
  getPluginsByCapability(capability: string): Promise<IPlugin[]>;
  
  activatePlugin(id: string): Promise<void>;
  deactivatePlugin(id: string): Promise<void>;
  
  getEventBus(): PluginEventBus;
  executePluginMethod(pluginId: string, method: string, args: any[]): Promise<any>;
}
```

### Supporting Types
```typescript
export interface PluginContext { /* ... */ }
export interface PluginManifest { /* ... */ }
export interface PluginSecurityManager { /* ... */ }
export interface PluginEventBus { /* ... */ }
// ... other supporting types
```

## Proposed Solution

### 1. CDN Bundle Enhancement
Modify the DataPrism CDN bundle to expose plugin interfaces:

```typescript
// In the UMD bundle (dataprism.umd.js)
window.DataPrism = {
  // Existing DataPrism exports
  DataPrismEngine: DataPrismEngine,
  
  // NEW: Plugin System Exports
  plugins: {
    // Core interfaces
    IPlugin: IPlugin,
    IDataProcessorPlugin: IDataProcessorPlugin,
    IVisualizationPlugin: IVisualizationPlugin,
    IIntegrationPlugin: IIntegrationPlugin,
    IUtilityPlugin: IUtilityPlugin,
    
    // Manager and supporting types
    IPluginManager: IPluginManager,
    PluginManager: PluginManager,
    PluginContext: PluginContext,
    PluginManifest: PluginManifest,
    PluginSecurityManager: PluginSecurityManager,
    PluginEventBus: PluginEventBus,
    
    // Utility functions
    createPluginContext: createPluginContext,
    validatePlugin: validatePlugin,
  },
  
  // Or alternatively, expose at top level
  IPlugin: IPlugin,
  IDataProcessorPlugin: IDataProcessorPlugin,
  // ... etc
};
```

### 2. Alternative: Separate Plugin Bundle
Create a separate plugin bundle that can be loaded alongside the main DataPrism bundle:

```typescript
// dataprism-plugins.umd.js
window.DataPrismPlugins = {
  IPlugin: IPlugin,
  IDataProcessorPlugin: IDataProcessorPlugin,
  IVisualizationPlugin: IVisualizationPlugin,
  IIntegrationPlugin: IIntegrationPlugin,
  IUtilityPlugin: IUtilityPlugin,
  IPluginManager: IPluginManager,
  PluginManager: PluginManager,
  // ... other exports
};
```

### 3. TypeScript Declarations
Provide TypeScript declarations for the CDN bundle:

```typescript
// dataprism.d.ts
declare global {
  interface Window {
    DataPrism: {
      DataPrismEngine: any;
      plugins: {
        IPlugin: any;
        IDataProcessorPlugin: any;
        IVisualizationPlugin: any;
        IIntegrationPlugin: any;
        IUtilityPlugin: any;
        IPluginManager: any;
        PluginManager: any;
        // ... other interfaces
      };
    };
  }
}
```

## Use Case Example
With the plugin interfaces exposed via CDN, developers can create proper plugins:

```typescript
// Example CSV Processor Plugin
class CSVProcessorPlugin implements window.DataPrism.plugins.IDataProcessorPlugin {
  readonly id = 'csv-processor';
  readonly name = 'CSV File Processor';
  readonly version = '2.0.0';
  readonly type = 'data-processor';
  readonly capabilities = ['file-upload', 'data-validation', 'schema-detection'];
  
  async initialize(context: PluginContext): Promise<void> {
    // Initialize with DataPrism context
  }
  
  async processData(input: DataProcessorInput): Promise<DataProcessorOutput> {
    // Process CSV data using Papa Parse
    // Return standardized output format
  }
  
  // ... implement other required methods
}

// Register with plugin manager
const pluginManager = new window.DataPrism.plugins.PluginManager();
await pluginManager.registerPlugin(new CSVProcessorPlugin());
```

## Benefits
1. **Standards Compliance**: Plugins conform to official DataPrism plugin specification
2. **Type Safety**: Proper TypeScript support for plugin development
3. **Ecosystem Growth**: Enables third-party plugin development
4. **Reference Implementation**: Analytics demo becomes true showcase of plugin capabilities
5. **Documentation**: Provides working examples of plugin implementation

## Current Workaround
We are currently implementing fallback interfaces, but this approach:
- Doesn't guarantee compliance with official plugin specification
- Requires maintenance when plugin interfaces change
- Doesn't provide the same level of integration as official interfaces
- Cannot access DataPrism's internal plugin management capabilities

## Timeline
This enhancement would be needed for the Phase 2 Plugin Transformation implementation (currently in progress).

## Implementation Considerations
1. **Bundle Size**: Consider impact on CDN bundle size
2. **Breaking Changes**: Ensure backward compatibility
3. **Documentation**: Update CDN usage documentation
4. **Examples**: Provide plugin development examples
5. **Testing**: Test plugin interface exposure in different environments

## Related PRPs
- [Plugin System PRP](https://github.com/srnarasim/DataPrism/blob/main/PRPs/plugin-system.md)
- [Analytics Demo Phase 2 Plugin Transformation PRP](PRPs/analytics-demo-phase2-plugin-transformation.md)

## Priority
**High** - This blocks the implementation of the plugin-based architecture showcase that demonstrates DataPrism's full plugin capabilities.

---

**Labels**: enhancement, plugin-system, cdn, typescript, phase-2
**Assignee**: DataPrism Core Team
**Milestone**: Plugin System CDN Integration