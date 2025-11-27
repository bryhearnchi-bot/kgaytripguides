import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { useTripWizard } from '@/contexts/TripWizardContext';

interface Event {
  id?: number;
  tripId: number;
  date: string;
  time: string;
  title: string;
  shipVenueId: number | null;
  resortVenueId: number | null;
  venueName?: string;
  talentIds: number[];
  talentNames?: string[];
  talentImages?: string[];
  partyThemeId: number | null;
  partyThemeName?: string;
  eventTypeId: number;
  eventTypeName?: string;
  eventTypeColor?: string;
  eventTypeIcon?: string;
  imageUrl?: string;
  description?: string;
}

interface DayInfo {
  date: string;
  dayLabel: string;
  locationName?: string;
  events: Event[];
}

interface EventsNavigationContextType {
  // Navigation state
  selectedDayIndex: number;
  setSelectedDayIndex: (index: number) => void;

  // Modal state
  showAddEventModal: boolean;
  setShowAddEventModal: (show: boolean) => void;

  // Computed values
  sortedDays: DayInfo[];
  dayOptions: { value: string; label: string; shortLabel: string }[];
  totalDays: number;
  currentDay: DayInfo | null;
  eventsForCurrentDay: Event[];

  // Navigation helpers
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

const EventsNavigationContext = createContext<EventsNavigationContextType | null>(null);

export function EventsNavigationProvider({ children }: { children: ReactNode }) {
  const { state } = useTripWizard();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  // Get events from state
  const events = useMemo(() => {
    return Array.isArray(state.events) ? state.events : [];
  }, [state.events]);

  // Get all unique dates from either itinerary entries (cruise) or schedule entries (resort)
  // and include any event dates that might not be in the schedule
  const sortedDays = useMemo(() => {
    const tripType = state.tripType || (state.tripData.tripTypeId === 1 ? 'cruise' : 'resort');
    const dateMap = new Map<string, DayInfo>();

    // First, add all dates from itinerary/schedule
    if (tripType === 'cruise') {
      state.itineraryEntries.forEach((entry, idx) => {
        const dayLabel =
          entry.dayNumber < 1
            ? 'Pre-Trip'
            : entry.dayNumber >= 100
              ? 'Post-Trip'
              : `Day ${entry.dayNumber}`;
        dateMap.set(entry.date, {
          date: entry.date,
          dayLabel,
          locationName: entry.locationName,
          events: [],
        });
      });
    } else {
      state.scheduleEntries.forEach((entry, idx) => {
        dateMap.set(entry.date, {
          date: entry.date,
          dayLabel: `Day ${entry.dayNumber}`,
          events: [],
        });
      });
    }

    // Add any event dates that aren't in the schedule
    events.forEach(event => {
      if (!dateMap.has(event.date)) {
        // Calculate day label from date
        dateMap.set(event.date, {
          date: event.date,
          dayLabel: formatDayLabel(event.date, state.tripData.startDate),
          events: [],
        });
      }
    });

    // Add events to their respective days
    events.forEach(event => {
      const dayInfo = dateMap.get(event.date);
      if (dayInfo) {
        dayInfo.events.push(event);
      }
    });

    // Sort each day's events by time
    dateMap.forEach(dayInfo => {
      dayInfo.events.sort((a, b) => a.time.localeCompare(b.time));
    });

    // Sort days by date
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [
    state.itineraryEntries,
    state.scheduleEntries,
    state.tripType,
    state.tripData.tripTypeId,
    state.tripData.startDate,
    events,
  ]);

  // Build day options for PillDropdown navigation
  const dayOptions = useMemo(() => {
    return sortedDays.map((day, idx) => {
      const locationLabel = day.locationName ? ` - ${day.locationName}` : '';
      const eventCount = day.events.length;
      const countLabel = eventCount > 0 ? ` (${eventCount})` : '';
      return {
        value: idx.toString(),
        label: `${day.dayLabel}${locationLabel}${countLabel}`,
        shortLabel: day.dayLabel,
      };
    });
  }, [sortedDays]);

  const totalDays = sortedDays.length;
  const canGoPrevious = selectedDayIndex > 0;
  const canGoNext = selectedDayIndex < totalDays - 1;

  const currentDay = sortedDays[selectedDayIndex] || null;
  const eventsForCurrentDay = currentDay?.events || [];

  const goToPreviousDay = useCallback(() => {
    if (canGoPrevious) {
      setSelectedDayIndex(prev => prev - 1);
    }
  }, [canGoPrevious]);

  const goToNextDay = useCallback(() => {
    if (canGoNext) {
      setSelectedDayIndex(prev => prev + 1);
    }
  }, [canGoNext]);

  const value = useMemo(
    () => ({
      selectedDayIndex,
      setSelectedDayIndex,
      showAddEventModal,
      setShowAddEventModal,
      sortedDays,
      dayOptions,
      totalDays,
      currentDay,
      eventsForCurrentDay,
      goToPreviousDay,
      goToNextDay,
      canGoPrevious,
      canGoNext,
    }),
    [
      selectedDayIndex,
      showAddEventModal,
      sortedDays,
      dayOptions,
      totalDays,
      currentDay,
      eventsForCurrentDay,
      goToPreviousDay,
      goToNextDay,
      canGoPrevious,
      canGoNext,
    ]
  );

  return (
    <EventsNavigationContext.Provider value={value}>{children}</EventsNavigationContext.Provider>
  );
}

export function useEventsNavigation() {
  const context = useContext(EventsNavigationContext);
  if (!context) {
    throw new Error('useEventsNavigation must be used within an EventsNavigationProvider');
  }
  return context;
}

// Helper function to format day label from date
function formatDayLabel(eventDate: string, tripStartDate?: string): string {
  if (!tripStartDate) return 'Day 1';

  const parseDateString = (dateStr: string): Date => {
    const parts = dateStr.split('-');
    const year = Number(parts[0] || 2025);
    const month = Number(parts[1] || 1);
    const day = Number(parts[2] || 1);
    return new Date(year, month - 1, day);
  };

  const eventDateObj = parseDateString(eventDate);
  const startDateObj = parseDateString(tripStartDate);
  const daysDiff = Math.floor(
    (eventDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff < 0) {
    return 'Pre-Trip';
  } else if (daysDiff >= 100) {
    return 'Post-Trip';
  }
  return `Day ${daysDiff + 1}`;
}
