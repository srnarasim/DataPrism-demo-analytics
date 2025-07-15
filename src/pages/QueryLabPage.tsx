/**
 * Query Lab Page
 * SQL editor with syntax highlighting, query execution, and results display
 */

import React, { useState, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { SQLEditor } from '@/components/query-lab/SQLEditor';
import { ResultsTable } from '@/components/query-lab/ResultsTable';
import { QueryHistory } from '@/components/query-lab/QueryHistory';
import { QueryMetrics } from '@/components/query-lab/QueryMetrics';
import { useDataPrism } from '@/contexts/DataPrismContext';

interface QueryResult {
  data: any[];
  metadata: {
    rowCount: number;
    executionTime: number;
    columns: Array<{ name: string; type: string }>;
  };
  error?: string;
}

interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  savedAt: Date;
}

interface QueryExecution {
  id: string;
  sql: string;
  result?: QueryResult;
  error?: string;
  executedAt: Date;
  executionTime: number;
}

export const QueryLabPage: React.FC = () => {
  const { engine, isInitialized } = useDataPrism();
  const [currentQuery, setCurrentQuery] = useState('SELECT * FROM sales LIMIT 10;');
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryExecution[]>([]);

  const executeQuery = useCallback(async (sql: string) => {
    if (!engine || !sql.trim()) return;

    setIsExecuting(true);
    const startTime = performance.now();
    const executionId = Date.now().toString();

    try {
      const result = await engine.query(sql);
      const executionTime = performance.now() - startTime;

      const queryResult: QueryResult = {
        data: result.data || [],
        metadata: {
          rowCount: result.data?.length || 0,
          executionTime,
          columns: result.metadata?.columns || [],
        },
        error: result.error?.message,
      };

      setQueryResult(queryResult);

      // Add to history
      const execution: QueryExecution = {
        id: executionId,
        sql,
        result: queryResult,
        executedAt: new Date(),
        executionTime,
      };

      setQueryHistory(prev => [execution, ...prev.slice(0, 19)]); // Keep last 20
      
    } catch (error) {
      const executionTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setQueryResult({
        data: [],
        metadata: { rowCount: 0, executionTime, columns: [] },
        error: errorMessage,
      });

      // Add error to history
      const execution: QueryExecution = {
        id: executionId,
        sql,
        error: errorMessage,
        executedAt: new Date(),
        executionTime,
      };

      setQueryHistory(prev => [execution, ...prev.slice(0, 19)]);
    } finally {
      setIsExecuting(false);
    }
  }, [engine]);

  const saveQuery = useCallback(async (name: string) => {
    if (!currentQuery.trim() || !name.trim()) return;

    const savedQuery: SavedQuery = {
      id: Date.now().toString(),
      name,
      sql: currentQuery,
      savedAt: new Date(),
    };

    setSavedQueries(prev => [savedQuery, ...prev]);
    
    // Save to localStorage
    try {
      const existing = localStorage.getItem('dataprism-saved-queries');
      const queries = existing ? JSON.parse(existing) : [];
      queries.unshift(savedQuery);
      localStorage.setItem('dataprism-saved-queries', JSON.stringify(queries.slice(0, 50))); // Keep max 50
    } catch (error) {
      console.warn('Failed to save query to localStorage:', error);
    }
  }, [currentQuery]);

  const loadQuery = useCallback((query: SavedQuery | QueryExecution) => {
    setCurrentQuery('sql' in query ? query.sql : '');
  }, []);

  // Commented out as it's not used currently
  // const deleteQuery = useCallback((queryId: string) => {
  //   setSavedQueries(prev => prev.filter(q => q.id !== queryId));
  //   
  //   // Update localStorage
  //   try {
  //     const existing = localStorage.getItem('dataprism-saved-queries');
  //     if (existing) {
  //       const queries = JSON.parse(existing).filter((q: SavedQuery) => q.id !== queryId);
  //       localStorage.setItem('dataprism-saved-queries', JSON.stringify(queries));
  //     }
  //   } catch (error) {
  //     console.warn('Failed to update localStorage:', error);
  //   }
  // }, []);

  // Load saved queries from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('dataprism-saved-queries');
      if (saved) {
        const queries = JSON.parse(saved);
        setSavedQueries(queries.map((q: any) => ({
          ...q,
          savedAt: new Date(q.savedAt),
        })));
      }
    } catch (error) {
      console.warn('Failed to load saved queries:', error);
    }
  }, []);

  if (!isInitialized) {
    return (
      <Layout title="Query Lab" description="Write and execute SQL queries">
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
      title="Query Lab" 
      description="Write and execute SQL queries against your data"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Main Query Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* SQL Editor */}
          <div className="bg-white rounded-lg border border-gray-200 h-80">
            <SQLEditor
              value={currentQuery}
              onChange={setCurrentQuery}
              onExecute={executeQuery}
              isExecuting={isExecuting}
              onSave={saveQuery}
            />
          </div>

          {/* Query Metrics */}
          {queryResult && (
            <QueryMetrics
              executionTime={queryResult.metadata.executionTime}
              rowCount={queryResult.metadata.rowCount}
              error={queryResult.error}
            />
          )}

          {/* Results */}
          {queryResult && (
            <div className="flex-1">
              <ResultsTable
                data={queryResult.data}
                columns={queryResult.metadata.columns}
                error={queryResult.error}
                executionTime={queryResult.metadata.executionTime}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Query History */}
          <QueryHistory
            queries={queryHistory}
            onLoadQuery={loadQuery}
          />

          {/* Saved Queries */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Queries</h3>
            {savedQueries.length === 0 ? (
              <p className="text-sm text-gray-500">No saved queries yet</p>
            ) : (
              <div className="space-y-2">
                {savedQueries.slice(0, 10).map((query) => (
                  <div
                    key={query.id}
                    className="p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => loadQuery(query)}
                  >
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {query.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {query.savedAt.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};