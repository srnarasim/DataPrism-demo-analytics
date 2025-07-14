/**
 * Mock DataPrism implementation for fallback when CDN fails
 */

// Mock engine class that simulates DataPrism functionality
export class MockDataPrismEngine {
  private tables: Map<string, any[]> = new Map();

  constructor(_config: any = {}) {
    // Config not used in mock implementation
  }

  async initialize() {
    console.log("🔧 Mock DataPrism Engine initialized");
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async query(sql: string) {
    console.log("📝 Mock query:", sql);
    
    // Simple mock responses for common queries
    if (sql.includes("SHOW TABLES")) {
      return {
        data: Array.from(this.tables.keys()).map(name => ({ name })),
        rowCount: this.tables.size,
        executionTime: Math.random() * 100
      };
    }
    
    if (sql.includes("DESCRIBE")) {
      const tableName = sql.split(" ")[1];
      if (this.tables.has(tableName)) {
        const sampleRow = this.tables.get(tableName)?.[0] || {};
        return {
          data: Object.keys(sampleRow).map(col => ({
            column_name: col,
            data_type: typeof sampleRow[col] === 'number' ? 'INTEGER' : 'VARCHAR',
            is_nullable: 'YES'
          })),
          rowCount: Object.keys(sampleRow).length,
          executionTime: Math.random() * 50
        };
      }
    }
    
    if (sql.includes("SELECT") || sql.includes("FROM")) {
      // Return sample data for any SELECT query
      const tables = Array.from(this.tables.entries());
      if (tables.length > 0) {
        const [_tableName, data] = tables[0];
        return {
          data: data.slice(0, 10), // Return first 10 rows
          rowCount: data.length,
          executionTime: Math.random() * 200
        };
      }
    }
    
    return {
      data: [],
      rowCount: 0,
      executionTime: Math.random() * 100
    };
  }

  async loadData(data: any[], tableName: string) {
    console.log(`📊 Mock loading ${data.length} records into table: ${tableName}`);
    this.tables.set(tableName, data);
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate loading time
  }

  async getTableInfo(tableName: string) {
    if (!this.tables.has(tableName)) {
      throw new Error(`Table ${tableName} not found`);
    }
    
    const sampleRow = this.tables.get(tableName)?.[0] || {};
    return Object.keys(sampleRow).map(col => ({
      column_name: col,
      data_type: typeof sampleRow[col] === 'number' ? 'INTEGER' : 'VARCHAR',
      is_nullable: 'YES'
    }));
  }

  async listTables() {
    return Array.from(this.tables.keys());
  }

  getMetrics() {
    return {
      queriesExecuted: Math.floor(Math.random() * 100),
      averageQueryTime: Math.floor(Math.random() * 200),
      cacheHitRate: Math.random(),
      memoryUsage: Math.floor(Math.random() * 100),
      tablesLoaded: this.tables.size,
    };
  }
}