/**
 * Integration tests for DataPrism initialization and core functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DataPrismProvider, useDataPrism } from '@/contexts/DataPrismContext';
import { getCDNConfig } from '@/config/cdn';
import { CDNAssetLoader } from '@/utils/cdnLoader';

// Mock component to test the context
function TestComponent() {
  const { 
    engine, 
    isInitialized, 
    isInitializing, 
    initializationError,
    cdnStatus 
  } = useDataPrism();

  return (
    <div>
      <div data-testid="initialization-status">
        {isInitializing && 'Initializing...'}
        {isInitialized && 'Initialized'}
        {initializationError && 'Error'}
      </div>
      <div data-testid="cdn-status">{cdnStatus}</div>
      <div data-testid="engine-status">
        {engine ? 'Engine Ready' : 'No Engine'}
      </div>
    </div>
  );
}

describe('DataPrism Integration', () => {
  let originalFetch: typeof global.fetch;
  let originalWindow: any;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalWindow = global.window;
    
    // Mock window
    global.window = {
      DataPrism: {
        DataPrismEngine: class MockDataPrismEngine {
          constructor(config: any) {
            this.config = config;
          }
          
          async initialize() {
            return Promise.resolve();
          }
          
          async query(sql: string) {
            return { data: [{ result: 'mock' }], rowCount: 1 };
          }
          
          async loadData(data: any[], tableName: string) {
            return Promise.resolve();
          }
          
          async listTables() {
            return ['sales', 'analytics', 'products'];
          }
          
          async getTableInfo(tableName: string) {
            return [{ column: 'id', type: 'INTEGER' }];
          }
          
          getMetrics() {
            return { queries: 5, avgTime: 100 };
          }
        }
      }
    } as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.window = originalWindow;
    vi.clearAllMocks();
  });

  describe('DataPrism Context Integration', () => {
    it('should initialize DataPrism from CDN successfully', async () => {
      // Mock successful CDN responses
      const mockManifest = {
        version: '1.0.0',
        buildHash: 'abc123',
        assets: { core: { filename: 'dataprism.umd.js' } }
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(mockManifest)))
        .mockResolvedValueOnce(new Response('', { status: 200 }));

      render(
        <DataPrismProvider>
          <TestComponent />
        </DataPrismProvider>
      );

      // Should start as initializing
      expect(screen.getByTestId('initialization-status')).toHaveTextContent('Initializing...');
      expect(screen.getByTestId('cdn-status')).toHaveTextContent('loading');

      // Wait for initialization to complete
      await waitFor(() => {
        expect(screen.getByTestId('initialization-status')).toHaveTextContent('Initialized');
      }, { timeout: 5000 });

      expect(screen.getByTestId('cdn-status')).toHaveTextContent('loaded');
      expect(screen.getByTestId('engine-status')).toHaveTextContent('Engine Ready');
    });

    it('should fallback to mock implementation on CDN failure', async () => {
      // Mock CDN failure
      global.fetch = vi.fn().mockRejectedValue(new Error('CDN_UNAVAILABLE'));

      render(
        <DataPrismProvider>
          <TestComponent />
        </DataPrismProvider>
      );

      // Wait for fallback to mock
      await waitFor(() => {
        expect(screen.getByTestId('initialization-status')).toHaveTextContent('Initialized');
      }, { timeout: 5000 });

      expect(screen.getByTestId('engine-status')).toHaveTextContent('Engine Ready');
    });

    it('should handle initialization errors gracefully', async () => {
      // Mock initialization error
      global.window.DataPrism.DataPrismEngine = class {
        constructor() {}
        async initialize() {
          throw new Error('Initialization failed');
        }
      };

      global.fetch = vi.fn()
        .mockResolvedValue(new Response(JSON.stringify({ 
          version: '1.0.0', 
          buildHash: 'abc123', 
          assets: {} 
        })));

      render(
        <DataPrismProvider>
          <TestComponent />
        </DataPrismProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialization-status')).toHaveTextContent('Error');
      }, { timeout: 5000 });
    });
  });

  describe('CDN Asset Loading Integration', () => {
    it('should load CDN assets with proper monitoring', async () => {
      const config = getCDNConfig();
      const loader = new CDNAssetLoader(config);

      // Mock responses
      const mockManifest = {
        version: '1.0.0',
        buildHash: 'abc123',
        assets: { core: { filename: 'dataprism.umd.js' } }
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce(new Response(JSON.stringify(mockManifest)))
        .mockResolvedValueOnce(new Response('console.log("loaded");', { 
          status: 200,
          headers: { 'content-type': 'application/javascript' }
        }));

      // Mock script loading
      const mockScript = document.createElement('script');
      vi.spyOn(document, 'createElement').mockReturnValue(mockScript);
      vi.spyOn(document.head, 'appendChild').mockImplementation(() => {
        // Simulate script load
        setTimeout(() => mockScript.onload?.({} as any), 10);
        return mockScript;
      });

      const DataPrism = await loader.loadCoreBundle();

      expect(DataPrism).toBeDefined();
      expect(global.fetch).toHaveBeenCalledTimes(2);
      
      // Check metrics
      const metrics = loader.getAssetMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      
      const summary = loader.getPerformanceSummary();
      expect(summary.totalAssets).toBeGreaterThan(0);
    });

    it('should handle asset loading failures with fallback', async () => {
      const config = getCDNConfig();
      const loader = new CDNAssetLoader(config);

      // Mock failure then success
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(new Response(JSON.stringify({ 
          version: '1.0.0', 
          buildHash: 'abc123', 
          assets: {} 
        })));

      try {
        await loader.loadCoreBundle();
        // Should not reach here if fallback is working
      } catch (error) {
        expect(error).toBeDefined();
      }

      const metrics = loader.getAssetMetrics();
      expect(metrics.some(m => m.status === 'error')).toBe(true);
    });
  });

  describe('Data Operations Integration', () => {
    let TestDataComponent: React.FC;

    beforeEach(() => {
      TestDataComponent = function() {
        const { engine, isInitialized, query, loadData, listTables } = useDataPrism();
        const [tables, setTables] = React.useState<string[]>([]);
        const [queryResult, setQueryResult] = React.useState<any>(null);

        React.useEffect(() => {
          if (isInitialized && engine) {
            loadSampleData();
          }
        }, [isInitialized, engine]);

        const loadSampleData = async () => {
          try {
            const sampleData = [
              { id: 1, name: 'Test 1', value: 100 },
              { id: 2, name: 'Test 2', value: 200 }
            ];
            await loadData(sampleData, 'test_table');
            
            const tableList = await listTables();
            setTables(tableList);
            
            const result = await query('SELECT COUNT(*) as count FROM test_table');
            setQueryResult(result);
          } catch (error) {
            console.error('Data operation failed:', error);
          }
        };

        return (
          <div>
            <div data-testid="tables">{tables.join(', ')}</div>
            <div data-testid="query-result">
              {queryResult ? JSON.stringify(queryResult) : 'No result'}
            </div>
          </div>
        );
      };
    });

    it('should perform data operations after initialization', async () => {
      global.fetch = vi.fn()
        .mockResolvedValue(new Response(JSON.stringify({ 
          version: '1.0.0', 
          buildHash: 'abc123', 
          assets: {} 
        })));

      render(
        <DataPrismProvider>
          <TestDataComponent />
        </DataPrismProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tables')).toHaveTextContent('sales, analytics, products');
      }, { timeout: 5000 });

      await waitFor(() => {
        expect(screen.getByTestId('query-result')).not.toHaveTextContent('No result');
      }, { timeout: 5000 });
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should monitor performance during initialization', async () => {
      // Mock performance API
      const mockPerformance = {
        now: vi.fn().mockReturnValue(1000),
        getEntriesByType: vi.fn().mockReturnValue([])
      };
      global.performance = mockPerformance;

      global.fetch = vi.fn()
        .mockResolvedValue(new Response(JSON.stringify({ 
          version: '1.0.0', 
          buildHash: 'abc123', 
          assets: {} 
        })));

      render(
        <DataPrismProvider>
          <TestComponent />
        </DataPrismProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('initialization-status')).toHaveTextContent('Initialized');
      }, { timeout: 5000 });

      // Performance should have been monitored
      expect(mockPerformance.now).toHaveBeenCalled();
    });
  });
});