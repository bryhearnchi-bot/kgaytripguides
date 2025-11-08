import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '@/lib/api-client';

export type BuildMethod = 'url' | 'pdf' | 'manual' | null;
export type TripType = 'resort' | 'cruise' | null;

interface TripData {
  id?: number; // Trip ID (for editing existing trips)
  charterCompanyId?: number;
  tripTypeId?: number;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  heroImageUrl: string;
  mapUrl: string;
  description: string;
  highlights: string;
}

export interface ResortData {
  name: string;
  location?: string;
  locationName?: string; // Alias for location
  locationId?: number;
  capacity?: number;
  numberOfRooms?: number;
  imageUrl: string;
  description: string;
  propertyMapUrl: string;
  checkInTime: string;
  checkOutTime: string;
  city?: string;
  state_province?: string;
  country?: string;
  country_code?: string;
  resortCompanyId?: number;
}

interface ShipData {
  name: string;
  cruiseLineId?: number;
  cruiseLineName?: string; // Display name from cruise_lines table
  capacity?: number;
  decks?: number;
  imageUrl: string;
  description: string;
  deckPlansUrl: string;
}

export interface ScheduleEntry {
  id?: number;
  dayNumber: number;
  date: string;
  imageUrl: string;
  description: string;
}

export interface ItineraryEntry {
  id?: number;
  dayNumber: number;
  date: string;
  locationId?: number;
  locationTypeId?: number;
  locationName: string;
  arrivalTime: string;
  departureTime: string;
  allAboardTime: string;
  description: string;
  imageUrl: string;
}

interface TripWizardState {
  currentPage: number;
  draftId?: number | null;
  tripType: TripType;
  buildMethod: BuildMethod;
  tripData: Partial<TripData>;
  resortId?: number | null;
  shipId?: number | null;
  resortData: Partial<ResortData> | null;
  shipData: Partial<ShipData> | null;
  amenityIds: number[];
  venueIds: number[];
  scheduleEntries: ScheduleEntry[];
  itineraryEntries: ItineraryEntry[];
  events?: any[]; // Trip events
  tripTalent?: any[]; // Trip talent
  tempFiles: string[];
  isEditMode?: boolean;
}

interface SyncResult {
  success: boolean;
  entriesToDelete?: (ScheduleEntry | ItineraryEntry)[];
}

interface TripWizardContextType {
  state: TripWizardState;
  setCurrentPage: (page: number) => void;
  setDraftId: (id: number | null) => void;
  setTripType: (type: TripType) => void;
  setBuildMethod: (method: BuildMethod) => void;
  updateTripData: (data: Partial<TripData>) => void;
  setResortId: (id: number | null) => void;
  setShipId: (id: number | null) => void;
  updateResortData: (data: Partial<ResortData>) => void;
  updateShipData: (data: Partial<ShipData>) => void;
  setAmenityIds: (ids: number[]) => void;
  setVenueIds: (ids: number[]) => void;
  setScheduleEntries: (entries: ScheduleEntry[]) => void;
  updateScheduleEntry: (index: number, data: Partial<ScheduleEntry>) => void;
  addScheduleEntry: (entry: ScheduleEntry) => void;
  setItineraryEntries: (entries: ItineraryEntry[]) => void;
  updateItineraryEntry: (index: number, data: Partial<ItineraryEntry>) => void;
  addItineraryEntry: (entry: ItineraryEntry) => void;
  addEvent: (event: any) => Promise<void>;
  updateEvent: (eventId: number, event: any) => Promise<void>;
  deleteEvent: (eventId: number) => Promise<void>;
  setTripTalent: (talent: any[]) => void;
  removeTalentFromTrip: (talentId: number) => Promise<void>;
  addTempFile: (path: string) => void;
  clearWizard: () => void;
  restoreFromDraft: (draftState: Partial<TripWizardState>) => void;
  syncScheduleWithDates: (
    oldStartDate: string,
    oldEndDate: string,
    newStartDate: string,
    newEndDate: string
  ) => SyncResult;
  syncItineraryWithDates: (
    oldStartDate: string,
    oldEndDate: string,
    newStartDate: string,
    newEndDate: string
  ) => SyncResult;
  syncEventsWithDates: (
    oldStartDate: string,
    oldEndDate: string,
    newStartDate: string,
    newEndDate: string
  ) => void;
}

const TripWizardContext = createContext<TripWizardContextType | undefined>(undefined);

const initialState: TripWizardState = {
  currentPage: 0,
  draftId: null,
  tripType: null,
  buildMethod: null,
  tripData: {
    name: '',
    slug: '',
    startDate: '',
    endDate: '',
    heroImageUrl: '',
    mapUrl: '',
    description: '',
    highlights: '',
  },
  resortData: null,
  shipData: null,
  amenityIds: [],
  venueIds: [],
  scheduleEntries: [],
  itineraryEntries: [],
  events: [],
  tripTalent: [],
  tempFiles: [],
  isEditMode: false, // Default to false for new trips
};

export function TripWizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TripWizardState>(initialState);

  const setCurrentPage = (page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
  };

  const setDraftId = (id: number | null) => {
    setState(prev => ({ ...prev, draftId: id }));
  };

  const setTripType = (type: TripType) => {
    setState(prev => ({ ...prev, tripType: type }));
  };

  const setBuildMethod = (method: BuildMethod) => {
    setState(prev => ({ ...prev, buildMethod: method }));
  };

  const updateTripData = (data: Partial<TripData>) => {
    setState(prev => ({
      ...prev,
      tripData: { ...prev.tripData, ...data },
    }));
  };

  const setResortId = (id: number | null) => {
    setState(prev => ({ ...prev, resortId: id }));
  };

  const setShipId = (id: number | null) => {
    setState(prev => ({ ...prev, shipId: id }));
  };

  const updateResortData = (data: Partial<ResortData>) => {
    setState(prev => ({
      ...prev,
      resortData: { ...prev.resortData, ...data },
    }));
  };

  const updateShipData = (data: Partial<ShipData>) => {
    setState(prev => ({
      ...prev,
      shipData: { ...prev.shipData, ...data },
    }));
  };

  const setAmenityIds = (ids: number[]) => {
    setState(prev => ({ ...prev, amenityIds: ids }));
  };

  const setVenueIds = (ids: number[]) => {
    setState(prev => ({ ...prev, venueIds: ids }));
  };

  const setScheduleEntries = (entries: ScheduleEntry[]) => {
    setState(prev => ({ ...prev, scheduleEntries: entries }));
  };

  const updateScheduleEntry = (index: number, data: Partial<ScheduleEntry>) => {
    setState(prev => ({
      ...prev,
      scheduleEntries: prev.scheduleEntries.map((entry, i) =>
        i === index ? { ...entry, ...data } : entry
      ),
    }));
  };

  const setItineraryEntries = (entries: ItineraryEntry[]) => {
    setState(prev => ({ ...prev, itineraryEntries: entries }));
  };

  const updateItineraryEntry = (index: number, data: Partial<ItineraryEntry>) => {
    setState(prev => ({
      ...prev,
      itineraryEntries: prev.itineraryEntries.map((entry, i) =>
        i === index ? { ...entry, ...data } : entry
      ),
    }));
  };

  const addScheduleEntry = (entry: ScheduleEntry) => {
    setState(prev => ({
      ...prev,
      scheduleEntries: [...prev.scheduleEntries, entry],
    }));
  };

  const addItineraryEntry = (entry: ItineraryEntry) => {
    setState(prev => ({
      ...prev,
      itineraryEntries: [...prev.itineraryEntries, entry],
    }));
  };

  const addTempFile = (path: string) => {
    setState(prev => ({
      ...prev,
      tempFiles: [...prev.tempFiles, path],
    }));
  };

  // Event management methods
  const addEvent = async (event: any) => {
    const tripId = state.tripData.id;
    if (!tripId) throw new Error('No trip ID available');

    const response = await api.post(`/api/admin/trips/${tripId}/events`, event);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add event: ${response.status} ${errorText}`);
    }

    const newEvent = await response.json();
    setState(prev => ({
      ...prev,
      events: [...(prev.events || []), newEvent],
    }));
  };

  const updateEvent = async (eventId: number, event: any) => {
    const tripId = state.tripData.id;
    if (!tripId) throw new Error('No trip ID available');

    const response = await api.put(`/api/admin/events/${eventId}`, event);

    if (!response.ok) throw new Error('Failed to update event');

    const updatedEvent = await response.json();
    setState(prev => ({
      ...prev,
      events: (prev.events || []).map(e => (e.id === eventId ? updatedEvent : e)),
    }));
  };

  const deleteEvent = async (eventId: number) => {
    const tripId = state.tripData.id;
    if (!tripId) throw new Error('No trip ID available');

    const response = await api.delete(`/api/admin/events/${eventId}`);

    if (!response.ok) throw new Error('Failed to delete event');

    setState(prev => ({
      ...prev,
      events: (prev.events || []).filter(e => e.id !== eventId),
    }));
  };

  // Talent management methods
  const setTripTalent = (talent: any[]) => {
    setState(prev => ({
      ...prev,
      tripTalent: talent,
    }));
  };

  const removeTalentFromTrip = async (talentId: number) => {
    setState(prev => ({
      ...prev,
      tripTalent: (prev.tripTalent || []).filter(t => t.id !== talentId),
    }));
  };

  const clearWizard = () => {
    // Reset to initial state - this creates a NEW object reference
    // which ensures all components re-render with fresh data
    setState({
      currentPage: 0,
      draftId: null,
      tripType: null,
      buildMethod: null,
      tripData: {
        name: '',
        slug: '',
        startDate: '',
        endDate: '',
        heroImageUrl: '',
        mapUrl: '',
        description: '',
        highlights: '',
      },
      resortId: null,
      shipId: null,
      resortData: null,
      shipData: null,
      amenityIds: [],
      venueIds: [],
      scheduleEntries: [],
      itineraryEntries: [],
      events: [],
      tripTalent: [],
      tempFiles: [],
    });
  };

  const restoreFromDraft = (draftState: Partial<TripWizardState>) => {
    // CRITICAL DEBUG: Log what we're receiving

    // Restore complete state from draft in one operation
    // This ensures all state is updated atomically
    const newState = {
      currentPage: draftState.currentPage ?? 0,
      draftId: draftState.draftId ?? null,
      tripType: draftState.tripType ?? null,
      buildMethod: draftState.buildMethod ?? null,
      tripData: {
        id: draftState.tripData?.id, // CRITICAL: Include trip ID for Events/Talent
        name: draftState.tripData?.name ?? '',
        slug: draftState.tripData?.slug ?? '',
        startDate: draftState.tripData?.startDate ?? '',
        endDate: draftState.tripData?.endDate ?? '',
        heroImageUrl: draftState.tripData?.heroImageUrl ?? '',
        mapUrl: draftState.tripData?.mapUrl ?? '', // CRITICAL: Include map URL
        description: draftState.tripData?.description ?? '',
        highlights: draftState.tripData?.highlights ?? '',
        charterCompanyId: draftState.tripData?.charterCompanyId,
        tripTypeId: draftState.tripData?.tripTypeId,
      },
      resortId: draftState.resortId ?? null,
      shipId: draftState.shipId ?? null,
      resortData: draftState.resortData ?? null,
      shipData: draftState.shipData ?? null,
      amenityIds: draftState.amenityIds ?? [],
      venueIds: draftState.venueIds ?? [],
      scheduleEntries: draftState.scheduleEntries ?? [],
      itineraryEntries: draftState.itineraryEntries ?? [],
      events: draftState.events ?? [], // CRITICAL: Include events
      tripTalent: draftState.tripTalent ?? [], // CRITICAL: Include talent
      tempFiles: draftState.tempFiles ?? [],
      isEditMode: draftState.isEditMode ?? false, // CRITICAL: Preserve edit mode flag
    };

    setState(newState);
  };

  // Date synchronization methods
  const parseDateLocal = (dateStr: string): Date => {
    const parts = dateStr.split('-');
    const year = Number(parts[0] || 2025);
    const month = Number(parts[1] || 1);
    const day = Number(parts[2] || 1);
    return new Date(year, month - 1, day);
  };

  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateDaysDifference = (start: string, end: string): number => {
    const startDate = parseDateLocal(start);
    const endDate = parseDateLocal(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  const addDaysToDate = (dateStr: string, days: number): string => {
    const date = parseDateLocal(dateStr);
    date.setDate(date.getDate() + days);
    return formatDateLocal(date);
  };

  const syncScheduleWithDates = (
    oldStartDate: string,
    oldEndDate: string,
    newStartDate: string,
    newEndDate: string
  ): SyncResult => {
    const oldDuration = calculateDaysDifference(oldStartDate, oldEndDate);
    const newDuration = calculateDaysDifference(newStartDate, newEndDate);
    const dateShift = calculateDaysDifference(oldStartDate, newStartDate);

    const updatedEntries: ScheduleEntry[] = [];
    const entriesToDelete: ScheduleEntry[] = [];

    // Process existing entries
    for (const entry of state.scheduleEntries) {
      // Preserve special day numbers (pre/post trip)
      if (entry.dayNumber < 0 || entry.dayNumber > 100) {
        updatedEntries.push(entry);
        continue;
      }

      // Check if entry is within new date range
      if (entry.dayNumber > newDuration + 1) {
        // Entry is outside new range
        if (entry.description || entry.imageUrl) {
          entriesToDelete.push(entry);
        }
        continue;
      }

      // Update entry date
      const newDate = addDaysToDate(newStartDate, entry.dayNumber - 1);
      updatedEntries.push({
        ...entry,
        date: newDate,
      });
    }

    // Check if we need user confirmation for deletions
    if (entriesToDelete.length > 0) {
      return { success: false, entriesToDelete };
    }

    // Add blank entries if trip extended
    const existingDayNumbers = new Set(updatedEntries.map(e => e.dayNumber));
    for (let dayNum = 1; dayNum <= newDuration + 1; dayNum++) {
      if (!existingDayNumbers.has(dayNum)) {
        updatedEntries.push({
          dayNumber: dayNum,
          date: addDaysToDate(newStartDate, dayNum - 1),
          description: '',
          imageUrl: '',
        });
      }
    }

    // Sort by day number
    updatedEntries.sort((a, b) => a.dayNumber - b.dayNumber);

    setState(prev => ({ ...prev, scheduleEntries: updatedEntries }));
    return { success: true };
  };

  const syncItineraryWithDates = (
    oldStartDate: string,
    oldEndDate: string,
    newStartDate: string,
    newEndDate: string
  ): SyncResult => {
    const oldDuration = calculateDaysDifference(oldStartDate, oldEndDate);
    const newDuration = calculateDaysDifference(newStartDate, newEndDate);
    const dateShift = calculateDaysDifference(oldStartDate, newStartDate);

    const updatedEntries: ItineraryEntry[] = [];
    const entriesToDelete: ItineraryEntry[] = [];

    // Process existing entries
    for (const entry of state.itineraryEntries) {
      // Preserve special day numbers (pre/post trip)
      if (entry.dayNumber < 0 || entry.dayNumber > 100) {
        updatedEntries.push(entry);
        continue;
      }

      // Check if entry is within new date range
      if (entry.dayNumber > newDuration + 1) {
        // Entry is outside new range
        if (
          entry.description ||
          entry.imageUrl ||
          entry.locationName ||
          entry.arrivalTime ||
          entry.departureTime
        ) {
          entriesToDelete.push(entry);
        }
        continue;
      }

      // Update entry date
      const newDate = addDaysToDate(newStartDate, entry.dayNumber - 1);
      updatedEntries.push({
        ...entry,
        date: newDate,
      });
    }

    // Check if we need user confirmation for deletions
    if (entriesToDelete.length > 0) {
      return { success: false, entriesToDelete };
    }

    // Add blank entries if trip extended
    const existingDayNumbers = new Set(updatedEntries.map(e => e.dayNumber));
    for (let dayNum = 1; dayNum <= newDuration + 1; dayNum++) {
      if (!existingDayNumbers.has(dayNum)) {
        updatedEntries.push({
          dayNumber: dayNum,
          date: addDaysToDate(newStartDate, dayNum - 1),
          locationName: '',
          arrivalTime: '',
          departureTime: '',
          allAboardTime: '',
          description: '',
          imageUrl: '',
        });
      }
    }

    // Sort by day number
    updatedEntries.sort((a, b) => a.dayNumber - b.dayNumber);

    setState(prev => ({ ...prev, itineraryEntries: updatedEntries }));
    return { success: true };
  };

  const syncEventsWithDates = (
    oldStartDate: string,
    oldEndDate: string,
    newStartDate: string,
    newEndDate: string
  ): void => {
    if (!state.events || state.events.length === 0) return;

    const dateShift = calculateDaysDifference(oldStartDate, newStartDate);
    if (dateShift === 0) return;

    // Shift all event dates by the date difference
    const updatedEvents = state.events.map(event => {
      if (!event.date) return event;

      const newEventDate = addDaysToDate(event.date, dateShift);
      return {
        ...event,
        date: newEventDate,
      };
    });

    setState(prev => ({ ...prev, events: updatedEvents }));
  };

  const value: TripWizardContextType = {
    state,
    setCurrentPage,
    setDraftId,
    setTripType,
    setBuildMethod,
    updateTripData,
    setResortId,
    setShipId,
    updateResortData,
    updateShipData,
    setAmenityIds,
    setVenueIds,
    setScheduleEntries,
    updateScheduleEntry,
    addScheduleEntry,
    setItineraryEntries,
    updateItineraryEntry,
    addItineraryEntry,
    addEvent,
    updateEvent,
    deleteEvent,
    setTripTalent,
    removeTalentFromTrip,
    addTempFile,
    clearWizard,
    restoreFromDraft,
    syncScheduleWithDates,
    syncItineraryWithDates,
    syncEventsWithDates,
  };

  return <TripWizardContext.Provider value={value}>{children}</TripWizardContext.Provider>;
}

export function useTripWizard() {
  const context = useContext(TripWizardContext);
  if (!context) {
    throw new Error('useTripWizard must be used within TripWizardProvider');
  }
  return context;
}
