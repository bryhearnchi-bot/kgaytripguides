import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ShipsManagement from '../ships';
import { vi } from 'vitest';

// Mock the API response
const mockShips = [
  {
    id: 1,
    name: 'Valiant Lady',
    cruiseLine: 'Virgin Voyages',
    capacity: 2770,
    decks: 17,
    builtYear: 2021
  },
  {
    id: 2,
    name: 'Resilient Lady',
    cruiseLine: 'Virgin Voyages',
    capacity: 2770,
    decks: 17,
    builtYear: 2023
  }
];

// Mock fetch
global.fetch = vi.fn();

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('Ships Table Layout', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Mock successful fetch
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockShips
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('displays ships in table format instead of cards', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ShipsManagement />
      </QueryClientProvider>
    );

    // Wait for ships to load
    await waitFor(() => {
      expect(screen.getByText('Valiant Lady')).toBeInTheDocument();
    });

    // Check table structure exists
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Check table headers
    expect(screen.getByText('Ship Details')).toBeInTheDocument();
    expect(screen.getByText('Capacity')).toBeInTheDocument();
    expect(screen.getByText('Ports')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check that ships are displayed in table rows
    const shipNameCells = screen.getAllByText(/Lady/);
    expect(shipNameCells.length).toBeGreaterThan(0);

    // Check capacity display
    expect(screen.getAllByText('2,770')).toHaveLength(2);

    // Check action buttons exist
    const editButtons = screen.getAllByTitle('Edit Ship');
    const deleteButtons = screen.getAllByTitle('Delete Ship');

    expect(editButtons.length).toBe(2);
    expect(deleteButtons.length).toBe(2);
  });

  it('shows correct capacity format with users icon', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ShipsManagement />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Valiant Lady')).toBeInTheDocument();
    });

    // Check capacity format includes "guests" text
    expect(screen.getAllByText('guests')).toHaveLength(2);

    // Check formatted number display
    expect(screen.getAllByText('2,770')).toHaveLength(2);
  });

  it('displays status and port badges correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ShipsManagement />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Valiant Lady')).toBeInTheDocument();
    });

    // Check status badges
    const statusBadges = screen.getAllByText('Active');
    expect(statusBadges.length).toBe(2);

    // Check port badges
    const portBadges = screen.getAllByText('Multiple Ports');
    expect(portBadges.length).toBe(2);
  });
});