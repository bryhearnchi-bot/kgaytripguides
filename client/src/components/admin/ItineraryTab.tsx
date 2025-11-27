import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StandardDropdown } from '@/components/ui/dropdowns';
import { PillDropdown } from '@/components/ui/dropdowns/PillDropdown';
import { TimePicker } from '@/components/ui/time-picker';
import { DatePicker } from '@/components/ui/date-picker';
import { AdminBottomSheet } from '@/components/admin/AdminBottomSheet';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { useLocations } from '@/contexts/LocationsContext';
import { Plus, ChevronLeft, ChevronRight, MapPin, Anchor, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

interface ItineraryDay {
  id?: number;
  date: string;
  day: number;
  portName: string;
  locationId?: number;
  country?: string;
  arrivalTime?: string;
  departureTime?: string;
  allAboardTime?: string;
  portImageUrl?: string;
  segment: 'pre' | 'main' | 'post';
  description?: string;
  orderIndex: number;
}

interface ItineraryTabProps {
  trip?: any;
  isEditing: boolean;
}

export default function ItineraryTab({ trip, isEditing }: ItineraryTabProps) {
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [addDayType, setAddDayType] = useState<'before' | 'after' | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const queryClient = useQueryClient();

  // Use shared locations context
  const { locations, loading: locationsLoading } = useLocations();

  // Fetch existing itinerary data
  const { data: existingItinerary, isLoading: itineraryLoading } = useQuery({
    queryKey: ['itinerary', trip?.id],
    queryFn: async () => {
      if (!trip?.id) return [];
      const response = await fetch(`/api/trips/${trip.id}/itinerary`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch itinerary');
      return response.json();
    },
    enabled: !!trip?.id && isEditing,
  });

  // Load existing itinerary data
  useEffect(() => {
    if (existingItinerary) {
      const mappedDays = existingItinerary.map((day: any) => {
        return {
          id: day.id,
          date: day.date ? (day.date.includes('T') ? day.date.split('T')[0] : day.date) : '',
          day: day.day,
          portName: day.locationName || day.portName || '',
          locationId: day.locationId,
          country: day.country || '',
          arrivalTime: day.arrivalTime || '',
          departureTime: day.departureTime || '',
          allAboardTime: day.allAboardTime || '',
          portImageUrl: day.portImageUrl || '',
          segment: day.segment || 'main',
          description: day.description || '',
          orderIndex: day.orderIndex || 0,
        };
      });
      setItineraryDays(mappedDays);
    }
  }, [existingItinerary]);

  // Build location options for StandardDropdown
  const locationOptions = useMemo(() => {
    return locations.map(loc => ({
      value: loc.id.toString(),
      label: loc.name,
      description: [loc.city, loc.country].filter(Boolean).join(', '),
    }));
  }, [locations]);

  // Update itinerary day mutation
  const updateItineraryMutation = useMutation({
    mutationFn: async (dayData: ItineraryDay) => {
      if (!dayData.id) throw new Error('No day ID');
      const response = await fetch(`/api/itinerary/${dayData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...dayData,
          date: dayData.date || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to update itinerary day');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', trip?.id] });
      toast.success('Success', { description: 'Itinerary day updated successfully' });
    },
    onError: () => {
      toast.error('Error', {
        description: 'Failed to update itinerary day. Please try again.',
      });
    },
  });

  // Create itinerary day mutation
  const createItineraryMutation = useMutation({
    mutationFn: async (dayData: Partial<ItineraryDay>) => {
      if (!trip?.id) throw new Error('No trip ID');
      const response = await fetch(`/api/trips/${trip.id}/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...dayData,
          date: dayData.date || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to create itinerary day');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary', trip?.id] });
      toast.success('Success', { description: 'Itinerary day added successfully' });
      setShowAddDayModal(false);
      setSelectedDate('');
      setAddDayType(null);
    },
    onError: () => {
      toast.error('Error', {
        description: 'Failed to add itinerary day. Please try again.',
      });
    },
  });

  // Sort entries by day number for display
  const sortedDays = useMemo(() => {
    return [...itineraryDays].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [itineraryDays]);

  // Build day options for PillDropdown navigation
  const dayOptions = useMemo(() => {
    return sortedDays.map((day, idx) => {
      const dayLabel =
        day.segment === 'pre'
          ? 'Pre-Trip'
          : day.segment === 'post'
            ? 'Post-Trip'
            : `Day ${day.day}`;
      const locationLabel = day.portName ? ` - ${day.portName}` : '';
      return {
        value: idx.toString(),
        label: `${dayLabel}${locationLabel}`,
        shortLabel: dayLabel,
      };
    });
  }, [sortedDays]);

  // Get current day being viewed
  const currentDay = sortedDays[selectedDayIndex];

  // Navigation handlers
  const goToPreviousDay = () => {
    if (selectedDayIndex > 0) {
      setSelectedDayIndex(selectedDayIndex - 1);
    }
  };

  const goToNextDay = () => {
    if (selectedDayIndex < sortedDays.length - 1) {
      setSelectedDayIndex(selectedDayIndex + 1);
    }
  };

  // Handle location change from dropdown
  const handleLocationChange = (locationIdStr: string) => {
    if (!currentDay) return;

    const locationId = locationIdStr ? parseInt(locationIdStr, 10) : undefined;
    const location = locations.find(loc => loc.id === locationId);

    const updatedDay = {
      ...currentDay,
      locationId,
      portName: location?.name || '',
      country: location?.country || '',
    };

    // Update local state
    setItineraryDays(prev => prev.map(day => (day.id === currentDay.id ? updatedDay : day)));

    // Save to server if it has an ID
    if (currentDay.id) {
      updateItineraryMutation.mutate(updatedDay);
    }
  };

  // Handle creating a new location from the dropdown
  const handleCreateLocation = async (newLocationName: string) => {
    const response = await api.post('/api/locations', {
      name: newLocationName,
      country: '',
    });
    if (!response.ok) {
      throw new Error('Failed to create location');
    }
    const newLocation = await response.json();

    // Update the current day with the new location
    if (currentDay) {
      const updatedDay = {
        ...currentDay,
        locationId: newLocation.id,
        portName: newLocation.name,
      };

      setItineraryDays(prev => prev.map(day => (day.id === currentDay.id ? updatedDay : day)));

      if (currentDay.id) {
        updateItineraryMutation.mutate(updatedDay);
      }
    }

    return { value: newLocation.id.toString(), label: newLocation.name };
  };

  // Handle field updates
  const updateDayField = (field: keyof ItineraryDay, value: any) => {
    if (!currentDay) return;

    const updatedDay = { ...currentDay, [field]: value };

    // Update local state
    setItineraryDays(prev => prev.map(day => (day.id === currentDay.id ? updatedDay : day)));

    // Debounced save to server (for text fields)
    if (
      currentDay.id &&
      ['arrivalTime', 'departureTime', 'allAboardTime', 'description', 'portImageUrl'].includes(
        field
      )
    ) {
      updateItineraryMutation.mutate(updatedDay);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date set';
    const parts = dateString.split('-');
    const year = Number(parts[0] || 2025);
    const month = Number(parts[1] || 1);
    const day = Number(parts[2] || 1);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle adding a new day
  const handleAddDay = () => {
    if (!selectedDate || !addDayType) return;

    // Check for duplicate date
    const dateExists = itineraryDays.some(day => day.date === selectedDate);
    if (dateExists) {
      toast.error('Error', { description: 'This date has already been added to the itinerary.' });
      return;
    }

    const newDay: Partial<ItineraryDay> = {
      date: selectedDate,
      day: sortedDays.length + 1,
      portName: '',
      segment: addDayType === 'before' ? 'pre' : addDayType === 'after' ? 'post' : 'main',
      orderIndex: addDayType === 'before' ? -1 : sortedDays.length,
    };

    createItineraryMutation.mutate(newDay);
  };

  if (itineraryLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <MapPin className="w-8 h-8 animate-pulse text-cyan-400" />
        <span className="ml-2 text-white/70">Loading itinerary...</span>
      </div>
    );
  }

  if (!trip?.id) {
    return (
      <div className="text-center py-8">
        <MapPin className="w-12 h-12 mx-auto mb-4 text-white/30" />
        <h3 className="text-lg font-medium text-white mb-2">Trip Required</h3>
        <p className="text-white/60">
          Please create the trip details first before adding itinerary stops.
        </p>
      </div>
    );
  }

  if (itineraryDays.length === 0) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="text-center py-8 rounded-xl border border-white/10 bg-white/[0.02]">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-white/30" />
          <h3 className="text-lg font-medium text-white mb-2">No itinerary stops</h3>
          <p className="text-white/60 mb-4">
            Start building your trip itinerary by adding port stops.
          </p>
          <Button
            onClick={() => setShowAddDayModal(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Stop
          </Button>
        </div>

        {/* Add Day Modal */}
        <AddDayModal
          isOpen={showAddDayModal}
          onOpenChange={setShowAddDayModal}
          addDayType={addDayType}
          setAddDayType={setAddDayType}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          onAddDay={handleAddDay}
          trip={trip}
          existingDates={itineraryDays.map(d => d.date)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Day Navigation Bar */}
      <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
        {/* Left side: Day navigation controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousDay}
            disabled={selectedDayIndex === 0}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-white/70" />
          </button>

          <PillDropdown
            options={dayOptions}
            value={selectedDayIndex.toString()}
            onChange={value => setSelectedDayIndex(parseInt(value, 10))}
            placeholder="Select Day"
            className="min-w-[140px]"
          />

          <button
            type="button"
            onClick={goToNextDay}
            disabled={selectedDayIndex === sortedDays.length - 1}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4 text-white/70" />
          </button>

          {/* Day counter badge */}
          <span className="text-xs text-white/40 hidden sm:inline">
            {selectedDayIndex + 1} of {sortedDays.length}
          </span>
        </div>

        {/* Right side: Add Day Button */}
        <Button
          type="button"
          onClick={() => setShowAddDayModal(true)}
          className="flex items-center gap-1.5 h-8 px-3 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-xs font-semibold hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Day</span>
        </Button>
      </div>

      {/* Current Day Card */}
      {currentDay && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
          {/* Day Header Banner */}
          <div className="px-5 py-4 bg-gradient-to-r from-cyan-500/10 to-transparent border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/20 flex items-center justify-center">
                  <Anchor className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {currentDay.segment === 'pre'
                      ? 'Pre-Trip Day'
                      : currentDay.segment === 'post'
                        ? 'Post-Trip Day'
                        : `Day ${currentDay.day}`}
                  </h3>
                  <p className="text-xs text-white/60">{formatDate(currentDay.date)}</p>
                </div>
              </div>
              {currentDay.portName && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-medium text-white">{currentDay.portName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Day Content */}
          <div className="p-5 space-y-5">
            {/* Location Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Port/Location - Using StandardDropdown with search-add */}
              <StandardDropdown
                variant="single-search-add"
                label="Port/Location"
                placeholder="Search or add location..."
                emptyMessage="No locations found. Type to add new."
                options={locationOptions}
                value={currentDay.locationId?.toString() || ''}
                onChange={value => handleLocationChange(value as string)}
                onCreateNew={handleCreateLocation}
                disabled={locationsLoading}
              />

              {/* Country (read-only, populated from location) */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                  Country
                </Label>
                <div className="h-11 px-3 flex items-center bg-white/[0.02] border border-white/10 rounded-xl text-white/60 text-sm">
                  {currentDay.country || 'Auto-filled from location'}
                </div>
              </div>
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
                    value={currentDay.arrivalTime || ''}
                    onChange={value => updateDayField('arrivalTime', value)}
                    placeholder="--:--"
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-white/90">Departure</Label>
                  <TimePicker
                    value={currentDay.departureTime || ''}
                    onChange={value => updateDayField('departureTime', value)}
                    placeholder="--:--"
                    className="h-11"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-white/90">All Aboard</Label>
                  <TimePicker
                    value={currentDay.allAboardTime || ''}
                    onChange={value => updateDayField('allAboardTime', value)}
                    placeholder="--:--"
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            {/* Image and Description Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Port Image */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                  Port Image
                </Label>
                <ImageUploadField
                  label=""
                  value={currentDay.portImageUrl || ''}
                  onChange={url => updateDayField('portImageUrl', url || '')}
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
                  value={currentDay.description || ''}
                  onChange={e => updateDayField('description', e.target.value)}
                  rows={4}
                  className="px-3 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm leading-relaxed transition-all resize-none focus:outline-none focus:border-cyan-400/60 focus:bg-cyan-400/[0.03] focus:ring-2 focus:ring-cyan-400/10"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Day Modal */}
      <AddDayModal
        isOpen={showAddDayModal}
        onOpenChange={setShowAddDayModal}
        addDayType={addDayType}
        setAddDayType={setAddDayType}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onAddDay={handleAddDay}
        trip={trip}
        existingDates={itineraryDays.map(d => d.date)}
      />
    </div>
  );
}

// Add Day Modal Component
interface AddDayModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  addDayType: 'before' | 'after' | null;
  setAddDayType: (type: 'before' | 'after' | null) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onAddDay: () => void;
  trip: any;
  existingDates: string[];
}

function AddDayModal({
  isOpen,
  onOpenChange,
  addDayType,
  setAddDayType,
  selectedDate,
  setSelectedDate,
  onAddDay,
  trip,
  existingDates,
}: AddDayModalProps) {
  // Helper to parse date string in local timezone
  const parseDateString = (dateStr: string): Date => {
    const parts = dateStr.split('-');
    const year = Number(parts[0] || 2025);
    const month = Number(parts[1] || 1);
    const day = Number(parts[2] || 1);
    return new Date(year, month - 1, day);
  };

  const getMinMaxDates = () => {
    if (!trip?.startDate || !trip?.endDate || !addDayType) {
      return { minDate: undefined, maxDate: undefined };
    }

    const startDate = parseDateString(trip.startDate);
    const endDate = parseDateString(trip.endDate);

    if (addDayType === 'before') {
      const maxDate = new Date(startDate);
      maxDate.setDate(maxDate.getDate() - 1);
      return { minDate: undefined, maxDate };
    } else {
      const minDate = new Date(endDate);
      minDate.setDate(minDate.getDate() + 1);
      return { minDate, maxDate: undefined };
    }
  };

  return (
    <AdminBottomSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Add Additional Day"
      description="Add a day before or after your cruise"
      icon={<Anchor className="w-5 h-5 text-cyan-400" />}
      primaryAction={{
        label: 'Add Day',
        onClick: onAddDay,
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
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const dateString = `${year}-${month}-${day}`;
              return existingDates.includes(dateString);
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
  );
}
