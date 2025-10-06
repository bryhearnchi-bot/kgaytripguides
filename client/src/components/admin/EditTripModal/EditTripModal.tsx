import React, { useState, useEffect } from 'react';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BasicInfoPage } from '../TripWizard/BasicInfoPage';
import { ResortDetailsPage } from '../TripWizard/ResortDetailsPage';
import { ShipDetailsPage } from '../TripWizard/ShipDetailsPage';
import { ResortVenuesAmenitiesPage } from '../TripWizard/ResortVenuesAmenitiesPage';
import { ShipVenuesAmenitiesPage } from '../TripWizard/ShipVenuesAmenitiesPage';
import { ResortSchedulePage } from '../TripWizard/ResortSchedulePage';
import { CruiseItineraryPage } from '../TripWizard/CruiseItineraryPage';
import { TripWizardProvider, useTripWizard } from '@/contexts/TripWizardContext';
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
    setAmenityIds,
    setVenueIds,
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
      console.log('EditTripModal: Populating context with trip data');
      console.log('Trip object received:', trip);
      console.log('Itinerary entries:', trip.itineraryEntries);
      console.log('Schedule entries:', trip.scheduleEntries);

      // Determine trip type based on tripTypeId (1 = cruise, 2 = resort)
      const tripType = (trip.tripTypeId === 1 ? 'cruise' : 'resort') as 'cruise' | 'resort';

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

      // Create a state object similar to what restoreFromDraft expects
      const editState = {
        currentPage: 0, // Start at first tab
        tripType,
        buildMethod: 'manual' as const, // For editing, we're in manual mode
        tripData: {
          charterCompanyId: trip.charterCompanyId,
          tripTypeId: trip.tripTypeId,
          name: trip.name,
          slug: trip.slug,
          startDate: formatDate(trip.startDate),
          endDate: formatDate(trip.endDate),
          heroImageUrl: trip.heroImageUrl || '',
          description: trip.description || '',
          highlights: Array.isArray(trip.highlights)
            ? trip.highlights.join('\n')
            : trip.highlights || '',
        },
        resortId: trip.resortId || null,
        shipId: trip.shipId || null,
        resortData: trip.resortData || null,
        shipData: trip.shipData || null,
        amenityIds: trip.amenityIds || [],
        venueIds: trip.venueIds || [],
        scheduleEntries: trip.scheduleEntries || [],
        itineraryEntries: trip.itineraryEntries || [],
        isEditMode: true, // Set edit mode flag
      };

      // CRITICAL DEBUG: Log the data we're about to restore
      console.log('🔍 EditTripModal - Restoring draft with data:', {
        itineraryEntries: editState.itineraryEntries,
        itineraryLength: editState.itineraryEntries?.length,
        scheduleEntries: editState.scheduleEntries,
        scheduleLength: editState.scheduleEntries?.length,
        tripId: trip.id,
        tripName: trip.name,
      });

      // Use restoreFromDraft to populate all state at once
      restoreFromDraft(editState);

      // CRITICAL DEBUG: Verify state was set
      console.log('✅ EditTripModal - Called restoreFromDraft');
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

  const handleSave = async () => {
    try {
      console.log('Saving trip with state:', state);

      // Prepare the payload to match trip wizard schema exactly
      const tripPayload: any = {
        // Trip ID for update
        id: trip.id,

        // Basic trip data
        name: state.tripData.name,
        slug: state.tripData.slug,
        charterCompanyId: state.tripData.charterCompanyId,
        tripTypeId: state.tripType === 'cruise' ? 1 : 2,
        startDate: state.tripData.startDate,
        endDate: state.tripData.endDate,
        heroImageUrl: state.tripData.heroImageUrl || undefined,
        description: state.tripData.description || undefined,
        highlights: state.tripData.highlights || undefined,

        // Venue and amenity IDs (always include, even if empty)
        venueIds: state.venueIds || [],
        amenityIds: state.amenityIds || [],
      };

      // Add resort or ship ID (NOT resortData/shipData)
      if (state.tripType === 'resort' && state.resortId) {
        tripPayload.resortId = state.resortId;
        tripPayload.scheduleEntries = state.scheduleEntries || [];
      } else if (state.tripType === 'cruise' && state.shipId) {
        tripPayload.shipId = state.shipId;
        tripPayload.itineraryEntries = state.itineraryEntries || [];
      }

      console.log('Trip payload to send:', tripPayload);

      // Use POST to update the trip (same endpoint as trip wizard, which handles both create and update)
      const response = await api.post(`/api/admin/trips`, tripPayload);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to save trip' }));
        throw new Error(error.message || 'Failed to save trip');
      }

      toast({
        title: 'Trip Updated',
        description: 'Trip has been successfully updated.',
      });

      // Call onSuccess callback
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving trip:', error);
      toast({
        title: 'Failed to Save',
        description: error instanceof Error ? error.message : 'Please try again.',
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
      subtitle={tripData?.name || 'Loading...'}
      maxWidthClassName="max-w-4xl"
      contentClassName="pb-6"
      primaryAction={{
        label: 'Save Changes',
        onClick: handleSave,
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
              value="venues-amenities"
              className="data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 text-white/70 hover:text-white px-4 py-2.5 rounded-none"
            >
              Venues & Amenities
            </TabsTrigger>
            <TabsTrigger
              value="schedule"
              className="data-[state=active]:bg-cyan-400/10 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 text-white/70 hover:text-white px-4 py-2.5 rounded-none"
            >
              {tripData.tripTypeId === 1 ? 'Itinerary' : 'Schedule'}
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="basic-info" className="mt-0">
            <BasicInfoPage />
          </TabsContent>

          <TabsContent value="location" className="mt-0">
            {tripData.tripTypeId === 1 ? <ShipDetailsPage /> : <ResortDetailsPage />}
          </TabsContent>

          <TabsContent value="venues-amenities" className="mt-0">
            {tripData.tripTypeId === 1 ? (
              <ShipVenuesAmenitiesPage />
            ) : (
              <ResortVenuesAmenitiesPage />
            )}
          </TabsContent>

          <TabsContent value="schedule" className="mt-0">
            {tripData.tripTypeId === 1 ? <CruiseItineraryPage /> : <ResortSchedulePage />}
          </TabsContent>
        </Tabs>
      )}
    </AdminFormModal>
  );
}

// Main component that wraps with TripWizardProvider
export function EditTripModal(props: EditTripModalProps) {
  if (!props.open || !props.trip) {
    return null;
  }

  return (
    <TripWizardProvider>
      <EditTripModalContent {...props} />
    </TripWizardProvider>
  );
}
