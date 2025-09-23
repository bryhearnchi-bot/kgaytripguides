/**
 * Generated TypeScript types from OpenAPI specification
 * K-GAY Travel Guides API v1.0.0
 *
 * This file contains TypeScript interfaces and types for all API endpoints.
 * It should be regenerated whenever the OpenAPI specification changes.
 */

// ============ CORE ENTITY TYPES ============

export interface Trip {
  id: number;
  name: string;
  slug: string;
  subtitle?: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'published' | 'archived';
  price?: number;
  duration?: number;
  shipName?: string;
  featuredImage?: string;
  maxCapacity?: number;
  currentBookings?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: number;
  tripId: number;
  title: string;
  description?: string;
  date: string;
  time: string;
  endTime?: string;
  location?: string;
  type: 'party' | 'show' | 'activity' | 'dining' | 'meeting' | 'other';
  category?: string;
  capacity?: number;
  isPrivate: boolean;
  requiresReservation: boolean;
  cost?: number;
  heroImage?: string;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Talent {
  id: number;
  name: string;
  stageName?: string;
  type: 'drag_queen' | 'dj' | 'performer' | 'host' | 'comedian' | 'singer' | 'dancer' | 'other';
  bio?: string;
  profileImageUrl?: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
  featured: boolean;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: number;
  name: string;
  country: string;
  description?: string;
  imageUrl?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  email: string;
  fullName?: string;
  username?: string;
  role: 'viewer' | 'content_manager' | 'admin';
  accountStatus: 'active' | 'suspended' | 'pending_verification';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItineraryItem {
  id: number;
  tripId: number;
  locationId?: number;
  dayNumber: number;
  date: string;
  arrivalTime?: string;
  departureTime?: string;
  description?: string;
  isSeaDay: boolean;
}

export interface InfoSection {
  id: string;
  tripId: string;
  title: string;
  content: string;
  order: number;
  isVisible: boolean;
}

// ============ API RESPONSE TYPES ============

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ErrorResponse {
  error: string;
  details?: Record<string, any>;
  code?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationResponse<T = any> {
  data: T[];
  pagination: PaginationMeta;
}

// ============ REQUEST TYPES ============

export interface CreateTripRequest {
  name: string;
  slug: string;
  subtitle?: string;
  description?: string;
  startDate: string;
  endDate: string;
  status?: 'draft' | 'published' | 'archived';
  price?: number;
  duration?: number;
  shipName?: string;
  featuredImage?: string;
  maxCapacity?: number;
  currentBookings?: number;
  metadata?: Record<string, any>;
}

export interface UpdateTripRequest {
  name?: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: 'draft' | 'published' | 'archived';
  price?: number;
  duration?: number;
  shipName?: string;
  featuredImage?: string;
  maxCapacity?: number;
  currentBookings?: number;
  metadata?: Record<string, any>;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  date: string;
  time: string;
  endTime?: string;
  location?: string;
  type: 'party' | 'show' | 'activity' | 'dining' | 'meeting' | 'other';
  category?: string;
  capacity?: number;
  isPrivate?: boolean;
  requiresReservation?: boolean;
  cost?: number;
  heroImage?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  endTime?: string;
  location?: string;
  type?: 'party' | 'show' | 'activity' | 'dining' | 'meeting' | 'other';
  category?: string;
  capacity?: number;
  isPrivate?: boolean;
  requiresReservation?: boolean;
  cost?: number;
  heroImage?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface BulkEventsRequest {
  tripId: number;
  events: (CreateEventRequest & { id?: number })[];
}

export interface DuplicateTripRequest {
  newName: string;
  newSlug: string;
}

export interface CreateProfileRequest {
  email: string;
  fullName: string;
  username?: string;
  role: 'viewer' | 'content_manager' | 'admin';
  phoneNumber?: string;
  bio?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  username?: string;
  role?: 'viewer' | 'content_manager' | 'admin';
  accountStatus?: 'active' | 'suspended' | 'pending_verification';
  phoneNumber?: string;
  bio?: string;
  isActive?: boolean;
}

// ============ SEARCH AND FILTERING ============

export interface SearchResult {
  query: string;
  total: number;
  results: {
    trips: Trip[];
    events: Event[];
    talent: Talent[];
    locations: Location[];
  };
}

export interface SearchParams {
  q: string;
  type?: 'trips' | 'events' | 'talent' | 'locations' | 'all';
  limit?: number;
}

export interface TripFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'draft' | 'published' | 'archived';
}

export interface EventFilters {
  tripId?: number;
  type?: 'party' | 'show' | 'activity' | 'dining' | 'meeting' | 'other';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface TalentFilters {
  featured?: boolean;
  type?: 'drag_queen' | 'dj' | 'performer' | 'host' | 'comedian' | 'singer' | 'dancer' | 'other';
  limit?: number;
  offset?: number;
}

export interface LocationFilters {
  country?: string;
  limit?: number;
  offset?: number;
}

export interface ProfileFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'viewer' | 'content_manager' | 'admin';
  status?: 'active' | 'suspended' | 'pending_verification';
}

// ============ STATISTICS AND ANALYTICS ============

export interface TripStats {
  total: number;
  published: number;
  draft: number;
  archived: number;
  upcoming: number;
  ongoing: number;
  past: number;
  totalCapacity: number;
  totalBookings: number;
  avgOccupancy: number;
}

export interface EventStats {
  total: number;
  byType: Record<string, number>;
}

export interface DashboardStatsRequest {
  dateRange?: {
    start: string;
    end: string;
  };
  metrics: ('trips' | 'events' | 'talent' | 'locations')[];
}

export interface DashboardStats {
  trips?: {
    total: number;
    upcoming: number;
    active: number;
    past: number;
  };
  events?: {
    total: number;
  };
  talent?: {
    total: number;
    featured: number;
  };
  locations?: {
    total: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  database?: {
    status: string;
    responseTime: number;
  };
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
}

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

// ============ COMPLETE TRIP DATA ============

export interface CompleteTripInfo {
  trip: Trip;
  itinerary: ItineraryItem[];
  events: Event[];
  infoSections: InfoSection[];
}

// ============ AUTHENTICATION ============

export interface AuthUser {
  id: string;
  email: string;
  role: 'viewer' | 'content_manager' | 'admin';
}

export interface CsrfToken {
  csrfToken: string;
}

export interface ApiVersions {
  versions: string[];
  current: string;
}

// ============ API CLIENT CONFIGURATION ============

export interface ApiClientConfig {
  baseURL: string;
  token?: string;
  timeout?: number;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
}

// ============ EXPORT AND IMPORT ============

export interface ExportTripRequest {
  format?: 'json' | 'csv';
  includeRelated?: boolean;
}

export interface ExportTripData {
  trip: Trip;
  itinerary?: ItineraryItem[];
  events?: Event[];
}

export interface ImportTripRequest {
  data: ExportTripData;
  format?: 'json' | 'csv';
  overwrite?: boolean;
}

// ============ UTILITY TYPES ============

export type TripStatus = Trip['status'];
export type EventType = Event['type'];
export type TalentType = Talent['type'];
export type UserRole = Profile['role'];
export type AccountStatus = Profile['accountStatus'];
export type SystemHealthStatus = SystemHealth['status'];

// ============ API ENDPOINT OPERATIONS ============

export interface ApiOperations {
  // Trip operations
  listTrips: () => Promise<Trip[]>;
  getTripById: (id: number) => Promise<Trip>;
  getTripBySlug: (slug: string) => Promise<Trip>;
  createTrip: (data: CreateTripRequest) => Promise<Trip>;
  updateTrip: (id: number, data: UpdateTripRequest) => Promise<Trip>;
  deleteTrip: (id: number) => Promise<void>;
  duplicateTrip: (id: number, data: DuplicateTripRequest) => Promise<Trip>;
  getCompleteTripInfo: (slug: string) => Promise<CompleteTripInfo>;

  // Event operations
  listEvents: (filters?: EventFilters) => Promise<Event[]>;
  createEvent: (tripId: number, data: CreateEventRequest) => Promise<Event>;
  updateEvent: (id: number, data: UpdateEventRequest) => Promise<Event>;
  deleteEvent: (id: number) => Promise<void>;
  bulkCreateUpdateEvents: (data: BulkEventsRequest) => Promise<{ success: boolean; events: Event[] }>;

  // Search operations
  globalSearch: (params: SearchParams) => Promise<SearchResult>;

  // Admin operations
  getAdminCruises: (filters?: TripFilters) => Promise<PaginationResponse<Trip>>;
  getTripStats: () => Promise<TripStats>;
  getDashboardStats: (request: DashboardStatsRequest) => Promise<DashboardStats>;
  getSystemHealth: (detailed?: boolean) => Promise<SystemHealth>;

  // Authentication
  getCsrfToken: () => Promise<CsrfToken>;
  getApiVersions: () => Promise<ApiVersions>;
}

// Types are already exported as interfaces above, no need for re-export