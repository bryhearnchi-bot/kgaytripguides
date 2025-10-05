import React from 'react';
import { useTripWizard, TripWizardProvider } from '@/contexts/TripWizardContext';
import { AdminFormModal } from '@/components/admin/AdminFormModal';
import { BuildMethodPage } from './BuildMethodPage';
import { BasicInfoPage } from './BasicInfoPage';
import { ResortDetailsPage } from './ResortDetailsPage';
import { ShipDetailsPage } from './ShipDetailsPage';
import { ResortVenuesAmenitiesPage } from './ResortVenuesAmenitiesPage';
import { ShipVenuesAmenitiesPage } from './ShipVenuesAmenitiesPage';
import { ResortSchedulePage } from './ResortSchedulePage';
import { CruiseItineraryPage } from './CruiseItineraryPage';
import { CompletionPage } from './CompletionPage';
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

// Custom styles to remove the header border from trip wizard modal
const tripWizardStyles = `
  .trip-wizard-modal .px-7.py-4 {
    border-bottom: none !important;
    padding-bottom: 0.5rem !important;
  }

  .trip-wizard-modal .trip-wizard-body {
    padding-top: 0.25rem !important;
  }

  .trip-wizard-modal .trip-wizard-progress {
    margin-top: -0.125rem !important;
  }
`;

interface TripWizardProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  draftTrip?: any | null;
}

function TripWizardContent({ isOpen, onOpenChange, onSuccess, draftTrip }: TripWizardProps) {
  const {
    state,
    setCurrentPage,
    setDraftId,
    clearWizard,
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
    setItineraryEntries,
    restoreFromDraft,
  } = useTripWizard();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Track if we've initialized for this session
  const initializedRef = React.useRef(false);
  const previousIsOpenRef = React.useRef(isOpen);
  const previousDraftIdRef = React.useRef<number | null>(null);

  // Restore draft state when draftTrip is provided, or clear when opening for new trip
  React.useEffect(() => {
    // Only run when wizard opens (transition from closed to open)
    if (isOpen && !previousIsOpenRef.current) {
      initializedRef.current = false;
    }
    previousIsOpenRef.current = isOpen;

    // Also detect if we're editing a different draft
    const currentDraftId = draftTrip?.id ?? null;
    const isDifferentDraft = currentDraftId !== previousDraftIdRef.current;
    previousDraftIdRef.current = currentDraftId;

    if (isOpen && (!initializedRef.current || isDifferentDraft)) {
      initializedRef.current = true;

      if (draftTrip && draftTrip.wizardState) {
        // Restore draft using atomic update
        const wizardState = {
          ...draftTrip.wizardState,
          draftId: draftTrip.id, // Ensure draft ID is set
        };
        restoreFromDraft(wizardState);
      } else if (!draftTrip) {
        // No draft - clear wizard for new trip
        clearWizard();
      }
    }
  }, [isOpen, draftTrip, clearWizard, restoreFromDraft]);

  const handleClose = () => {
    // If editing an existing draft, just close without clearing
    // The draft is already saved in the database
    if (state.draftId) {
      if (confirm('Close wizard? Unsaved changes since last save will be lost.')) {
        onOpenChange(false);
      }
    } else {
      // For new trips, warn and clear wizard state
      if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
        clearWizard();
        onOpenChange(false);
      }
    }
  };

  const handleSaveDraft = async () => {
    try {
      // Helper to check if an object has any non-empty values
      const hasData = (obj: any) => {
        if (!obj || typeof obj !== 'object') return false;
        return Object.values(obj).some(val => val !== null && val !== undefined && val !== '');
      };

      // Prepare draft data - flat structure to match schema
      // Only include resortData/shipData if they have actual data
      const draftData = {
        draftId: state.draftId || undefined,
        currentPage: state.currentPage,
        tripType: state.tripType,
        buildMethod: state.buildMethod,
        tripData: state.tripData,
        resortId: state.resortId || undefined,
        shipId: state.shipId || undefined,
        resortData: hasData(state.resortData) ? state.resortData : undefined,
        shipData: hasData(state.shipData) ? state.shipData : undefined,
        amenityIds: state.amenityIds,
        venueIds: state.venueIds,
        scheduleEntries: state.scheduleEntries,
        itineraryEntries: state.itineraryEntries,
      };

      // Use api client which handles authentication
      const response = await api.post('/api/admin/trips/draft', draftData);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to save draft' }));
        throw new Error(error.message || 'Failed to save draft');
      }

      // Save draft ID so subsequent saves update instead of creating duplicates
      const savedDraft = await response.json();
      if (savedDraft.id && !state.draftId) {
        setDraftId(savedDraft.id);
      }

      const message = state.draftId
        ? 'Draft updated successfully!'
        : 'Draft saved! You can return to finish this trip later.';

      // Show toast immediately
      toast({
        title: state.draftId ? 'Draft Updated' : 'Draft Saved',
        description: message,
      });

      // Close modal
      onOpenChange(false);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Don't invalidate queries - let the table handle its own refresh
      // This prevents blocking the UI thread
    } catch (error) {
      console.error('Error saving draft:', error);

      toast({
        title: 'Failed to Save Draft',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleNext = () => {
    // Validate current page before proceeding
    if (state.currentPage === 0 && !state.buildMethod) {
      toast({
        title: 'Please Select a Build Method',
        description: 'Choose how you want to create your trip before continuing.',
        variant: 'destructive',
      });
      return;
    }

    if (state.currentPage === 1) {
      // Only require trip type to proceed (determines resort vs cruise flow)
      const { tripTypeId } = state.tripData;
      if (!tripTypeId) {
        toast({
          title: 'Please Select Trip Type',
          description: 'Choose whether this is a resort or cruise trip.',
          variant: 'destructive',
        });
        return;
      }
    }

    // NOTE: Validation disabled for testing - can skip schedule/itinerary page
    // if (state.currentPage === 4) {
    //   // Validate schedule/itinerary entries
    //   if (state.tripType === 'resort') {
    //     // Check that all schedule entries have descriptions
    //     const hasIncompleteEntries = state.scheduleEntries.some(
    //       entry => !entry.description?.trim()
    //     );
    //     if (hasIncompleteEntries) {
    //       alert('Please add descriptions for all days before continuing.');
    //       return;
    //     }
    //   } else if (state.tripType === 'cruise') {
    //     // Check that all itinerary entries have location names
    //     const hasIncompleteEntries = state.itineraryEntries.some(
    //       entry => !entry.locationName?.trim()
    //     );
    //     if (hasIncompleteEntries) {
    //       alert('Please add port/location names for all days before continuing.');
    //       return;
    //     }
    //   }
    // }

    setCurrentPage(state.currentPage + 1);
  };

  const handleBack = () => {
    if (state.currentPage > 0) {
      setCurrentPage(state.currentPage - 1);
    }
  };

  const canProceed = () => {
    // For testing: No required fields - allow navigation freely
    return true;
  };

  const renderPage = () => {
    switch (state.currentPage) {
      case 0:
        return <BuildMethodPage />;
      case 1:
        return <BasicInfoPage />;
      case 2:
        // Conditional rendering based on trip type
        if (state.tripType === 'resort') {
          return <ResortDetailsPage />;
        } else if (state.tripType === 'cruise') {
          return <ShipDetailsPage />;
        } else {
          // Fallback if trip type not yet selected
          return (
            <div className="text-white/60 text-center py-8">
              Please select a trip type on the previous page.
            </div>
          );
        }
      case 3:
        // Conditional rendering for venues and amenities
        if (state.tripType === 'resort') {
          return <ResortVenuesAmenitiesPage />;
        } else if (state.tripType === 'cruise') {
          return <ShipVenuesAmenitiesPage />;
        } else {
          return (
            <div className="text-white/60 text-center py-8">
              Please select a trip type on the previous page.
            </div>
          );
        }
      case 4:
        // Conditional rendering for schedule/itinerary
        if (state.tripType === 'resort') {
          return <ResortSchedulePage />;
        } else if (state.tripType === 'cruise') {
          return <CruiseItineraryPage />;
        } else {
          return (
            <div className="text-white/60 text-center py-8">
              Please select a trip type on the previous page.
            </div>
          );
        }
      case 5:
        return <CompletionPage />;
      default:
        return <div className="text-white/60 text-center py-8">Page under construction</div>;
    }
  };

  const getPageTitle = () => {
    switch (state.currentPage) {
      case 0:
        return 'How would you like to build this trip?';
      case 1:
        return 'Basic Trip Information';
      case 2:
        if (state.tripType === 'resort') {
          return 'Resort Details';
        } else if (state.tripType === 'cruise') {
          return 'Ship Details';
        }
        return 'Property Details';
      case 3:
        if (state.tripType === 'resort') {
          return 'Resort Venues & Amenities';
        } else if (state.tripType === 'cruise') {
          return 'Ship Venues & Amenities';
        }
        return 'Venues & Amenities';
      case 4:
        if (state.tripType === 'resort') {
          return 'Resort Schedule';
        } else if (state.tripType === 'cruise') {
          return 'Cruise Itinerary';
        }
        return 'Schedule & Itinerary';
      case 5:
        return 'Review & Approve';
      default:
        return 'Create New Trip';
    }
  };

  const getPageDescription = () => {
    switch (state.currentPage) {
      case 0:
        return 'Choose your preferred method to create a new trip';
      case 1:
        return 'Enter the essential details for your new trip';
      case 2:
        if (state.tripType === 'resort') {
          return 'Provide resort information and amenities';
        } else if (state.tripType === 'cruise') {
          return 'Provide ship specifications and details';
        }
        return 'Enter property details';
      case 3:
        if (state.tripType === 'resort') {
          return 'Select venues and amenities available at the resort';
        } else if (state.tripType === 'cruise') {
          return 'Select venues and amenities available on the ship';
        }
        return 'Select venues and amenities';
      case 4:
        if (state.tripType === 'resort') {
          return 'Add daily schedule with images and descriptions';
        } else if (state.tripType === 'cruise') {
          return 'Add port-by-port itinerary with times and locations';
        }
        return 'Build your schedule or itinerary';
      case 5:
        return 'Review all trip details and save';
      default:
        return '';
    }
  };

  const totalPages = 6; // Initial selection, basic info, resort/ship details, venues/amenities, schedule/itinerary, completion
  const progress = ((state.currentPage + 1) / totalPages) * 100;

  return (
    <>
      <style>{tripWizardStyles}</style>
      <AdminFormModal
        isOpen={isOpen}
        onOpenChange={handleClose}
        title={getPageTitle()}
        description={getPageDescription()}
        icon={<Sparkles className="h-5 w-5 text-cyan-400" />}
        maxWidthClassName="trip-wizard-modal max-w-4xl"
        contentClassName="trip-wizard-body pb-6"
      >
        {/* Progress Bar */}
        <div className="mb-7 trip-wizard-progress">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-white/60">
              Step {state.currentPage + 1} of {totalPages}
            </span>
            <span className="text-xs font-medium text-white/60">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Page Content */}
        <div>{renderPage()}</div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between mt-6 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={state.currentPage === 0}
            className="h-9 px-4 bg-white/4 border-[1.5px] border-white/10 text-white/75 hover:bg-white/8 hover:text-white/90 hover:border-white/20 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="h-9 px-4 text-white/60 hover:text-white/90 hover:bg-white/5 rounded-lg transition-all"
            >
              Cancel
            </Button>

            {/* Save Draft button - shown on all pages except initial build method page and completion page */}
            {state.currentPage > 0 && state.currentPage < totalPages - 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                className="h-9 px-4 bg-white/[0.04] border-[1.5px] border-white/10 text-white/75 hover:bg-white/[0.06] hover:text-white/90 hover:border-white/20 rounded-lg transition-all"
              >
                {state.draftId ? 'Update Draft' : 'Save Draft'}
              </Button>
            )}

            {/* Don't show Next button on initial build method page (page 0) or final completion page */}
            {state.currentPage > 0 && state.currentPage < totalPages - 1 && (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {state.currentPage === totalPages - 2 ? (
                  <>
                    Review & Finish
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </AdminFormModal>
    </>
  );
}

export function TripWizard({ isOpen, onOpenChange, onSuccess, draftTrip }: TripWizardProps) {
  return (
    <TripWizardProvider>
      <TripWizardContent
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        draftTrip={draftTrip}
      />
    </TripWizardProvider>
  );
}
