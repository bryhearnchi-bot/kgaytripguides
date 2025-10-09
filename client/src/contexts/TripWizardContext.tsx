import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  description: string;
  highlights: string;
}

interface ResortData {
  name: string;
  locationId?: number;
  capacity?: number;
  numberOfRooms?: number;
  imageUrl: string;
  description: string;
  propertyMapUrl: string;
  checkInTime: string;
  checkOutTime: string;
}

interface ShipData {
  name: string;
  cruiseLine: string;
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

    const response = await fetch(`/api/trips/${tripId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });

    if (!response.ok) throw new Error('Failed to add event');

    const newEvent = await response.json();
    setState(prev => ({
      ...prev,
      events: [...(prev.events || []), newEvent],
    }));
  };

  const updateEvent = async (eventId: number, event: any) => {
    const tripId = state.tripData.id;
    if (!tripId) throw new Error('No trip ID available');

    const response = await fetch(`/api/trips/${tripId}/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });

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

    const response = await fetch(`/api/trips/${tripId}/events/${eventId}`, {
      method: 'DELETE',
    });

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
    console.log('🔍 TripWizardContext.restoreFromDraft - Received draftState:', {
      itineraryEntries: draftState.itineraryEntries,
      itineraryLength: draftState.itineraryEntries?.length,
      scheduleEntries: draftState.scheduleEntries,
      scheduleLength: draftState.scheduleEntries?.length,
    });

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

    console.log('✅ TripWizardContext.restoreFromDraft - Setting state:', {
      itineraryEntries: newState.itineraryEntries,
      itineraryLength: newState.itineraryEntries?.length,
      scheduleEntries: newState.scheduleEntries,
      scheduleLength: newState.scheduleEntries?.length,
      isEditMode: newState.isEditMode,
    });

    setState(newState);
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
