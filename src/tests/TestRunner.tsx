/**
 * Simple Test Runner for Plugin System
 * 
 * Provides a lightweight test runner that can be integrated into the
 * DataPrism Analytics Demo to test plugin functionality
 */

import React, { useState } from 'react';
import { useDataPrism } from '../contexts/DataPrismContext';
import { AnalyticsPluginManager } from '../plugins/AnalyticsPluginManager';

interface QuickTestResult {
  name: string;
  success: boolean;
  message: string;
  duration: number;
}

export const TestRunner: React.FC = () => {
  const { isInitialized, pluginSystemAvailable, engine } = useDataPrism();
  const [testResults, setTestResults] = useState<QuickTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runQuickTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    const results: QuickTestResult[] = [];
    
    // Test 1: Basic DataPrism functionality
    const test1Start = performance.now();
    try {
      if (!isInitialized || !engine) {
        throw new Error('DataPrism not initialized');
      }
      
      const testQuery = await engine.query('SELECT 1 as test');
      if (!testQuery || !testQuery.data) {
        throw new Error('Basic query failed');
      }
      
      results.push({
        name: 'DataPrism Basic Query',
        success: true,
        message: 'Basic query executed successfully',
        duration: performance.now() - test1Start
      });
    } catch (error) {
      results.push({
        name: 'DataPrism Basic Query',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - test1Start
      });
    }
    
    // Test 2: Plugin system availability
    const test2Start = performance.now();
    try {
      if (!pluginSystemAvailable) {
        throw new Error('Plugin system not available');
      }
      
      results.push({
        name: 'Plugin System Availability',
        success: true,
        message: 'Plugin system is available',
        duration: performance.now() - test2Start
      });
    } catch (error) {
      results.push({
        name: 'Plugin System Availability',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - test2Start
      });
    }
    
    // Test 3: Plugin manager initialization
    const test3Start = performance.now();
    try {
      const pluginManager = new AnalyticsPluginManager({ engine });
      await pluginManager.initialize();
      
      const status = pluginManager.getStatus();
      if (!status.initialized) {
        throw new Error('Plugin manager not initialized');
      }
      
      results.push({
        name: 'Plugin Manager Initialization',
        success: true,
        message: `Initialized with ${status.registeredPlugins} plugins`,
        duration: performance.now() - test3Start
      });
    } catch (error) {
      results.push({
        name: 'Plugin Manager Initialization',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: performance.now() - test3Start
      });
    }
    
    setTestResults(results);
    setIsRunning(false);
  };

  const successCount = testResults.filter(r => r.success).length;
  const failureCount = testResults.filter(r => !r.success).length;

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      backgroundColor: '#f9f9f9',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h3>🧪 Plugin System Quick Test</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={runQuickTests}
          disabled={isRunning}
          style={{
            padding: '8px 16px',
            backgroundColor: isRunning ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {isRunning ? 'Running Tests...' : 'Run Quick Tests'}
        </button>
      </div>

      {testResults.length > 0 && (
        <div>
          <div style={{ marginBottom: '15px' }}>
            <strong>Results: </strong>
            <span style={{ color: 'green' }}>✅ {successCount} passed</span>
            {failureCount > 0 && (
              <span style={{ color: 'red', marginLeft: '10px' }}>❌ {failureCount} failed</span>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {testResults.map((result, index) => (
              <div 
                key={index}
                style={{
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: result.success ? '#d4edda' : '#f8d7da',
                  fontSize: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    {result.success ? '✅' : '❌'} <strong>{result.name}</strong>
                  </span>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {result.duration.toFixed(0)}ms
                  </span>
                </div>
                <div style={{ marginTop: '5px', color: result.success ? 'green' : 'red' }}>
                  {result.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestRunner;