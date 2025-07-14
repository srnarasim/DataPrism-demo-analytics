/**
 * Test setup file for DataPrism Demo Analytics validation
 * Configures global test environment for unit and integration tests
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.crypto for testing environments
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid'),
    subtle: {
      digest: vi.fn(() => Promise.resolve(new ArrayBuffer(48))),
    },
  },
  writable: true,
  configurable: true,
});

// Mock performance API for testing
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    getEntriesByType: vi.fn(() => []),
    mark: vi.fn(),
    measure: vi.fn(),
  },
  writable: true,
  configurable: true,
});

// Mock PerformanceObserver for testing
global.PerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(),
}));

// Mock fetch for testing
global.fetch = vi.fn();

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

// Mock ResizeObserver for chart components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for lazy loading
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock WebAssembly for testing
global.WebAssembly = {
  instantiate: vi.fn(() => Promise.resolve({
    instance: {
      exports: {},
    },
  })),
  compile: vi.fn(() => Promise.resolve({})),
  Module: vi.fn(),
  Instance: vi.fn(),
  Memory: vi.fn(),
  Table: vi.fn(),
  CompileError: Error,
  RuntimeError: Error,
  LinkError: Error,
  validate: vi.fn(() => true),
};

// Mock navigator for testing
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
    language: 'en-US',
    onLine: true,
  },
});

// Mock location for testing
Object.defineProperty(window, 'location', {
  value: {
    href: 'https://localhost:3000',
    origin: 'https://localhost:3000',
    protocol: 'https:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    reload: vi.fn(),
    replace: vi.fn(),
    assign: vi.fn(),
  },
});

// Mock console methods to reduce noise in tests
console.log = vi.fn();
console.info = vi.fn();
console.warn = vi.fn();
console.error = vi.fn();

// Setup test environment variables
process.env.NODE_ENV = 'test';
process.env.VITE_DATAPRISM_CDN_URL = 'https://test-cdn.com/dataprism';
process.env.VITE_DATAPRISM_VERSION = 'latest';