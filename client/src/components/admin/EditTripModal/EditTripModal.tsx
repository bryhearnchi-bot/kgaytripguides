import React, { useState, useEffect } from 'react';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { BasicInfoPage } from '../TripWizard/BasicInfoPage';
import { ResortDetailsPage } from '../TripWizard/ResortDetailsPage';
import { ShipDetailsPage } from '../TripWizard/ShipDetailsPage';
import { ResortSchedulePage } from '../TripWizard/ResortSchedulePage';
import { CruiseItineraryPage } from '../TripWizard/CruiseItineraryPage';
import { EventsTabPage } from '../TripWizard/EventsTabPage';
import { TalentTabPage } from '../TripWizard/TalentTabPage';
import { TripInfoTabPage } from '../TripWizard/TripInfoTabPage';
import { FAQTabPage } from '../TripWizard/FAQTabPage';
import { UpdatesTabPage } from '../TripWizard/UpdatesTabPage';
import { TripWizardProvider, useTripWizard } from '@/contexts/TripWizardContext';
import { LocationsProvider } from '@/contexts/LocationsContext';
import {
  ItineraryNavigationProvider,
  useItineraryNavigation,
} from '@/contexts/ItineraryNavigationContext';
import { EventsNavigationProvider, useEventsNavigation } from '@/contexts/EventsNavigationContext';
import { TalentNavigationProvider, useTalentNavigation } from '@/contexts/TalentNavigationContext';
import {
  TripInfoNavigationProvider,
  useTripInfoNavigation,
} from '@/contexts/TripInfoNavigationContext';
import { FAQNavigationProvider, useFAQNavigation } from '@/contexts/FAQNavigationContext';
import {
  UpdatesNavigationProvider,
  useUpdatesNavigation,
} from '@/contexts/UpdatesNavigationContext';
import {
  Loader2,
  X,
  FileText,
  MapPin,
  Calendar,
  Users,
  Info,
  HelpCircle,
  Bell,
  Save,
  TreePalm,
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PillDropdown } from '@/components/ui/dropdowns';

interface EditTripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: any | null; // Changed from tripId to trip object
  onSuccess?: () => void;
}

// Tab configuration matching Components page pattern
const tabOptions = [
  { id: 'basic-info', label: 'Trip Info', icon: FileText },
  {
    id: 'location',
    label: 'Location',
    icon: MapPin,
    dynamicLabel: (tripTypeId: number) => (tripTypeId === 1 ? 'Ship' : 'Resort'),
  },
  {
    id: 'schedule',
    label: 'Schedule',
    icon: Calendar,
    dynamicLabel: (tripTypeId: number) => (tripTypeId === 1 ? 'Itinerary' : 'Schedule'),
  },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'talent', label: 'Talent', icon: Users },
  { id: 'trip-info', label: 'Information', icon: Info },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'updates', label: 'Updates', icon: Bell },
];

// Inner component that uses the TripWizard context
function EditTripModalContent({ open, onOpenChange, trip, onSuccess }: EditTripModalProps) {
  const [activeTab, setActiveTab] = useState('basic-info');
  const hasInitialized = React.useRef(false);
  const lastSavedState = React.useRef<any>(null); // Track last saved state to detect unsaved changes

  // Get context methods to populate data
  const {
    state,
    updateTripData,
    setTripType,
    setBuildMethod,
    setResortId,
    setShipId,
    updateResortData,
    updateShipData,
    setScheduleEntries,
    setItineraryEntries,
    restoreFromDraft,
  } = useTripWizard();

  // Use the trip data directly - no need to fetch
  const tripData = trip;
  const isLoading = false;
  const error = !trip ? new Error('No trip data provided') : null;

  // Populate TripWizardContext when modal opens with trip data
  useEffect(() => {
    // Only populate once when modal first opens with trip data
    if (trip && open && !hasInitialized.current) {
      hasInitialized.current = true;

      // Helper to format date to YYYY-MM-DD (DatePicker expects this format)
      const formatDate = (dateStr: string | null | undefined): string => {
        if (!dateStr) return '';
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr;
        }
        // Otherwise, parse and format (handles datetime strings like "2024-01-01T00:00:00")
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Helper to fetch ship details if we have a shipId
      const fetchShipData = async (shipId: number) => {
        try {
          const response = await api.get(`/api/ships/${shipId}`);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {}
        return null;
      };

      // Helper to fetch resort details if we have a resortId
      const fetchResortData = async (resortId: number) => {
        try {
          const response = await api.get(`/api/resorts/${resortId}`);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {}
        return null;
      };

      // Async function to populate context
      const populateContext = async () => {
        // Determine trip type based on tripTypeId (1 = cruise, 2 = resort)
        const tripType = (trip.tripTypeId === 1 ? 'cruise' : 'resort') as 'cruise' | 'resort';

        // Fetch ship/resort data if we have IDs
        let shipData = trip.shipData || null;
        let resortData = trip.resortData || null;

        if (trip.shipId && tripType === 'cruise') {
          const fetchedShip = await fetchShipData(trip.shipId);
          if (fetchedShip) {
            shipData = {
              name: fetchedShip.name || '',
              cruiseLineId: fetchedShip.cruiseLineId,
              cruiseLineName: fetchedShip.cruiseLineName || '',
              capacity: fetchedShip.capacity,
              decks: fetchedShip.decks,
              imageUrl: fetchedShip.imageUrl || '',
              description: fetchedShip.description || '',
              deckPlansUrl: fetchedShip.deckPlansUrl || '',
            };
          }
        }

        if (trip.resortId && tripType === 'resort') {
          const fetchedResort = await fetchResortData(trip.resortId);
          if (fetchedResort) {
            resortData = {
              name: fetchedResort.name || '',
              locationId: fetchedResort.locationId,
              capacity: fetchedResort.capacity,
              numberOfRooms: fetchedResort.numberOfRooms,
              imageUrl: fetchedResort.imageUrl || '',
              description: fetchedResort.description || '',
              propertyMapUrl: fetchedResort.propertyMapUrl || '',
              checkInTime: fetchedResort.checkInTime || '',
              checkOutTime: fetchedResort.checkOutTime || '',
            };
          }
        }

        // Create a state object similar to what restoreFromDraft expects
        const editState = {
          currentPage: 0, // Start at first tab
          tripType,
          buildMethod: 'manual' as const, // For editing, we're in manual mode
          tripData: {
            id: trip.id, // CRITICAL: Include trip ID for Events/Talent tabs
            charterCompanyId: trip.charterCompanyId,
            tripTypeId: trip.tripTypeId,
            name: trip.name,
            slug: trip.slug,
            startDate: formatDate(trip.startDate),
            endDate: formatDate(trip.endDate),
            heroImageUrl: trip.heroImageUrl || '',
            mapUrl: trip.mapUrl || '',
            bookingUrl: trip.bookingUrl || '',
            description: trip.description || '',
            highlights: Array.isArray(trip.highlights)
              ? trip.highlights.join('\n')
              : trip.highlights || '',
          },
          resortId: trip.resortId || null,
          shipId: trip.shipId || null,
          resortData,
          shipData,
          // NOTE: amenityIds and venueIds are NOT included
          // They are managed separately by ShipFormModal/ResortFormModal
          scheduleEntries: (trip.scheduleEntries || []).map((entry: any) => ({
            dayNumber: entry.dayNumber || entry.day_number,
            date: entry.date?.split('T')[0] || entry.date,
            imageUrl: entry.imageUrl || entry.image_url || '',
            description: entry.description || '',
          })),
          itineraryEntries: (trip.itineraryEntries || []).map((stop: any) => ({
            dayNumber: stop.dayNumber || stop.day,
            date: stop.date?.split('T')[0] || stop.date,
            locationName: stop.locationName || stop.portName || stop.port_name || '',
            locationId: stop.locationId || stop.location_id,
            locationTypeId: stop.locationTypeId || stop.location_type_id,
            arrivalTime: stop.arrivalTime || stop.arrival_time || '',
            departureTime: stop.departureTime || stop.departure_time || '',
            allAboardTime: stop.allAboardTime || stop.all_aboard_time || '',
            description: stop.description || '',
            imageUrl: stop.imageUrl || stop.portImageUrl || stop.port_image_url || '',
          })),
          events: trip.events || [], // Load existing events
          tripTalent: trip.tripTalent || [], // Load existing talent
          isEditMode: true, // Set edit mode flag
        };

        // Use restoreFromDraft to populate all state at once
        restoreFromDraft(editState);

        // Initialize lastSavedState with the initial trip data
        // This represents the "saved" state when modal opens
        lastSavedState.current = {
          tripData: { ...editState.tripData },
          resortId: editState.resortId,
          shipId: editState.shipId,
          scheduleEntries: editState.scheduleEntries ? [...editState.scheduleEntries] : [],
          itineraryEntries: editState.itineraryEntries ? [...editState.itineraryEntries] : [],
        };

        // CRITICAL DEBUG: Verify state was set
      };

      // Execute async population
      populateContext();
    }

    // Reset initialization flag when modal closes
    if (!open) {
      hasInitialized.current = false;
      lastSavedState.current = null; // Reset saved state when modal closes
    }
  }, [trip, open, restoreFromDraft]);

  // Debug logging removed to prevent console spam

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    if (!lastSavedState.current) {
      // If we've never saved, check if state has been modified from initial
      return true; // Assume there might be changes if never saved
    }

    // Compare current state with last saved state
    const current = {
      tripData: state.tripData,
      resortId: state.resortId,
      shipId: state.shipId,
      scheduleEntries: state.scheduleEntries,
      itineraryEntries: state.itineraryEntries,
    };

    const saved = lastSavedState.current;

    // Simple deep comparison (could be improved)
    return JSON.stringify(current) !== JSON.stringify(saved);
  };

  const handleClose = () => {
    if (hasUnsavedChanges()) {
      if (confirm('Close edit modal? Any unsaved changes will be lost.')) {
        onOpenChange(false);
      }
    } else {
      // No unsaved changes, close without warning
      onOpenChange(false);
    }
  };

  // State is already available from useTripWizard hook above

  // Get current tab info
  const currentTab = tabOptions.find(tab => tab.id === activeTab);
  const currentTabLabel = currentTab
    ? currentTab.dynamicLabel && tripData?.tripTypeId
      ? currentTab.dynamicLabel(tripData.tripTypeId)
      : currentTab.label
    : 'Edit Trip';
  const CurrentTabIcon = currentTab?.icon;

  const handleSaveTrip = async () => {
    try {
      // Build trip update payload - ONLY trip data, NO amenities or venues
      const updatePayload: any = {
        id: trip.id,
        name: state.tripData.name,
        slug: state.tripData.slug,
        charterCompanyId: state.tripData.charterCompanyId,
        tripTypeId: state.tripType === 'cruise' ? 1 : 2,
        startDate: state.tripData.startDate,
        endDate: state.tripData.endDate,
        heroImageUrl: state.tripData.heroImageUrl || undefined,
        mapUrl: state.tripData.mapUrl || undefined,
        bookingUrl: state.tripData.bookingUrl || undefined,
        description: state.tripData.description || undefined,
        highlights: state.tripData.highlights || undefined,
      };

      // Add location-specific data
      if (state.tripType === 'resort' && state.resortId) {
        updatePayload.resortId = state.resortId;
        updatePayload.scheduleEntries = state.scheduleEntries || [];
      } else if (state.tripType === 'cruise' && state.shipId) {
        updatePayload.shipId = state.shipId;
        updatePayload.itineraryEntries = state.itineraryEntries || [];
      }

      // Save trip data
      const response = await api.post('/api/admin/trips', updatePayload);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update trip' }));

        // If validation error, show detailed message
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details
            .map((e: any) => `${e.path?.join('.') || 'Field'}: ${e.message}`)
            .join(', ');
          throw new Error(`Validation failed: ${validationErrors}`);
        }

        throw new Error(errorData.message || errorData.error || 'Failed to update trip');
      }

      // Save the current state as the last saved state
      lastSavedState.current = {
        tripData: { ...state.tripData },
        resortId: state.resortId,
        shipId: state.shipId,
        scheduleEntries: state.scheduleEntries ? [...state.scheduleEntries] : [],
        itineraryEntries: state.itineraryEntries ? [...state.itineraryEntries] : [],
      };

      // Show success message
      toast.success('Trip Updated', {
        description: 'Your changes have been saved.',
      });

      // Don't close modal - let user continue editing other tabs
      // Refresh trip list in background
      if (onSuccess) {
        setTimeout(() => onSuccess(), 250);
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to save trip changes.',
      });
    }
  };

  // Custom header with dropdown menu on right and save button
  const customHeader = (
    <div className="flex items-center justify-between w-full">
      {/* Title with Icon */}
      <div className="flex items-center gap-2">
        <TreePalm className="h-5 w-5 text-white" />
        <h2 className="text-xl font-bold text-white leading-tight">Edit Trip</h2>
      </div>

      {/* Right side: Dropdown Menu + Save Button + X Button */}
      <div className="flex items-center gap-2">
        {/* Dropdown Menu */}
        <PillDropdown
          options={tabOptions.map(option => {
            const Icon = option.icon;
            const displayLabel =
              option.dynamicLabel && tripData?.tripTypeId
                ? option.dynamicLabel(tripData.tripTypeId)
                : option.label;
            return {
              value: option.id,
              label: displayLabel,
              icon: Icon,
            };
          })}
          value={activeTab}
          onChange={setActiveTab}
          placeholder="Select tab"
          triggerClassName=""
        />

        {/* Save Button */}
        <Button
          onClick={handleSaveTrip}
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full border border-white/10 bg-white/10 hover:bg-white/15 text-green-400 hover:text-green-300 transition-colors"
          aria-label="Save Changes"
        >
          <Save className="w-4 h-4" />
        </Button>

        {/* X Button */}
        <Button
          onClick={handleClose}
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full border border-white/10 bg-white/10 hover:bg-white/15 text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <AdminBottomSheet
      isOpen={open}
      onOpenChange={open => {
        if (!open) handleClose();
      }}
      title="Edit Trip"
      description={tripData?.name || 'Loading...'}
      className="max-w-4xl"
      contentClassName="pb-6 pt-0"
      maxHeight="85vh"
      customHeader={customHeader}
      fullScreen={true}
    >
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-white/60" />
          <span className="ml-3 text-white/70">Loading trip details...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-400 font-semibold mb-2">Failed to load trip</p>
            <p className="text-white/60">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && tripData && (
        <div className="space-y-3">
          {/* Tab Header - matching Components page pattern */}
          <div
            className="flex items-center justify-between pb-6 sticky top-0 z-10 -mx-6 px-6 backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(0, 33, 71, 1)',
              backgroundImage:
                'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
              marginTop: '-1rem', // -4 (16px) to pull up and eliminate gap
              paddingTop: '1.25rem', // Extend background upward to cover any remaining gap
              marginBottom: '0',
            }}
          >
            <div className="flex items-center gap-2">
              {CurrentTabIcon && <CurrentTabIcon className="h-5 w-5 text-white" />}
              <h3 className="text-lg font-semibold text-white">{currentTabLabel}</h3>
            </div>
            {/* Day navigation controls for cruise itinerary */}
            {activeTab === 'schedule' && tripData.tripTypeId === 1 && <ItineraryHeaderActions />}
            {/* Day navigation controls for events */}
            {activeTab === 'events' && <EventsHeaderActions />}
            {/* Category filter and add button for talent */}
            {activeTab === 'talent' && <TalentHeaderActions />}
            {/* Add button for trip info */}
            {activeTab === 'trip-info' && <TripInfoHeaderActions />}
            {/* Add button for FAQ */}
            {activeTab === 'faq' && <FAQHeaderActions />}
            {/* Add button for Updates */}
            {activeTab === 'updates' && <UpdatesHeaderActions />}
          </div>

          {/* Tab Content */}
          {activeTab === 'basic-info' && <BasicInfoPage />}
          {activeTab === 'location' &&
            (tripData.tripTypeId === 1 ? <ShipDetailsPage /> : <ResortDetailsPage />)}
          {activeTab === 'schedule' &&
            (tripData.tripTypeId === 1 ? <CruiseItineraryPage /> : <ResortSchedulePage />)}
          {activeTab === 'events' && <EventsTabPage />}
          {activeTab === 'talent' && <TalentTabPage />}
          {activeTab === 'trip-info' && <TripInfoTabPage />}
          {activeTab === 'faq' && <FAQTabPage />}
          {activeTab === 'updates' && <UpdatesTabPage />}
        </div>
      )}
    </AdminBottomSheet>
  );
}

// Itinerary Header Actions Component - renders day selector and add button
function ItineraryHeaderActions() {
  const {
    selectedDayIndex,
    setSelectedDayIndex,
    setShowAddDayModal,
    dayOptions,
    totalDays,
    goToPreviousDay,
    goToNextDay,
    canGoPrevious,
    canGoNext,
  } = useItineraryNavigation();

  if (totalDays === 0) {
    return (
      <Button
        type="button"
        onClick={() => setShowAddDayModal(true)}
        className="flex items-center gap-1.5 h-8 px-3 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-xs font-semibold hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Day</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Day Navigation Controls */}
      <button
        type="button"
        onClick={goToPreviousDay}
        disabled={!canGoPrevious}
        className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-4 h-4 text-white/70" />
      </button>

      <PillDropdown
        options={dayOptions}
        value={selectedDayIndex.toString()}
        onChange={value => setSelectedDayIndex(parseInt(value, 10))}
        placeholder="Select Day"
        className="min-w-[120px]"
      />

      <button
        type="button"
        onClick={goToNextDay}
        disabled={!canGoNext}
        className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="w-4 h-4 text-white/70" />
      </button>

      {/* Add Day Button */}
      <Button
        type="button"
        onClick={() => setShowAddDayModal(true)}
        className="flex items-center gap-1.5 h-8 px-3 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-xs font-semibold hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all ml-2"
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

// Events Header Actions Component - renders day selector and add event button
function EventsHeaderActions() {
  const {
    selectedDayIndex,
    setSelectedDayIndex,
    setShowAddEventModal,
    dayOptions,
    totalDays,
    goToPreviousDay,
    goToNextDay,
    canGoPrevious,
    canGoNext,
  } = useEventsNavigation();

  if (totalDays === 0) {
    return (
      <Button
        type="button"
        onClick={() => setShowAddEventModal(true)}
        className="flex items-center gap-1.5 h-8 px-3 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-xs font-semibold hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Event</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Day Navigation Controls */}
      <button
        type="button"
        onClick={goToPreviousDay}
        disabled={!canGoPrevious}
        className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft className="w-4 h-4 text-white/70" />
      </button>

      <PillDropdown
        options={dayOptions}
        value={selectedDayIndex.toString()}
        onChange={value => setSelectedDayIndex(parseInt(value, 10))}
        placeholder="Select Day"
        className="min-w-[120px]"
      />

      <button
        type="button"
        onClick={goToNextDay}
        disabled={!canGoNext}
        className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight className="w-4 h-4 text-white/70" />
      </button>

      {/* Add Event Button */}
      <Button
        type="button"
        onClick={() => setShowAddEventModal(true)}
        className="flex items-center gap-1.5 h-8 px-3 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-xs font-semibold hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all ml-2"
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

// Talent Header Actions Component - renders category filter and add talent button
function TalentHeaderActions() {
  const {
    selectedCategoryFilter,
    setSelectedCategoryFilter,
    setShowAddTalentModal,
    categoryFilterOptions,
    totalTalent,
  } = useTalentNavigation();

  if (totalTalent === 0) {
    return (
      <Button
        type="button"
        onClick={() => setShowAddTalentModal(true)}
        className="flex items-center gap-1.5 h-8 px-3 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-xs font-semibold hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Talent</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Category Filter Dropdown */}
      <PillDropdown
        options={categoryFilterOptions}
        value={selectedCategoryFilter}
        onChange={setSelectedCategoryFilter}
        placeholder="All Talent"
      />

      {/* Add Talent Button */}
      <Button
        type="button"
        onClick={() => setShowAddTalentModal(true)}
        className="flex items-center gap-1.5 h-8 px-3 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-xs font-semibold hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

// Trip Info Header Actions Component - renders add section button
function TripInfoHeaderActions() {
  const { setShowAddSectionModal } = useTripInfoNavigation();

  return (
    <Button
      type="button"
      onClick={() => setShowAddSectionModal(true)}
      className="flex items-center gap-1.5 h-8 px-3 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-xs font-semibold hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all"
    >
      <Plus className="w-3.5 h-3.5" />
    </Button>
  );
}

// FAQ Header Actions Component - renders add FAQ button
function FAQHeaderActions() {
  const { setShowAddFAQModal } = useFAQNavigation();

  return (
    <Button
      type="button"
      onClick={() => setShowAddFAQModal(true)}
      className="flex items-center gap-1.5 h-8 px-3 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-xs font-semibold hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all"
    >
      <Plus className="w-3.5 h-3.5" />
    </Button>
  );
}

// Updates Header Actions Component - renders add update button
function UpdatesHeaderActions() {
  const { setShowAddUpdateModal } = useUpdatesNavigation();

  return (
    <Button
      type="button"
      onClick={() => setShowAddUpdateModal(true)}
      className="flex items-center gap-1.5 h-8 px-3 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-xs font-semibold hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all"
    >
      <Plus className="w-3.5 h-3.5" />
    </Button>
  );
}

// Main component that wraps with TripWizardProvider and LocationsProvider
export function EditTripModal(props: EditTripModalProps) {
  if (!props.open || !props.trip) {
    return null;
  }

  return (
    <LocationsProvider>
      <TripWizardProvider>
        <ItineraryNavigationProvider>
          <EventsNavigationProvider>
            <TalentNavigationProvider>
              <TripInfoNavigationProvider>
                <FAQNavigationProvider>
                  <UpdatesNavigationProvider>
                    <EditTripModalContent {...props} />
                  </UpdatesNavigationProvider>
                </FAQNavigationProvider>
              </TripInfoNavigationProvider>
            </TalentNavigationProvider>
          </EventsNavigationProvider>
        </ItineraryNavigationProvider>
      </TripWizardProvider>
    </LocationsProvider>
  );
}
