/**
 * Jest Configuration for Integration Tests
 * Used specifically for integration tests that need different setup than Vitest
 */

module.exports = {
  displayName: 'Integration Tests',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.{js,ts}',
    '<rootDir>/tests/api/**/*.test.{js,ts}'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/utils/jest-setup.js'
  ],
  collectCoverageFrom: [
    'server/**/*.{js,ts}',
    'shared/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/*.test.{js,ts}',
    '!**/*.spec.{js,ts}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**'
  ],
  coverageDirectory: '<rootDir>/coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
    '^@server/(.*)$': '<rootDir>/server/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  testTimeout: 30000,
  detectOpenHandles: true,
  forceExit: true,
  maxWorkers: 2,
  verbose: true,
  bail: false,
  clearMocks: true,
  restoreMocks: true
};