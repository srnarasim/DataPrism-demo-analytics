/**
 * Manual Plugin Test
 * 
 * Simple test to verify plugin functionality without TypeScript compilation
 */

import { CSVProcessorPlugin } from '../plugins/CSVProcessorPlugin.js';
import { SQLQueryIntegrationPlugin } from '../plugins/SQLQueryIntegrationPlugin.js';
import { ExportUtilityPlugin } from '../plugins/ExportUtilityPlugin.js';
import { AnalyticsPluginManager } from '../plugins/AnalyticsPluginManager.js';

// Test data
const testData = [
  { id: 1, name: 'John Doe', age: 30, city: 'New York', salary: 50000 },
  { id: 2, name: 'Jane Smith', age: 25, city: 'Los Angeles', salary: 60000 },
  { id: 3, name: 'Bob Johnson', age: 35, city: 'Chicago', salary: 70000 },
  { id: 4, name: 'Alice Brown', age: 28, city: 'Houston', salary: 55000 },
  { id: 5, name: 'Charlie Davis', age: 32, city: 'Phoenix', salary: 65000 }
];

// Mock DataPrism context
const mockContext = {
  engine: {
    query: async (sql) => {
      console.log(`Mock query executed: ${sql}`);
      return {
        data: testData,
        metadata: { rowCount: testData.length }
      };
    }
  },
  query: async (sql) => {
    console.log(`Mock query executed: ${sql}`);
    return {
      data: testData,
      metadata: { rowCount: testData.length }
    };
  }
};

async function testPlugins() {
  console.log('🧪 Manual Plugin Test Starting...\n');

  try {
    // Test CSV Processor Plugin
    console.log('1. Testing CSV Processor Plugin');
    const csvPlugin = new CSVProcessorPlugin();
    await csvPlugin.initialize(mockContext);
    await csvPlugin.activate();
    
    const csvResult = await csvPlugin.processData({ data: testData });
    console.log('✅ CSV Plugin Result:', {
      dataLength: csvResult.data.length,
      schemaColumns: csvResult.schema.columns.length,
      processingTime: csvResult.metadata.processingTime
    });

    // Test SQL Query Integration Plugin
    console.log('\n2. Testing SQL Query Integration Plugin');
    const sqlPlugin = new SQLQueryIntegrationPlugin();
    await sqlPlugin.initialize(mockContext);
    await sqlPlugin.activate();
    
    await sqlPlugin.connect({ type: 'dataprism', engine: mockContext.engine });
    const queryResult = await sqlPlugin.executeQuery({ sql: 'SELECT * FROM test_table' });
    console.log('✅ SQL Plugin Result:', {
      dataLength: queryResult.data.length,
      executionTime: queryResult.executionTime,
      fromCache: queryResult.fromCache
    });

    // Test Export Utility Plugin
    console.log('\n3. Testing Export Utility Plugin');
    const exportPlugin = new ExportUtilityPlugin();
    await exportPlugin.initialize(mockContext);
    await exportPlugin.activate();
    
    const csvExport = await exportPlugin.executeFunction('exportJSON', [testData, {}]);
    console.log('✅ Export Plugin Result:', {
      exportType: 'JSON',
      dataLength: csvExport.length,
      isString: typeof csvExport === 'string'
    });

    // Test Analytics Plugin Manager
    console.log('\n4. Testing Analytics Plugin Manager');
    const manager = new AnalyticsPluginManager(mockContext);
    await manager.initialize();
    
    const activePlugins = manager.getActivePlugins();
    const status = manager.getStatus();
    console.log('✅ Plugin Manager Result:', {
      activePlugins: activePlugins.length,
      registeredPlugins: status.registeredPlugins,
      initialized: status.initialized
    });

    console.log('\n🎉 All manual plugin tests passed!');
    
  } catch (error) {
    console.error('❌ Manual plugin test failed:', error);
    process.exit(1);
  }
}

// Run the test
testPlugins();