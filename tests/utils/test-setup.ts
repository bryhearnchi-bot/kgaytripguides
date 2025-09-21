/**
 * Test Setup and Configuration
 * Global test configuration following TDD best practices
 */

import { beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { testDb, mockApi } from './test-helpers';
import { fixtures } from '../fixtures/database-fixtures';

// ============ GLOBAL TEST CONFIGURATION ============

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.USE_MOCK_DATA = 'true';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// ============ VITEST GLOBAL SETUP ============

beforeAll(async () => {
  console.log('🧪 Starting test suite...');

  // Initialize test environment
  vi.clearAllMocks();

  // Set up fake timers if needed
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
});

afterAll(async () => {
  console.log('🏁 Test suite completed');

  // Cleanup global resources
  vi.useRealTimers();
  vi.clearAllMocks();
});

beforeEach(async () => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Reset API mock responses
  mockApi.clear();

  // Reset performance tracking
  performance.clearMarks();
  performance.clearMeasures();
});

afterEach(async () => {
  // Clean up test database
  await testDb.cleanup();

  // Clear any test data
  mockApi.clear();

  // Reset timers
  vi.clearAllTimers();
});

// ============ MOCK CONFIGURATIONS ============

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: null },
        error: null
      })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
      delete: vi.fn(() => Promise.resolve({ error: null })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: null, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/image.jpg' } })),
      })),
    },
  })),
}));

// Mock React Router (Wouter)
vi.mock('wouter', () => ({
  useLocation: vi.fn(() => ['/test', vi.fn()]),
  useRoute: vi.fn(() => [true, { id: '1' }]),
  Link: vi.fn(({ children, href }: { children: React.ReactNode; href: string }) =>
    ({ type: 'a', props: { href, children } })
  ),
  Route: vi.fn(({ children }: { children: React.ReactNode }) =>
    ({ type: 'div', props: { children } })
  ),
  Switch: vi.fn(({ children }: { children: React.ReactNode }) =>
    ({ type: 'div', props: { children } })
  ),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isLoading: false,
    error: null,
  })),
  QueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock date-fns
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    format: vi.fn((date: Date, formatStr: string) => {
      // Simple mock implementation
      return new Intl.DateTimeFormat('en-US').format(date);
    }),
  };
});

// Mock Framer Motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: vi.fn(({ children, ...props }: any) => ({ type: 'div', props: { ...props, children } })),
    section: vi.fn(({ children, ...props }: any) => ({ type: 'section', props: { ...props, children } })),
    article: vi.fn(({ children, ...props }: any) => ({ type: 'article', props: { ...props, children } })),
    span: vi.fn(({ children, ...props }: any) => ({ type: 'span', props: { ...props, children } })),
    p: vi.fn(({ children, ...props }: any) => ({ type: 'p', props: { ...props, children } })),
    h1: vi.fn(({ children, ...props }: any) => ({ type: 'h1', props: { ...props, children } })),
    h2: vi.fn(({ children, ...props }: any) => ({ type: 'h2', props: { ...props, children } })),
    h3: vi.fn(({ children, ...props }: any) => ({ type: 'h3', props: { ...props, children } })),
  },
  AnimatePresence: vi.fn(({ children }: { children: React.ReactNode }) => children),
  useAnimation: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => {
  const createMockIcon = (name: string) =>
    vi.fn(({ size, className, ...props }: any) => ({
      type: 'svg',
      props: { className, width: size, height: size, 'data-testid': `${name}-icon`, ...props }
    }));

  return new Proxy({}, {
    get: (target, prop) => {
      if (typeof prop === 'string') {
        return createMockIcon(prop);
      }
      return undefined;
    }
  });
});

// ============ TEST DATABASE CONFIGURATION ============

// Mock database operations for unit tests
export const mockDatabase = {
  trips: new Map(),
  events: new Map(),
  talent: new Map(),
  ports: new Map(),
  parties: new Map(),
  profiles: new Map(),

  clear() {
    this.trips.clear();
    this.events.clear();
    this.talent.clear();
    this.ports.clear();
    this.parties.clear();
    this.profiles.clear();
  },

  insert(table: string, data: any) {
    const collection = this[table as keyof typeof this] as Map<any, any>;
    const id = data.id || Math.floor(Math.random() * 10000);
    const record = { ...data, id, createdAt: new Date(), updatedAt: new Date() };
    collection.set(id, record);
    return record;
  },

  select(table: string, filter?: (item: any) => boolean) {
    const collection = this[table as keyof typeof this] as Map<any, any>;
    const items = Array.from(collection.values());
    return filter ? items.filter(filter) : items;
  },

  update(table: string, id: any, updates: any) {
    const collection = this[table as keyof typeof this] as Map<any, any>;
    const existing = collection.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    collection.set(id, updated);
    return updated;
  },

  delete(table: string, id: any) {
    const collection = this[table as keyof typeof this] as Map<any, any>;
    return collection.delete(id);
  },
};

// Reset mock database before each test
beforeEach(() => {
  mockDatabase.clear();
});

// ============ ASSERTION HELPERS ============

declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toBeValidTrip(): any;
      toBeValidEvent(): any;
      toBeValidTalent(): any;
      toBeValidApiResponse(): any;
      toHaveValidTimestamps(): any;
    }
  }
}

// Custom matchers for better assertions
expect.extend({
  toBeValidTrip(received) {
    const pass = received &&
      typeof received.id === 'number' &&
      typeof received.title === 'string' &&
      typeof received.slug === 'string' &&
      received.startDate instanceof Date &&
      received.endDate instanceof Date &&
      typeof received.status === 'string';

    return {
      message: () => pass
        ? `Expected ${received} not to be a valid trip`
        : `Expected ${received} to be a valid trip with id, title, slug, dates, and status`,
      pass,
    };
  },

  toBeValidEvent(received) {
    const pass = received &&
      typeof received.id === 'number' &&
      typeof received.title === 'string' &&
      typeof received.cruiseId === 'number' &&
      received.date instanceof Date &&
      typeof received.type === 'string';

    return {
      message: () => pass
        ? `Expected ${received} not to be a valid event`
        : `Expected ${received} to be a valid event with id, title, cruiseId, date, and type`,
      pass,
    };
  },

  toBeValidTalent(received) {
    const pass = received &&
      typeof received.id === 'number' &&
      typeof received.name === 'string' &&
      typeof received.category === 'string';

    return {
      message: () => pass
        ? `Expected ${received} not to be a valid talent`
        : `Expected ${received} to be a valid talent with id, name, and category`,
      pass,
    };
  },

  toBeValidApiResponse(received) {
    const pass = received &&
      typeof received.status === 'number' &&
      received.status >= 200 &&
      received.status < 400 &&
      received.data !== undefined;

    return {
      message: () => pass
        ? `Expected ${received} not to be a valid API response`
        : `Expected ${received} to be a valid API response with status 2xx and data`,
      pass,
    };
  },

  toHaveValidTimestamps(received) {
    const pass = received &&
      received.createdAt instanceof Date &&
      received.updatedAt instanceof Date &&
      received.createdAt <= received.updatedAt;

    return {
      message: () => pass
        ? `Expected ${received} not to have valid timestamps`
        : `Expected ${received} to have valid createdAt and updatedAt timestamps`,
      pass,
    };
  },
});

// ============ PERFORMANCE TESTING SETUP ============

// Set performance budgets
export const PERFORMANCE_BUDGETS = {
  // Database operations should complete within these times (ms)
  DATABASE_QUERY: 100,
  DATABASE_INSERT: 200,
  DATABASE_UPDATE: 150,
  DATABASE_DELETE: 100,

  // API endpoints should respond within these times (ms)
  API_GET: 500,
  API_POST: 1000,
  API_PUT: 800,
  API_DELETE: 300,

  // Component rendering should complete within these times (ms)
  COMPONENT_MOUNT: 50,
  COMPONENT_UPDATE: 30,
  COMPONENT_UNMOUNT: 20,
};

// Helper to assert performance
export const assertPerformance = (duration: number, budget: number, operation: string) => {
  if (duration > budget) {
    console.warn(`⚠️ Performance budget exceeded for ${operation}: ${duration}ms > ${budget}ms`);
  }
  expect(duration).toBeLessThan(budget * 1.5); // Allow 50% buffer for CI environments
};

// ============ EXPORT UTILITIES ============

export { FixtureLoader as fixtures } from '../fixtures/database-fixtures';
export * from './test-helpers';