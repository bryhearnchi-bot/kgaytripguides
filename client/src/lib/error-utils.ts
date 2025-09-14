// Error types for better error handling
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface NetworkError extends Error {
  status?: number;
  response?: Response;
}

// Error classification
export const isNetworkError = (error: unknown): error is NetworkError => {
  return error instanceof Error && 'status' in error;
};

export const isApiError = (error: unknown): error is ApiError => {
  return typeof error === 'object' && error !== null && 'message' in error;
};

// Error message helpers
export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }

  if (isNetworkError(error)) {
    switch (error.status) {
      case 404:
        return 'The requested resource was not found.';
      case 500:
        return 'Internal server error. Please try again later.';
      case 403:
        return 'You do not have permission to access this resource.';
      case 401:
        return 'Authentication required. Please log in.';
      default:
        return 'Network error occurred. Please check your connection.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
};

// Retry logic for network errors
export const shouldRetry = (error: unknown, retryCount: number): boolean => {
  if (retryCount >= 3) return false;

  if (isNetworkError(error)) {
    // Retry on server errors (5xx) and timeout errors
    return error.status ? error.status >= 500 : true;
  }

  return false;
};

// Log errors appropriately
export const logError = (error: unknown, context?: string) => {
  const isDevelopment = import.meta.env.DEV;

  if (isDevelopment) {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);
  } else {
    // In production, you might want to send to an error tracking service
    // Example: Sentry.captureException(error, { tags: { context } });
  }
};