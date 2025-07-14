/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    include: ['tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/**/*.spec.{js,ts,jsx,tsx}', // Exclude Playwright specs
      'tests/e2e/**/*', // Exclude E2E tests
      'tests/**/*/spec.{js,ts,jsx,tsx}' // Exclude all spec files
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, './src/components'),
      '@/pages': resolve(__dirname, './src/pages'),
      '@/contexts': resolve(__dirname, './src/contexts'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/config': resolve(__dirname, './src/config'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/types': resolve(__dirname, './src/types'),
      '@/monitoring': resolve(__dirname, './src/monitoring'),
      '@/validation': resolve(__dirname, './src/validation'),
      '@/plugins': resolve(__dirname, './src/plugins'),
    },
  },
});