/**
 * Visualization Page
 * Create charts and visualizations from query results
 */

import React, { useState, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { ChartTypeSelector } from '@/components/visualization/ChartTypeSelector';
import { FieldMapper } from '@/components/visualization/FieldMapper';
import { ChartRenderer } from '@/components/visualization/ChartRenderer';
import { ChartExporter } from '@/components/visualization/ChartExporter';
import { useDataPrism } from '@/contexts/DataPrismContext';
import { BarChart3 } from 'lucide-react';

interface ChartConfig {
  type: 'bar' | 'line' | 'pie';
  data: any[];
  xAxis: string;
  yAxis: string;
  groupBy?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  title?: string;
  colors?: string[];
}

interface QueryResult {
  data: any[];
  columns: Array<{ name: string; type: string }>;
  query: string;
}

export const VisualizationPage: React.FC = () => {
  const { engine, isInitialized } = useDataPrism();
  const [queryInput, setQueryInput] = useState('SELECT region, COUNT(*) as count FROM sales GROUP BY region;');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: 'bar',
    data: [],
    xAxis: '',
    yAxis: '',
    aggregation: 'sum',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = useCallback(async () => {
    if (!engine || !queryInput.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await engine.query(queryInput);
      
      if (result.error) {
        throw new Error(result.error.message || 'Query failed');
      }

      const queryResult: QueryResult = {
        data: result.data || [],
        columns: result.metadata?.columns || [],
        query: queryInput,
      };

      setQueryResult(queryResult);
      
      // Auto-configure chart if we have data
      if (queryResult.data.length > 0 && queryResult.columns.length >= 2) {
        const firstTextColumn = queryResult.columns.find(col => 
          col.type === 'string' || col.type === 'text'
        );
        const firstNumberColumn = queryResult.columns.find(col => 
          col.type === 'number' || col.type === 'integer' || col.type === 'float'
        );

        if (firstTextColumn && firstNumberColumn) {
          setChartConfig(prev => ({
            ...prev,
            data: queryResult.data,
            xAxis: firstTextColumn.name,
            yAxis: firstNumberColumn.name,
          }));
        }
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute query');
    } finally {
      setIsLoading(false);
    }
  }, [engine, queryInput]);

  const handleConfigChange = (newConfig: Partial<ChartConfig>) => {
    setChartConfig(prev => ({ ...prev, ...newConfig }));
  };

  const sampleQueries = [
    'SELECT region, COUNT(*) as count FROM sales GROUP BY region;',
    'SELECT product, SUM(total) as revenue FROM sales GROUP BY product ORDER BY revenue DESC LIMIT 10;',
    'SELECT DATE(date) as date, SUM(total) as daily_sales FROM sales GROUP BY DATE(date) ORDER BY date;',
    'SELECT device, AVG(duration) as avg_duration FROM analytics GROUP BY device;',
    'SELECT category, AVG(price) as avg_price FROM products GROUP BY category;',
  ];

  if (!isInitialized) {
    return (
      <Layout title="Visualization Studio" description="Create charts from your data">
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
      title="Visualization Studio" 
      description="Create interactive charts and visualizations from your data"
    >
      <div className="space-y-6">
        {/* Query Input */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Query</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SQL Query
              </label>
              <textarea
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="Enter your SQL query..."
              />
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={executeQuery}
                disabled={isLoading || !queryInput.trim()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                {isLoading ? 'Executing...' : 'Execute Query'}
              </button>

              <div className="text-sm text-gray-500">
                Results will be used for visualization
              </div>
            </div>

            {/* Sample Queries */}
            {!queryResult && (
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Sample Queries:</p>
                <div className="grid grid-cols-1 gap-2">
                  {sampleQueries.map((query, index) => (
                    <button
                      key={index}
                      onClick={() => setQueryInput(query)}
                      className="text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200 transition-colors"
                    >
                      <code className="font-mono text-xs">{query}</code>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Chart Configuration */}
        {queryResult && queryResult.data.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-1 space-y-6">
              <ChartTypeSelector
                selectedType={chartConfig.type}
                onTypeChange={(type) => handleConfigChange({ type })}
              />

              <FieldMapper
                data={queryResult.data}
                columns={queryResult.columns}
                config={chartConfig}
                onConfigChange={handleConfigChange}
              />

              <ChartExporter chartConfig={chartConfig} />
            </div>

            {/* Chart Display */}
            <div className="lg:col-span-2">
              <ChartRenderer config={chartConfig} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!queryResult && !isLoading && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No data to visualize</h3>
            <p className="text-gray-600">
              Execute a query to start creating visualizations
            </p>
          </div>
        )}

        {/* No Results State */}
        {queryResult && queryResult.data.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results from query</h3>
            <p className="text-gray-600">
              Try a different query that returns data
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};