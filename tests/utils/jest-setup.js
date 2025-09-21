/**
 * Jest Setup for Integration Tests
 * Configuration specific to Jest-based integration tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.USE_MOCK_DATA = 'true';

// Global test utilities
global.testTimeout = 30000;

// Mock console methods in CI to reduce noise
if (process.env.CI) {
  global.console = {
    ...console,
    // Keep log and info for debugging
    log: jest.fn(),
    info: jest.fn(),
    // Silence warnings and errors in tests unless needed
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Global test helpers
global.expectToBeWithinRange = (actual, min, max) => {
  expect(actual).toBeGreaterThanOrEqual(min);
  expect(actual).toBeLessThanOrEqual(max);
};

global.expectValidHttpResponse = (response) => {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(400);
  expect(response.headers).toHaveProperty('content-type');
};

global.expectValidErrorResponse = (response) => {
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(response.body).toHaveProperty('error');
  expect(response.body.error).toHaveProperty('message');
};

// Set up global timeouts
beforeAll(() => {
  jest.setTimeout(global.testTimeout);
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});