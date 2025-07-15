/**
 * Export Utility Plugin
 * 
 * Implements the official DataPrism IUtilityPlugin interface
 * to provide comprehensive data export capabilities
 */

import Papa from 'papaparse';

// Interface implementation using official DataPrism plugin interfaces
export class ExportUtilityPlugin {
  readonly id = 'export-utility';
  readonly name = 'Data Export Utility Plugin';
  readonly version = '2.0.0';
  readonly description = 'Comprehensive data export utility supporting multiple formats';
  readonly type = 'utility';
  readonly capabilities = ['csv-export', 'json-export', 'excel-export', 'pdf-export', 'xml-export', 'sql-export'];

  private context: any;
  private exportHistory: any[] = [];
  private supportedFormats = ['csv', 'json', 'excel', 'pdf', 'xml', 'sql'];

  /**
   * Initialize the plugin with DataPrism context
   */
  async initialize(context: any): Promise<void> {
    console.log('📤 Initializing Export Utility Plugin...');
    this.context = context;
    
    // Set up export tracking
    this.setupExportTracking();
    
    console.log('✅ Export Utility Plugin initialized');
  }

  /**
   * Activate the plugin
   */
  async activate(): Promise<void> {
    console.log('▶️ Export Utility Plugin activated');
  }

  /**
   * Deactivate the plugin
   */
  async deactivate(): Promise<void> {
    console.log('⏸️ Export Utility Plugin deactivated');
  }

  /**
   * Dispose the plugin and clean up resources
   */
  async dispose(): Promise<void> {
    console.log('🗑️ Export Utility Plugin disposed');
    this.exportHistory = [];
  }

  /**
   * Check if the plugin is valid
   */
  isValid(): boolean {
    return true;
  }

  /**
   * Get the plugin status
   */
  getStatus(): any {
    return {
      state: 'active',
      message: 'Export Utility Plugin is running',
      lastUpdate: new Date(),
      performance: {
        totalExports: this.exportHistory.length,
        successfulExports: this.exportHistory.filter(e => e.success).length,
        failedExports: this.exportHistory.filter(e => !e.success).length,
        averageExportTime: this.calculateAverageExportTime()
      }
    };
  }

  /**
   * Execute export function
   */
  async executeFunction(name: string, args: any[]): Promise<any> {
    const startTime = performance.now();
    
    try {
      console.log(`🔄 Executing export function: ${name}`);
      
      let result;
      switch (name) {
        case 'exportCSV':
          result = await this.exportCSV(args[0], args[1]);
          break;
        case 'exportJSON':
          result = await this.exportJSON(args[0], args[1]);
          break;
        case 'exportExcel':
          result = await this.exportExcel(args[0], args[1]);
          break;
        case 'exportPDF':
          result = await this.exportPDF(args[0], args[1]);
          break;
        case 'exportXML':
          result = await this.exportXML(args[0], args[1]);
          break;
        case 'exportSQL':
          result = await this.exportSQL(args[0], args[1]);
          break;
        case 'bulkExport':
          result = await this.bulkExport(args[0], args[1]);
          break;
        case 'getExportHistory':
          result = this.getExportHistory();
          break;
        case 'clearExportHistory':
          result = this.clearExportHistory();
          break;
        default:
          throw new Error(`Unknown export function: ${name}`);
      }
      
      const executionTime = performance.now() - startTime;
      
      // Track export
      this.trackExport({
        function: name,
        success: true,
        executionTime: executionTime,
        timestamp: new Date(),
        args: args
      });
      
      console.log(`✅ Export function ${name} completed in ${executionTime.toFixed(2)}ms`);
      return result;
      
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      // Track failed export
      this.trackExport({
        function: name,
        success: false,
        error: error.message,
        executionTime: executionTime,
        timestamp: new Date(),
        args: args
      });
      
      console.error(`❌ Export function ${name} failed:`, error);
      throw error;
    }
  }

  /**
   * Get available export functions
   */
  getAvailableFunctions(): any[] {
    return [
      {
        name: 'exportCSV',
        description: 'Export data to CSV format',
        params: ['data', 'options'],
        returns: 'Blob',
        example: 'exportCSV(data, { filename: "export.csv", delimiter: "," })'
      },
      {
        name: 'exportJSON',
        description: 'Export data to JSON format',
        params: ['data', 'options'],
        returns: 'string',
        example: 'exportJSON(data, { filename: "export.json", pretty: true })'
      },
      {
        name: 'exportExcel',
        description: 'Export data to Excel format',
        params: ['data', 'options'],
        returns: 'Blob',
        example: 'exportExcel(data, { filename: "export.xlsx", sheetName: "Data" })'
      },
      {
        name: 'exportPDF',
        description: 'Export data to PDF format',
        params: ['data', 'options'],
        returns: 'Blob',
        example: 'exportPDF(data, { filename: "export.pdf", title: "Data Export" })'
      },
      {
        name: 'exportXML',
        description: 'Export data to XML format',
        params: ['data', 'options'],
        returns: 'string',
        example: 'exportXML(data, { filename: "export.xml", rootElement: "data" })'
      },
      {
        name: 'exportSQL',
        description: 'Export data as SQL INSERT statements',
        params: ['data', 'options'],
        returns: 'string',
        example: 'exportSQL(data, { tableName: "exported_data", filename: "export.sql" })'
      },
      {
        name: 'bulkExport',
        description: 'Export data to multiple formats simultaneously',
        params: ['data', 'formats'],
        returns: 'Object',
        example: 'bulkExport(data, ["csv", "json", "excel"])'
      },
      {
        name: 'getExportHistory',
        description: 'Get export history',
        params: [],
        returns: 'Array',
        example: 'getExportHistory()'
      },
      {
        name: 'clearExportHistory',
        description: 'Clear export history',
        params: [],
        returns: 'void',
        example: 'clearExportHistory()'
      }
    ];
  }

  /**
   * Get system information
   */
  getSystemInfo(): any {
    return {
      pluginId: this.id,
      version: this.version,
      supportedFormats: this.supportedFormats,
      capabilities: this.capabilities,
      memoryUsage: this.getMemoryUsage(),
      exportStatistics: {
        totalExports: this.exportHistory.length,
        successRate: this.calculateSuccessRate(),
        averageExportTime: this.calculateAverageExportTime()
      }
    };
  }

  /**
   * Perform maintenance tasks
   */
  async performMaintenance(): Promise<any> {
    console.log('🔧 Performing maintenance tasks...');
    
    const maintenanceResults = {
      timestamp: new Date(),
      tasks: [],
      errors: []
    };

    try {
      // Clean up old export history
      const oldHistoryCount = this.exportHistory.length;
      this.exportHistory = this.exportHistory.slice(-100); // Keep last 100 exports
      
      if (oldHistoryCount > 100) {
        maintenanceResults.tasks.push({
          task: 'history_cleanup',
          description: `Cleaned up ${oldHistoryCount - 100} old export history entries`,
          success: true
        });
      }

      // Check system resources
      const memoryUsage = this.getMemoryUsage();
      maintenanceResults.tasks.push({
        task: 'memory_check',
        description: `Current memory usage: ${memoryUsage.used.toFixed(2)}MB`,
        success: true
      });

      // Validate export capabilities
      const capabilityCheck = this.validateCapabilities();
      maintenanceResults.tasks.push({
        task: 'capability_validation',
        description: `Validated ${capabilityCheck.valid.length} capabilities`,
        success: capabilityCheck.errors.length === 0,
        errors: capabilityCheck.errors
      });

      console.log('✅ Maintenance completed successfully');
      return maintenanceResults;
      
    } catch (error) {
      console.error('❌ Maintenance failed:', error);
      maintenanceResults.errors.push(error.message);
      return maintenanceResults;
    }
  }

  // Export format implementations

  /**
   * Export data to CSV format
   */
  async exportCSV(data: any[], options: any = {}): Promise<Blob> {
    try {
      console.log('📊 Exporting to CSV...');
      
      const csvOptions = {
        delimiter: options.delimiter || ',',
        header: options.header !== false,
        skipEmptyLines: options.skipEmptyLines !== false,
        quotes: options.quotes !== false,
        ...options.papaParseOptions
      };

      const csvString = Papa.unparse(data, csvOptions);
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      
      if (options.filename) {
        this.downloadBlob(blob, options.filename);
      }
      
      console.log('✅ CSV export completed');
      return blob;
      
    } catch (error) {
      console.error('❌ CSV export failed:', error);
      throw error;
    }
  }

  /**
   * Export data to JSON format
   */
  async exportJSON(data: any[], options: any = {}): Promise<string> {
    try {
      console.log('📋 Exporting to JSON...');
      
      const jsonString = JSON.stringify(data, null, options.pretty ? 2 : 0);
      
      if (options.filename) {
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
        this.downloadBlob(blob, options.filename);
      }
      
      console.log('✅ JSON export completed');
      return jsonString;
      
    } catch (error) {
      console.error('❌ JSON export failed:', error);
      throw error;
    }
  }

  /**
   * Export data to Excel format
   */
  async exportExcel(data: any[], options: any = {}): Promise<Blob> {
    try {
      console.log('📗 Exporting to Excel...');
      
      // For now, export as CSV with .xlsx extension
      // In a real implementation, you'd use a library like xlsx
      const csvString = Papa.unparse(data, {
        delimiter: ',',
        header: true,
        skipEmptyLines: true
      });
      
      const blob = new Blob([csvString], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      if (options.filename) {
        this.downloadBlob(blob, options.filename);
      }
      
      console.log('✅ Excel export completed (CSV format)');
      return blob;
      
    } catch (error) {
      console.error('❌ Excel export failed:', error);
      throw error;
    }
  }

  /**
   * Export data to PDF format
   */
  async exportPDF(data: any[], options: any = {}): Promise<Blob> {
    try {
      console.log('📄 Exporting to PDF...');
      
      // Create a simple HTML table for PDF conversion
      const htmlContent = this.createHTMLTable(data, options);
      
      // For now, create a blob with HTML content
      // In a real implementation, you'd use a library like jsPDF or puppeteer
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      
      if (options.filename) {
        this.downloadBlob(blob, options.filename.replace('.pdf', '.html'));
      }
      
      console.log('✅ PDF export completed (HTML format)');
      return blob;
      
    } catch (error) {
      console.error('❌ PDF export failed:', error);
      throw error;
    }
  }

  /**
   * Export data to XML format
   */
  async exportXML(data: any[], options: any = {}): Promise<string> {
    try {
      console.log('📰 Exporting to XML...');
      
      const rootElement = options.rootElement || 'data';
      const itemElement = options.itemElement || 'item';
      
      let xmlString = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n`;
      
      data.forEach(item => {
        xmlString += `  <${itemElement}>\n`;
        
        Object.keys(item).forEach(key => {
          const value = this.escapeXML(String(item[key]));
          xmlString += `    <${key}>${value}</${key}>\n`;
        });
        
        xmlString += `  </${itemElement}>\n`;
      });
      
      xmlString += `</${rootElement}>`;
      
      if (options.filename) {
        const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8;' });
        this.downloadBlob(blob, options.filename);
      }
      
      console.log('✅ XML export completed');
      return xmlString;
      
    } catch (error) {
      console.error('❌ XML export failed:', error);
      throw error;
    }
  }

  /**
   * Export data as SQL INSERT statements
   */
  async exportSQL(data: any[], options: any = {}): Promise<string> {
    try {
      console.log('🗄️ Exporting to SQL...');
      
      const tableName = options.tableName || 'exported_data';
      
      if (data.length === 0) {
        return `-- No data to export\n`;
      }
      
      const columns = Object.keys(data[0]);
      let sqlString = `-- SQL Export generated on ${new Date().toISOString()}\n\n`;
      
      // Create table statement (optional)
      if (options.includeCreateTable) {
        sqlString += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
        columns.forEach((column, index) => {
          sqlString += `  ${column} VARCHAR(255)${index < columns.length - 1 ? ',' : ''}\n`;
        });
        sqlString += ');\n\n';
      }
      
      // Insert statements
      data.forEach(item => {
        const values = columns.map(col => {
          const value = item[col];
          return value === null || value === undefined ? 'NULL' : `'${String(value).replace(/'/g, "''")}'`;
        }).join(', ');
        
        sqlString += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});\n`;
      });
      
      if (options.filename) {
        const blob = new Blob([sqlString], { type: 'application/sql;charset=utf-8;' });
        this.downloadBlob(blob, options.filename);
      }
      
      console.log('✅ SQL export completed');
      return sqlString;
      
    } catch (error) {
      console.error('❌ SQL export failed:', error);
      throw error;
    }
  }

  /**
   * Bulk export to multiple formats
   */
  async bulkExport(data: any[], formats: string[]): Promise<any> {
    try {
      console.log('📦 Performing bulk export...');
      
      const results: any = {};
      const errors: any = {};
      
      for (const format of formats) {
        try {
          const timestamp = Date.now();
          const filename = `export_${timestamp}.${format}`;
          
          switch (format) {
            case 'csv':
              results.csv = await this.exportCSV(data, { filename });
              break;
            case 'json':
              results.json = await this.exportJSON(data, { filename });
              break;
            case 'excel':
              results.excel = await this.exportExcel(data, { filename });
              break;
            case 'pdf':
              results.pdf = await this.exportPDF(data, { filename });
              break;
            case 'xml':
              results.xml = await this.exportXML(data, { filename });
              break;
            case 'sql':
              results.sql = await this.exportSQL(data, { filename });
              break;
            default:
              errors[format] = `Unsupported format: ${format}`;
          }
        } catch (error) {
          errors[format] = error.message;
        }
      }
      
      const result = {
        success: Object.keys(results).length > 0,
        results: results,
        errors: errors,
        timestamp: new Date()
      };
      
      console.log('✅ Bulk export completed');
      return result;
      
    } catch (error) {
      console.error('❌ Bulk export failed:', error);
      throw error;
    }
  }

  // Private helper methods

  private setupExportTracking(): void {
    // Set up periodic cleanup of export history
    setInterval(() => {
      if (this.exportHistory.length > 1000) {
        this.exportHistory = this.exportHistory.slice(-1000);
      }
    }, 60000); // Clean every minute
  }

  private trackExport(exportInfo: any): void {
    this.exportHistory.push({
      ...exportInfo,
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  }

  private getExportHistory(): any[] {
    return this.exportHistory.slice(-100); // Return last 100 exports
  }

  private clearExportHistory(): void {
    this.exportHistory = [];
    console.log('🗑️ Export history cleared');
  }

  private calculateAverageExportTime(): number {
    if (this.exportHistory.length === 0) return 0;
    
    const totalTime = this.exportHistory.reduce((sum, exp) => sum + exp.executionTime, 0);
    return totalTime / this.exportHistory.length;
  }

  private calculateSuccessRate(): number {
    if (this.exportHistory.length === 0) return 100;
    
    const successfulExports = this.exportHistory.filter(exp => exp.success).length;
    return (successfulExports / this.exportHistory.length) * 100;
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

  private validateCapabilities(): any {
    const valid = [];
    const errors = [];
    
    this.capabilities.forEach(capability => {
      switch (capability) {
        case 'csv-export':
          if (typeof Papa !== 'undefined') {
            valid.push(capability);
          } else {
            errors.push(`${capability}: Papa Parse not available`);
          }
          break;
        case 'json-export':
          if (typeof JSON !== 'undefined') {
            valid.push(capability);
          } else {
            errors.push(`${capability}: JSON not available`);
          }
          break;
        default:
          valid.push(capability);
      }
    });
    
    return { valid, errors };
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }

  private createHTMLTable(data: any[], options: any = {}): string {
    const title = options.title || 'Data Export';
    
    let html = `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        tr:nth-child(even) { background-color: #f9f9f9; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <p>Generated on: ${new Date().toLocaleString()}</p>
    <table>
`;
    
    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      
      // Header row
      html += '<tr>';
      columns.forEach(column => {
        html += `<th>${column}</th>`;
      });
      html += '</tr>';
      
      // Data rows
      data.forEach(item => {
        html += '<tr>';
        columns.forEach(column => {
          const value = item[column] || '';
          html += `<td>${String(value).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;
        });
        html += '</tr>';
      });
    }
    
    html += `
    </table>
</body>
</html>`;
    
    return html;
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}