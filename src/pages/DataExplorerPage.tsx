/**
 * Data Explorer Page
 * Implements file upload, data preview, and schema inspection
 */

import React, { useState, useCallback } from 'react';
import { Database } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { FileUploader } from '@/components/data-explorer/FileUploader';
import { DataTable } from '@/components/data-explorer/DataTable';
import { SchemaInspector } from '@/components/data-explorer/SchemaInspector';
import { useDataPrism } from '@/contexts/DataPrismContext';

interface Dataset {
  name: string;
  data: any[];
  columns: ColumnDefinition[];
  rowCount: number;
  uploadedAt: Date;
}

interface ColumnDefinition {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
}

export const DataExplorerPage: React.FC = () => {
  const { engine, isInitialized } = useDataPrism();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File, parsedData: any[]) => {
    if (!engine) {
      setError('DataPrism engine not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tableName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      
      // Load data into DataPrism engine
      await engine.loadData(parsedData, tableName);
      
      // Infer column types from parsed data
      const columns = inferColumnTypes(parsedData);
      
      const dataset: Dataset = {
        name: tableName,
        data: parsedData,
        columns,
        rowCount: parsedData.length,
        uploadedAt: new Date(),
      };

      setDatasets(prev => [...prev, dataset]);
      setSelectedDataset(dataset);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  }, [engine]);

  const inferColumnTypes = (data: any[]): ColumnDefinition[] => {
    if (data.length === 0) return [];
    
    const sample = data[0];
    return Object.keys(sample).map(key => {
      const values = data.slice(0, 100).map(row => row[key]); // Sample first 100 rows
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      
      let type: ColumnDefinition['type'] = 'string';
      
      if (nonNullValues.length > 0) {
        // Check if all non-null values are numbers
        if (nonNullValues.every(v => typeof v === 'number' || !isNaN(Number(v)))) {
          type = 'number';
        }
        // Check if values look like dates
        else if (nonNullValues.some(v => !isNaN(Date.parse(String(v))))) {
          type = 'date';
        }
        // Check if values are booleans
        else if (nonNullValues.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) {
          type = 'boolean';
        }
      }
      
      return {
        name: key,
        type,
        nullable: values.length !== nonNullValues.length,
      };
    });
  };

  if (!isInitialized) {
    return (
      <Layout title="Data Explorer" description="Upload and explore your datasets">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing DataPrism engine...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title="Data Explorer" 
      description="Upload CSV files and explore your data with powerful analytics"
    >
      <div className="space-y-6">
        {/* File Upload Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upload Dataset
          </h2>
          <FileUploader
            onUpload={handleFileUpload}
            isLoading={isLoading}
            error={error}
          />
        </div>

        {/* Dataset List */}
        {datasets.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Uploaded Datasets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasets.map((dataset, index) => (
                <div
                  key={index}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedDataset === dataset
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDataset(dataset)}
                >
                  <h3 className="font-medium text-gray-900">{dataset.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {dataset.rowCount.toLocaleString()} rows, {dataset.columns.length} columns
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploaded {dataset.uploadedAt.toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Preview and Schema */}
        {selectedDataset && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Data Table */}
            <div className="lg:col-span-2">
              <DataTable
                data={selectedDataset.data}
                columns={selectedDataset.columns}
                tableName={selectedDataset.name}
              />
            </div>

            {/* Schema Inspector */}
            <div className="lg:col-span-1">
              <SchemaInspector
                columns={selectedDataset.columns}
                data={selectedDataset.data}
                tableName={selectedDataset.name}
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {datasets.length === 0 && (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No datasets uploaded</h3>
            <p className="text-gray-600">
              Upload a CSV file to start exploring your data
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};