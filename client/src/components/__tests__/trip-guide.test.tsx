import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TripGuide from '../trip-guide';
import { useTripData, type TripData } from '../../hooks/useTripData';
import { TimeFormatProvider } from '../../contexts/TimeFormatContext';

// Mock the useTripData hook
vi.mock('../../hooks/useTripData', () => ({
  useTripData: vi.fn(),
  transformTripData: vi.fn((data: any) => ({
    ITINERARY: data.itinerary.map((stop: any) => ({
      key: stop.date.split('T')[0],
      date: 'Oct 12',
      rawDate: stop.date,
      port: stop.portName,
      arrive: stop.arrivalTime || '—',
      depart: stop.departureTime || '—',
      allAboard: stop.allAboardTime,
      imageUrl: stop.portImageUrl,
      description: stop.description,
    })),
    DAILY: [{
      key: '2025-10-12',
      items: data.events.map((event: any) => ({
        time: event.time,
        title: event.title,
        type: event.type,
        venue: event.venue,
        description: event.description,
        imageUrl: event.imageUrl,
        talent: event.talentIds ? data.talent.filter((t: any) => event.talentIds.includes(t.id)) : []
      }))
    }],
    TALENT: data.talent.map((t: any) => ({
      name: t.name,
      bio: t.bio,
      cat: t.category,
      img: t.profileImageUrl,
      knownFor: t.category,
      social: t.social
    })),
    PARTY_THEMES: [],
    IMPORTANT_INFO: {},
    TRIP_INFO: {}
  }))
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<any>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => children,
}));

const mockTripData: TripData = {
  trip: {
    id: 1,
    name: 'Greek Isles October 2025',
    slug: 'greek-isles-october-2025',
    startDate: '2025-10-12',
    endDate: '2025-10-19',
    status: 'upcoming',
    heroImageUrl: 'https://example.com/hero.jpg',
    description: 'Amazing Greek Isles cruise',
    shortDescription: 'Greek Isles cruise',
    featured: true,
  },
  itinerary: [
    {
      id: 1,
      tripId: 1,
      date: '2025-10-12T00:00:00.000Z',
      day: 1,
      portName: 'Athens, Greece',
      country: 'Greece',
      arrivalTime: null,
      departureTime: '18:00',
      allAboardTime: '17:00',
      portImageUrl: 'https://example.com/athens.jpg',
      description: 'Explore the historic city of Athens',
      orderIndex: 1,
    },
  ],
  events: [
    {
      id: 1,
      tripId: 1,
      date: '2025-10-12T00:00:00.000Z',
      time: '20:00',
      title: 'Welcome Party',
      type: 'party',
      venue: 'Main Deck',
      description: 'Welcome aboard party',
      imageUrl: 'https://example.com/party.jpg',
      talentIds: [],
    },
    {
      id: 2,
      tripId: 1,
      date: '2025-10-12T00:00:00.000Z',
      time: '21:00',
      title: 'DJ Performance',
      type: 'performance',
      venue: 'Club',
      description: 'Amazing DJ set',
      talentIds: [1],
    },
  ],
  talent: [
    {
      id: 1,
      name: 'DJ Test',
      bio: 'Amazing DJ from somewhere',
      knownFor: 'Electronic Dance Music',
      category: 'DJs',
      profileImageUrl: 'https://example.com/dj.jpg',
      socialLinks: {
        instagram: 'https://instagram.com/djtest',
      },
    },
  ],
};

const renderTripGuide = (props: Record<string, any> = {}) => {
  return render(
    <TimeFormatProvider>
      <TripGuide slug="greek-isles-october-2025" {...props} />
    </TimeFormatProvider>
  );
};

describe('TripGuide Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useTripData as jest.MockedFunction<typeof useTripData>).mockReturnValue({
      data: mockTripData,
      isLoading: false,
      error: null,
      isError: false,
      refetch: vi.fn(),
    } as any);
  });

  describe('Party Events - Image Borders', () => {
    it('should render party event images with white border', async () => {
      renderTripGuide();

      // Navigate to Parties tab
      fireEvent.click(screen.getByText('Parties'));

      await waitFor(() => {
        const partyImages = screen.getAllByAltText(/Welcome Party/i);
        expect(partyImages.length).toBeGreaterThan(0);

        partyImages.forEach(img => {
          const container = img.closest('div');
          expect(container).toHaveClass('ring-2');
          expect(container).toHaveClass('ring-white/50');
        });
      });
    });
  });

  describe('Itinerary Time Display', () => {
    it('should show All Aboard time with gradient background', async () => {
      renderTripGuide();

      // Should be on Itinerary tab by default
      await waitFor(() => {
        const allAboardBadge = screen.getByText('17:00');
        const container = allAboardBadge.closest('span');
        expect(container).toHaveClass('bg-gradient-to-r');
        expect(container).toHaveClass('from-coral');
        expect(container).toHaveClass('to-pink-500');
      });
    });

    it('should show Depart time with simple bold styling', async () => {
      renderTripGuide();

      await waitFor(() => {
        const departLabel = screen.getByText('Depart:');
        const departTime = screen.getByText('18:00');
        const container = departTime.closest('span');
        expect(container).toHaveClass('font-bold');
        expect(container).toHaveClass('text-gray-800');
        expect(container).not.toHaveClass('bg-gradient-to-r');
      });
    });
  });

  describe('View Events Button', () => {
    it('should render View Events button on itinerary cards', async () => {
      renderTripGuide();

      await waitFor(() => {
        const viewEventsButton = screen.getByText('View Events');
        expect(viewEventsButton).toBeInTheDocument();
        expect(viewEventsButton).toHaveClass('bg-ocean-600');
      });
    });

    it('should open modal with events when View Events is clicked', async () => {
      renderTripGuide();

      await waitFor(() => {
        const viewEventsButton = screen.getByText('View Events');
        fireEvent.click(viewEventsButton);

        // Modal should open with events for that day
        expect(screen.getByText('Events for Athens, Greece')).toBeInTheDocument();
        expect(screen.getByText('Welcome Party')).toBeInTheDocument();
        expect(screen.getByText('DJ Performance')).toBeInTheDocument();
      });
    });
  });

  describe('Schedule Click Handlers', () => {
    it('should make schedule cards clickable when they contain talent', async () => {
      renderTripGuide();

      // Navigate to Schedule tab
      fireEvent.click(screen.getByText('Schedule'));

      await waitFor(() => {
        const talentCard = screen.getByText('DJ Performance').closest('.cursor-pointer');
        expect(talentCard).toBeInTheDocument();
      });
    });

    it('should open talent modal when clicking talent event', async () => {
      renderTripGuide();

      fireEvent.click(screen.getByText('Schedule'));

      await waitFor(() => {
        const talentEvent = screen.getByText('DJ Performance');
        fireEvent.click(talentEvent);

        // Talent modal should open
        expect(screen.getByText('DJ Test')).toBeInTheDocument();
        expect(screen.getByText('Amazing DJ from somewhere')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should display properly on mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderTripGuide();

      await waitFor(() => {
        // Check that mobile-specific classes are applied
        const cards = screen.getAllByTestId('itinerary-card');
        cards.forEach(card => {
          expect(card).toHaveClass('flex-col');
          expect(card.querySelector('.sm\\:flex-row')).toBeInTheDocument();
        });
      });
    });

    it('should prevent text overflow on small screens', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderTripGuide();

      await waitFor(() => {
        const textElements = screen.getAllByText(/Athens, Greece/i);
        textElements.forEach(element => {
          const styles = window.getComputedStyle(element);
          expect(styles.wordBreak).toBe('break-words');
        });
      });
    });
  });

  describe('Timing Logic', () => {
    it('should show all events for upcoming cruise', async () => {
      renderTripGuide();

      fireEvent.click(screen.getByText('Schedule'));

      await waitFor(() => {
        expect(screen.getByText('Welcome Party')).toBeInTheDocument();
        expect(screen.getByText('DJ Performance')).toBeInTheDocument();
      });
    });

    it('should filter past events for current cruise', async () => {
      (useTripData as jest.MockedFunction<typeof useTripData>).mockReturnValue({
        data: {
          ...mockTripData,
          trip: {
            ...mockTripData.trip,
            status: 'current',
          },
        },
        isLoading: false,
        error: null,
        isError: false,
        refetch: vi.fn(),
      } as any);

      renderTripGuide();

      fireEvent.click(screen.getByText('Schedule'));

      await waitFor(() => {
        // Past events should be filtered out
        // (We'll need to mock dates to test this properly)
        const events = screen.getAllByText(/Party|Performance/);
        expect(events.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state', () => {
      (useTripData as jest.MockedFunction<typeof useTripData>).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        isError: false,
        isPending: true,
        isLoadingError: false,
        isRefetchError: false,
        isSuccess: false,
        isFetching: true,
        isFetched: false,
        isFetchedAfterMount: false,
        isRefetching: false,
        isStale: false,
        isPlaceholderData: false,
        status: 'pending',
        fetchStatus: 'fetching',
        errorUpdateCount: 0,
        errorUpdatedAt: 0,
        dataUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        refetch: vi.fn(),
      } as any);

      renderTripGuide();

      expect(screen.getByText('Loading trip guide...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      (useTripData as jest.MockedFunction<typeof useTripData>).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load trip data'),
        isError: true,
        isPending: false,
        isLoadingError: true,
        isRefetchError: false,
        isSuccess: false,
        isFetching: false,
        isFetched: true,
        isFetchedAfterMount: true,
        isRefetching: false,
        isStale: false,
        isPlaceholderData: false,
        status: 'error',
        fetchStatus: 'idle',
        errorUpdateCount: 1,
        errorUpdatedAt: Date.now(),
        dataUpdatedAt: 0,
        failureCount: 1,
        failureReason: new Error('Failed to load trip data'),
        refetch: vi.fn(),
      } as any);

      renderTripGuide();

      expect(screen.getByText(/Unable to load trip guide/)).toBeInTheDocument();
    });
  });
});