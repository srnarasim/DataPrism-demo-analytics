/**
 * CSV Data Processor Plugin
 * 
 * Implements the official DataPrism IDataProcessorPlugin interface
 * to provide CSV file processing capabilities with advanced validation
 * and schema detection.
 */

import Papa from 'papaparse';

// Interface implementation using official DataPrism plugin interfaces
export class CSVProcessorPlugin {
  readonly id = 'csv-processor';
  readonly name = 'CSV File Processor';
  readonly version = '2.0.0';
  readonly description = 'Process CSV files with advanced validation and schema detection';
  readonly type = 'data-processor';
  readonly capabilities = ['file-upload', 'data-validation', 'schema-detection', 'streaming'];

  private context: any;
  private batchSize = 1000;

  /**
   * Initialize the plugin with DataPrism context
   */
  async initialize(context: any): Promise<void> {
    console.log('🔄 Initializing CSV Processor Plugin...');
    this.context = context;
    
    // Set up plugin-specific configuration
    this.configureBatchSize();
    
    console.log('✅ CSV Processor Plugin initialized');
  }

  /**
   * Activate the plugin
   */
  async activate(): Promise<void> {
    console.log('▶️ CSV Processor Plugin activated');
  }

  /**
   * Deactivate the plugin
   */
  async deactivate(): Promise<void> {
    console.log('⏸️ CSV Processor Plugin deactivated');
  }

  /**
   * Dispose the plugin and clean up resources
   */
  async dispose(): Promise<void> {
    console.log('🗑️ CSV Processor Plugin disposed');
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
      message: 'CSV Processor Plugin is running',
      lastUpdate: new Date(),
      performance: {
        processedFiles: 0,
        totalProcessingTime: 0,
        averageProcessingTime: 0
      }
    };
  }

  /**
   * Process CSV data from various input sources
   */
  async processData(input: any): Promise<any> {
    const startTime = performance.now();
    
    try {
      console.log('🔄 Processing CSV data...');
      
      let data: any[] = [];
      let schema: any;
      
      if (input.file) {
        // Process from file
        const result = await this.processFile(input.file);
        data = result.data;
        schema = result.schema;
      } else if (input.data) {
        // Process from data array
        data = input.data;
        schema = await this.detectSchema(data);
      } else if (input.stream) {
        // Process from stream
        const result = await this.processStream(input.stream);
        data = result.data || [];
        schema = result.schema || { columns: [] };
      } else {
        throw new Error('Invalid input: must provide file, data, or stream');
      }

      // Validate processed data
      const validationResult = await this.validateData(data);
      
      const processingTime = performance.now() - startTime;
      
      const output = {
        data,
        schema,
        metadata: {
          rowCount: data.length,
          columns: schema.columns,
          processingTime,
          inputType: input.file ? 'file' : input.stream ? 'stream' : 'data',
          fileSize: input.file ? input.file.size : undefined,
          fileName: input.file ? input.file.name : undefined,
        },
        validationResults: validationResult.valid ? undefined : validationResult,
        qualityScore: this.calculateQualityScore(data, validationResult)
      };

      console.log(`✅ CSV processing completed in ${processingTime.toFixed(2)}ms`);
      return output;
      
    } catch (error) {
      console.error('❌ CSV processing failed:', error);
      throw error;
    }
  }

  /**
   * Validate CSV data
   */
  async validateData(data: any[]): Promise<any> {
    try {
      console.log('🔍 Validating CSV data...');
      
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Check if data exists
      if (!data || data.length === 0) {
        errors.push('No data provided or data is empty');
      }
      
      // Check data structure
      if (data.length > 0) {
        const firstRow = data[0];
        const expectedKeys = Object.keys(firstRow);
        
        // Check consistency across rows
        for (let i = 1; i < Math.min(data.length, 100); i++) {
          const currentKeys = Object.keys(data[i]);
          if (currentKeys.length !== expectedKeys.length) {
            warnings.push(`Row ${i} has different number of columns than expected`);
          }
        }
        
        // Check for empty values
        let emptyValueCount = 0;
        data.forEach((row, index) => {
          expectedKeys.forEach(key => {
            if (row[key] === null || row[key] === undefined || row[key] === '') {
              emptyValueCount++;
            }
          });
        });
        
        if (emptyValueCount > data.length * expectedKeys.length * 0.1) {
          warnings.push(`High percentage of empty values detected (${((emptyValueCount / (data.length * expectedKeys.length)) * 100).toFixed(1)}%)`);
        }
      }
      
      const result = {
        valid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          rowCount: data.length,
          emptyValuePercentage: data.length > 0 ? this.calculateEmptyValuePercentage(data) : 0,
          duplicateRowCount: this.countDuplicateRows(data),
          dataTypes: this.analyzeDataTypes(data)
        }
      };
      
      console.log(`✅ Data validation completed: ${result.valid ? 'Valid' : 'Invalid'}`);
      return result;
      
    } catch (error) {
      console.error('❌ Data validation failed:', error);
      return {
        valid: false,
        errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        metadata: {}
      };
    }
  }

  /**
   * Transform CSV data based on configuration
   */
  async transformData(data: any[], config: any): Promise<any[]> {
    try {
      console.log('🔄 Transforming CSV data...');
      
      let transformedData = [...data];
      
      if (config.operations) {
        for (const operation of config.operations) {
          transformedData = await this.applyTransformation(transformedData, operation);
        }
      }
      
      console.log('✅ Data transformation completed');
      return transformedData;
      
    } catch (error) {
      console.error('❌ Data transformation failed:', error);
      throw error;
    }
  }

  /**
   * Process CSV stream
   */
  async processStream(stream: ReadableStream): Promise<any> {
    try {
      console.log('🔄 Processing CSV stream...');
      
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const processedData: any[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            const parsedLine = this.parseCSVLine(line);
            if (parsedLine) {
              processedData.push(parsedLine);
            }
          }
        }
      }
      
      // Process remaining buffer
      if (buffer.trim()) {
        const parsedLine = this.parseCSVLine(buffer);
        if (parsedLine) {
          processedData.push(parsedLine);
        }
      }
      
      // Create new stream with processed data
      const processedStream = new ReadableStream({
        start(controller) {
          for (const item of processedData) {
            controller.enqueue(new TextEncoder().encode(JSON.stringify(item) + '\n'));
          }
          controller.close();
        }
      });
      
      console.log('✅ Stream processing completed');
      return {
        data: processedData,
        schema: await this.detectSchema(processedData)
      };
      
    } catch (error) {
      console.error('❌ Stream processing failed:', error);
      throw error;
    }
  }

  /**
   * Get batch size for processing
   */
  getBatchSize(): number {
    return this.batchSize;
  }

  // Private helper methods

  private async processFile(file: File): Promise<{ data: any[], schema: any }> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        complete: async (results: any) => {
          try {
            const schema = await this.detectSchema(results.data);
            resolve({ data: results.data, schema });
          } catch (error) {
            reject(error);
          }
        },
        error: (error: any) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        }
      });
    });
  }

  private async detectSchema(data: any[]): Promise<any> {
    if (!data || data.length === 0) {
      return { columns: [], rowCount: 0 };
    }

    const firstRow = data[0];
    const columns = Object.keys(firstRow).map(key => {
      const dataType = this.detectColumnType(data, key);
      const statistics = this.calculateColumnStatistics(data, key, dataType);
      
      return {
        name: key,
        type: dataType,
        nullable: statistics.nullCount > 0,
        unique: statistics.uniqueCount === data.length,
        statistics
      };
    });

    return {
      columns,
      rowCount: data.length,
      metadata: {
        detectedAt: new Date().toISOString(),
        sampleSize: data.length
      }
    };
  }

  private detectColumnType(data: any[], columnName: string): string {
    const sampleSize = Math.min(100, data.length);
    let numberCount = 0;
    let dateCount = 0;
    let booleanCount = 0;
    
    for (let i = 0; i < sampleSize; i++) {
      const value = data[i][columnName];
      
      if (value === null || value === undefined || value === '') {
        continue;
      }
      
      // Check if number
      if (!isNaN(Number(value))) {
        numberCount++;
      }
      
      // Check if date
      if (Date.parse(value)) {
        dateCount++;
      }
      
      // Check if boolean
      if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
        booleanCount++;
      }
    }
    
    const threshold = sampleSize * 0.8;
    
    if (numberCount > threshold) return 'number';
    if (dateCount > threshold) return 'date';
    if (booleanCount > threshold) return 'boolean';
    
    return 'string';
  }

  private calculateColumnStatistics(data: any[], columnName: string, dataType: string): any {
    const values = data.map(row => row[columnName]).filter(v => v !== null && v !== undefined && v !== '');
    const nullCount = data.length - values.length;
    const uniqueValues = new Set(values);
    
    const stats: any = {
      nullCount,
      uniqueCount: uniqueValues.size,
      nullPercentage: (nullCount / data.length) * 100,
      sampleValues: Array.from(uniqueValues).slice(0, 10)
    };
    
    if (dataType === 'number') {
      const numbers = values.map(v => Number(v)).filter(n => !isNaN(n));
      if (numbers.length > 0) {
        stats.min = Math.min(...numbers);
        stats.max = Math.max(...numbers);
        stats.average = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        stats.median = this.calculateMedian(numbers);
      }
    }
    
    if (dataType === 'string') {
      const lengths = values.map(v => String(v).length);
      if (lengths.length > 0) {
        stats.minLength = Math.min(...lengths);
        stats.maxLength = Math.max(...lengths);
        stats.averageLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      }
    }
    
    return stats;
  }

  private calculateMedian(numbers: number[]): number {
    const sorted = numbers.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculateEmptyValuePercentage(data: any[]): number {
    if (data.length === 0) return 0;
    
    const firstRow = data[0];
    const totalCells = data.length * Object.keys(firstRow).length;
    let emptyCells = 0;
    
    data.forEach(row => {
      Object.values(row).forEach(value => {
        if (value === null || value === undefined || value === '') {
          emptyCells++;
        }
      });
    });
    
    return (emptyCells / totalCells) * 100;
  }

  private countDuplicateRows(data: any[]): number {
    const seen = new Set();
    let duplicates = 0;
    
    data.forEach(row => {
      const key = JSON.stringify(row);
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    });
    
    return duplicates;
  }

  private analyzeDataTypes(data: any[]): Record<string, string> {
    if (data.length === 0) return {};
    
    const firstRow = data[0];
    const dataTypes: Record<string, string> = {};
    
    Object.keys(firstRow).forEach(key => {
      dataTypes[key] = this.detectColumnType(data, key);
    });
    
    return dataTypes;
  }

  private calculateQualityScore(data: any[], validationResult: any): number {
    let score = 100;
    
    // Deduct points for errors
    if (validationResult.errors && validationResult.errors.length > 0) {
      score -= validationResult.errors.length * 20;
    }
    
    // Deduct points for warnings
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      score -= validationResult.warnings.length * 5;
    }
    
    // Deduct points for empty values
    if (validationResult.metadata && validationResult.metadata.emptyValuePercentage > 10) {
      score -= validationResult.metadata.emptyValuePercentage;
    }
    
    // Deduct points for duplicates
    if (validationResult.metadata && validationResult.metadata.duplicateRowCount > 0) {
      score -= (validationResult.metadata.duplicateRowCount / data.length) * 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private async applyTransformation(data: any[], operation: any): Promise<any[]> {
    switch (operation.type) {
      case 'filter':
        return data.filter(row => this.evaluateFilter(row, operation.params));
      case 'sort':
        return data.sort((a, b) => this.compareValues(a[operation.params.column], b[operation.params.column], operation.params.direction));
      case 'transform':
        return data.map(row => this.transformRow(row, operation.params));
      default:
        throw new Error(`Unknown transformation type: ${operation.type}`);
    }
  }

  private evaluateFilter(row: any, params: any): boolean {
    const value = row[params.column];
    switch (params.operator) {
      case 'equals':
        return value === params.value;
      case 'contains':
        return String(value).includes(params.value);
      case 'greater':
        return Number(value) > Number(params.value);
      case 'less':
        return Number(value) < Number(params.value);
      default:
        return true;
    }
  }

  private compareValues(a: any, b: any, direction: string): number {
    if (a === b) return 0;
    const result = a < b ? -1 : 1;
    return direction === 'desc' ? -result : result;
  }

  private transformRow(row: any, params: any): any {
    const newRow = { ...row };
    
    if (params.rename) {
      Object.keys(params.rename).forEach(oldKey => {
        const newKey = params.rename[oldKey];
        newRow[newKey] = newRow[oldKey];
        delete newRow[oldKey];
      });
    }
    
    if (params.compute) {
      Object.keys(params.compute).forEach(newKey => {
        const formula = params.compute[newKey];
        newRow[newKey] = this.evaluateFormula(newRow, formula);
      });
    }
    
    return newRow;
  }

  private evaluateFormula(row: any, formula: string): any {
    // Simple formula evaluation (can be extended)
    try {
      return eval(formula.replace(/\$(\w+)/g, (match, column) => row[column] || 0));
    } catch (error) {
      return null;
    }
  }

  private parseCSVLine(line: string): any | null {
    try {
      const result = Papa.parse(line, { header: false });
      return result.data[0];
    } catch (error) {
      return null;
    }
  }

  private configureBatchSize(): void {
    // Configure batch size based on available memory and performance
    const memoryMB = (performance as any).memory?.usedJSHeapSize / (1024 * 1024) || 100;
    
    if (memoryMB < 50) {
      this.batchSize = 500;
    } else if (memoryMB < 100) {
      this.batchSize = 1000;
    } else {
      this.batchSize = 2000;
    }
    
    console.log(`📊 CSV Processor batch size configured to: ${this.batchSize}`);
  }
}