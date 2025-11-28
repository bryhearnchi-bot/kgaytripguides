import React from 'react';
import { useTripWizard, TripWizardProvider } from '@/contexts/TripWizardContext';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { BuildMethodPage } from './BuildMethodPage';
import { BasicInfoPage } from './BasicInfoPage';
import { ResortDetailsPage } from './ResortDetailsPage';
import { ShipDetailsPage } from './ShipDetailsPage';
import { ResortSchedulePage } from './ResortSchedulePage';
import { CruiseItineraryPage } from './CruiseItineraryPage';
import { CompletionPage } from './CompletionPage';
import { Sparkles, ArrowLeft, ArrowRight, X, Save } from 'lucide-react';
import { ItineraryNavigationProvider } from '@/contexts/ItineraryNavigationContext';
import { LocationsProvider } from '@/contexts/LocationsContext';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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
    setScheduleEntries,
    setItineraryEntries,
    restoreFromDraft,
  } = useTripWizard();
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
        // Async function to fetch ship/resort data and restore draft
        const restoreDraftWithData = async () => {
          const wizardState = { ...draftTrip.wizardState };

          // Fetch ship data if shipId exists
          if (wizardState.shipId && wizardState.tripType === 'cruise') {
            try {
              const response = await api.get(`/api/ships/${wizardState.shipId}`);
              if (response.ok) {
                const ship = await response.json();
                wizardState.shipData = {
                  name: ship.name || '',
                  cruiseLineId: ship.cruiseLineId,
                  cruiseLineName: ship.cruiseLineName || '', // This comes from the JOIN
                  capacity: ship.capacity,
                  decks: ship.decks,
                  imageUrl: ship.imageUrl || '',
                  description: ship.description || '',
                  deckPlansUrl: ship.deckPlansUrl || '',
                };
              }
            } catch (error) {}
          }

          // Fetch resort data if resortId exists
          if (wizardState.resortId && wizardState.tripType === 'resort') {
            try {
              const response = await api.get(`/api/resorts/${wizardState.resortId}`);
              if (response.ok) {
                const resort = await response.json();
                wizardState.resortData = {
                  name: resort.name || '',
                  locationId: resort.locationId,
                  capacity: resort.capacity,
                  numberOfRooms: resort.numberOfRooms,
                  imageUrl: resort.imageUrl || '',
                  description: resort.description || '',
                  propertyMapUrl: resort.propertyMapUrl || '',
                  checkInTime: resort.checkInTime || '',
                  checkOutTime: resort.checkOutTime || '',
                };
              }
            } catch (error) {}
          }

          // Ensure draft ID is set
          wizardState.draftId = draftTrip.id;

          // Restore draft with complete data
          restoreFromDraft(wizardState);
        };

        restoreDraftWithData();
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

      // First blur any focused element to prevent aria-hidden conflict
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Close modal
      onOpenChange(false);

      // Schedule everything else to happen AFTER the modal is completely gone
      requestAnimationFrame(() => {
        const message = state.draftId
          ? 'Draft updated successfully!'
          : 'Draft saved! You can return to finish this trip later.';

        // Show toast
        toast.success(state.draftId ? 'Draft Updated' : 'Draft Saved', {
          description: message,
        });

        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
      });
    } catch (error) {
      toast.error('Failed to Save Draft', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  };

  const handleNext = () => {
    // Validate current page before proceeding
    if (state.currentPage === 0 && !state.buildMethod) {
      toast.error('Please Select a Build Method', {
        description: 'Choose how you want to create your trip before continuing.',
      });
      return;
    }

    if (state.currentPage === 1) {
      // Only require trip type to proceed (determines resort vs cruise flow)
      const { tripTypeId } = state.tripData;
      if (!tripTypeId) {
        toast.error('Please Select Trip Type', {
          description: 'Choose whether this is a resort or cruise trip.',
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
        // Conditional rendering for schedule/itinerary
        if (state.tripType === 'resort') {
          return <ResortSchedulePage />;
        } else if (state.tripType === 'cruise') {
          return (
            <LocationsProvider>
              <ItineraryNavigationProvider>
                <CruiseItineraryPage />
              </ItineraryNavigationProvider>
            </LocationsProvider>
          );
        } else {
          return (
            <div className="text-white/60 text-center py-8">
              Please select a trip type on the previous page.
            </div>
          );
        }
      case 4:
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
          return 'Resort Schedule';
        } else if (state.tripType === 'cruise') {
          return 'Cruise Itinerary';
        }
        return 'Schedule & Itinerary';
      case 4:
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
          return 'Select a resort or create a new one (includes venues & amenities)';
        } else if (state.tripType === 'cruise') {
          return 'Select a ship or create a new one (includes venues & amenities)';
        }
        return 'Enter property details';
      case 3:
        if (state.tripType === 'resort') {
          return 'Add daily schedule with images and descriptions';
        } else if (state.tripType === 'cruise') {
          return 'Add port-by-port itinerary with times and locations';
        }
        return 'Build your schedule or itinerary';
      case 4:
        return 'Review all trip details and save';
      default:
        return '';
    }
  };

  const totalPages = 5; // Build method, basic info, resort/ship details, schedule/itinerary, completion
  const progress = ((state.currentPage + 1) / totalPages) * 100;
  const isFirstPage = state.currentPage === 0;
  const isLastPage = state.currentPage === totalPages - 1;
  const showNavButtons = !isFirstPage && !isLastPage;

  // Custom header with navigation buttons
  const customHeader = (
    <div className="flex items-center justify-between w-full">
      {/* Left side: Icon + Title + Step indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white leading-tight">{getPageTitle()}</h2>
        </div>
        {/* Step indicator pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          <span className="text-xs font-medium text-white/60">
            Step {state.currentPage + 1}/{totalPages}
          </span>
          <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Right side: Navigation buttons */}
      <div className="flex items-center gap-2">
        {/* Back button - icon only */}
        {!isFirstPage && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-9 w-9 rounded-full border border-white/10 bg-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Save Draft button - icon only, shown on middle pages */}
        {showNavButtons && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSaveDraft}
            className="h-9 w-9 rounded-full border border-white/10 bg-white/10 hover:bg-white/15 text-amber-400 hover:text-amber-300 transition-colors"
            aria-label={state.draftId ? 'Update Draft' : 'Save Draft'}
            title={state.draftId ? 'Update Draft' : 'Save Draft'}
          >
            <Save className="w-4 h-4" />
          </Button>
        )}

        {/* Next/Finish button - icon only, shown on middle pages */}
        {showNavButtons && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={!canProceed()}
            className="h-9 w-9 rounded-full border border-white/10 bg-white/10 hover:bg-white/15 text-green-400 hover:text-green-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={state.currentPage === totalPages - 2 ? 'Review & Finish' : 'Next'}
            title={state.currentPage === totalPages - 2 ? 'Review & Finish' : 'Next'}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}

        {/* Close button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClose}
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
      isOpen={isOpen}
      onOpenChange={handleClose}
      title={getPageTitle()}
      description={getPageDescription()}
      contentClassName="pb-6 pt-0"
      className="max-w-4xl"
      maxHeight="85vh"
      fullScreen={true}
      customHeader={customHeader}
    >
      {/* Mobile step indicator - shown only on small screens */}
      <div className="sm:hidden mb-4">
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
      <div className="max-w-3xl mx-auto">{renderPage()}</div>
    </AdminBottomSheet>
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
