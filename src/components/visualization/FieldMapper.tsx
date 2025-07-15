/**
 * Field Mapper Component
 * Configure data field mappings for chart axes and grouping
 */

import React from 'react';
import { Settings, X, Group, Calculator } from 'lucide-react';

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

interface FieldMapperProps {
  data: any[];
  columns: Array<{ name: string; type: string }>;
  config: ChartConfig;
  onConfigChange: (newConfig: Partial<ChartConfig>) => void;
}

export const FieldMapper: React.FC<FieldMapperProps> = ({
  data,
  columns,
  config,
  onConfigChange,
}) => {
  const categoricalColumns = columns.filter(col => 
    col.type === 'string' || col.type === 'text'
  );
  
  const numericalColumns = columns.filter(col => 
    col.type === 'number' || col.type === 'integer' || col.type === 'float'
  );

  const getFieldLabel = (chartType: string) => {
    switch (chartType) {
      case 'pie':
        return {
          x: 'Category Field',
          y: 'Value Field',
        };
      case 'line':
        return {
          x: 'X-Axis (Time/Sequence)',
          y: 'Y-Axis (Values)',
        };
      default:
        return {
          x: 'X-Axis (Categories)',
          y: 'Y-Axis (Values)',
        };
    }
  };

  const fieldLabels = getFieldLabel(config.type);

  const aggregationOptions = [
    { value: 'sum', label: 'Sum', description: 'Add all values' },
    { value: 'avg', label: 'Average', description: 'Mean of values' },
    { value: 'count', label: 'Count', description: 'Number of records' },
    { value: 'min', label: 'Minimum', description: 'Smallest value' },
    { value: 'max', label: 'Maximum', description: 'Largest value' },
  ];

  const presetColors = [
    ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
    ['#1F2937', '#6B7280', '#9CA3AF', '#D1D5DB', '#F3F4F6'],
    ['#DC2626', '#EA580C', '#D97706', '#65A30D', '#059669'],
    ['#7C3AED', '#C026D3', '#DB2777', '#E11D48', '#DC2626'],
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="w-4 h-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">Field Mapping</h3>
      </div>
      
      <div className="space-y-4">
        {/* X-Axis Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-1">
              <X className="w-4 h-4" />
              <span>{fieldLabels.x}</span>
            </div>
          </label>
          <select
            value={config.xAxis}
            onChange={(e) => onConfigChange({ xAxis: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select field...</option>
            {columns.map((column) => (
              <option key={column.name} value={column.name}>
                {column.name} ({column.type})
              </option>
            ))}
          </select>
        </div>

        {/* Y-Axis Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-1">
              <span className="w-4 h-4 text-center font-mono text-sm">Y</span>
              <span>{fieldLabels.y}</span>
            </div>
          </label>
          <select
            value={config.yAxis}
            onChange={(e) => onConfigChange({ yAxis: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select field...</option>
            {columns.map((column) => (
              <option key={column.name} value={column.name}>
                {column.name} ({column.type})
              </option>
            ))}
          </select>
        </div>

        {/* Group By Field (optional) */}
        {config.type !== 'pie' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-1">
                <Group className="w-4 h-4" />
                <span>Group By (Optional)</span>
              </div>
            </label>
            <select
              value={config.groupBy || ''}
              onChange={(e) => onConfigChange({ groupBy: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">No grouping</option>
              {categoricalColumns.map((column) => (
                <option key={column.name} value={column.name}>
                  {column.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Aggregation */}
        {numericalColumns.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-1">
                <Calculator className="w-4 h-4" />
                <span>Aggregation</span>
              </div>
            </label>
            <select
              value={config.aggregation || 'sum'}
              onChange={(e) => onConfigChange({ aggregation: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {aggregationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Chart Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chart Title
          </label>
          <input
            type="text"
            value={config.title || ''}
            onChange={(e) => onConfigChange({ title: e.target.value })}
            placeholder="Enter chart title..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Color Scheme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Color Scheme
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presetColors.map((colors, index) => (
              <button
                key={index}
                onClick={() => onConfigChange({ colors })}
                className={`flex space-x-1 p-2 border rounded-md transition-colors ${
                  JSON.stringify(config.colors) === JSON.stringify(colors)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {colors.map((color, colorIndex) => (
                  <div
                    key={colorIndex}
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </button>
            ))}
          </div>
        </div>

        {/* Data Preview */}
        {config.xAxis && config.yAxis && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Data Preview</h4>
            <div className="bg-gray-50 rounded p-3">
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>X-Axis:</strong> {config.xAxis}</p>
                <p><strong>Y-Axis:</strong> {config.yAxis}</p>
                {config.groupBy && <p><strong>Grouped by:</strong> {config.groupBy}</p>}
                <p><strong>Records:</strong> {data.length.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};