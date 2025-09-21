/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './client/src/test/setup.ts',
      './tests/utils/test-setup.ts'
    ],
    css: true,
    include: [
      './tests/**/*.{test,spec}.{js,ts,tsx}',
      './client/src/**/*.{test,spec}.{js,ts,tsx}',
      './server/**/*.{test,spec}.{js,ts}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/e2e/**',
      '**/archived/**',
      '**/modelcontextprotocol/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/tests/**',
        '**/test/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/coverage/**',
        '**/archived/**',
        '**/modelcontextprotocol/**',
        'vitest.config.ts',
        'playwright.config.ts',
        '**/*.d.ts',
        '**/types/**'
      ],
      include: [
        'client/src/**/*.{js,ts,tsx}',
        'server/**/*.{js,ts}',
        'shared/**/*.{js,ts}'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'client/src/components/**': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        'server/storage/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      },
      watermarks: {
        statements: [70, 80],
        functions: [70, 80],
        branches: [70, 80],
        lines: [70, 80]
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 4,
        useAtomics: true
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    isolate: true,
    watch: true,
    reporters: ['verbose', 'junit', 'json'],
    outputFile: {
      junit: './test-results/junit.xml',
      json: './test-results/results.json'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@server': path.resolve(__dirname, './server'),
      '@tests': path.resolve(__dirname, './tests')
    },
  },
});