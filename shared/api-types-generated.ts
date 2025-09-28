/**
 * Generated TypeScript types from OpenAPI specification
 * K-GAY Travel Guides API v1.0.0
 *
 * Generated on: 2025-09-20T20:48:38.793Z
 *
 * DO NOT EDIT MANUALLY - This file is auto-generated
 * Run `node scripts/generate-api-types.js` to regenerate
 */

export interface Trip {
  id?: number;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface Event {
  id?: number;
  tripId?: number;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface Talent {
  id?: number;
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
  featured?: boolean;
  isActive?: boolean;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Location {
  id?: number;
  name: string;
  country: string;
  description?: string;
  imageUrl?: string;
  coordinates?: {
  latitude?: number;
  longitude?: number;
};
  timezone?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Profile {
  id?: string;
  email?: string;
  name?: string;
  username?: string;
  role?: 'viewer' | 'content_manager' | 'admin';
  accountStatus?: 'active' | 'suspended' | 'pending_verification';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse {
  success?: boolean;
  message?: string;
  data?: Record<string, any>;
}

export interface ErrorResponse {
  error: string;
  details?: Record<string, any>;
  code?: string;
}

export interface PaginationResponse {
  data?: any[];
  pagination?: {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};
}

// Utility types
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiRequestConfig {
  method?: ApiMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

// API Client interface
export interface ApiClient {
  baseUrl: string;
  token?: string;
  request<T>(endpoint: string, config?: ApiRequestConfig): Promise<T>;
}

// API Operations
export const API_OPERATIONS = {
  apiHealthCheck: {
    method: 'GET' as const,
    path: '/api',
    summary: 'API health check'
  },
  getApiVersions: {
    method: 'GET' as const,
    path: '/api/versions',
    summary: 'Get API versions'
  },
  getCsrfToken: {
    method: 'GET' as const,
    path: '/api/csrf-token',
    summary: 'Get CSRF token'
  },
  globalSearch: {
    method: 'GET' as const,
    path: '/api/search',
    summary: 'Global search'
  },
  listTalent: {
    method: 'GET' as const,
    path: '/api/talent',
    summary: 'List talent'
  },
  getTalentById: {
    method: 'GET' as const,
    path: '/api/talent/{id}',
    summary: 'Get talent by ID'
  },
  listLocations: {
    method: 'GET' as const,
    path: '/api/locations',
    summary: 'List locations'
  },
  getLocationById: {
    method: 'GET' as const,
    path: '/api/locations/{id}',
    summary: 'Get location by ID'
  },
  getMetrics: {
    method: 'GET' as const,
    path: '/api/metrics',
    summary: 'Get performance metrics'
  },
  trackAnalyticsEvent: {
    method: 'POST' as const,
    path: '/api/analytics/track',
    summary: 'Track analytics event'
  },
  healthCheck: {
    method: 'GET' as const,
    path: '/healthz',
    summary: 'Health check'
  },
  healthCheckHead: {
    method: 'HEAD' as const,
    path: '/healthz',
    summary: 'Health check (HEAD)'
  },
  listTrips: {
    method: 'GET' as const,
    path: '/api/trips',
    summary: 'List all trips'
  },
  createTrip: {
    method: 'POST' as const,
    path: '/api/trips',
    summary: 'Create a new trip'
  },
  getUpcomingTrips: {
    method: 'GET' as const,
    path: '/api/trips/upcoming',
    summary: 'Get upcoming trips'
  },
  getPastTrips: {
    method: 'GET' as const,
    path: '/api/trips/past',
    summary: 'Get past trips'
  },
  getTripById: {
    method: 'GET' as const,
    path: '/api/trips/id/{id}',
    summary: 'Get trip by ID'
  },
  getTripBySlug: {
    method: 'GET' as const,
    path: '/api/trips/{slug}',
    summary: 'Get trip by slug'
  },
  getCompleteTripInfo: {
    method: 'GET' as const,
    path: '/api/trips/{slug}/complete',
    summary: 'Get complete trip information'
  },
  updateTrip: {
    method: 'PUT' as const,
    path: '/api/trips/{id}',
    summary: 'Update trip'
  },
  deleteTrip: {
    method: 'DELETE' as const,
    path: '/api/trips/{id}',
    summary: 'Delete trip'
  },
  duplicateTrip: {
    method: 'POST' as const,
    path: '/api/trips/{id}/duplicate',
    summary: 'Duplicate trip'
  },
  getTripItinerary: {
    method: 'GET' as const,
    path: '/api/trips/{tripId}/itinerary',
    summary: 'Get trip itinerary'
  },
  listEvents: {
    method: 'GET' as const,
    path: '/api/events',
    summary: 'List events with filtering'
  },
  getEventStats: {
    method: 'GET' as const,
    path: '/api/events/stats',
    summary: 'Get event statistics'
  },
  bulkCreateUpdateEvents: {
    method: 'POST' as const,
    path: '/api/events/bulk',
    summary: 'Bulk create/update events'
  },
  updateEvent: {
    method: 'PUT' as const,
    path: '/api/events/{id}',
    summary: 'Update event'
  },
  deleteEvent: {
    method: 'DELETE' as const,
    path: '/api/events/{id}',
    summary: 'Delete event'
  },
  getTripEvents: {
    method: 'GET' as const,
    path: '/api/trips/{tripId}/events',
    summary: 'Get events for a trip'
  },
  createTripEvent: {
    method: 'POST' as const,
    path: '/api/trips/{tripId}/events',
    summary: 'Create event for trip'
  },
  getTripEventsByDate: {
    method: 'GET' as const,
    path: '/api/trips/{tripId}/events/date/{date}',
    summary: 'Get events by date'
  },
  getTripEventsByType: {
    method: 'GET' as const,
    path: '/api/trips/{tripId}/events/type/{type}',
    summary: 'Get events by type'
  },
  getAdminTrips: {
    method: 'GET' as const,
    path: '/api/admin/trips',
    summary: 'Get admin trip list'
  },
  updateTripStatus: {
    method: 'PATCH' as const,
    path: '/api/admin/trips/{id}/status',
    summary: 'Update trip status'
  },
  getTripStats: {
    method: 'GET' as const,
    path: '/api/admin/trips/stats',
    summary: 'Get trip statistics'
  },
  getDashboardStats: {
    method: 'POST' as const,
    path: '/api/admin/dashboard/stats',
    summary: 'Get dashboard statistics'
  },
  getSystemHealth: {
    method: 'GET' as const,
    path: '/api/admin/system/health',
    summary: 'System health check'
  },
  listAdminProfiles: {
    method: 'GET' as const,
    path: '/api/admin/profiles',
    summary: 'List admin profiles'
  },
  createAdminProfile: {
    method: 'POST' as const,
    path: '/api/admin/profiles',
    summary: 'Create admin profile'
  },
  updateAdminProfile: {
    method: 'PUT' as const,
    path: '/api/admin/profiles/{id}',
    summary: 'Update admin profile'
  },
  deleteAdminProfile: {
    method: 'DELETE' as const,
    path: '/api/admin/profiles/{id}',
    summary: 'Delete admin profile'
  }
} as const;

export type ApiOperation = keyof typeof API_OPERATIONS;

