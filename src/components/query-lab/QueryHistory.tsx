/**
 * Query History Component
 * Shows recent query executions with status and timing
 */

import React from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface QueryExecution {
  id: string;
  sql: string;
  result?: {
    data: any[];
    metadata: {
      rowCount: number;
      executionTime: number;
      columns: { name: string; type: string }[];
    };
  };
  error?: string;
  executedAt: Date;
  executionTime: number;
}

interface QueryHistoryProps {
  queries: QueryExecution[];
  onLoadQuery: (query: QueryExecution) => void;
}

export const QueryHistory: React.FC<QueryHistoryProps> = ({ queries, onLoadQuery }) => {
  const formatSql = (sql: string) => {
    return sql.length > 60 ? sql.substring(0, 60) + '...' : sql;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-4 h-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">Recent Queries</h3>
      </div>

      {queries.length === 0 ? (
        <p className="text-sm text-gray-500">No queries executed yet</p>
      ) : (
        <div className="space-y-2">
          {queries.slice(0, 10).map((query) => (
            <div
              key={query.id}
              className="p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onLoadQuery(query)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {query.error ? (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                  <span className={`text-xs px-2 py-1 rounded ${
                    query.error 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {query.error ? 'Error' : 'Success'}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTime(query.executedAt)}
                </span>
              </div>

              <div className="mb-2">
                <code className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded block">
                  {formatSql(query.sql)}
                </code>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>
                  {query.result 
                    ? `${query.result.metadata.rowCount} rows`
                    : 'No results'
                  }
                </span>
                <span>{query.executionTime.toFixed(1)}ms</span>
              </div>

              {query.error && (
                <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  {query.error.length > 100 
                    ? query.error.substring(0, 100) + '...'
                    : query.error
                  }
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};