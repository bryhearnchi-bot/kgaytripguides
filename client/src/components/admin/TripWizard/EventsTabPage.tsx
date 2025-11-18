import { useState } from 'react';
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Users,
  PartyPopper,
  ChevronDown,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EventFormModal } from './EventFormModal';
import { useTripWizard } from '@/contexts/TripWizardContext';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
  const [openAccordionDate, setOpenAccordionDate] = useState<string | undefined>(undefined);

  // Ensure events is always an array
  const events = Array.isArray(state.events) ? state.events : [];
  const tripTalent = Array.isArray(state.tripTalent) ? state.tripTalent : [];
  const tripType = state.tripType || (state.tripData.tripTypeId === 1 ? 'cruise' : 'resort');
  const scheduleEntries = state.scheduleEntries || [];
  const itineraryEntries = state.itineraryEntries || [];

  const handleCreateEvent = () => {
    setEditingEvent(undefined);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEventModal(true);
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
        // When adding a new event, auto-open the accordion for that date
        setOpenAccordionDate(event.date);
        toast.success('Success', {
          description: 'Event created successfully',
        });
      }
    } catch (error) {
      throw error;
    }
  };

  // Sort events by date and time
  const sortedEvents = [...(events || [])].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  // Format date for display (timezone-agnostic - no timezone conversions)
  const formatDate = (dateStr: string) => {
    // Extract YYYY-MM-DD from string (may be "2025-10-12" or "2025-10-12T00:00:00")
    const datePart = dateStr.split('T')[0] ?? dateStr;
    const parts = datePart.split('-');
    const year = Number(parts[0] ?? 2025);
    const month = Number(parts[1] ?? 1);
    const day = Number(parts[2] ?? 1);

    // Create date in local timezone without any UTC conversion
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
  // Note: Backend already applies party theme fallback to imageUrl
  const getEventImage = (event: Event): string | null => {
    // Priority 1: Event's image (or party theme image if no event image - applied by backend)
    if (event.imageUrl) {
      return event.imageUrl;
    }

    // Priority 2: First talent's profile image (if any talent assigned)
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

  // Group events by day
  const groupEventsByDay = (events: Event[]) => {
    const grouped: { [date: string]: Event[] } = {};
    events.forEach(event => {
      const dateKey = event.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    // Sort each day's events by time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.time.localeCompare(b.time));
    });

    return grouped;
  };

  // Create grouped events
  const groupedEvents = groupEventsByDay(sortedEvents);

  return (
    <div className="space-y-2.5 max-w-3xl mx-auto">
      {/* Add Event Button */}
      <div className="flex justify-between items-center">
        <p className="text-xs text-white/70">
          Manage events for this trip including parties, shows, dining, and activities
        </p>
        <Button
          onClick={handleCreateEvent}
          className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Event
        </Button>
      </div>

      {/* Events List */}
      {sortedEvents.length === 0 ? (
        <div className="p-8 rounded-[10px] bg-white/[0.02] border-2 border-white/10 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-sm text-white/70 mb-1">No events added yet</p>
          <p className="text-xs text-white/50">Click "Add Event" to create your first event</p>
        </div>
      ) : (
        <Accordion
          type="single"
          collapsible
          value={openAccordionDate}
          onValueChange={setOpenAccordionDate}
          className="space-y-2.5"
        >
          {Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <AccordionItem
              key={date}
              value={date}
              className="border-2 border-white/10 rounded-[10px] bg-white/[0.02] overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:bg-white/[0.04] hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-sm font-semibold text-white">{formatDate(date)}</div>
                    <div className="text-[10px] text-white/50">
                      {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-0">
                <div className="space-y-2.5">
                  {dayEvents.map((event, index) => {
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
                              <h3 className="text-sm font-semibold text-white truncate">
                                {event.title}
                              </h3>
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
                                onClick={() => event.id && handleDeleteEvent(event.id)}
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
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Info Notice */}
      <div className="mt-4 p-3 rounded-lg bg-cyan-400/5 border border-cyan-400/20">
        <p className="text-[11px] text-white/70 leading-relaxed">
          <span className="font-semibold text-cyan-400">Note:</span> Events are automatically synced
          when you change trip dates. If you extend the trip, events remain on their assigned days.
          If you shorten the trip, events on removed days will need to be manually adjusted.
        </p>
      </div>

      {/* Event Form Modal */}
      <EventFormModal
        isOpen={showEventModal || !!editingEvent}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(undefined);
        }}
        onSave={handleSaveEvent}
        tripId={state.tripData.id || 0}
        tripType={tripType as 'resort' | 'cruise'}
        shipId={state.shipId}
        resortId={state.resortId}
        scheduleEntries={scheduleEntries}
        itineraryEntries={itineraryEntries}
        editingEvent={editingEvent}
      />
    </div>
  );
}
