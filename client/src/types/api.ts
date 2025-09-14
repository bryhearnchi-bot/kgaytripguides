// Enhanced API response types with better error handling
export interface ApiResponse<T> {
  data: T;
  success: true;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query parameter types
export interface TripFilters {
  status?: 'upcoming' | 'current' | 'completed';
  featured?: boolean;
  startDate?: string;
  endDate?: string;
}

// Utility types for better type safety
export type NonEmptyString = string & { readonly brand: unique symbol };

export const isNonEmptyString = (value: string): value is NonEmptyString => {
  return value.trim().length > 0;
};

// Environment variables type
export interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly VITE_API_URL?: string;
}

export interface ImportMeta {
  readonly env: ImportMetaEnv;
}