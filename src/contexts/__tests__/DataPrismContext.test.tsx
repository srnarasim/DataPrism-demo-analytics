/**
 * DataPrism Context Tests
 * Tests the CDN-based DataPrism React context
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DataPrismProvider, useDataPrism } from '../DataPrismContext';

// Mock CDN loader
vi.mock('../../utils/cdnLoader', () => ({
  CDNAssetLoader: vi.fn(() => ({
    getCDNStatus: vi.fn().mockResolvedValue({
      available: true,
      version: '1.0.0',
      latency: 100
    }),
    preloadAssets: vi.fn().mockResolvedValue(undefined),
    loadCoreBundle: vi.fn().mockResolvedValue({
      DataPrismEngine: vi.fn(() => ({
        initialize: vi.fn().mockResolvedValue(undefined),
        query: vi.fn().mockResolvedValue({ data: [], rowCount: 0 }),
        loadData: vi.fn().mockResolvedValue(undefined),
        getTableInfo: vi.fn().mockResolvedValue({}),
        listTables: vi.fn().mockResolvedValue([]),
        getMetrics: vi.fn().mockResolvedValue({})
      }))
    })
  }))
}));

const TestComponent = () => {
  const { 
    isInitialized, 
    isInitializing,
    cdnStatus, 
    cdnInfo,
    engine,
    initializationError 
  } = useDataPrism();
  
  return (
    <div>
      <div data-testid="initialized">{isInitialized.toString()}</div>
      <div data-testid="initializing">{isInitializing.toString()}</div>
      <div data-testid="cdn-status">{cdnStatus}</div>
      <div data-testid="cdn-version">{cdnInfo.version || 'unknown'}</div>
      <div data-testid="engine-available">{!!engine ? 'true' : 'false'}</div>
      <div data-testid="error">{initializationError?.message || 'none'}</div>
    </div>
  );
};

describe('DataPrismContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial loading state', () => {
    render(
      <DataPrismProvider>
        <TestComponent />
      </DataPrismProvider>
    );

    expect(screen.getByTestId('initialized')).toHaveTextContent('false');
    expect(screen.getByTestId('initializing')).toHaveTextContent('true');
    expect(screen.getByTestId('cdn-status')).toHaveTextContent('loading');
    expect(screen.getByTestId('engine-available')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });

  it('should initialize DataPrism successfully', async () => {
    render(
      <DataPrismProvider>
        <TestComponent />
      </DataPrismProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('initialized')).toHaveTextContent('true');
    }, { timeout: 5000 });

    expect(screen.getByTestId('initializing')).toHaveTextContent('false');
    expect(screen.getByTestId('cdn-status')).toHaveTextContent('loaded');
    expect(screen.getByTestId('cdn-version')).toHaveTextContent('1.0.0');
    expect(screen.getByTestId('engine-available')).toHaveTextContent('true');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });

  it('should handle initialization errors', async () => {
    // Mock CDN loader to fail
    const { CDNAssetLoader } = await import('../../utils/cdnLoader');
    const mockLoader = CDNAssetLoader as any;
    mockLoader.mockImplementation(() => ({
      getCDNStatus: vi.fn().mockResolvedValue({
        available: false,
        error: 'CDN not available'
      }),
      preloadAssets: vi.fn().mockResolvedValue(undefined),
      loadCoreBundle: vi.fn().mockRejectedValue(new Error('CDN load failed'))
    }));

    render(
      <DataPrismProvider>
        <TestComponent />
      </DataPrismProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('cdn-status')).toHaveTextContent('error');
    }, { timeout: 5000 });

    expect(screen.getByTestId('initialized')).toHaveTextContent('false');
    expect(screen.getByTestId('initializing')).toHaveTextContent('false');
    expect(screen.getByTestId('engine-available')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).not.toHaveTextContent('none');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useDataPrism must be used within a DataPrismProvider');

    console.error = originalError;
  });

  it('should provide query functionality after initialization', async () => {
    const TestQueryComponent = () => {
      const { query, isInitialized } = useDataPrism();
      
      const handleQuery = async () => {
        if (isInitialized) {
          const result = await query('SELECT 1');
          return result;
        }
      };
      
      return (
        <div>
          <div data-testid="query-ready">{isInitialized ? 'ready' : 'not-ready'}</div>
          <button onClick={handleQuery} data-testid="query-button">
            Query
          </button>
        </div>
      );
    };

    render(
      <DataPrismProvider>
        <TestQueryComponent />
      </DataPrismProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('query-ready')).toHaveTextContent('ready');
    }, { timeout: 5000 });
  });
});