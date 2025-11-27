import { useEffect, useState, useRef, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { TimePicker } from '@/components/ui/time-picker';
import { StandardDropdown } from '@/components/ui/dropdowns';
import { DatePicker } from '@/components/ui/date-picker';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { useTripWizard } from '@/contexts/TripWizardContext';
import type { ItineraryEntry } from '@/contexts/TripWizardContext';
import { useLocations } from '@/contexts/LocationsContext';
import { useItineraryNavigation } from '@/contexts/ItineraryNavigationContext';
import { Anchor } from 'lucide-react';
import { api } from '@/lib/api-client';

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
  const entriesContainerRef = useRef<HTMLDivElement>(null);

  // Use shared navigation context (state is in EditTripModal's header)
  const { selectedDayIndex, showAddDayModal, setShowAddDayModal, sortedEntries } =
    useItineraryNavigation();

  // Use shared locations context
  const { locations, loading: locationsLoading } = useLocations();

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

  // Handle creating a new location from the dropdown
  // Note: We need a closure to capture the current index
  const createLocationHandler = (index: number) => async (newLocationName: string) => {
    const response = await api.post('/api/locations', {
      name: newLocationName,
      country: '',
    });
    if (!response.ok) {
      throw new Error('Failed to create location');
    }
    const newLocation = await response.json();
    updateItineraryEntry(index, {
      locationId: newLocation.id,
      locationName: newLocation.name,
    });
    return { value: newLocation.id.toString(), label: newLocation.name };
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
        <div className="p-4 rounded-lg bg-cyan-400/5 border border-cyan-400/20 text-center">
          <p className="text-sm text-white/70">
            No itinerary entries found. Please ensure trip dates are set on the Basic Info page.
          </p>
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
      {/* Current Day Content */}
      {currentEntry && currentIndex >= 0 && (
        <>
          {/* Date and Port Subheader */}
          <p className="text-sm text-white/70 pb-1">
            {formatDate(currentEntry.date)}
            {currentEntry.locationName && (
              <span className="text-cyan-400"> — {currentEntry.locationName}</span>
            )}
          </p>

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
              onCreateNew={createLocationHandler(currentIndex)}
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
            </div>
          </div>
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
    </div>
  );
}
