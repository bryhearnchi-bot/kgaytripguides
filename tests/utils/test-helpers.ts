/**
 * Test Helpers and Utilities
 * Comprehensive testing utilities following TDD best practices
 */

import { vi } from 'vitest';
import type { MockedFunction } from 'vitest';

// ============ DATABASE TEST HELPERS ============

export class TestDatabase {
  private static instance: TestDatabase;
  private cleanupTasks: (() => Promise<void>)[] = [];

  static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  /**
   * Register cleanup task to run after each test
   */
  addCleanupTask(task: () => Promise<void>): void {
    this.cleanupTasks.push(task);
  }

  /**
   * Run all cleanup tasks
   */
  async cleanup(): Promise<void> {
    for (const task of this.cleanupTasks) {
      await task();
    }
    this.cleanupTasks = [];
  }

  /**
   * Truncate specific tables for test isolation
   */
  async truncateTable(tableName: string): Promise<void> {
    // This will be implemented when we add database integration tests
    // For now, this is a placeholder
    console.log(`Truncating table: ${tableName}`);
  }

  /**
   * Create test transaction that can be rolled back
   */
  async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
    // Implementation for transactional testing
    return callback();
  }
}

// ============ MOCK FACTORIES ============

export const mockProfile = (overrides: Partial<any> = {}) => ({
  id: 'test-profile-1',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  lastSignInAt: new Date('2024-01-01'),
  ...overrides
});

export const mockTrip = (overrides: Partial<any> = {}) => ({
  id: 1,
  title: 'Test Mediterranean Cruise',
  slug: 'test-mediterranean-cruise',
  description: 'A test cruise through the Mediterranean',
  shortDescription: 'Test cruise',
  startDate: new Date('2024-06-01'),
  endDate: new Date('2024-06-08'),
  status: 'published',
  capacity: 500,
  currentBookings: 250,
  price: 2500,
  shipName: 'Test Ship',
  departurePort: 'Athens',
  featuredImage: 'https://example.com/cruise.jpg',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

export const mockEvent = (overrides: Partial<any> = {}) => ({
  id: 1,
  cruiseId: 1,
  title: 'Test Event',
  description: 'A test event',
  type: 'party',
  date: new Date('2024-06-02'),
  time: '20:00',
  duration: 3,
  location: 'Main Deck',
  capacity: 200,
  isRecurring: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

export const mockTalent = (overrides: Partial<any> = {}) => ({
  id: 1,
  name: 'Test Artist',
  category: 'DJ',
  bio: 'A test artist',
  knownFor: 'Great music',
  profileImageUrl: 'https://example.com/artist.jpg',
  socialLinks: { instagram: '@testartist' },
  website: 'https://testartist.com',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

export const mockPort = (overrides: Partial<any> = {}) => ({
  id: 1,
  name: 'Test Athens',
  country: 'Greece',
  region: 'Mediterranean',
  port_type: 'port' as const,
  coordinates: { lat: 37.9838, lng: 23.7275 },
  description: 'Test port description',
  image_url: 'https://example.com/athens.jpg',
  ...overrides
});

export const mockParty = (overrides: Partial<any> = {}) => ({
  id: 1,
  name: 'Test White Party',
  theme: 'All White Attire',
  venue_type: 'pool' as const,
  capacity: 500,
  duration_hours: 4,
  requirements: ['DJ', 'Sound System'],
  image_url: 'https://example.com/party.jpg',
  usage_count: 0,
  ...overrides
});

// ============ STORAGE MOCKS ============

export class MockStorageBase {
  protected data: Map<any, any> = new Map();
  protected nextId = 1;

  async create(item: any): Promise<any> {
    const id = this.nextId++;
    const created = { ...item, id, createdAt: new Date(), updatedAt: new Date() };
    this.data.set(id, created);
    return created;
  }

  async getById(id: any): Promise<any> {
    return this.data.get(id) || null;
  }

  async update(id: any, updates: any): Promise<any> {
    const existing = this.data.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.data.set(id, updated);
    return updated;
  }

  async delete(id: any): Promise<boolean> {
    return this.data.delete(id);
  }

  async list(filters: any = {}): Promise<any[]> {
    const items = Array.from(this.data.values());

    // Simple filtering
    return items.filter(item => {
      return Object.entries(filters).every(([key, value]) =>
        item[key] === value
      );
    });
  }

  clear(): void {
    this.data.clear();
    this.nextId = 1;
  }
}

export class MockTripStorage extends MockStorageBase {
  async getTripBySlug(slug: string): Promise<any> {
    const items = Array.from(this.data.values());
    return items.find(item => item.slug === slug) || null;
  }

  async getUpcomingTrips(): Promise<any[]> {
    const items = Array.from(this.data.values());
    const now = new Date();
    return items.filter(item => item.startDate > now);
  }

  async getPastTrips(): Promise<any[]> {
    const items = Array.from(this.data.values());
    const now = new Date();
    return items.filter(item => item.endDate < now);
  }
}

export class MockEventStorage extends MockStorageBase {
  async getEventsByCruise(cruiseId: number): Promise<any[]> {
    const items = Array.from(this.data.values());
    return items.filter(item => item.cruiseId === cruiseId);
  }

  async getEventsByDate(cruiseId: number, date: Date): Promise<any[]> {
    const items = Array.from(this.data.values());
    return items.filter(item =>
      item.cruiseId === cruiseId &&
      item.date.toDateString() === date.toDateString()
    );
  }
}

export class MockTalentStorage extends MockStorageBase {
  async getTalentByCruise(cruiseId: number): Promise<any[]> {
    // This would normally join with cruise_talent table
    return Array.from(this.data.values()).slice(0, 3); // Mock return
  }

  async searchTalent(search?: string, performanceType?: string): Promise<any[]> {
    let items = Array.from(this.data.values());

    if (search) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.bio.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (performanceType) {
      items = items.filter(item => item.category === performanceType);
    }

    return items;
  }
}

// ============ API TEST HELPERS ============

export interface TestResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
}

export class MockApiClient {
  private responses: Map<string, TestResponse> = new Map();

  setMockResponse(endpoint: string, response: TestResponse): void {
    this.responses.set(endpoint, response);
  }

  async get(endpoint: string): Promise<TestResponse> {
    const response = this.responses.get(endpoint);
    if (!response) {
      throw new Error(`No mock response set for GET ${endpoint}`);
    }
    return response;
  }

  async post(endpoint: string, data: any): Promise<TestResponse> {
    const response = this.responses.get(endpoint);
    if (!response) {
      throw new Error(`No mock response set for POST ${endpoint}`);
    }
    return { ...response, data: { ...response.data, ...data } };
  }

  async put(endpoint: string, data: any): Promise<TestResponse> {
    const response = this.responses.get(endpoint);
    if (!response) {
      throw new Error(`No mock response set for PUT ${endpoint}`);
    }
    return { ...response, data: { ...response.data, ...data } };
  }

  async delete(endpoint: string): Promise<TestResponse> {
    const response = this.responses.get(endpoint);
    if (!response) {
      throw new Error(`No mock response set for DELETE ${endpoint}`);
    }
    return response;
  }

  clear(): void {
    this.responses.clear();
  }
}

// ============ COMPONENT TEST HELPERS ============

export const mockReactRouter = () => {
  return {
    useLocation: vi.fn(() => ({ pathname: '/test' })),
    useRoute: vi.fn(() => ({ params: {} })),
    Link: vi.fn(({ children, to }: { children: React.ReactNode; to: string }) => ({
      type: 'a',
      props: { href: to, children }
    })),
  };
};

export const mockSupabaseAuth = () => {
  return {
    user: mockProfile(),
    isLoading: false,
    isAuthenticated: true,
    signIn: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
  };
};

// ============ TIME TESTING HELPERS ============

export class TimeTravel {
  private static originalDate = Date;

  static to(date: string | Date): void {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    vi.setSystemTime(targetDate);
  }

  static reset(): void {
    vi.useRealTimers();
  }
}

// ============ ASSERTION HELPERS ============

export const expectToMatchSchema = (data: any, schema: any) => {
  // This would validate against Zod schemas
  // For now, just check basic structure
  expect(data).toBeDefined();
  expect(typeof data).toBe('object');
};

export const expectValidApiResponse = (response: TestResponse) => {
  expect(response).toBeDefined();
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(400);
  expect(response.data).toBeDefined();
};

export const expectValidErrorResponse = (response: TestResponse) => {
  expect(response).toBeDefined();
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(response.data).toBeDefined();
  expect(response.data.error).toBeDefined();
};

// ============ PERFORMANCE TESTING HELPERS ============

export class PerformanceTracker {
  private marks: Map<string, number> = new Map();

  start(name: string): void {
    this.marks.set(name, performance.now());
  }

  end(name: string): number {
    const start = this.marks.get(name);
    if (!start) {
      throw new Error(`No start mark found for ${name}`);
    }

    const duration = performance.now() - start;
    this.marks.delete(name);
    return duration;
  }

  expectFasterThan(name: string, maxMs: number): void {
    const duration = this.end(name);
    expect(duration).toBeLessThan(maxMs);
  }
}

// ============ EXPORTS ============

export const testDb = TestDatabase.getInstance();
export const mockApi = new MockApiClient();
export const performanceTracker = new PerformanceTracker();

// Pre-configured storage mocks
export const mockTripStorage = new MockTripStorage();
export const mockEventStorage = new MockEventStorage();
export const mockTalentStorage = new MockTalentStorage();