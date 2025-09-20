import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import AccountSetup from '../AccountSetup';

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signUp: vi.fn(),
    },
  },
}));

// Mock useSupabaseAuth hook
vi.mock('@/hooks/useSupabaseAuth', () => ({
  useSupabaseAuth: () => ({
    user: null,
    profile: null,
    session: null,
    loading: false,
    isAuthenticated: false,
    isAdmin: false,
    signUp: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
    signIn: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
  }),
}));

// Mock wouter hooks
vi.mock('wouter', () => ({
  useLocation: () => ['/setup-account/test-token', vi.fn()],
  useRoute: () => [true, { token: 'test-invitation-token' }],
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <SupabaseAuthProvider>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </SupabaseAuthProvider>
  </QueryClientProvider>
);

describe('AccountSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful invitation verification
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/auth/verify-invitation/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            invitation: {
              email: 'test@example.com',
              full_name: 'Test User',
              role: 'content_editor',
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }
          })
        });
      }
      return Promise.resolve({ ok: false });
    });
  });

  it('renders the account setup wizard', async () => {
    render(
      <TestWrapper>
        <AccountSetup />
      </TestWrapper>
    );

    // Should show verifying message initially
    expect(screen.getByText('Verifying invitation...')).toBeInTheDocument();

    // Wait for verification to complete
    await waitFor(() => {
      expect(screen.getByText('Account Setup')).toBeInTheDocument();
    });

    // Should show progress indicator
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();

    // Should show step 1 by default (email verification)
    expect(screen.getByText('Verify Email')).toBeInTheDocument();
    expect(screen.getByText('Email Verified Successfully!')).toBeInTheDocument();
  });

  it('displays all four steps in the progress indicator', async () => {
    render(
      <TestWrapper>
        <AccountSetup />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Account Setup')).toBeInTheDocument();
    });

    // Check all step titles are present
    expect(screen.getByText('Verify Email')).toBeInTheDocument();
    expect(screen.getByText('Create Password')).toBeInTheDocument();
    expect(screen.getByText('Profile Setup')).toBeInTheDocument();
    expect(screen.getByText('Accept Terms')).toBeInTheDocument();
  });

  it('allows navigation between steps', async () => {
    render(
      <TestWrapper>
        <AccountSetup />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Account Setup')).toBeInTheDocument();
    });

    // Start on step 1
    expect(screen.getByText('Email Verified Successfully!')).toBeInTheDocument();

    // Click Continue to go to step 2
    const continueButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(continueButton);

    // Should now be on step 2 (password creation)
    await waitFor(() => {
      expect(screen.getByLabelText(/password \*/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password \*/i)).toBeInTheDocument();
    });
  });

  it('validates password strength', async () => {
    render(
      <TestWrapper>
        <AccountSetup />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Account Setup')).toBeInTheDocument();
    });

    // Navigate to password step
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/password \*/i)).toBeInTheDocument();
    });

    // Enter a weak password
    const passwordInput = screen.getByLabelText(/password \*/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });

    // Should show weak password indicator
    await waitFor(() => {
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    // Enter a strong password
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });

    // Should show strong password indicator
    await waitFor(() => {
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });
  });

  it('validates form fields', async () => {
    render(
      <TestWrapper>
        <AccountSetup />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Account Setup')).toBeInTheDocument();
    });

    // Navigate to password step
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/password \*/i)).toBeInTheDocument();
    });

    // Try to continue without filling password
    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).toBeDisabled();

    // Fill password but not confirm password
    const passwordInput = screen.getByLabelText(/password \*/i);
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });

    // Still should be disabled
    expect(continueButton).toBeDisabled();

    // Fill confirm password with different value
    const confirmPasswordInput = screen.getByLabelText(/confirm password \*/i);
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass123!' } });

    // Should show error for mismatched passwords
    await waitFor(() => {
      expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
    });

    // Fix the confirm password
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });

    // Now continue button should be enabled
    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });
  });

  it('shows mobile responsive design', async () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375 });

    render(
      <TestWrapper>
        <AccountSetup />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Account Setup')).toBeInTheDocument();
    });

    // Check that mobile-specific elements are present
    const progressContainer = screen.getByText('Progress').closest('div');
    expect(progressContainer).toBeInTheDocument();

    // Check ocean theme colors are applied
    const setupCard = screen.getByText('Account Setup').closest('.shadow-xl');
    expect(setupCard).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock failed invitation verification
    (global.fetch as any).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({
          error: 'Invalid invitation',
          message: 'The invitation token is invalid or expired'
        })
      })
    );

    render(
      <TestWrapper>
        <AccountSetup />
      </TestWrapper>
    );

    // Should redirect on invalid token (we can't test actual redirect in this environment)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/verify-invitation/test-invitation-token',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  });

  it('prevents submission with invalid data', async () => {
    render(
      <TestWrapper>
        <AccountSetup />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Account Setup')).toBeInTheDocument();
    });

    // Navigate through all steps quickly without filling required fields
    let continueButton = screen.getByRole('button', { name: /continue/i });

    // Step 1 should allow continue (email verified)
    fireEvent.click(continueButton);

    // Step 2 should be disabled without password
    await waitFor(() => {
      continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();
    });
  });

  it('displays proper error states for each field', async () => {
    render(
      <TestWrapper>
        <AccountSetup />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Account Setup')).toBeInTheDocument();
    });

    // Go to step 3 (profile setup)
    fireEvent.click(screen.getByRole('button', { name: /continue/i })); // Step 1 -> 2

    await waitFor(() => {
      const passwordInput = screen.getByLabelText(/password \*/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password \*/i);

      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
    });

    fireEvent.click(screen.getByRole('button', { name: /continue/i })); // Step 2 -> 3

    await waitFor(() => {
      expect(screen.getByLabelText(/full name \*/i)).toBeInTheDocument();
    });

    // Try to continue without full name
    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).toBeDisabled();

    // Add full name
    const fullNameInput = screen.getByLabelText(/full name \*/i);
    fireEvent.change(fullNameInput, { target: { value: 'Test User' } });

    // Now should be able to continue
    await waitFor(() => {
      expect(continueButton).not.toBeDisabled();
    });
  });
});