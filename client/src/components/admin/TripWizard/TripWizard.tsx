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
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

function TripWizardContent({ isOpen, onOpenChange, onSuccess }: TripWizardProps) {
  const { state, setCurrentPage, clearWizard } = useTripWizard();

  const handleClose = () => {
    clearWizard();
    onOpenChange(false);
  };

  const handleNext = () => {
    // Validate current page before proceeding
    if (state.currentPage === 0 && !state.buildMethod) {
      return; // Don't proceed if no build method selected
    }

    if (state.currentPage === 1) {
      // Only require trip type to proceed (determines resort vs cruise flow)
      const { tripTypeId } = state.tripData;
      if (!tripTypeId) {
        return; // Don't proceed if no trip type selected
      }
    }

    if (state.currentPage === 4) {
      // Validate schedule/itinerary entries
      if (state.tripType === 'resort') {
        // Check that all schedule entries have descriptions
        const hasIncompleteEntries = state.scheduleEntries.some(
          entry => !entry.description?.trim()
        );
        if (hasIncompleteEntries) {
          alert('Please add descriptions for all days before continuing.');
          return;
        }
      } else if (state.tripType === 'cruise') {
        // Check that all itinerary entries have location names
        const hasIncompleteEntries = state.itineraryEntries.some(
          entry => !entry.locationName?.trim()
        );
        if (hasIncompleteEntries) {
          alert('Please add port/location names for all days before continuing.');
          return;
        }
      }
    }

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
      default:
        return '';
    }
  };

  const totalPages = 5; // Initial selection, basic info, resort/ship details, venues/amenities, schedule/itinerary
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

            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {state.currentPage === totalPages - 1 ? (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </AdminFormModal>
    </>
  );
}

export function TripWizard({ isOpen, onOpenChange, onSuccess }: TripWizardProps) {
  return (
    <TripWizardProvider>
      <TripWizardContent isOpen={isOpen} onOpenChange={onOpenChange} onSuccess={onSuccess} />
    </TripWizardProvider>
  );
}
