import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  PartyPopper,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { OceanInput } from '@/components/ui/ocean-input';
import { OceanTextarea } from '@/components/ui/ocean-textarea';
import { SingleDropDownNew } from '@/components/ui/single-drop-down-new';
import { TimePicker } from '@/components/ui/time-picker';
import { TripDayDropdown } from './TripDayDropdown';
import { VenueDropdown } from './VenueDropdown';
import { TalentSelector } from './TalentSelector';
import { PartyThemeSelector } from './PartyThemeSelector';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { api } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

const eventSchema = z.object({
  tripId: z.number(),
  date: z.string().min(1, 'Day is required'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  eventTypeId: z.number().min(1, 'Event type is required'),
  shipVenueId: z.number().nullable(),
  resortVenueId: z.number().nullable(),
  talentIds: z.array(z.number()).default([]),
  partyThemeId: z.number().nullable(),
  imageUrl: z
    .string()
    .optional()
    .transform(val => val || ''),
  description: z
    .string()
    .optional()
    .transform(val => val || ''),
});

type EventFormData = z.infer<typeof eventSchema>;

interface ScheduleEntry {
  dayNumber: number;
  date: string;
  imageUrl?: string;
  description?: string;
}

interface ItineraryEntry {
  dayNumber: number;
  date: string;
  portName?: string;
  locationType?: string;
  arrivalTime?: string;
  departureTime?: string;
  allAboardTime?: string;
  imageUrl?: string;
  description?: string;
}

interface EventType {
  id: number;
  name: string;
  description?: string;
  icon: string;
  color: string;
  displayOrder: number;
}

interface Event {
  id?: number;
  tripId: number;
  date: string;
  time: string;
  title: string;
  shipVenueId: number | null;
  resortVenueId: number | null;
  talentIds: number[];
  partyThemeId: number | null;
  eventTypeId: number;
  imageUrl?: string;
  description?: string;
}

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Event) => Promise<void>;
  tripId: number;
  tripType: 'resort' | 'cruise';
  shipId?: number | null;
  resortId?: number | null;
  scheduleEntries: ScheduleEntry[];
  itineraryEntries: ItineraryEntry[];
  editingEvent?: Event;
}

export function EventFormModal({
  isOpen,
  onClose,
  onSave,
  tripId,
  tripType,
  shipId,
  resortId,
  scheduleEntries,
  itineraryEntries,
  editingEvent,
}: EventFormModalProps) {
  const [saving, setSaving] = useState(false);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [formData, setFormData] = useState<EventFormData>({
    tripId,
    date: '',
    time: '',
    title: '',
    eventTypeId: 0,
    shipVenueId: null,
    resortVenueId: null,
    talentIds: [],
    partyThemeId: null,
    imageUrl: '',
    description: '',
  });

  // Load event types
  useEffect(() => {
    fetchEventTypes();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (editingEvent) {
      setFormData({
        tripId: editingEvent.tripId,
        date: editingEvent.date,
        time: editingEvent.time,
        title: editingEvent.title,
        eventTypeId: editingEvent.eventTypeId,
        shipVenueId: editingEvent.shipVenueId,
        resortVenueId: editingEvent.resortVenueId,
        talentIds: editingEvent.talentIds || [],
        partyThemeId: editingEvent.partyThemeId,
        imageUrl: editingEvent.imageUrl || '',
        description: editingEvent.description || '',
      });
    } else {
      // Reset form for new event
      setFormData({
        tripId,
        date: '',
        time: '',
        title: '',
        eventTypeId: 0,
        shipVenueId: null,
        resortVenueId: null,
        talentIds: [],
        partyThemeId: null,
        imageUrl: '',
        description: '',
      });
    }
  }, [editingEvent, tripId, isOpen]);

  const fetchEventTypes = async () => {
    try {
      const response = await api.get('/api/admin/event-types');
      const data = await response.json();
      setEventTypes(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load event types',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    try {
      // Validate
      const validated = eventSchema.parse(formData);

      setSaving(true);
      await onSave({
        ...validated,
        id: editingEvent?.id,
      });

      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          title: 'Validation Error',
          description: firstError?.message || 'Validation failed',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save event',
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Build event type dropdown options
  const eventTypeOptions = eventTypes
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(type => ({
      value: String(type.id),
      label: type.name,
    }));

  // Check if party theme should be visible
  const isPartyEvent =
    eventTypes.find(t => t.id === formData.eventTypeId)?.name.toLowerCase() === 'party';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="admin-form-modal sm:max-w-2xl border-white/10 bg-gradient-to-b from-[#10192f] to-[#0f1629] rounded-[20px] text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Day Selector */}
          <TripDayDropdown
            tripType={tripType}
            scheduleEntries={scheduleEntries}
            itineraryEntries={itineraryEntries}
            value={formData.date}
            onChange={date => setFormData({ ...formData, date })}
            required
            label="Day"
          />

          {/* Event Title */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/90">
              Event Title <span className="text-cyan-400">*</span>
            </label>
            <OceanInput
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., White Party, Drag Show, Welcome Reception"
              className="h-10"
            />
          </div>

          {/* Event Type */}
          <SingleDropDownNew
            label="Event Type"
            placeholder="Select event type"
            emptyMessage="No event types found"
            options={eventTypeOptions}
            value={String(formData.eventTypeId || '')}
            onChange={val => setFormData({ ...formData, eventTypeId: parseInt(val) })}
            required
          />

          {/* Time */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/90">
              Time (24-hour format) <span className="text-cyan-400">*</span>
            </label>
            <TimePicker
              value={formData.time}
              onChange={time => setFormData({ ...formData, time })}
              placeholder="Select event time"
              required
            />
            <p className="text-[10px] text-white/50">
              Example: 14:00 for 2:00 PM, 23:30 for 11:30 PM
            </p>
          </div>
          {/* Venue Selector */}
          <VenueDropdown
            tripType={tripType}
            shipId={shipId}
            resortId={resortId}
            value={tripType === 'cruise' ? formData.shipVenueId : formData.resortVenueId}
            onChange={venueId => {
              if (tripType === 'cruise') {
                setFormData({ ...formData, shipVenueId: venueId, resortVenueId: null });
              } else {
                setFormData({ ...formData, resortVenueId: venueId, shipVenueId: null });
              }
            }}
            label="Venue"
          />

          {/* Talent Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/90">Talent (Optional)</label>
            <TalentSelector
              tripId={tripId}
              selectedIds={formData.talentIds}
              onSelectionChange={ids => setFormData({ ...formData, talentIds: ids })}
              menuVariant="compact"
            />
            <p className="text-[10px] text-white/50">Select talent performing at this event</p>
          </div>

          {/* Party Theme (only for party events) */}
          {isPartyEvent && (
            <PartyThemeSelector
              value={formData.partyThemeId}
              onChange={themeId => setFormData({ ...formData, partyThemeId: themeId })}
              label="Party Theme (Optional)"
            />
          )}

          {/* Image Upload */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/90">Event Image (Optional)</label>
            <ImageUploadField
              value={formData.imageUrl || ''}
              onChange={url => setFormData({ ...formData, imageUrl: url || '' })}
              imageType="general"
              label=""
              placeholder="Event flyer or promotional image"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/90">Description (Optional)</label>
            <OceanTextarea
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Event description, special instructions, dress code..."
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 px-4 bg-white/4 border-[1.5px] border-white/10 text-white/90 hover:bg-white/10 hover:text-white transition-all"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-medium transition-colors"
          >
            {saving ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
