import { useState, useEffect, useRef } from 'react';
import { useTripWizard } from '@/contexts/TripWizardContext';
import type { ScheduleEntry, ItineraryEntry } from '@/contexts/TripWizardContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { SingleDropDownNew } from '@/components/ui/single-drop-down-new';
import { DatePicker } from '@/components/ui/date-picker';
import { ConfirmDeleteDaysDialog } from './ConfirmDeleteDaysDialog';
import { api } from '@/lib/api-client';
import { Ship, Calendar, Building2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CharterCompany {
  id: number;
  name: string;
}

interface TripType {
  id: number;
  trip_type: string;
}

export function BasicInfoPage() {
  const {
    state,
    updateTripData,
    setTripType,
    syncScheduleWithDates,
    syncItineraryWithDates,
    syncEventsWithDates,
  } = useTripWizard();

  // Debug: Log bookingUrl value
  console.log('🔍 BasicInfoPage: bookingUrl value:', state.tripData.bookingUrl);
  const [charterCompanies, setCharterCompanies] = useState<CharterCompany[]>([]);
  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [loading, setLoading] = useState(true);

  // Date change tracking
  const previousDatesRef = useRef<{ start: string; end: string } | null>(null);
  const isSyncingRef = useRef(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pendingDateChange, setPendingDateChange] = useState<{ start: string; end: string } | null>(
    null
  );
  const [entriesToDelete, setEntriesToDelete] = useState<(ScheduleEntry | ItineraryEntry)[]>([]);

  useEffect(() => {
    loadLookupData();
  }, []);

  // Watch for date changes and sync schedule/itinerary
  useEffect(() => {
    // Skip if already syncing
    if (isSyncingRef.current) return;

    const currentStart = state.tripData.startDate;
    const currentEnd = state.tripData.endDate;

    // Skip if either date is missing
    if (!currentStart || !currentEnd) {
      return;
    }

    // First time seeing dates - just save them
    if (!previousDatesRef.current) {
      previousDatesRef.current = { start: currentStart, end: currentEnd };
      return;
    }

    // Check if dates have changed
    const datesChanged =
      currentStart !== previousDatesRef.current.start ||
      currentEnd !== previousDatesRef.current.end;

    if (!datesChanged) return;

    // Dates changed - sync schedule/itinerary
    const performSync = () => {
      isSyncingRef.current = true;

      const oldStart = previousDatesRef.current!.start;
      const oldEnd = previousDatesRef.current!.end;

      // Sync based on trip type
      let syncResult;
      if (state.tripType === 'resort') {
        // Only sync if there are schedule entries
        if (state.scheduleEntries.length > 0) {
          syncResult = syncScheduleWithDates(oldStart, oldEnd, currentStart, currentEnd);
        }
      } else if (state.tripType === 'cruise') {
        // Only sync if there are itinerary entries
        if (state.itineraryEntries.length > 0) {
          syncResult = syncItineraryWithDates(oldStart, oldEnd, currentStart, currentEnd);
        }
      }

      // Handle sync result
      if (syncResult && !syncResult.success && syncResult.entriesToDelete) {
        // User needs to confirm deletion
        setPendingDateChange({ start: currentStart, end: currentEnd });
        setEntriesToDelete(syncResult.entriesToDelete);
        setShowDeleteDialog(true);

        // Revert dates temporarily (will be re-applied if user confirms)
        updateTripData({ startDate: oldStart, endDate: oldEnd });
      } else {
        // Sync successful or no entries to sync
        previousDatesRef.current = { start: currentStart, end: currentEnd };

        // ALSO SYNC EVENTS - events shift with dates automatically
        if (state.events && state.events.length > 0) {
          syncEventsWithDates(oldStart, oldEnd, currentStart, currentEnd);
        }

        // Show toast notification if entries were synced
        if (syncResult && (state.scheduleEntries.length > 0 || state.itineraryEntries.length > 0)) {
          const pageName = state.tripType === 'resort' ? 'Schedule' : 'Itinerary';
          toast({
            title: 'Trip dates updated',
            description: `Please review the ${pageName} page and Events tab to verify all entries.`,
            duration: 5000,
          });
        }
      }

      isSyncingRef.current = false;
    };

    performSync();
  }, [
    state.tripData.startDate,
    state.tripData.endDate,
    state.tripType,
    state.scheduleEntries.length,
    state.itineraryEntries.length,
    state.events?.length,
    syncScheduleWithDates,
    syncItineraryWithDates,
    syncEventsWithDates,
    updateTripData,
  ]);

  const handleConfirmDelete = () => {
    if (!pendingDateChange || !previousDatesRef.current) return;

    isSyncingRef.current = true;

    // Apply the pending date change
    const { start: newStart, end: newEnd } = pendingDateChange;
    const { start: oldStart, end: oldEnd } = previousDatesRef.current;

    // Force sync (this will delete the entries)
    if (state.tripType === 'resort') {
      syncScheduleWithDates(oldStart, oldEnd, newStart, newEnd);
    } else if (state.tripType === 'cruise') {
      syncItineraryWithDates(oldStart, oldEnd, newStart, newEnd);
    }

    // ALSO SYNC EVENTS
    if (state.events && state.events.length > 0) {
      syncEventsWithDates(oldStart, oldEnd, newStart, newEnd);
    }

    // Update dates
    updateTripData({ startDate: newStart, endDate: newEnd });
    previousDatesRef.current = { start: newStart, end: newEnd };

    // Show toast
    const pageName = state.tripType === 'resort' ? 'Schedule' : 'Itinerary';
    toast({
      title: 'Trip dates updated',
      description: `Days deleted. Please review the ${pageName} page and Events tab to verify remaining entries.`,
      duration: 5000,
    });

    // Close dialog
    setShowDeleteDialog(false);
    setPendingDateChange(null);
    setEntriesToDelete([]);

    isSyncingRef.current = false;
  };

  const handleCancelDelete = () => {
    // User cancelled - dates have already been reverted
    setShowDeleteDialog(false);
    setPendingDateChange(null);
    setEntriesToDelete([]);
  };

  const loadLookupData = async () => {
    try {
      setLoading(true);
      const [companiesRes, typesRes] = await Promise.all([
        api.get('/api/admin/lookup-tables/charter-companies'),
        api.get('/api/admin/lookup-tables/trip-types'),
      ]);

      if (companiesRes.ok && typesRes.ok) {
        const companiesData = await companiesRes.json();
        const typesData = await typesRes.json();
        setCharterCompanies(companiesData.items || []);
        setTripTypes(typesData.items || []);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date without timezone issues
  const formatDateForStorage = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate minimum end date (one day after start date)
  const getMinimumEndDate = (): Date | undefined => {
    if (!state.tripData.startDate) return undefined;
    const startDate = new Date(state.tripData.startDate);
    const minEndDate = new Date(startDate);
    minEndDate.setDate(minEndDate.getDate() + 1);
    return minEndDate;
  };

  const handleInputChange = (field: string, value: string) => {
    updateTripData({ [field]: value });

    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      updateTripData({ slug });
    }
  };

  const handleTripTypeChange = (tripTypeId: string) => {
    updateTripData({ tripTypeId: Number(tripTypeId) });

    // Find the trip type and set it in context
    const selectedType = tripTypes.find(t => t.id === Number(tripTypeId));
    if (selectedType) {
      const type = selectedType.trip_type.toLowerCase() as 'resort' | 'cruise';
      setTripType(type);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Column */}
        <div className="space-y-2.5">
          {/* Charter Company */}
          <SingleDropDownNew
            label="Charter Company"
            placeholder="Select a charter company"
            emptyMessage="No charter company found."
            options={charterCompanies.map(company => ({
              value: company.id.toString(),
              label: company.name,
            }))}
            value={state.tripData.charterCompanyId?.toString() || ''}
            onChange={value => updateTripData({ charterCompanyId: Number(value) })}
            required
          />

          {/* Trip Type */}
          <div className="space-y-1">
            <SingleDropDownNew
              label="Trip Type"
              placeholder="Select a trip type"
              emptyMessage="No trip type found."
              options={tripTypes.map(type => ({
                value: type.id.toString(),
                label: type.trip_type,
                icon: type.trip_type.toLowerCase() === 'cruise' ? Ship : Calendar,
              }))}
              value={state.tripData.tripTypeId?.toString() || ''}
              onChange={handleTripTypeChange}
              required
              disabled={state.isEditMode}
            />
            {state.tripType && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-400/10 border border-cyan-400/20 rounded-lg">
                {state.tripType === 'cruise' ? (
                  <Ship className="w-3 h-3 text-cyan-400" />
                ) : (
                  <Calendar className="w-3 h-3 text-cyan-400" />
                )}
                <span className="text-[10px] text-cyan-400 font-medium">
                  {state.tripType === 'cruise' ? 'Cruise' : 'Resort'} trip selected
                </span>
              </div>
            )}
          </div>

          {/* Trip Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/90">Trip Name *</label>
            <Input
              placeholder="Enter trip name"
              value={state.tripData.name || ''}
              onChange={e => handleInputChange('name', e.target.value)}
              className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
            />
            {state.tripData.slug && (
              <p className="text-[10px] text-white/50 mt-0.5">
                URL: /trip-guide/{state.tripData.slug}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">Start Date *</label>
              <DatePicker
                value={state.tripData.startDate}
                onChange={date => {
                  const newStartDate = date ? formatDateForStorage(date) : '';

                  // Clear end date if it's now invalid (same as or before new start date)
                  if (state.tripData.endDate && newStartDate) {
                    const startDateObj = new Date(newStartDate);
                    const endDateObj = new Date(state.tripData.endDate);

                    if (endDateObj <= startDateObj) {
                      updateTripData({ startDate: newStartDate, endDate: '' });
                      return;
                    }
                  }

                  updateTripData({ startDate: newStartDate });
                }}
                placeholder="Pick start date"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/90">End Date *</label>
              <DatePicker
                value={state.tripData.endDate}
                onChange={date =>
                  updateTripData({ endDate: date ? formatDateForStorage(date) : '' })
                }
                placeholder="Pick end date"
                disabled={!state.tripData.startDate}
                fromDate={getMinimumEndDate()}
              />
              {state.tripData.startDate && (
                <p className="text-[10px] text-white/50 mt-0.5">
                  Must be at least one day after start date
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-2.5">
          {/* Hero Image */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/90">Trip Cover Image *</label>
            <ImageUploadField
              label="Trip Cover Image"
              value={state.tripData.heroImageUrl || ''}
              onChange={url => updateTripData({ heroImageUrl: url || '' })}
              imageType="general"
              placeholder="No cover image uploaded"
              className="admin-form-modal"
            />
          </div>

          {/* Map Image */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/90">Cruise Route Map</label>
            <ImageUploadField
              label="Cruise Route Map"
              value={state.tripData.mapUrl || ''}
              onChange={url => updateTripData({ mapUrl: url || '' })}
              imageType="maps"
              placeholder="No map image uploaded"
              className="admin-form-modal"
            />
            <p className="text-[10px] text-white/50 mt-0.5">
              Upload a map showing the cruise route or resort location
            </p>
          </div>

          {/* Booking URL */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/90">Booking URL</label>
            <Input
              placeholder="https://example.com/booking"
              value={state.tripData.bookingUrl || ''}
              onChange={e => updateTripData({ bookingUrl: e.target.value })}
              className="h-10 px-3 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm transition-all focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
            />
            <p className="text-[10px] text-white/50 mt-0.5">URL where users can book this trip</p>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/90">Description *</label>
            <Textarea
              placeholder="Enter trip description..."
              value={state.tripData.description || ''}
              onChange={e => handleInputChange('description', e.target.value)}
              rows={3}
              className="px-3 py-2 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm leading-snug transition-all resize-vertical focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
            />
          </div>

          {/* Highlights */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/90">Highlights</label>
            <Textarea
              placeholder="Enter trip highlights (one per line)..."
              value={state.tripData.highlights || ''}
              onChange={e => handleInputChange('highlights', e.target.value)}
              rows={2}
              className="px-3 py-2 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm leading-snug transition-all resize-vertical focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
            />
            <p className="text-[10px] text-white/50 mt-0.5">Enter each highlight on a new line</p>
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="mt-2.5 p-2.5 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
        <p className="text-[10px] text-white/70 leading-relaxed">
          <span className="font-semibold text-cyan-400">Note:</span> New trips are automatically set
          to "Upcoming" status and will be visible on the site immediately after creation.
        </p>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDaysDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        entriesToDelete={entriesToDelete}
        tripType={state.tripType || 'resort'}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
