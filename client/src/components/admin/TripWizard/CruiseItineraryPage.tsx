import { useEffect, useState, useRef, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { TimePicker } from '@/components/ui/time-picker';
import { StandardDropdown } from '@/components/ui/dropdowns';
import { DatePicker } from '@/components/ui/date-picker';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { LocationFormModal } from '@/components/admin/LocationFormModal';
import { LocationAttractionsPreview } from '@/components/admin/LocationAttractionsPreview';
import { LocationLGBTVenuesPreview } from '@/components/admin/LocationLGBTVenuesPreview';
import { LocationAttractionsModal } from '@/components/admin/LocationAttractionsModal';
import { LocationLGBTVenuesModal } from '@/components/admin/LocationLGBTVenuesModal';
import { useTripWizard } from '@/contexts/TripWizardContext';
import type { ItineraryEntry } from '@/contexts/TripWizardContext';
import { useLocations } from '@/contexts/LocationsContext';
import { useItineraryNavigation } from '@/contexts/ItineraryNavigationContext';
import { Anchor, Edit2, Landmark, Building2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { PillDropdown } from '@/components/ui/dropdowns';

interface LocationType {
  id: number;
  type: string;
}

export function CruiseItineraryPage() {
  const { state, setItineraryEntries, updateItineraryEntry, addItineraryEntry } = useTripWizard();
  const [addDayType, setAddDayType] = useState<'before' | 'after' | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
  const [loadingLocationTypes, setLoadingLocationTypes] = useState(true);
  const [showCreateLocationModal, setShowCreateLocationModal] = useState(false);
  const [showEditLocationModal, setShowEditLocationModal] = useState(false);
  const [showAttractionsModal, setShowAttractionsModal] = useState(false);
  const [showLGBTVenuesModal, setShowLGBTVenuesModal] = useState(false);
  const entriesContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Use shared navigation context (state is in EditTripModal's header)
  const {
    selectedDayIndex,
    setSelectedDayIndex,
    showAddDayModal,
    setShowAddDayModal,
    sortedEntries,
    dayOptions,
    totalDays,
    goToPreviousDay,
    goToNextDay,
    canGoPrevious,
    canGoNext,
  } = useItineraryNavigation();

  // Use shared locations context
  const { locations, loading: locationsLoading, refetch: refetchLocations } = useLocations();

  // Fetch location types on mount
  useEffect(() => {
    const fetchLocationTypes = async () => {
      try {
        setLoadingLocationTypes(true);
        const response = await api.get('/api/admin/lookup-tables/location-types');
        if (response.ok) {
          const data = await response.json();
          setLocationTypes(data.items || []);
        }
      } catch (error) {
        // Error silently handled
      } finally {
        setLoadingLocationTypes(false);
      }
    };

    fetchLocationTypes();
  }, []);

  // Generate itinerary entries from trip dates if not already created
  // IMPORTANT: Don't generate blank entries in edit mode - the data is coming from restoreFromDraft
  useEffect(() => {
    // ONLY generate blank entries if:
    // 1. No entries exist
    // 2. We have dates
    // 3. We're in CREATE mode (not edit mode)
    // In edit mode, the data should come from the database via restoreFromDraft
    if (
      state.itineraryEntries.length === 0 &&
      state.tripData.startDate &&
      state.tripData.endDate &&
      !state.isEditMode
    ) {
      // Parse dates in local timezone to avoid UTC conversion issues
      const startParts = state.tripData.startDate.split('-');
      const startYear = Number(startParts[0] || 2025);
      const startMonth = Number(startParts[1] || 1);
      const startDay = Number(startParts[2] || 1);

      const endParts = state.tripData.endDate.split('-');
      const endYear = Number(endParts[0] || 2025);
      const endMonth = Number(endParts[1] || 1);
      const endDay = Number(endParts[2] || 1);

      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      const entries: ItineraryEntry[] = [];

      const currentDate = new Date(startDate);
      let dayNumber = 1; // Start at Day 1

      while (currentDate <= endDate) {
        // Format date as YYYY-MM-DD without timezone conversion
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        entries.push({
          dayNumber,
          date: dateString,
          locationName: '',
          arrivalTime: '',
          departureTime: '',
          allAboardTime: '',
          description: '',
          imageUrl: '',
        });
        currentDate.setDate(currentDate.getDate() + 1);
        dayNumber++;
      }

      setItineraryEntries(entries);
    }
  }, [
    state.tripData.startDate,
    state.tripData.endDate,
    state.itineraryEntries.length,
    setItineraryEntries,
  ]);

  // Format date for display in subheader
  const formatDate = (dateString: string) => {
    const parts = dateString.split('-');
    const year = Number(parts[0] || 2025);
    const month = Number(parts[1] || 1);
    const day = Number(parts[2] || 1);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  // Build location options for StandardDropdown
  const locationOptions = useMemo(() => {
    return locations.map(loc => ({
      value: loc.id.toString(),
      label: loc.name,
      description: [loc.city, loc.country].filter(Boolean).join(', '),
    }));
  }, [locations]);

  const handleLocationChange = (index: number, locationIdStr: string) => {
    if (!locationIdStr) {
      updateItineraryEntry(index, { locationId: undefined, locationName: '' });
      return;
    }

    const locationId = parseInt(locationIdStr, 10);
    const location = locations.find(loc => loc.id === locationId);

    updateItineraryEntry(index, {
      locationId: locationId,
      locationName: location?.name || '',
    });
  };

  // Handle opening the location creation modal
  const handleOpenCreateLocationModal = () => {
    setShowCreateLocationModal(true);
  };

  // Handle location creation success
  const handleLocationCreated = async (newLocation: any) => {
    await refetchLocations();

    // Auto-select the new location in the current entry
    const currentEntry = sortedEntries[selectedDayIndex];
    const currentIndex = currentEntry
      ? state.itineraryEntries.findIndex(
          e => e.date === currentEntry.date && e.dayNumber === currentEntry.dayNumber
        )
      : -1;

    if (currentIndex >= 0) {
      updateItineraryEntry(currentIndex, {
        locationId: newLocation.id,
        locationName: newLocation.name,
      });
    }
  };

  // Get the selected location data for the current entry
  const getSelectedLocation = () => {
    const currentEntry = sortedEntries[selectedDayIndex];
    if (!currentEntry?.locationId) return null;
    return locations.find(loc => loc.id === currentEntry.locationId) || null;
  };

  const selectedLocation = getSelectedLocation();

  // Handler for editing the location
  const handleEditLocation = () => {
    if (selectedLocation) {
      setShowEditLocationModal(true);
    }
  };

  // Handler for when location is updated
  const handleLocationUpdated = async () => {
    await refetchLocations();
    queryClient.invalidateQueries({ queryKey: ['locations'] });
  };

  const handleImageUpload = (index: number, url: string) => {
    updateItineraryEntry(index, { imageUrl: url });
  };

  const handleTimeChange = (
    index: number,
    field: 'arrivalTime' | 'departureTime' | 'allAboardTime',
    value: string
  ) => {
    updateItineraryEntry(index, { [field]: value });
  };

  const handleDescriptionChange = (index: number, description: string) => {
    updateItineraryEntry(index, { description });
  };

  // Helper to parse date string in local timezone (not UTC)
  const parseDateString = (dateStr: string): Date => {
    const parts = dateStr.split('-');
    const year = Number(parts[0] || 2025);
    const month = Number(parts[1] || 1);
    const day = Number(parts[2] || 1);
    return new Date(year, month - 1, day);
  };

  const handleAddDay = () => {
    if (!selectedDate || !addDayType || !state.tripData.startDate || !state.tripData.endDate)
      return;

    // Check for duplicate date
    const dateExists = state.itineraryEntries.some(entry => entry.date === selectedDate);
    if (dateExists) {
      alert('This date has already been added to the itinerary.');
      return;
    }

    // Calculate day number based on date difference
    let newDayNumber: number;
    const selectedDateObj = parseDateString(selectedDate);

    if (addDayType === 'before') {
      // Pre-trip days: calculate days before start date
      const startDateObj = parseDateString(state.tripData.startDate);
      const daysDiff = Math.floor(
        (startDateObj.getTime() - selectedDateObj.getTime()) / (1000 * 60 * 60 * 24)
      );
      newDayNumber = -daysDiff; // e.g., 1 day before = -1, 2 days before = -2
    } else {
      // Post-trip days: calculate days after end date
      const endDateObj = parseDateString(state.tripData.endDate);
      const daysDiff = Math.floor(
        (selectedDateObj.getTime() - endDateObj.getTime()) / (1000 * 60 * 60 * 24)
      );
      newDayNumber = 100 + daysDiff - 1; // e.g., 1 day after = 100, 2 days after = 101
    }

    // Add the new entry
    const newEntry: ItineraryEntry = {
      dayNumber: newDayNumber,
      date: selectedDate,
      locationName: '',
      arrivalTime: '',
      departureTime: '',
      allAboardTime: '',
      description: '',
      imageUrl: '',
    };

    addItineraryEntry(newEntry);

    // Reset modal first
    setShowAddDayModal(false);
    setSelectedDate('');
    const typeToScroll = addDayType;
    setAddDayType(null);

    // Scroll to the appropriate position after adding
    setTimeout(() => {
      if (entriesContainerRef.current) {
        if (typeToScroll === 'before') {
          // Scroll to top for pre-trip days
          entriesContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Scroll to bottom for post-trip days
          entriesContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }
    }, 150);
  };

  const getMinMaxDates = () => {
    if (!state.tripData.startDate || !state.tripData.endDate || !addDayType) {
      return { minDate: undefined, maxDate: undefined };
    }

    // Parse dates in local timezone to avoid UTC conversion
    const startDate = parseDateString(state.tripData.startDate);
    const endDate = parseDateString(state.tripData.endDate);

    if (addDayType === 'before') {
      // Allow dates up to one day before trip start
      const maxDate = new Date(startDate);
      maxDate.setDate(maxDate.getDate() - 1);
      return { minDate: undefined, maxDate };
    } else {
      // Allow dates starting one day after trip end
      const minDate = new Date(endDate);
      minDate.setDate(minDate.getDate() + 1);
      return { minDate, maxDate: undefined };
    }
  };

  if (!state.itineraryEntries.length) {
    return (
      <div className="space-y-2.5 max-w-3xl mx-auto">
        <div className="p-4 rounded-lg bg-cyan-400/5 border border-cyan-400/20 text-center space-y-3">
          <p className="text-sm text-white/70">
            No itinerary entries found. Please ensure trip dates are set on the Basic Info page.
          </p>
          <Button
            type="button"
            onClick={() => setShowAddDayModal(true)}
            className="flex items-center gap-1.5 h-8 px-3 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-xs font-semibold hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all mx-auto"
          >
            <Plus className="w-3 h-3" />
            <span>Add Day</span>
          </Button>
        </div>
      </div>
    );
  }

  // Get current entry being viewed (sortedEntries comes from context)
  const currentEntry = sortedEntries[selectedDayIndex];
  const currentIndex = currentEntry
    ? state.itineraryEntries.findIndex(
        e => e.date === currentEntry.date && e.dayNumber === currentEntry.dayNumber
      )
    : -1;

  return (
    <div className="space-y-2.5 max-w-3xl mx-auto pt-2" ref={entriesContainerRef}>
      {/* Day Navigation Controls */}
      {totalDays > 0 && (
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
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
            <button
              type="button"
              onClick={() => setShowAddDayModal(true)}
              className="flex items-center justify-center h-7 w-7 min-w-[28px] p-0 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all ml-2"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Current Day Content */}
      {currentEntry && currentIndex >= 0 && (
        <>
          {/* Date and Port Subheader */}
          <div className="flex items-center gap-2 pb-1">
            <p className="text-sm text-white/70">
              <span className="font-semibold text-cyan-400">
                {currentEntry.dayNumber < 1
                  ? 'Pre-Trip'
                  : currentEntry.dayNumber >= 100
                    ? 'Post-Trip'
                    : `Day ${currentEntry.dayNumber}`}
              </span>
              {' — '}
              {formatDate(currentEntry.date)}
              {currentEntry.locationName && (
                <span className="text-cyan-400"> — {currentEntry.locationName}</span>
              )}
            </p>
            {selectedLocation && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleEditLocation}
                className="h-6 px-2 text-xs text-white/50 hover:text-cyan-400 hover:bg-white/5"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit Location
              </Button>
            )}
          </div>

          {/* Location and Type Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Port/Location - Using StandardDropdown with search-add */}
            <StandardDropdown
              variant="single-search-add"
              label="Port/Location"
              placeholder="Search or add location..."
              emptyMessage="No locations found. Type to add new."
              options={locationOptions}
              value={currentEntry.locationId?.toString() || ''}
              onChange={value => handleLocationChange(currentIndex, value as string)}
              onOpenCreateModal={handleOpenCreateLocationModal}
              disabled={locationsLoading}
            />

            {/* Location Type */}
            <StandardDropdown
              variant="single-search"
              label="Location Type"
              placeholder="Select type..."
              emptyMessage="No location types found."
              options={locationTypes.map(type => ({
                value: type.id.toString(),
                label: type.type,
              }))}
              value={currentEntry.locationTypeId?.toString() || ''}
              onChange={value =>
                updateItineraryEntry(currentIndex, { locationTypeId: Number(value) })
              }
            />
          </div>

          {/* Times Section */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              Schedule
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-white/90">Arrival</Label>
                <TimePicker
                  value={currentEntry.arrivalTime || ''}
                  onChange={value => handleTimeChange(currentIndex, 'arrivalTime', value)}
                  placeholder="--:--"
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-white/90">Departure</Label>
                <TimePicker
                  value={currentEntry.departureTime || ''}
                  onChange={value => handleTimeChange(currentIndex, 'departureTime', value)}
                  placeholder="--:--"
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-white/90">All Aboard</Label>
                <TimePicker
                  value={currentEntry.allAboardTime || ''}
                  onChange={value => handleTimeChange(currentIndex, 'allAboardTime', value)}
                  placeholder="--:--"
                  className="h-11"
                />
              </div>
            </div>
          </div>

          {/* Image and Description Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Port Image */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                Port Image
              </Label>
              <ImageUploadField
                label=""
                value={currentEntry.imageUrl || ''}
                onChange={url => handleImageUpload(currentIndex, url || '')}
                imageType="locations"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                Description
              </Label>
              <Textarea
                placeholder="Port highlights, activities, or notes..."
                value={currentEntry.description || ''}
                onChange={e => handleDescriptionChange(currentIndex, e.target.value)}
                rows={4}
                className="px-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm leading-relaxed transition-all resize-none focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:ring-2 focus:ring-cyan-400/10"
              />
              <p className="text-xs text-white/40">
                * Displays on the itinerary card. Leave empty to show none.
              </p>
            </div>
          </div>

          {/* Location Details Section - Attractions & LGBT Venues */}
          {selectedLocation && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                  Location Details
                </Label>
                <span className="text-xs text-white/40">({selectedLocation.name})</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Attractions Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-white/90">Top Attractions</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAttractionsModal(true)}
                      className="h-6 px-2 text-xs text-white/50 hover:text-cyan-400 hover:bg-white/5"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Manage
                    </Button>
                  </div>
                  <LocationAttractionsPreview locationId={selectedLocation.id} />
                </div>

                {/* LGBT Venues Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-pink-400" />
                      <span className="text-sm font-medium text-white/90">LGBTQ+ Venues</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLGBTVenuesModal(true)}
                      className="h-6 px-2 text-xs text-white/50 hover:text-cyan-400 hover:bg-white/5"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Manage
                    </Button>
                  </div>
                  <LocationLGBTVenuesPreview locationId={selectedLocation.id} />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Day Modal */}
      <AdminBottomSheet
        isOpen={showAddDayModal}
        onOpenChange={setShowAddDayModal}
        title="Add Additional Day"
        description="Add a day before or after your cruise"
        icon={<Anchor className="w-5 h-5 text-cyan-400" />}
        primaryAction={{
          label: 'Add Day',
          onClick: handleAddDay,
          disabled: !selectedDate || !addDayType,
        }}
        maxWidthClassName="max-w-md"
      >
        <div className="space-y-4">
          {/* Day Type Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-white/90">When is this day?</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAddDayType('before')}
                className={`flex-1 h-10 px-3 rounded-[10px] text-sm font-medium transition-all ${
                  addDayType === 'before'
                    ? 'bg-cyan-400/20 border-[1.5px] border-cyan-400/60 text-cyan-400'
                    : 'bg-white/[0.04] border-[1.5px] border-white/8 text-white/70 hover:bg-white/[0.06] hover:border-white/10'
                }`}
              >
                Before Trip
              </button>
              <button
                type="button"
                onClick={() => setAddDayType('after')}
                className={`flex-1 h-10 px-3 rounded-[10px] text-sm font-medium transition-all ${
                  addDayType === 'after'
                    ? 'bg-cyan-400/20 border-[1.5px] border-cyan-400/60 text-cyan-400'
                    : 'bg-white/[0.04] border-[1.5px] border-white/8 text-white/70 hover:bg-white/[0.06] hover:border-white/10'
                }`}
              >
                After Trip
              </button>
            </div>
            <p className="text-[10px] text-white/50 mt-0.5">
              {addDayType === 'before'
                ? 'Select a date before your cruise starts'
                : addDayType === 'after'
                  ? 'Select a date after your cruise ends'
                  : 'Choose whether this day is before or after the main cruise dates'}
            </p>
          </div>

          {/* Date Selection */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-white/90">Date</Label>
            <DatePicker
              value={selectedDate}
              onChange={date => {
                if (date) {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  setSelectedDate(`${year}-${month}-${day}`);
                } else {
                  setSelectedDate('');
                }
              }}
              placeholder="Select date"
              disabled={!addDayType}
              disabledDates={date => {
                // Check if this date already exists in itinerary entries
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;
                return state.itineraryEntries.some(entry => entry.date === dateString);
              }}
              {...(addDayType === 'before'
                ? { toDate: getMinMaxDates().maxDate }
                : addDayType === 'after'
                  ? { fromDate: getMinMaxDates().minDate }
                  : {})}
            />
            {!addDayType && (
              <p className="text-[10px] text-white/50 mt-0.5">
                Please select when this day occurs first
              </p>
            )}
          </div>
        </div>
      </AdminBottomSheet>

      {/* Create Location Modal - using the reusable LocationFormModal */}
      <LocationFormModal
        isOpen={showCreateLocationModal}
        onOpenChange={setShowCreateLocationModal}
        onSuccess={handleLocationCreated}
      />

      {/* Edit Location Modal */}
      {selectedLocation && (
        <LocationFormModal
          isOpen={showEditLocationModal}
          onOpenChange={setShowEditLocationModal}
          editingLocation={selectedLocation}
          onSuccess={handleLocationUpdated}
        />
      )}

      {/* Attractions Modal */}
      {selectedLocation && (
        <LocationAttractionsModal
          isOpen={showAttractionsModal}
          onOpenChange={setShowAttractionsModal}
          locationId={selectedLocation.id}
          locationName={selectedLocation.name}
        />
      )}

      {/* LGBT Venues Modal */}
      {selectedLocation && (
        <LocationLGBTVenuesModal
          isOpen={showLGBTVenuesModal}
          onOpenChange={setShowLGBTVenuesModal}
          locationId={selectedLocation.id}
          locationName={selectedLocation.name}
        />
      )}
    </div>
  );
}
