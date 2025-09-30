import { renderHook, act, waitFor } from '@testing-library/react';
import { useSupabaseAuth } from '../useSupabaseAuth';
import { supabase } from '../../lib/supabase';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/admin/dashboard', vi.fn()],
}));

describe('useSupabaseAuth - Loading State Fix', () => {
  const mockSubscription = { unsubscribe: vi.fn() };
  let mockAuthStateCallback: (event: string, session: any) => void;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock getSession to return a session
    (supabase.auth.getSession as any).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user-id', email: 'test@example.com' },
          access_token: 'mock-token',
        },
      },
    });

    // Mock onAuthStateChange to capture the callback
    (supabase.auth.onAuthStateChange as any).mockImplementation((callback: (event: string, session: any) => void) => {
      mockAuthStateCallback = callback;
      return { data: { subscription: mockSubscription } };
    });

    // Mock profile fetch to fail (this was causing the loading issue)
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error('Profile not found')),
        }),
      }),
    });
  });

  it('should set loading to false immediately after session is available, even if profile fetch fails', async () => {
    const { result } = renderHook(() => useSupabaseAuth());

    // Initially loading should be true
    expect(result.current.loading).toBe(true);

    // Wait for initial auth to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Session should be set
    expect(result.current.session).toBeTruthy();
    expect(result.current.user).toBeTruthy();
    expect(result.current.isAuthenticated).toBe(true);

    // Profile should be null (fetch failed) but loading should still be false
    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should set loading to false immediately when auth state changes, regardless of profile fetch', async () => {
    const { result } = renderHook(() => useSupabaseAuth());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simulate login via auth state change
    const newSession = {
      user: { id: 'new-user-id', email: 'new@example.com' },
      access_token: 'new-token',
    };

    await act(async () => {
      mockAuthStateCallback('SIGNED_IN', newSession);
    });

    // Loading should immediately be false
    expect(result.current.loading).toBe(false);
    expect(result.current.session).toBeTruthy();
    expect(result.current.user).toBeTruthy();
    expect(result.current.isAuthenticated).toBe(true);

    // Profile fetch failure doesn't affect loading state
    expect(result.current.profile).toBeNull();
  });

  it('should handle successful profile fetch without blocking loading state', async () => {
    // Mock successful profile fetch
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'test-user-id',
              email: 'test@example.com',
              name: 'Test User',
              role: 'admin',
              created_at: '2023-01-01',
              updated_at: '2023-01-01',
            },
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useSupabaseAuth());

    // Wait for auth to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have session and eventually profile
    expect(result.current.session).toBeTruthy();
    expect(result.current.loading).toBe(false);

    // Profile should eventually be loaded
    await waitFor(() => {
      expect(result.current.profile).toBeTruthy();
    });

    expect(result.current.loading).toBe(false); // Still false after profile load
  });

  it('should not get stuck in loading state when profile table does not exist', async () => {
    // Mock profile fetch to simulate table not existing
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue({
            code: '42P01', // PostgreSQL table does not exist error
            message: 'relation "profiles" does not exist',
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useSupabaseAuth());

    // Should still complete loading despite profile fetch failure
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.session).toBeTruthy();
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.profile).toBeNull();
  });
});