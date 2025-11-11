import React, { useState, useEffect } from 'react';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

interface EditTripModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: any | null; // Changed from tripId to trip object
  onSuccess?: () => void;
}

// Inner component that uses the TripWizard context
function EditTripModalContent({ open, onOpenChange, trip, onSuccess }: EditTripModalProps) {
  const [activeTab, setActiveTab] = useState('basic-info');
  const { toast } = useToast();
  const hasInitialized = React.useRef(false);

  // Get context methods to populate data
  const {
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

        // CRITICAL DEBUG: Log the data we're about to restore

        // Use restoreFromDraft to populate all state at once
        restoreFromDraft(editState);

        // CRITICAL DEBUG: Verify state was set
      };

      // Execute async population
      populateContext();
    }

    // Reset initialization flag when modal closes
    if (!open) {
      hasInitialized.current = false;
    }
  }, [trip, open, restoreFromDraft]);

  // Debug logging removed to prevent console spam

  const handleClose = () => {
    if (confirm('Close edit modal? Any unsaved changes will be lost.')) {
      onOpenChange(false);
    }
  };

  // Get the current state from context for saving
  const { state } = useTripWizard();

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

      // Show success message
      toast({
        title: 'Trip Updated',
        description: 'Your changes have been saved.',
      });

      // Close modal
      onOpenChange(false);

      // Refresh trip list after modal closes
      if (onSuccess) {
        setTimeout(() => onSuccess(), 250);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save trip changes.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminFormModal
      isOpen={open}
      onOpenChange={open => {
        if (!open) handleClose();
      }}
      title="Edit Trip"
      description={tripData?.name || 'Loading...'}
      maxWidthClassName="max-w-4xl"
      contentClassName="pb-6"
      primaryAction={{
        label: 'Save Changes',
        onClick: handleSaveTrip,
        loading: false,
        loadingLabel: 'Saving...',
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: handleClose,
      }}
    >
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Tab Navigation */}
          <TabsList className="w-full justify-start bg-white/[0.02] border-b border-white/10 rounded-none p-0 h-auto">
            <TabsTrigger
              value="basic-info"
              className="data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 text-white/70 hover:text-white px-4 py-2.5 rounded-none"
            >
              Trip Info
            </TabsTrigger>
            <TabsTrigger
              value="location"
              className="data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 text-white/70 hover:text-white px-4 py-2.5 rounded-none"
            >
              {tripData.tripTypeId === 1 ? 'Ship' : 'Resort'}
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 text-white/70 hover:text-white px-4 py-2.5 rounded-none"
            >
              {tripData.tripTypeId === 1 ? 'Itinerary' : 'Schedule'}
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 text-white/70 hover:text-white px-4 py-2.5 rounded-none"
            >
              Events
            </TabsTrigger>
            <TabsTrigger
              value="talent"
              className="data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 text-white/70 hover:text-white px-4 py-2.5 rounded-none"
            >
              Talent
            </TabsTrigger>
            <TabsTrigger
              value="trip-info"
              className="data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 text-white/70 hover:text-white px-4 py-2.5 rounded-none"
            >
              Trip Info
            </TabsTrigger>
            <TabsTrigger
              value="faq"
              className="data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 text-white/70 hover:text-white px-4 py-2.5 rounded-none"
            >
              FAQ
            </TabsTrigger>
            <TabsTrigger
              value="updates"
              className="data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 text-white/70 hover:text-white px-4 py-2.5 rounded-none"
            >
              Updates
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="basic-info" className="mt-0">
            <BasicInfoPage />
          </TabsContent>

          <TabsContent value="location" className="mt-0">
            {tripData.tripTypeId === 1 ? <ShipDetailsPage /> : <ResortDetailsPage />}
          </TabsContent>

          <TabsContent value="schedule" className="mt-0">
            {tripData.tripTypeId === 1 ? <CruiseItineraryPage /> : <ResortSchedulePage />}
          </TabsContent>

          <TabsContent value="events" className="mt-0">
            <EventsTabPage />
          </TabsContent>

          <TabsContent value="talent" className="mt-0">
            <TalentTabPage />
          </TabsContent>

          <TabsContent value="trip-info" className="mt-0">
            <TripInfoTabPage />
          </TabsContent>

          <TabsContent value="faq" className="mt-0">
            <FAQTabPage />
          </TabsContent>

          <TabsContent value="updates" className="mt-0">
            <UpdatesTabPage />
          </TabsContent>
        </Tabs>
      )}
    </AdminFormModal>
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
        <EditTripModalContent {...props} />
      </TripWizardProvider>
    </LocationsProvider>
  );
}
