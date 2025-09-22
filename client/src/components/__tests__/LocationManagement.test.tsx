/**
 * Location Management Component Tests
 * Tests for the Location Management interface
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Updated component imports
import LocationManagement from '../admin/LocationManagement';

// Mock Supabase auth context
vi.mock('../../contexts/SupabaseAuthContext', () => ({
  useSupabaseAuth: () => ({
    session: {
      access_token: 'mock-token'
    }
  })
}));

// Mock toast hook
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('LocationManagement', () => {
  let mockFetch: any;

  beforeEach(() => {
    // Mock fetch globally
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Default successful response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });
  });

  it('renders location management component', async () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <LocationManagement />
      </Wrapper>
    );

    expect(screen.getByText('Location Management')).toBeInTheDocument();
  });

  it('displays locations when data is loaded', async () => {
    const mockLocations = [
      {
        id: 1,
        name: 'Santorini',
        country: 'Greece',
        region: 'Mediterranean',
        port_type: 'port',
        coordinates: { lat: 36.3932, lng: 25.4615 },
        description: 'Beautiful Greek island'
      }
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLocations)
    });

    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <LocationManagement />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Santorini')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('API Error'));

    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <LocationManagement />
      </Wrapper>
    );

    // Component should still render without crashing
    expect(screen.getByText('Location Management')).toBeInTheDocument();
  });

  it('allows searching through locations', async () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <LocationManagement />
      </Wrapper>
    );

    const searchInput = screen.getByPlaceholderText(/search locations/i);
    expect(searchInput).toBeInTheDocument();

    await userEvent.type(searchInput, 'santorini');
    expect(searchInput).toHaveValue('santorini');
  });

  it('provides add location functionality', async () => {
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <LocationManagement />
      </Wrapper>
    );

    const addButton = screen.getByText('Add Location');
    expect(addButton).toBeInTheDocument();
  });
});