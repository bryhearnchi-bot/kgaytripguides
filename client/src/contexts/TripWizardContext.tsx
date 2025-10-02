import React, { createContext, useContext, useState, ReactNode } from 'react';

export type BuildMethod = 'url' | 'pdf' | 'manual' | null;
export type TripType = 'resort' | 'cruise' | null;

interface TripData {
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
  locationName: string;
  arrivalTime: string;
  departureTime: string;
  allAboardTime: string;
  description: string;
  imageUrl: string;
}

interface TripWizardState {
  currentPage: number;
  tripType: TripType;
  buildMethod: BuildMethod;
  tripData: Partial<TripData>;
  resortData: Partial<ResortData> | null;
  shipData: Partial<ShipData> | null;
  amenityIds: number[];
  venueIds: number[];
  scheduleEntries: ScheduleEntry[];
  itineraryEntries: ItineraryEntry[];
  tempFiles: string[];
}

interface TripWizardContextType {
  state: TripWizardState;
  setCurrentPage: (page: number) => void;
  setTripType: (type: TripType) => void;
  setBuildMethod: (method: BuildMethod) => void;
  updateTripData: (data: Partial<TripData>) => void;
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
  addTempFile: (path: string) => void;
  clearWizard: () => void;
}

const TripWizardContext = createContext<TripWizardContextType | undefined>(undefined);

const initialState: TripWizardState = {
  currentPage: 0,
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
  tempFiles: [],
};

export function TripWizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TripWizardState>(initialState);

  const setCurrentPage = (page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
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

  const clearWizard = () => {
    setState(initialState);
  };

  const value: TripWizardContextType = {
    state,
    setCurrentPage,
    setTripType,
    setBuildMethod,
    updateTripData,
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
    addTempFile,
    clearWizard,
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
