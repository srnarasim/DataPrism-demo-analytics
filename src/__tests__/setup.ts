/**
 * Test setup for DataPrism Demo Analytics
 */

import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.mock('meta.env', () => ({
  VITE_DATAPRISM_CDN_URL: 'https://test-cdn.example.com',
  VITE_DATAPRISM_VERSION: 'test',
  DEV: true,
}));

// Mock fetch for CDN requests
global.fetch = vi.fn();

// Mock DataPrism global
Object.defineProperty(window, 'DataPrism', {
  writable: true,
  value: {
    DataPrismEngine: vi.fn(() => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue({ data: [], rowCount: 0 }),
      loadData: vi.fn().mockResolvedValue(undefined),
      getTableInfo: vi.fn().mockResolvedValue({}),
      listTables: vi.fn().mockResolvedValue([]),
      getMetrics: vi.fn().mockResolvedValue({}),
    })),
  },
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};