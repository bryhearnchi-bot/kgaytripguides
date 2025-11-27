import { useState, useEffect } from 'react';
import { Calendar, Pencil, Trash2, MapPin, Users, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EventFormModal } from './EventFormModal';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { useEventsNavigation } from '@/contexts/EventsNavigationContext';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';

interface Event {
  id?: number;
  tripId: number;
  date: string;
  time: string;
  title: string;
  shipVenueId: number | null;
  resortVenueId: number | null;
  venueName?: string;
  talentIds: number[];
  talentNames?: string[];
  talentImages?: string[];
  partyThemeId: number | null;
  partyThemeName?: string;
  eventTypeId: number;
  eventTypeName?: string;
  eventTypeColor?: string;
  eventTypeIcon?: string;
  imageUrl?: string;
  description?: string;
}

export function EventsTabPage() {
  const { state, setTripTalent, addEvent, updateEvent, deleteEvent } = useTripWizard();
  const { currentDay, eventsForCurrentDay, showAddEventModal, setShowAddEventModal, totalDays } =
    useEventsNavigation();

  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);

  const tripType = state.tripType || (state.tripData.tripTypeId === 1 ? 'cruise' : 'resort');
  const scheduleEntries = state.scheduleEntries || [];
  const itineraryEntries = state.itineraryEntries || [];

  // Sync showAddEventModal from context to local modal state
  useEffect(() => {
    if (showAddEventModal) {
      setEditingEvent(undefined);
    }
  }, [showAddEventModal]);

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await deleteEvent(eventId);

      // Refresh trip talent list after deleting event (in case talent was auto-removed)
      if (state.tripData.id) {
        try {
          const response = await api.get(`/api/admin/trips/${state.tripData.id}/talent`);
          const talentData = await response.json();
          setTripTalent(talentData);
        } catch (error) {
          // Non-fatal - don't show error to user
        }
      }

      toast.success('Success', {
        description: 'Event deleted successfully',
      });
    } catch (error) {
      toast.error('Error', {
        description: 'Failed to delete event',
      });
    }
  };

  const handleSaveEvent = async (event: Event) => {
    try {
      if (event.id) {
        await updateEvent(event.id, event);
        toast.success('Success', {
          description: 'Event updated successfully',
        });
      } else {
        await addEvent(event);
        toast.success('Success', {
          description: 'Event created successfully',
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const handleCloseModal = () => {
    setShowAddEventModal(false);
    setEditingEvent(undefined);
  };

  // Format date for display (timezone-agnostic - no timezone conversions)
  const formatDate = (dateStr: string) => {
    const datePart = dateStr.split('T')[0] ?? dateStr;
    const parts = datePart.split('-');
    const year = Number(parts[0] ?? 2025);
    const month = Number(parts[1] ?? 1);
    const day = Number(parts[2] ?? 1);

    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time for display (24-hour to 12-hour)
  const formatTime = (time: string) => {
    const parts = time.split(':');
    const hoursStr = parts[0] || '0';
    const minutesStr = parts[1] || '0';
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Get event image with fallback logic
  const getEventImage = (event: Event): string | null => {
    if (event.imageUrl) {
      return event.imageUrl;
    }

    if (
      Array.isArray(event.talentIds) &&
      event.talentIds.length > 0 &&
      Array.isArray(event.talentImages) &&
      event.talentImages.length > 0
    ) {
      const [firstTalentImage] = event.talentImages;
      if (firstTalentImage) {
        return firstTalentImage;
      }
    }

    return null;
  };

  // Empty state when no days exist
  if (totalDays === 0) {
    return (
      <div className="space-y-2.5 max-w-3xl mx-auto pt-2">
        <div className="p-8 rounded-[10px] bg-white/[0.02] border-2 border-white/10 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-sm text-white/70 mb-1">No schedule days found</p>
          <p className="text-xs text-white/50">
            Please add itinerary days on the Itinerary tab first, or ensure trip dates are set.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 max-w-3xl mx-auto pt-2">
      {/* Current Day Header */}
      {currentDay && (
        <p className="text-sm text-white/70 pb-1">
          {formatDate(currentDay.date)}
          {currentDay.locationName && (
            <span className="text-cyan-400"> — {currentDay.locationName}</span>
          )}
        </p>
      )}

      {/* Events List for Current Day */}
      {eventsForCurrentDay.length === 0 ? (
        <div className="p-8 rounded-[10px] bg-white/[0.02] border-2 border-white/10 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-sm text-white/70 mb-1">No events for this day</p>
          <p className="text-xs text-white/50">
            Use the + button above to add an event for this day
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {eventsForCurrentDay.map((event, index) => {
            const eventImage = getEventImage(event);

            return (
              <div
                key={event.id || index}
                className="p-3 rounded-lg bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-cyan-400/40 transition-all relative"
              >
                <div className="flex items-start gap-3 pr-10">
                  {/* Event Thumbnail */}
                  {eventImage && (
                    <div className="flex-shrink-0">
                      <img
                        src={eventImage}
                        alt={event.title}
                        className="w-16 h-16 object-cover rounded-lg border border-white/10"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Event Details - Compact 3-line layout */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Line 1: Title + Type Badge */}
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white truncate">{event.title}</h3>
                      {event.eventTypeName && (
                        <div
                          className="px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0"
                          style={{
                            backgroundColor: event.eventTypeColor
                              ? `${event.eventTypeColor}20`
                              : 'rgba(34, 211, 238, 0.1)',
                            color: event.eventTypeColor || '#22d3ee',
                            border: `1px solid ${event.eventTypeColor ? `${event.eventTypeColor}40` : 'rgba(34, 211, 238, 0.2)'}`,
                          }}
                        >
                          {event.eventTypeName}
                        </div>
                      )}
                    </div>

                    {/* Line 2: Time */}
                    <div className="text-xs text-white/60">{formatTime(event.time)}</div>

                    {/* Line 3: Artist + Location */}
                    <div className="flex items-center gap-3 text-xs text-white/60">
                      {/* Artist */}
                      {event.talentNames && event.talentNames.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{event.talentNames.join(', ')}</span>
                        </div>
                      )}

                      {/* Location */}
                      {event.venueName && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{event.venueName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Three-dot Menu - Positioned absolutely to the right */}
                <div className="absolute right-3 top-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="border-white/10"
                      style={{
                        backgroundColor: 'rgba(0, 33, 71, 1)',
                        backgroundImage:
                          'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
                      }}
                    >
                      <DropdownMenuItem
                        onClick={() => handleEditEvent(event)}
                        className="text-white/70 hover:text-cyan-400 hover:bg-white/5 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (event.id) handleDeleteEvent(event.id);
                        }}
                        className="text-white/70 hover:text-red-400 hover:bg-white/5 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Form Modal */}
      <EventFormModal
        isOpen={showAddEventModal || !!editingEvent}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        tripId={state.tripData.id || 0}
        tripType={tripType as 'resort' | 'cruise'}
        shipId={state.shipId}
        resortId={state.resortId}
        scheduleEntries={scheduleEntries}
        itineraryEntries={itineraryEntries}
        editingEvent={editingEvent}
        defaultDate={currentDay?.date}
      />
    </div>
  );
}
