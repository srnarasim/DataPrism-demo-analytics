/**
 * SQL Editor Component
 * Monaco Editor with SQL syntax highlighting and execution controls
 */

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Save, HelpCircle } from 'lucide-react';

interface SQLEditorProps {
  value: string;
  onChange: (value: string) => void;
  onExecute: (sql: string) => void;
  isExecuting: boolean;
  onSave: (name: string) => void;
}

export const SQLEditor: React.FC<SQLEditorProps> = ({
  value,
  onChange,
  onExecute,
  isExecuting,
  onSave,
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [queryName, setQueryName] = useState('');

  const handleExecute = () => {
    if (!isExecuting && value.trim()) {
      onExecute(value);
    }
  };

  const handleSave = () => {
    if (queryName.trim()) {
      onSave(queryName);
      setQueryName('');
      setShowSaveDialog(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const exampleQueries = [
    'SELECT * FROM sales LIMIT 10;',
    'SELECT region, COUNT(*) as count FROM sales GROUP BY region;',
    'SELECT AVG(total) as avg_sale FROM sales;',
    'SELECT * FROM analytics WHERE device = \'mobile\';',
    'SELECT name, price FROM products ORDER BY price DESC LIMIT 5;',
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExecute}
            disabled={isExecuting || !value.trim()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isExecuting ? 'Running...' : 'Execute'}
          </button>
          
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={!value.trim()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </button>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd>
          <span>to execute</span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0" onKeyDown={handleKeyDown}>
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={value}
          onChange={(value) => onChange(value || '')}
          theme="vs"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            folding: true,
            renderLineHighlight: 'all',
          }}
        />
      </div>

      {/* Example Queries */}
      {!value.trim() && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 mb-3">
            <HelpCircle className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Example Queries</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {exampleQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => onChange(query)}
                className="text-left p-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded border border-transparent hover:border-gray-200 transition-colors"
              >
                <code className="font-mono">{query}</code>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Query</h3>
            <input
              type="text"
              placeholder="Enter query name..."
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                } else if (e.key === 'Escape') {
                  setShowSaveDialog(false);
                }
              }}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!queryName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};