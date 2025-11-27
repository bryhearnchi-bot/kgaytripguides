import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { useTripWizard, ItineraryEntry } from '@/contexts/TripWizardContext';

interface ItineraryNavigationContextType {
  // Navigation state
  selectedDayIndex: number;
  setSelectedDayIndex: (index: number) => void;

  // Modal state
  showAddDayModal: boolean;
  setShowAddDayModal: (show: boolean) => void;

  // Computed values
  sortedEntries: ItineraryEntry[];
  dayOptions: { value: string; label: string; shortLabel: string }[];
  totalDays: number;

  // Navigation helpers
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

const ItineraryNavigationContext = createContext<ItineraryNavigationContextType | null>(null);

export function ItineraryNavigationProvider({ children }: { children: ReactNode }) {
  const { state } = useTripWizard();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showAddDayModal, setShowAddDayModal] = useState(false);

  // Sort entries by day number for display
  const sortedEntries = useMemo(() => {
    return [...state.itineraryEntries].sort((a, b) => a.dayNumber - b.dayNumber);
  }, [state.itineraryEntries]);

  // Build day options for PillDropdown navigation
  const dayOptions = useMemo(() => {
    return sortedEntries.map((entry, idx) => {
      const dayLabel =
        entry.dayNumber < 1
          ? 'Pre-Trip'
          : entry.dayNumber >= 100
            ? 'Post-Trip'
            : `Day ${entry.dayNumber}`;
      const locationLabel = entry.locationName ? ` - ${entry.locationName}` : '';
      return {
        value: idx.toString(),
        label: `${dayLabel}${locationLabel}`,
        shortLabel: dayLabel,
      };
    });
  }, [sortedEntries]);

  const totalDays = sortedEntries.length;
  const canGoPrevious = selectedDayIndex > 0;
  const canGoNext = selectedDayIndex < totalDays - 1;

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
      showAddDayModal,
      setShowAddDayModal,
      sortedEntries,
      dayOptions,
      totalDays,
      goToPreviousDay,
      goToNextDay,
      canGoPrevious,
      canGoNext,
    }),
    [
      selectedDayIndex,
      showAddDayModal,
      sortedEntries,
      dayOptions,
      totalDays,
      goToPreviousDay,
      goToNextDay,
      canGoPrevious,
      canGoNext,
    ]
  );

  return (
    <ItineraryNavigationContext.Provider value={value}>
      {children}
    </ItineraryNavigationContext.Provider>
  );
}

export function useItineraryNavigation() {
  const context = useContext(ItineraryNavigationContext);
  if (!context) {
    throw new Error('useItineraryNavigation must be used within an ItineraryNavigationProvider');
  }
  return context;
}
