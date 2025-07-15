/**
 * Chart Exporter Component
 * Export charts as images or data
 */

import React from 'react';
import { Download, Image, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';

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

interface ChartExporterProps {
  chartConfig: ChartConfig;
}

export const ChartExporter: React.FC<ChartExporterProps> = ({ chartConfig }) => {
  const exportAsPNG = async () => {
    try {
      // Find the chart canvas element
      const chartContainer = document.querySelector('[data-testid="chart-container"]') as HTMLElement;
      if (!chartContainer) {
        // Fallback to any canvas element
        const canvas = document.querySelector('canvas');
        if (canvas) {
          const link = document.createElement('a');
          link.download = `chart_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
          link.href = canvas.toDataURL();
          link.click();
          return;
        }
        console.warn('Chart canvas not found for export');
        return;
      }

      const canvas = await html2canvas(chartContainer);

      const link = document.createElement('a');
      link.download = `chart_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Failed to export chart as PNG:', error);
    }
  };

  const exportAsJSON = () => {
    try {
      const exportData = {
        chartConfig,
        exportedAt: new Date().toISOString(),
        dataPoints: chartConfig.data.length,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chart_config_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export chart configuration:', error);
    }
  };

  const exportAsCSV = () => {
    try {
      if (!chartConfig.data || chartConfig.data.length === 0) {
        console.warn('No data to export');
        return;
      }

      // Get the columns that are being used in the chart
      const columns = [chartConfig.xAxis, chartConfig.yAxis];
      if (chartConfig.groupBy) {
        columns.push(chartConfig.groupBy);
      }

      // Create CSV header
      const header = columns.join(',');
      
      // Create CSV rows
      const rows = chartConfig.data.map(row => 
        columns.map(col => {
          const value = row[col];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        }).join(',')
      );

      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chart_data_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export chart data as CSV:', error);
    }
  };

  const hasData = chartConfig.data && chartConfig.data.length > 0;
  const hasConfig = chartConfig.xAxis && chartConfig.yAxis;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Chart</h3>
      
      <div className="space-y-3">
        <button
          onClick={exportAsPNG}
          disabled={!hasConfig || !hasData}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Image className="w-4 h-4 mr-2" />
          Export as PNG
        </button>

        <button
          onClick={exportAsCSV}
          disabled={!hasData}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-4 h-4 mr-2" />
          Export Data as CSV
        </button>

        <button
          onClick={exportAsJSON}
          disabled={!hasConfig}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Configuration
        </button>
      </div>

      {!hasData && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            No data available for export. Execute a query first.
          </p>
        </div>
      )}

      {!hasConfig && hasData && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            Configure chart fields to enable chart export.
          </p>
        </div>
      )}
    </div>
  );
};