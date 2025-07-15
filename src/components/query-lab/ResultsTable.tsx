/**
 * Results Table Component
 * Displays query results with export functionality
 */

import React, { useState } from 'react';
import { Download, Copy, AlertCircle, CheckCircle } from 'lucide-react';

interface ResultsTableProps {
  data: any[];
  columns: Array<{ name: string; type: string }>;
  error?: string;
  executionTime: number;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  data,
  columns,
  error,
  executionTime,
}) => {
  const [copied, setCopied] = useState(false);

  const exportAsCSV = () => {
    if (data.length === 0) return;

    const headers = columns.map(col => col.name).join(',');
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col.name];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = () => {
    if (data.length === 0) return;

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (data.length === 0) return;

    try {
      const text = data.map(row => 
        columns.map(col => row[col.name] || '').join('\t')
      ).join('\n');
      
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <AlertCircle className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Query Error</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <pre className="text-sm text-red-800 whitespace-pre-wrap">{error}</pre>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Query executed successfully</h3>
          <p className="text-gray-600">No results returned</p>
          <p className="text-sm text-gray-500 mt-1">
            Execution time: {executionTime.toFixed(2)}ms
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Query Results</h3>
          <p className="text-sm text-gray-600">
            {data.length.toLocaleString()} rows • {executionTime.toFixed(2)}ms
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </>
            )}
          </button>
          
          <button
            onClick={exportAsCSV}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </button>
          
          <button
            onClick={exportAsJSON}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            JSON
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.name}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.name}</span>
                    <span className="text-gray-400">({column.type})</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.slice(0, 1000).map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatValue(row[column.name])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > 1000 && (
        <div className="p-4 border-t border-gray-200 bg-yellow-50">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Only the first 1,000 rows are displayed. 
            Export to CSV or JSON to see all {data.length.toLocaleString()} results.
          </p>
        </div>
      )}
    </div>
  );
};

const formatValue = (value: any) => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">null</span>;
  }
  
  if (typeof value === 'boolean') {
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {String(value)}
      </span>
    );
  }
  
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  
  return String(value);
};