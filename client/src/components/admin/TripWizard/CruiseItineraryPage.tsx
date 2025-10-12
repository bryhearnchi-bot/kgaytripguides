import { useEffect, useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { TimePicker } from '@/components/ui/time-picker';
import { LocationSelector } from '@/components/admin/LocationSelector';
import { SingleDropDownNew } from '@/components/ui/single-drop-down-new';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTripWizard } from '@/contexts/TripWizardContext';
import type { ItineraryEntry } from '@/contexts/TripWizardContext';
import { Anchor, Plus } from 'lucide-react';
import { api } from '@/lib/api-client';

interface LocationType {
  id: number;
  type: string;
}

export function CruiseItineraryPage() {
  const { state, setItineraryEntries, updateItineraryEntry, addItineraryEntry } = useTripWizard();
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [addDayType, setAddDayType] = useState<'before' | 'after' | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
  const [loadingLocationTypes, setLoadingLocationTypes] = useState(true);
  const entriesContainerRef = useRef<HTMLDivElement>(null);

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
        console.error('Error loading location types:', error);
      } finally {
        setLoadingLocationTypes(false);
      }
    };

    fetchLocationTypes();
  }, []);

  // Generate itinerary entries from trip dates if not already created
  // IMPORTANT: Don't generate blank entries in edit mode - the data is coming from restoreFromDraft
  useEffect(() => {
    console.log('🔍 CruiseItineraryPage - useEffect triggered:', {
      itineraryLength: state.itineraryEntries.length,
      startDate: state.tripData.startDate,
      endDate: state.tripData.endDate,
      isEditMode: state.isEditMode,
      willGenerate:
        state.itineraryEntries.length === 0 &&
        state.tripData.startDate &&
        state.tripData.endDate &&
        !state.isEditMode,
    });

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
      console.log('📝 CruiseItineraryPage - Generating blank entries for NEW trip creation');

      // Parse dates in local timezone to avoid UTC conversion issues
      const [startYear, startMonth, startDay] = state.tripData.startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = state.tripData.endDate.split('-').map(Number);

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

      console.log('📝 CruiseItineraryPage - Setting blank entries:', entries.length);
      setItineraryEntries(entries);
    } else {
      console.log(
        '✅ CruiseItineraryPage - Skipping generation, entries already exist or dates missing'
      );
    }
  }, [
    state.tripData.startDate,
    state.tripData.endDate,
    state.itineraryEntries.length,
    setItineraryEntries,
  ]);

  const formatDate = (dateString: string) => {
    // Parse in local timezone to avoid UTC conversion
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleLocationChange = async (index: number, locationId: number | null) => {
    // Update itinerary entry with location ID and fetch location name
    if (locationId === null) {
      updateItineraryEntry(index, { locationId: undefined, locationName: '' });
      return;
    }

    // Fetch location name from API
    try {
      const response = await api.get(`/api/locations/${locationId}`);
      if (response.ok) {
        const location = await response.json();
        // Update both locationId and locationName
        updateItineraryEntry(index, {
          locationId: locationId,
          locationName: location.name || '',
        });
      } else {
        // Fallback: just update locationId if fetch fails
        updateItineraryEntry(index, { locationId: locationId });
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      // Fallback: just update locationId if fetch fails
      updateItineraryEntry(index, { locationId: locationId });
    }
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
    const [year, month, day] = dateStr.split('-').map(Number);
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
      <div className="space-y-2.5">
        <div className="p-4 rounded-lg bg-cyan-400/5 border border-cyan-400/20 text-center">
          <p className="text-sm text-white/70">
            No itinerary entries found. Please ensure trip dates are set on the Basic Info page.
          </p>
        </div>
      </div>
    );
  }

  // Sort entries by day number for display (NOT date, to handle pre/post-trip days correctly)
  const sortedEntries = [...state.itineraryEntries].sort((a, b) => a.dayNumber - b.dayNumber);

  // DEBUG: Log what we're about to render
  console.log(
    '🎨 CruiseItineraryPage - About to render entries:',
    sortedEntries.map(e => ({
      dayNumber: e.dayNumber,
      date: e.date,
      locationId: e.locationId,
      locationName: e.locationName,
    }))
  );

  return (
    <div className="space-y-2.5" ref={entriesContainerRef}>
      {/* Itinerary Entries */}
      {sortedEntries.map(entry => {
        // CRITICAL FIX: Find the actual index in the state array, not the sorted array
        // This ensures we update the correct entry when user makes changes
        const index = state.itineraryEntries.findIndex(
          e => e.date === entry.date && e.dayNumber === entry.dayNumber
        );

        console.log(
          `🔍 Rendering entry - dayNumber: ${entry.dayNumber}, locationId: ${entry.locationId}, locationName: ${entry.locationName}, index: ${index}`
        );

        return (
          <div
            key={`${entry.date}-${entry.dayNumber}`}
            className="p-3 rounded-lg border border-white/10 bg-white/[0.02] transition-all hover:border-white/20"
          >
            {/* Day Header */}
            <div className="flex items-center gap-2 mb-2.5">
              <Anchor className="w-4 h-4 text-cyan-400" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-cyan-400">
                  {entry.dayNumber < 1
                    ? 'Pre-Trip'
                    : entry.dayNumber >= 100
                      ? 'Post-Trip'
                      : `Day ${entry.dayNumber}`}
                </span>
                {entry.locationName && (
                  <>
                    <span className="text-xs text-white/40">•</span>
                    <span className="text-xs font-semibold text-white">{entry.locationName}</span>
                  </>
                )}
                <span className="text-xs text-white/60">{formatDate(entry.date)}</span>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-2.5">
              {/* Location and Type Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Location */}
                <LocationSelector
                  label="Port/Location"
                  selectedId={entry.locationId ?? null}
                  onSelectionChange={locationId => handleLocationChange(index, locationId)}
                  placeholder="Select port or location..."
                  required
                  wizardMode={true}
                />

                {/* Location Type */}
                <SingleDropDownNew
                  label="Location Type"
                  placeholder="Select type"
                  emptyMessage="No location types found."
                  options={locationTypes.map(type => ({
                    value: type.id.toString(),
                    label: type.type,
                  }))}
                  value={entry.locationTypeId?.toString() || ''}
                  onChange={value => updateItineraryEntry(index, { locationTypeId: Number(value) })}
                  required
                />
              </div>

              {/* Times Grid */}
              <div className="grid grid-cols-3 gap-2">
                {/* Arrival Time */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-white/90">Arrival</Label>
                  <TimePicker
                    value={entry.arrivalTime || ''}
                    onChange={value => handleTimeChange(index, 'arrivalTime', value)}
                    placeholder="HH:MM"
                    className="h-10"
                  />
                  <p className="text-[10px] text-white/50 mt-0.5">24-hour format</p>
                </div>

                {/* Departure Time */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-white/90">Departure</Label>
                  <TimePicker
                    value={entry.departureTime || ''}
                    onChange={value => handleTimeChange(index, 'departureTime', value)}
                    placeholder="HH:MM"
                    className="h-10"
                  />
                  <p className="text-[10px] text-white/50 mt-0.5">24-hour format</p>
                </div>

                {/* All Aboard Time */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-white/90">All Aboard</Label>
                  <TimePicker
                    value={entry.allAboardTime || ''}
                    onChange={value => handleTimeChange(index, 'allAboardTime', value)}
                    placeholder="HH:MM"
                    className="h-10"
                  />
                  <p className="text-[10px] text-white/50 mt-0.5">24-hour format</p>
                </div>
              </div>

              {/* Image and Description Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Port Image */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-white/90">
                    Port Image (Optional)
                  </Label>
                  <ImageUploadField
                    label=""
                    value={entry.imageUrl || ''}
                    onChange={url => handleImageUpload(index, url || '')}
                    bucketName="trip-images"
                    folder="itineraries"
                  />
                  <p className="text-[10px] text-white/50 mt-0.5">Image of the port or location</p>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-white/90">
                    Description (Optional)
                  </Label>
                  <Textarea
                    placeholder="Enter port highlights or activities..."
                    value={entry.description || ''}
                    onChange={e => handleDescriptionChange(index, e.target.value)}
                    rows={3}
                    className="px-3 py-2 bg-white/[0.04] border-[1.5px] border-white/8 rounded-[10px] text-white text-sm leading-snug transition-all resize-vertical focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]"
                  />
                  <p className="text-[10px] text-white/50 mt-0.5">
                    Activities or highlights for this port
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Add Day Button */}
      <div className="flex justify-end mt-4">
        <Button
          type="button"
          onClick={() => setShowAddDayModal(true)}
          className="flex items-center gap-1.5 h-10 px-4 bg-cyan-400/10 border border-cyan-400/30 rounded-[10px] text-cyan-400 text-sm font-medium hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Day
        </Button>
      </div>

      {/* Info Notice */}
      <div className="mt-2.5 p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
        <p className="text-[11px] text-white/70 leading-relaxed">
          <span className="font-semibold text-cyan-400">AI Tip:</span> Add port locations, times,
          images, and descriptions for each day of the cruise. These will appear in the itinerary
          tab on the trip guide page.
        </p>
      </div>

      {/* Add Day Modal */}
      <Dialog open={showAddDayModal} onOpenChange={setShowAddDayModal}>
        <DialogContent className="bg-[#0a1628] border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">
              Add Additional Day
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
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

          <DialogFooter className="gap-2">
            <Button
              type="button"
              onClick={() => {
                setShowAddDayModal(false);
                setSelectedDate('');
                setAddDayType(null);
              }}
              className="h-10 px-4 bg-white/[0.04] border border-white/10 rounded-[10px] text-white text-sm hover:bg-white/[0.06] transition-all"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddDay}
              disabled={!selectedDate || !addDayType}
              className="h-10 px-4 bg-cyan-400/20 border border-cyan-400/40 rounded-[10px] text-cyan-400 text-sm font-medium hover:bg-cyan-400/30 hover:border-cyan-400/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Add Day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
