import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAuthHeaders,
  authenticatedFetch,
  authenticatedGet,
  authenticatedPost,
  authenticatedPut,
  authenticatedDelete,
  ApiError,
  AuthErrorType,
  handleApiError,
  requireAdminRole,
  retryAuthenticatedRequest
} from '../authUtils';
import { supabase } from '../supabase';

// Mock supabase
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

// Mock fetch
global.fetch = vi.fn();

describe('authUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAuthHeaders', () => {
    it('should return headers with valid session token', async () => {
      const mockSession = {
        access_token: 'test-token-123',
        user: { id: 'user-123' }
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const headers = await getAuthHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token-123'
      });
    });

    it('should throw error when no session available', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      });

      await expect(getAuthHeaders()).rejects.toThrow(
        new ApiError('No authentication token available', AuthErrorType.NO_SESSION)
      );
    });

    it('should throw error when session fetch fails', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: new Error('Session error')
      });

      await expect(getAuthHeaders()).rejects.toThrow(
        new ApiError('Failed to get authentication session', AuthErrorType.NO_SESSION)
      );
    });
  });

  describe('authenticatedFetch', () => {
    const mockSession = {
      access_token: 'test-token-123',
      user: { id: 'user-123' }
    };

    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      });
    });

    it('should make authenticated request successfully', async () => {
      const mockResponse = new Response('{"success": true}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const response = await authenticatedFetch('/api/test');

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-123'
        },
        credentials: 'include'
      });

      expect(response).toBe(mockResponse);
    });

    it('should handle 401 authentication error', async () => {
      const mockResponse = new Response('Unauthorized', { status: 401 });
      vi.mocked(fetch).mockResolvedValue(mockResponse);

      await expect(authenticatedFetch('/api/test')).rejects.toThrow(
        new ApiError('Authentication failed', AuthErrorType.INVALID_TOKEN, 401)
      );
    });

    it('should handle 403 permission error', async () => {
      const mockResponse = new Response('Forbidden', { status: 403 });
      vi.mocked(fetch).mockResolvedValue(mockResponse);

      await expect(authenticatedFetch('/api/test')).rejects.toThrow(
        new ApiError('Insufficient permissions', AuthErrorType.INSUFFICIENT_PERMISSIONS, 403)
      );
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValue(new TypeError('fetch error'));

      await expect(authenticatedFetch('/api/test')).rejects.toThrow(
        new ApiError('Network connection failed', AuthErrorType.NETWORK_ERROR)
      );
    });

    it('should merge custom headers', async () => {
      const mockResponse = new Response('{"success": true}', { status: 200 });
      vi.mocked(fetch).mockResolvedValue(mockResponse);

      await authenticatedFetch('/api/test', {
        headers: { 'X-Custom': 'value' }
      });

      expect(fetch).toHaveBeenCalledWith('/api/test', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token-123',
          'X-Custom': 'value'
        },
        credentials: 'include'
      });
    });
  });

  describe('authenticatedGet', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      });
    });

    it('should return parsed JSON on successful GET', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockResponse = new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const result = await authenticatedGet('/api/test');

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'GET'
      }));
    });

    it('should throw error on failed GET request', async () => {
      const mockResponse = new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404
      });

      vi.mocked(fetch).mockResolvedValue(mockResponse);

      await expect(authenticatedGet('/api/test')).rejects.toThrow(
        new ApiError('Not found', undefined, 404)
      );
    });
  });

  describe('authenticatedPost', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      });
    });

    it('should send POST request with data', async () => {
      const mockData = { id: 1, name: 'Created' };
      const mockResponse = new Response(JSON.stringify(mockData), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });

      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const postData = { name: 'Test', value: 123 };
      const result = await authenticatedPost('/api/test', postData);

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(postData)
      }));
    });

    it('should handle POST without data', async () => {
      const mockResponse = new Response('{}', { status: 200 });
      vi.mocked(fetch).mockResolvedValue(mockResponse);

      await authenticatedPost('/api/test');

      expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
        method: 'POST',
        body: undefined
      }));
    });
  });

  describe('authenticatedPut', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      });
    });

    it('should send PUT request with data', async () => {
      const mockData = { id: 1, name: 'Updated' };
      const mockResponse = new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const putData = { name: 'Updated Name' };
      const result = await authenticatedPut('/api/test/1', putData);

      expect(result).toEqual(mockData);
      expect(fetch).toHaveBeenCalledWith('/api/test/1', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(putData)
      }));
    });
  });

  describe('authenticatedDelete', () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null
      });
    });

    it('should handle DELETE request with 204 response', async () => {
      const mockResponse = new Response(null, { status: 204 });
      vi.mocked(fetch).mockResolvedValue(mockResponse);

      await expect(authenticatedDelete('/api/test/1')).resolves.toBeUndefined();

      expect(fetch).toHaveBeenCalledWith('/api/test/1', expect.objectContaining({
        method: 'DELETE'
      }));
    });

    it('should handle DELETE request with JSON response', async () => {
      const mockData = { success: true };
      const mockResponse = new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

      vi.mocked(fetch).mockResolvedValue(mockResponse);

      const result = await authenticatedDelete('/api/test/1');
      expect(result).toEqual(mockData);
    });
  });

  describe('requireAdminRole', () => {
    it('should pass for admin users', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null
      });

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }))
        }))
      }));

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await expect(requireAdminRole()).resolves.toBeUndefined();
    });

    it('should throw error for non-admin users', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null
      });

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { role: 'viewer' },
              error: null
            })
          }))
        }))
      }));

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      await expect(requireAdminRole()).rejects.toThrow(
        new ApiError('Admin access required', AuthErrorType.INSUFFICIENT_PERMISSIONS)
      );
    });

    it('should throw error when no session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      });

      await expect(requireAdminRole()).rejects.toThrow(
        new ApiError('Authentication required', AuthErrorType.NO_SESSION)
      );
    });
  });

  describe('handleApiError', () => {
    it('should handle different error types correctly', () => {
      const mockToast = vi.fn();

      // Test NO_SESSION error
      const noSessionError = new ApiError('No session', AuthErrorType.NO_SESSION);
      handleApiError(noSessionError, mockToast);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Authentication Required',
        description: 'Please log in to continue.',
        variant: 'destructive'
      });

      // Test INVALID_TOKEN error
      mockToast.mockClear();
      const invalidTokenError = new ApiError('Invalid token', AuthErrorType.INVALID_TOKEN);
      handleApiError(invalidTokenError, mockToast);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Session Expired',
        description: 'Please log in again.',
        variant: 'destructive'
      });

      // Test INSUFFICIENT_PERMISSIONS error
      mockToast.mockClear();
      const permissionError = new ApiError('No permission', AuthErrorType.INSUFFICIENT_PERMISSIONS);
      handleApiError(permissionError, mockToast);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Access Denied',
        description: 'You don\'t have permission to perform this action.',
        variant: 'destructive'
      });

      // Test NETWORK_ERROR
      mockToast.mockClear();
      const networkError = new ApiError('Network failed', AuthErrorType.NETWORK_ERROR);
      handleApiError(networkError, mockToast);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Connection Error',
        description: 'Please check your internet connection and try again.',
        variant: 'destructive'
      });

      // Test unknown error
      mockToast.mockClear();
      const unknownError = new Error('Something went wrong');
      handleApiError(unknownError, mockToast);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    });
  });

  describe('retryAuthenticatedRequest', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await retryAuthenticatedRequest(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on network errors', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new ApiError('Network error', AuthErrorType.NETWORK_ERROR))
        .mockResolvedValue('success');

      const result = await retryAuthenticatedRequest(mockFn, 3, 1);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should not retry authentication errors', async () => {
      const mockFn = vi.fn()
        .mockRejectedValue(new ApiError('No session', AuthErrorType.NO_SESSION));

      await expect(retryAuthenticatedRequest(mockFn, 3, 1)).rejects.toThrow(
        new ApiError('No session', AuthErrorType.NO_SESSION)
      );

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should fail after max retries', async () => {
      const mockFn = vi.fn()
        .mockRejectedValue(new Error('Server error'));

      await expect(retryAuthenticatedRequest(mockFn, 3, 1)).rejects.toThrow('Server error');

      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('ApiError class', () => {
    it('should create error with all properties', () => {
      const error = new ApiError('Test message', 'TEST_CODE', 400, { extra: 'data' });

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ extra: 'data' });
      expect(error.name).toBe('ApiError');
    });

    it('should create error with minimal properties', () => {
      const error = new ApiError('Simple error');

      expect(error.message).toBe('Simple error');
      expect(error.code).toBeUndefined();
      expect(error.status).toBeUndefined();
      expect(error.details).toBeUndefined();
    });
  });
});