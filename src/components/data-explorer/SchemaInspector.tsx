/**
 * Schema Inspector Component
 * Displays table schema, column statistics, and data quality metrics
 */

import React, { useMemo } from 'react';
import { Download, Info } from 'lucide-react';

interface ColumnDefinition {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
}

interface SchemaInspectorProps {
  columns: ColumnDefinition[];
  data: any[];
  tableName: string;
}

interface ColumnStats {
  name: string;
  type: string;
  nullable: boolean;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  min?: number | string;
  max?: number | string;
  avg?: number;
  sampleValues: any[];
}

export const SchemaInspector: React.FC<SchemaInspectorProps> = ({
  columns,
  data,
  tableName,
}) => {
  const columnStats = useMemo(() => {
    return columns.map((column): ColumnStats => {
      const values = data.map(row => row[column.name]);
      const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
      const nullCount = values.length - nonNullValues.length;
      const uniqueValues = new Set(nonNullValues);
      
      let min: number | string | undefined;
      let max: number | string | undefined;
      let avg: number | undefined;
      
      if (column.type === 'number' && nonNullValues.length > 0) {
        const numbers = nonNullValues.map(v => Number(v)).filter(n => !isNaN(n));
        if (numbers.length > 0) {
          min = Math.min(...numbers);
          max = Math.max(...numbers);
          avg = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
        }
      } else if (column.type === 'string' && nonNullValues.length > 0) {
        const lengths = nonNullValues.map(v => String(v).length);
        min = Math.min(...lengths);
        max = Math.max(...lengths);
      } else if (column.type === 'date' && nonNullValues.length > 0) {
        const dates = nonNullValues
          .map(v => new Date(v))
          .filter(d => !isNaN(d.getTime()));
        if (dates.length > 0) {
          min = new Date(Math.min(...dates.map(d => d.getTime()))).toLocaleDateString();
          max = new Date(Math.max(...dates.map(d => d.getTime()))).toLocaleDateString();
        }
      }
      
      return {
        name: column.name,
        type: column.type,
        nullable: column.nullable,
        nullCount,
        nullPercentage: (nullCount / values.length) * 100,
        uniqueCount: uniqueValues.size,
        min,
        max,
        avg,
        sampleValues: Array.from(uniqueValues).slice(0, 5),
      };
    });
  }, [columns, data]);

  const exportSchema = () => {
    const schemaData = {
      tableName,
      rowCount: data.length,
      columnCount: columns.length,
      columns: columnStats.map(stat => ({
        name: stat.name,
        type: stat.type,
        nullable: stat.nullable,
        nullPercentage: stat.nullPercentage,
        uniqueCount: stat.uniqueCount,
        ...(stat.min !== undefined && { min: stat.min }),
        ...(stat.max !== undefined && { max: stat.max }),
        ...(stat.avg !== undefined && { avg: stat.avg }),
      })),
    };
    
    const blob = new Blob([JSON.stringify(schemaData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}_schema.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'number': return 'bg-blue-100 text-blue-800';
      case 'string': return 'bg-green-100 text-green-800';
      case 'date': return 'bg-purple-100 text-purple-800';
      case 'boolean': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDataQualityColor = (percentage: number) => {
    if (percentage === 0) return 'text-green-600';
    if (percentage < 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Schema Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Schema Overview</h3>
          <button
            onClick={exportSchema}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {data.length.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Rows</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {columns.length}
            </div>
            <div className="text-sm text-gray-600">Columns</div>
          </div>
        </div>

        {/* Column Details */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Columns</h4>
          {columnStats.map((stat) => (
            <div key={stat.name} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h5 className="font-medium text-gray-900">{stat.name}</h5>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTypeColor(stat.type)}`}>
                    {stat.type}
                  </span>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <div>{stat.uniqueCount.toLocaleString()} unique</div>
                  <div className={getDataQualityColor(stat.nullPercentage)}>
                    {stat.nullPercentage.toFixed(1)}% null
                  </div>
                </div>
              </div>

              {/* Statistics */}
              {(stat.min !== undefined || stat.max !== undefined || stat.avg !== undefined) && (
                <div className="bg-gray-50 rounded p-3 mb-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">Statistics</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {stat.min !== undefined && (
                      <div>
                        <div className="text-gray-500">Min</div>
                        <div className="font-medium">{stat.min}</div>
                      </div>
                    )}
                    {stat.max !== undefined && (
                      <div>
                        <div className="text-gray-500">Max</div>
                        <div className="font-medium">{stat.max}</div>
                      </div>
                    )}
                    {stat.avg !== undefined && (
                      <div>
                        <div className="text-gray-500">Avg</div>
                        <div className="font-medium">{stat.avg.toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sample Values */}
              {stat.sampleValues.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-2">Sample Values</div>
                  <div className="flex flex-wrap gap-1">
                    {stat.sampleValues.map((value, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {String(value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data Quality Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Quality</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Completeness</span>
            <span className="text-sm font-medium">
              {((1 - columnStats.reduce((sum, stat) => sum + stat.nullPercentage, 0) / (columnStats.length * 100)) * 100).toFixed(1)}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Unique Columns</span>
            <span className="text-sm font-medium">
              {columnStats.filter(stat => stat.uniqueCount === data.length).length} / {columnStats.length}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Nullable Columns</span>
            <span className="text-sm font-medium">
              {columnStats.filter(stat => stat.nullable).length} / {columnStats.length}
            </span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Data Quality Tips</p>
              <ul className="mt-1 text-xs space-y-1">
                <li>• Columns with high null percentages may need cleaning</li>
                <li>• Unique columns could be used as identifiers</li>
                <li>• Check min/max values for outliers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};