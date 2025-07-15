/**
 * Query Metrics Component
 * Displays query execution performance metrics
 */

import React from 'react';
import { Clock, Database, AlertTriangle, TrendingUp } from 'lucide-react';

interface QueryMetricsProps {
  executionTime: number;
  rowCount: number;
  error?: string;
}

export const QueryMetrics: React.FC<QueryMetricsProps> = ({
  executionTime,
  rowCount,
  error,
}) => {
  const getPerformanceLevel = (time: number) => {
    if (time < 100) return { level: 'excellent', color: 'green' };
    if (time < 500) return { level: 'good', color: 'blue' };
    if (time < 2000) return { level: 'fair', color: 'yellow' };
    return { level: 'slow', color: 'red' };
  };

  const performance = getPerformanceLevel(executionTime);

  const getPerformanceTip = () => {
    if (performance.level === 'slow') {
      return 'Consider adding WHERE clauses, LIMIT, or indexes to improve performance';
    }
    if (performance.level === 'fair') {
      return 'Query performance is acceptable but could be optimized';
    }
    return 'Excellent query performance!';
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-red-800">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Query Failed</span>
          <span className="text-sm">({executionTime.toFixed(2)}ms)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Execution Time */}
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            performance.color === 'green' ? 'bg-green-100' :
            performance.color === 'blue' ? 'bg-blue-100' :
            performance.color === 'yellow' ? 'bg-yellow-100' :
            'bg-red-100'
          }`}>
            <Clock className={`w-5 h-5 ${
              performance.color === 'green' ? 'text-green-600' :
              performance.color === 'blue' ? 'text-blue-600' :
              performance.color === 'yellow' ? 'text-yellow-600' :
              'text-red-600'
            }`} />
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {executionTime.toFixed(2)}ms
            </div>
            <div className="text-sm text-gray-600">Execution Time</div>
          </div>
        </div>

        {/* Row Count */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {rowCount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Rows Returned</div>
          </div>
        </div>

        {/* Performance Level */}
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            performance.color === 'green' ? 'bg-green-100' :
            performance.color === 'blue' ? 'bg-blue-100' :
            performance.color === 'yellow' ? 'bg-yellow-100' :
            'bg-red-100'
          }`}>
            <TrendingUp className={`w-5 h-5 ${
              performance.color === 'green' ? 'text-green-600' :
              performance.color === 'blue' ? 'text-blue-600' :
              performance.color === 'yellow' ? 'text-yellow-600' :
              'text-red-600'
            }`} />
          </div>
          <div>
            <div className={`text-lg font-semibold capitalize ${
              performance.color === 'green' ? 'text-green-900' :
              performance.color === 'blue' ? 'text-blue-900' :
              performance.color === 'yellow' ? 'text-yellow-900' :
              'text-red-900'
            }`}>
              {performance.level}
            </div>
            <div className="text-sm text-gray-600">Performance</div>
          </div>
        </div>
      </div>

      {/* Performance Tip */}
      <div className={`mt-4 p-3 rounded-lg border ${
        performance.color === 'green' ? 'bg-green-50 border-green-200' :
        performance.color === 'blue' ? 'bg-blue-50 border-blue-200' :
        performance.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}>
        <p className={`text-sm ${
          performance.color === 'green' ? 'text-green-800' :
          performance.color === 'blue' ? 'text-blue-800' :
          performance.color === 'yellow' ? 'text-yellow-800' :
          'text-red-800'
        }`}>
          💡 {getPerformanceTip()}
        </p>
      </div>
    </div>
  );
};