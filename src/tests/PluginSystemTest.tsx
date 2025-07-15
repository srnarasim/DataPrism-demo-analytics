/**
 * Plugin System Integration Test
 * 
 * Tests the plugin system integration with DataPrism to ensure
 * all components work correctly together
 */

import React, { useState, useEffect } from 'react';
import { useDataPrism } from '../contexts/DataPrismContext';
import { AnalyticsPluginManager } from '../plugins/AnalyticsPluginManager';
import { verifyPluginInterfaces } from '../utils/pluginInterfaceVerification';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  duration?: number;
  error?: string;
}

export const PluginSystemTest: React.FC = () => {
  const { 
    isInitialized, 
    pluginSystemAvailable, 
    pluginInterfaces, 
    pluginManager,
    engine 
  } = useDataPrism();

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [analyticsPluginManager, setAnalyticsPluginManager] = useState<AnalyticsPluginManager | null>(null);

  // Test suite definition
  const testSuite = [
    {
      name: 'DataPrism Engine Initialization',
      test: async () => {
        if (!isInitialized) {
          throw new Error('DataPrism engine not initialized');
        }
        if (!engine) {
          throw new Error('DataPrism engine instance not available');
        }
        return 'DataPrism engine initialized successfully';
      }
    },
    {
      name: 'Plugin Interface Verification',
      test: async () => {
        const verification = verifyPluginInterfaces();
        if (!verification.available) {
          throw new Error(`Plugin interfaces not available: ${verification.error}`);
        }
        
        const coreInterfaces = ['IPlugin', 'IDataProcessorPlugin', 'IVisualizationPlugin', 'IIntegrationPlugin', 'IUtilityPlugin'];
        const missingInterfaces = coreInterfaces.filter(interfaceName => !verification.interfaces[interfaceName as keyof typeof verification.interfaces]);
        
        if (missingInterfaces.length > 0) {
          throw new Error(`Missing core interfaces: ${missingInterfaces.join(', ')}`);
        }
        
        return `All plugin interfaces verified: ${Object.keys(verification.interfaces).filter(k => verification.interfaces[k as keyof typeof verification.interfaces]).length} available`;
      }
    },
    {
      name: 'Plugin Manager Initialization',
      test: async () => {
        if (!pluginSystemAvailable) {
          throw new Error('Plugin system not available');
        }
        
        const manager = new AnalyticsPluginManager({ engine, query: engine?.query });
        await manager.initialize();
        
        setAnalyticsPluginManager(manager);
        
        const status = manager.getStatus();
        if (!status.initialized) {
          throw new Error('Analytics Plugin Manager not initialized');
        }
        
        return `Plugin Manager initialized with ${status.registeredPlugins} plugins`;
      }
    },
    {
      name: 'CSV Data Processor Plugin Test',
      test: async () => {
        if (!analyticsPluginManager) {
          throw new Error('Analytics Plugin Manager not available');
        }
        
        const plugin = await analyticsPluginManager.loadPlugin('csv-processor');
        if (!plugin) {
          throw new Error('CSV Processor Plugin not loaded');
        }
        
        // Test with sample CSV data
        const sampleData = [
          { id: 1, name: 'John Doe', age: 30, city: 'New York' },
          { id: 2, name: 'Jane Smith', age: 25, city: 'Los Angeles' },
          { id: 3, name: 'Bob Johnson', age: 35, city: 'Chicago' }
        ];
        
        const result = await plugin.processData({ data: sampleData });
        
        if (!result.data || result.data.length !== 3) {
          throw new Error('CSV processing failed');
        }
        
        if (!result.schema || !result.schema.columns) {
          throw new Error('Schema detection failed');
        }
        
        return `CSV Plugin processed ${result.data.length} rows with ${result.schema.columns.length} columns`;
      }
    },
    {
      name: 'Chart.js Visualization Plugin Test',
      test: async () => {
        if (!analyticsPluginManager) {
          throw new Error('Analytics Plugin Manager not available');
        }
        
        const plugin = await analyticsPluginManager.loadPlugin('chartjs-visualization');
        if (!plugin) {
          throw new Error('Chart.js Visualization Plugin not loaded');
        }
        
        // Test chart configuration
        const sampleData = [10, 20, 30, 40, 50];
        const config = plugin.createChartConfig(sampleData, 'bar', { title: 'Test Chart' });
        
        if (!config || !config.data || !config.data.datasets) {
          throw new Error('Chart configuration creation failed');
        }
        
        // Test supported chart types
        const supportedTypes = plugin.getSupportedChartTypes();
        if (!supportedTypes || supportedTypes.length === 0) {
          throw new Error('No supported chart types found');
        }
        
        return `Chart Plugin supports ${supportedTypes.length} chart types`;
      }
    },
    {
      name: 'SQL Query Integration Plugin Test',
      test: async () => {
        if (!analyticsPluginManager) {
          throw new Error('Analytics Plugin Manager not available');
        }
        
        const plugin = await analyticsPluginManager.loadPlugin('sql-query-integration');
        if (!plugin) {
          throw new Error('SQL Query Integration Plugin not loaded');
        }
        
        // Test connection
        await plugin.connect({ type: 'dataprism', engine: engine });
        
        // Test simple query
        const result = await plugin.executeQuery({ sql: 'SELECT 1 as test_value' });
        
        if (!result || !result.data) {
          throw new Error('SQL query execution failed');
        }
        
        // Test query metrics
        const metrics = plugin.getQueryMetrics();
        if (!metrics || metrics.totalQueries === 0) {
          throw new Error('Query metrics not tracked');
        }
        
        return `SQL Plugin executed query in ${result.executionTime?.toFixed(2)}ms`;
      }
    },
    {
      name: 'Export Utility Plugin Test',
      test: async () => {
        if (!analyticsPluginManager) {
          throw new Error('Analytics Plugin Manager not available');
        }
        
        const plugin = await analyticsPluginManager.loadPlugin('export-utility');
        if (!plugin) {
          throw new Error('Export Utility Plugin not loaded');
        }
        
        // Test available functions
        const functions = plugin.getAvailableFunctions();
        if (!functions || functions.length === 0) {
          throw new Error('No export functions available');
        }
        
        // Test CSV export
        const sampleData = [
          { id: 1, name: 'Test Item 1', value: 100 },
          { id: 2, name: 'Test Item 2', value: 200 }
        ];
        
        const csvResult = await plugin.executeFunction('exportCSV', [sampleData, {}]);
        if (!csvResult || !(csvResult instanceof Blob)) {
          throw new Error('CSV export failed');
        }
        
        // Test JSON export
        const jsonResult = await plugin.executeFunction('exportJSON', [sampleData, {}]);
        if (!jsonResult || typeof jsonResult !== 'string') {
          throw new Error('JSON export failed');
        }
        
        return `Export Plugin supports ${functions.length} export formats`;
      }
    },
    {
      name: 'Plugin Communication Test',
      test: async () => {
        if (!analyticsPluginManager) {
          throw new Error('Analytics Plugin Manager not available');
        }
        
        // Test getting plugins by type
        const dataProcessors = await analyticsPluginManager.getPluginsByType('data-processor');
        const visualizationPlugins = await analyticsPluginManager.getPluginsByType('visualization');
        const integrationPlugins = await analyticsPluginManager.getPluginsByType('integration');
        const utilityPlugins = await analyticsPluginManager.getPluginsByType('utility');
        
        if (dataProcessors.length === 0) {
          throw new Error('No data processor plugins found');
        }
        
        if (visualizationPlugins.length === 0) {
          throw new Error('No visualization plugins found');
        }
        
        if (integrationPlugins.length === 0) {
          throw new Error('No integration plugins found');
        }
        
        if (utilityPlugins.length === 0) {
          throw new Error('No utility plugins found');
        }
        
        // Test plugin capabilities
        const exportCapablePlugins = analyticsPluginManager.getPluginsByCapability('csv-export');
        if (exportCapablePlugins.length === 0) {
          throw new Error('No plugins with CSV export capability found');
        }
        
        return `Plugin communication verified: ${dataProcessors.length + visualizationPlugins.length + integrationPlugins.length + utilityPlugins.length} plugins active`;
      }
    },
    {
      name: 'Integration Workflow Test',
      test: async () => {
        if (!analyticsPluginManager) {
          throw new Error('Analytics Plugin Manager not available');
        }
        
        // Test complete workflow: Data Processing → Visualization → Export
        
        // Step 1: Process data
        const csvPlugin = analyticsPluginManager.getPlugin('csv-processor');
        const sampleData = [
          { category: 'A', value: 10 },
          { category: 'B', value: 20 },
          { category: 'C', value: 30 }
        ];
        
        const processedData = await csvPlugin.processData({ data: sampleData });
        
        // Step 2: Create visualization
        const chartPlugin = analyticsPluginManager.getPlugin('chartjs-visualization');
        const chartConfig = chartPlugin.createChartConfig(processedData.data, 'bar', { title: 'Test Data' });
        
        // Step 3: Export data
        const exportPlugin = analyticsPluginManager.getPlugin('export-utility');
        const exportedData = await exportPlugin.executeFunction('exportJSON', [processedData.data, {}]);
        
        if (!exportedData || typeof exportedData !== 'string') {
          throw new Error('Integration workflow failed at export step');
        }
        
        return `Integration workflow completed: ${processedData.data.length} rows processed → visualized → exported`;
      }
    },
    {
      name: 'Performance Metrics Test',
      test: async () => {
        if (!analyticsPluginManager) {
          throw new Error('Analytics Plugin Manager not available');
        }
        
        // Test performance metrics collection
        const metrics = analyticsPluginManager.getPerformanceMetrics();
        
        if (!metrics || typeof metrics.totalPlugins !== 'number') {
          throw new Error('Performance metrics not available');
        }
        
        if (metrics.activePlugins === 0) {
          throw new Error('No active plugins found in metrics');
        }
        
        // Test individual plugin status
        const activePlugins = analyticsPluginManager.getActivePlugins();
        let statusCount = 0;
        
        for (const plugin of activePlugins) {
          if (plugin.getStatus && typeof plugin.getStatus === 'function') {
            const status = plugin.getStatus();
            if (status && status.state) {
              statusCount++;
            }
          }
        }
        
        if (statusCount === 0) {
          throw new Error('No plugin status information available');
        }
        
        return `Performance metrics collected: ${metrics.activePlugins} active plugins, ${statusCount} with status`;
      }
    }
  ];

  // Run all tests
  const runTests = async () => {
    setOverallStatus('running');
    setTestResults([]);
    
    for (const testCase of testSuite) {
      setCurrentTest(testCase.name);
      
      // Initialize test result
      const testResult: TestResult = {
        name: testCase.name,
        status: 'running',
        message: 'Running...'
      };
      
      setTestResults(prev => [...prev, testResult]);
      
      const startTime = performance.now();
      
      try {
        const message = await testCase.test();
        const duration = performance.now() - startTime;
        
        testResult.status = 'passed';
        testResult.message = message;
        testResult.duration = duration;
        
        setTestResults(prev => 
          prev.map(t => t.name === testCase.name ? testResult : t)
        );
        
      } catch (error) {
        const duration = performance.now() - startTime;
        
        testResult.status = 'failed';
        testResult.message = 'Test failed';
        testResult.error = error instanceof Error ? error.message : String(error);
        testResult.duration = duration;
        
        setTestResults(prev => 
          prev.map(t => t.name === testCase.name ? testResult : t)
        );
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setCurrentTest('');
    setOverallStatus('completed');
  };

  // Calculate test statistics
  const testStats = {
    total: testResults.length,
    passed: testResults.filter(t => t.status === 'passed').length,
    failed: testResults.filter(t => t.status === 'failed').length,
    running: testResults.filter(t => t.status === 'running').length
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🔬 Plugin System Integration Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Status</h3>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
          <span>Total: {testStats.total}</span>
          <span style={{ color: 'green' }}>✅ Passed: {testStats.passed}</span>
          <span style={{ color: 'red' }}>❌ Failed: {testStats.failed}</span>
          <span style={{ color: 'blue' }}>🔄 Running: {testStats.running}</span>
        </div>
        
        {currentTest && (
          <div style={{ color: 'blue', fontWeight: 'bold' }}>
            Currently running: {currentTest}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runTests}
          disabled={overallStatus === 'running'}
          style={{
            padding: '10px 20px',
            backgroundColor: overallStatus === 'running' ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: overallStatus === 'running' ? 'not-allowed' : 'pointer'
          }}
        >
          {overallStatus === 'running' ? 'Running Tests...' : 'Run Plugin System Tests'}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>System Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <strong>DataPrism Engine:</strong> {isInitialized ? '✅ Ready' : '❌ Not Ready'}
          </div>
          <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <strong>Plugin System:</strong> {pluginSystemAvailable ? '✅ Available' : '❌ Not Available'}
          </div>
          <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <strong>Plugin Interfaces:</strong> {pluginInterfaces ? '✅ Loaded' : '❌ Not Loaded'}
          </div>
          <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <strong>Plugin Manager:</strong> {pluginManager ? '✅ Active' : '❌ Not Active'}
          </div>
        </div>
      </div>

      <div>
        <h3>Test Results</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {testResults.map((result, index) => (
            <div 
              key={index} 
              style={{
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                backgroundColor: result.status === 'passed' ? '#d4edda' : 
                                result.status === 'failed' ? '#f8d7da' : 
                                result.status === 'running' ? '#d1ecf1' : '#f8f9fa'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{result.name}</strong>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {result.duration && <span>{result.duration.toFixed(0)}ms</span>}
                  <span>
                    {result.status === 'passed' && '✅'}
                    {result.status === 'failed' && '❌'}
                    {result.status === 'running' && '🔄'}
                    {result.status === 'pending' && '⏳'}
                  </span>
                </span>
              </div>
              <div style={{ marginTop: '5px', color: result.status === 'failed' ? 'red' : 'inherit' }}>
                {result.message}
              </div>
              {result.error && (
                <div style={{ marginTop: '5px', color: 'red', fontSize: '0.9em', fontFamily: 'monospace' }}>
                  Error: {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PluginSystemTest;