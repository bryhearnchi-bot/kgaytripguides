import { useState } from 'react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  Edit2,
  Ship,
  Building2,
  Calendar,
  MapPin,
  Anchor,
  PartyPopper,
  ExternalLink,
  Plus,
  LayoutDashboard,
  AlertCircle,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { EditBasicInfoModal } from './modals/EditBasicInfoModal';
import { EditResortDetailsModal } from './modals/EditResortDetailsModal';
import { EditShipDetailsModal } from './modals/EditShipDetailsModal';
import { EditVenuesAmenitiesModal } from './modals/EditVenuesAmenitiesModal';
import { EditResortScheduleModal } from './modals/EditResortScheduleModal';
import { EditCruiseItineraryModal } from './modals/EditCruiseItineraryModal';

export function CompletionPage() {
  const { state } = useTripWizard();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showBasicInfoModal, setShowBasicInfoModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showVenuesModal, setShowVenuesModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedTripSlug, setSavedTripSlug] = useState<string>('');

  const handleApprove = async () => {
    try {
      setSaving(true);

      // Validate required fields with detailed error messages
      if (!state.tripData.name || !state.tripData.charterCompanyId || !state.tripData.tripTypeId) {
        toast({
          title: 'Missing Required Information',
          description:
            'Please complete all required fields: Trip Name, Charter Company, and Trip Type.',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      if (!state.tripData.startDate || !state.tripData.endDate) {
        toast({
          title: 'Missing Trip Dates',
          description: 'Please provide both start and end dates for the trip.',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      if (state.tripType === 'resort' && !state.resortData?.name) {
        toast({
          title: 'Missing Resort Information',
          description: 'Please complete the resort details before saving.',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      if (state.tripType === 'cruise' && !state.shipData?.name) {
        toast({
          title: 'Missing Ship Information',
          description: 'Please complete the ship details before saving.',
          variant: 'destructive',
        });
        setSaving(false);
        return;
      }

      // Transform wizard state to API format
      const tripPayload = {
        // Include draft ID if this trip was created from a draft
        // This tells the server to delete the draft after successful trip creation
        ...(state.draftId ? { draftId: state.draftId } : {}),

        // Basic trip data
        name: state.tripData.name,
        slug: state.tripData.slug,
        charterCompanyId: state.tripData.charterCompanyId,
        tripTypeId: state.tripData.tripTypeId,
        startDate: state.tripData.startDate,
        endDate: state.tripData.endDate,
        heroImageUrl: state.tripData.heroImageUrl,
        description: state.tripData.description,
        highlights: state.tripData.highlights,

        // Resort ID (if linking to existing) or resort data (if creating new)
        ...(state.tripType === 'resort'
          ? {
              ...(state.resortId ? { resortId: state.resortId } : {}),
              ...(state.resortData
                ? {
                    resortData: {
                      name: state.resortData.name,
                      locationId: state.resortData.locationId,
                      capacity: state.resortData.capacity,
                      numberOfRooms: state.resortData.numberOfRooms,
                      imageUrl: state.resortData.imageUrl,
                      description: state.resortData.description,
                      propertyMapUrl: state.resortData.propertyMapUrl,
                      checkInTime: state.resortData.checkInTime,
                      checkOutTime: state.resortData.checkOutTime,
                    },
                  }
                : {}),
            }
          : {}),

        // Ship ID (if linking to existing) or ship data (if creating new)
        ...(state.tripType === 'cruise'
          ? {
              ...(state.shipId ? { shipId: state.shipId } : {}),
              ...(state.shipData
                ? {
                    shipData: {
                      name: state.shipData.name,
                      cruiseLine: state.shipData.cruiseLine,
                      capacity: state.shipData.capacity,
                      decks: state.shipData.decks,
                      imageUrl: state.shipData.imageUrl,
                      description: state.shipData.description,
                      deckPlansUrl: state.shipData.deckPlansUrl,
                    },
                  }
                : {}),
            }
          : {}),

        // Venues and amenities
        venueIds: state.venueIds,
        amenityIds: state.amenityIds,

        // Schedule or itinerary
        ...(state.tripType === 'resort'
          ? {
              scheduleEntries: state.scheduleEntries,
            }
          : {}),

        ...(state.tripType === 'cruise'
          ? {
              itineraryEntries: state.itineraryEntries,
            }
          : {}),
      };

      // Use api client which handles authentication
      const response = await api.post('/api/admin/trips', tripPayload);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to save trip' }));
        throw new Error(error.message || 'Failed to save trip');
      }

      const result = await response.json();

      // Success! Store the trip slug and show success modal
      setSavedTripSlug(result.slug || state.tripData.slug);
      setShowSuccessModal(true);

      // Invalidate the admin trips query to refresh the list
      await queryClient.invalidateQueries({ queryKey: ['admin-trips'] });

      // Show success toast
      toast({
        title: 'Trip Saved for Preview!',
        description: `${state.tripData.name} has been saved and is ready to preview.`,
      });

      console.log('Trip created:', result);
    } catch (error) {
      console.error('Error saving trip:', error);

      // Enhanced error messaging
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

      toast({
        title: 'Failed to Save Trip',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Success Header */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-cyan-400/10 border border-cyan-400/30">
        <CheckCircle2 className="w-6 h-6 text-cyan-400" />
        <div>
          <h3 className="text-sm font-semibold text-white">Ready to Preview</h3>
          <p className="text-xs text-white/70">
            Review your trip details below and click "Review & Preview" to save for preview.
          </p>
        </div>
      </div>

      {/* Basic Information Section */}
      <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h4 className="text-sm font-semibold text-white">Basic Information</h4>
          </div>
          <Button
            type="button"
            onClick={() => setShowBasicInfoModal(true)}
            className="h-8 px-3 bg-white/[0.04] border border-white/10 rounded-lg text-white/70 text-xs hover:bg-white/[0.06] hover:text-white transition-all"
          >
            <Edit2 className="w-3 h-3 mr-1.5" />
            Edit
          </Button>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-white/50">Trip Name</p>
              <p className="text-sm text-white/90">{state.tripData.name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/50">Trip Type</p>
              <p className="text-sm text-white/90 capitalize">{state.tripType || 'Not set'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-white/50">Start Date</p>
              <p className="text-sm text-white/90">{formatDate(state.tripData.startDate || '')}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/50">End Date</p>
              <p className="text-sm text-white/90">{formatDate(state.tripData.endDate || '')}</p>
            </div>
          </div>
          {state.tripData.description && (
            <div>
              <p className="text-[10px] text-white/50">Description</p>
              <p className="text-sm text-white/70 line-clamp-2">{state.tripData.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Resort/Ship Details Section */}
      {state.tripType === 'resort' && state.resortData && (
        <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-semibold text-white">Resort Details</h4>
            </div>
            <Button
              type="button"
              onClick={() => setShowDetailsModal(true)}
              className="h-8 px-3 bg-white/[0.04] border border-white/10 rounded-lg text-white/70 text-xs hover:bg-white/[0.06] hover:text-white transition-all"
            >
              <Edit2 className="w-3 h-3 mr-1.5" />
              Edit
            </Button>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-white/50">Resort Name</p>
              <p className="text-sm text-white/90">{state.resortData.name || 'Not set'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-white/50">Capacity</p>
                <p className="text-sm text-white/90">{state.resortData.capacity || 'Not set'}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50">Rooms</p>
                <p className="text-sm text-white/90">
                  {state.resortData.numberOfRooms || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {state.tripType === 'cruise' && state.shipData && (
        <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Ship className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-semibold text-white">Ship Details</h4>
            </div>
            <Button
              type="button"
              onClick={() => setShowDetailsModal(true)}
              className="h-8 px-3 bg-white/[0.04] border border-white/10 rounded-lg text-white/70 text-xs hover:bg-white/[0.06] hover:text-white transition-all"
            >
              <Edit2 className="w-3 h-3 mr-1.5" />
              Edit
            </Button>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-white/50">Ship Name</p>
              <p className="text-sm text-white/90">{state.shipData.name || 'Not set'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-white/50">Cruise Line</p>
                <p className="text-sm text-white/90">{state.shipData.cruiseLine || 'Not set'}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50">Capacity</p>
                <p className="text-sm text-white/90">{state.shipData.capacity || 'Not set'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule/Itinerary Section */}
      {state.tripType === 'resort' && state.scheduleEntries.length > 0 && (
        <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-semibold text-white">Resort Schedule</h4>
            </div>
            <Button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="h-8 px-3 bg-white/[0.04] border border-white/10 rounded-lg text-white/70 text-xs hover:bg-white/[0.06] hover:text-white transition-all"
            >
              <Edit2 className="w-3 h-3 mr-1.5" />
              Edit
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-white/50 mb-2">
              {state.scheduleEntries.length} days configured
            </p>
            {/* Accordion for all days */}
            <Accordion type="multiple" className="w-full">
              {state.scheduleEntries
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((entry, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`day-${idx}`}
                    className="border-b border-white/10"
                  >
                    <AccordionTrigger className="py-3 text-white/90 hover:text-white hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className="text-xs font-semibold text-cyan-400 min-w-[65px]">
                          {entry.dayNumber < 1
                            ? 'Pre-Trip'
                            : entry.dayNumber >= 100
                              ? 'Post-Trip'
                              : `Day ${entry.dayNumber}`}
                        </span>
                        <span className="text-xs text-white/60">{formatDate(entry.date)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                      <div className="space-y-2 pl-1">
                        {entry.imageUrl && (
                          <div>
                            <p className="text-[10px] text-white/50 mb-1">Day Image</p>
                            <img
                              src={entry.imageUrl}
                              alt={`Day ${entry.dayNumber}`}
                              className="w-full max-w-sm h-32 object-cover rounded-lg border border-white/10"
                            />
                          </div>
                        )}
                        {entry.description && (
                          <div>
                            <p className="text-[10px] text-white/50 mb-1">Description</p>
                            <p className="text-xs text-white/80 leading-relaxed">
                              {entry.description}
                            </p>
                          </div>
                        )}
                        {!entry.imageUrl && !entry.description && (
                          <p className="text-xs text-white/40 italic">No details added yet</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </div>
        </div>
      )}

      {state.tripType === 'cruise' && state.itineraryEntries.length > 0 && (
        <div className="p-4 rounded-lg border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Anchor className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-semibold text-white">Cruise Itinerary</h4>
            </div>
            <Button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="h-8 px-3 bg-white/[0.04] border border-white/10 rounded-lg text-white/70 text-xs hover:bg-white/[0.06] hover:text-white transition-all"
            >
              <Edit2 className="w-3 h-3 mr-1.5" />
              Edit
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-white/50 mb-2">
              {state.itineraryEntries.length} ports/days configured
            </p>
            {/* Accordion for all ports */}
            <Accordion type="multiple" className="w-full">
              {state.itineraryEntries
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((entry, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`port-${idx}`}
                    className="border-b border-white/10"
                  >
                    <AccordionTrigger className="py-3 text-white/90 hover:text-white hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className="text-xs font-semibold text-cyan-400 min-w-[65px]">
                          {entry.dayNumber < 1
                            ? 'Pre-Trip'
                            : entry.dayNumber >= 100
                              ? 'Post-Trip'
                              : `Day ${entry.dayNumber}`}
                        </span>
                        <span className="text-xs text-white/60">{formatDate(entry.date)}</span>
                        {entry.locationName && (
                          <span className="text-xs text-white/90 font-medium">
                            - {entry.locationName}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                      <div className="space-y-2 pl-1">
                        {/* Times */}
                        {(entry.arrivalTime || entry.departureTime || entry.allAboardTime) && (
                          <div className="grid grid-cols-3 gap-2">
                            {entry.arrivalTime && (
                              <div>
                                <p className="text-[10px] text-white/50 mb-0.5">Arrival</p>
                                <p className="text-xs text-white/80">{entry.arrivalTime}</p>
                              </div>
                            )}
                            {entry.departureTime && (
                              <div>
                                <p className="text-[10px] text-white/50 mb-0.5">Departure</p>
                                <p className="text-xs text-white/80">{entry.departureTime}</p>
                              </div>
                            )}
                            {entry.allAboardTime && (
                              <div>
                                <p className="text-[10px] text-white/50 mb-0.5">All Aboard</p>
                                <p className="text-xs text-white/80">{entry.allAboardTime}</p>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Port Image */}
                        {entry.imageUrl && (
                          <div>
                            <p className="text-[10px] text-white/50 mb-1">Port Image</p>
                            <img
                              src={entry.imageUrl}
                              alt={entry.locationName || `Day ${entry.dayNumber}`}
                              className="w-full max-w-sm h-32 object-cover rounded-lg border border-white/10"
                            />
                          </div>
                        )}
                        {/* Description */}
                        {entry.description && (
                          <div>
                            <p className="text-[10px] text-white/50 mb-1">Description</p>
                            <p className="text-xs text-white/80 leading-relaxed">
                              {entry.description}
                            </p>
                          </div>
                        )}
                        {!entry.locationName &&
                          !entry.arrivalTime &&
                          !entry.departureTime &&
                          !entry.allAboardTime &&
                          !entry.imageUrl &&
                          !entry.description && (
                            <p className="text-xs text-white/40 italic">No details added yet</p>
                          )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
            </Accordion>
          </div>
        </div>
      )}

      {/* Approve Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="button"
          onClick={handleApprove}
          disabled={saving}
          className="h-11 px-6 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Review & Preview'}
        </Button>
      </div>

      {/* Edit Modals */}
      <EditBasicInfoModal open={showBasicInfoModal} onOpenChange={setShowBasicInfoModal} />

      {state.tripType === 'resort' && (
        <EditResortDetailsModal open={showDetailsModal} onOpenChange={setShowDetailsModal} />
      )}

      {state.tripType === 'cruise' && (
        <EditShipDetailsModal open={showDetailsModal} onOpenChange={setShowDetailsModal} />
      )}

      <EditVenuesAmenitiesModal open={showVenuesModal} onOpenChange={setShowVenuesModal} />

      {state.tripType === 'resort' && (
        <EditResortScheduleModal open={showScheduleModal} onOpenChange={setShowScheduleModal} />
      )}

      {state.tripType === 'cruise' && (
        <EditCruiseItineraryModal open={showScheduleModal} onOpenChange={setShowScheduleModal} />
      )}

      {/* Success Modal */}
      <Dialog
        open={showSuccessModal}
        onOpenChange={open => {
          setShowSuccessModal(open);
          if (!open) {
            window.location.href = '/admin/trips';
          }
        }}
      >
        <DialogContent className="sm:max-w-lg border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white">
          <DialogTitle className="sr-only">Trip Saved Successfully</DialogTitle>
          <DialogDescription className="sr-only">
            Your trip has been saved for preview
          </DialogDescription>
          <div className="flex flex-col items-center text-center py-6 px-4">
            {/* Success Icon */}
            <div className="w-20 h-20 rounded-full bg-cyan-400/10 border-2 border-cyan-400/30 flex items-center justify-center mb-6">
              <PartyPopper className="w-10 h-10 text-cyan-400" />
            </div>

            {/* Success Message */}
            <h3 className="text-2xl font-bold text-white mb-2">Saved for Preview!</h3>
            <p className="text-base text-white/70 mb-2">
              Your trip <span className="text-cyan-400 font-semibold">"{state.tripData.name}"</span>{' '}
              has been saved successfully!
            </p>
            <p className="text-sm text-white/50 mb-8">
              Preview your trip and approve it when you're ready to make it live.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full">
              {/* Primary Action - Preview Trip */}
              <a
                href={`/trip/${savedTripSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 h-11 px-6 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition-all"
              >
                Preview Trip
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Secondary Actions */}
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSuccessModal(false);
                    // TODO: Open new wizard for another trip
                    window.location.reload();
                  }}
                  className="flex-1 h-10 px-4 bg-white/[0.04] border-[1.5px] border-white/10 text-white/75 hover:bg-white/[0.06] hover:text-white/90 hover:border-white/20 rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Another
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSuccessModal(false);
                    // TODO: Navigate to admin trips page
                    window.location.href = '/admin/trips';
                  }}
                  className="flex-1 h-10 px-4 bg-white/[0.04] border-[1.5px] border-white/10 text-white/75 hover:bg-white/[0.06] hover:text-white/90 hover:border-white/20 rounded-lg transition-all"
                >
                  <LayoutDashboard className="w-4 h-4 mr-1.5" />
                  Back to Trips
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
