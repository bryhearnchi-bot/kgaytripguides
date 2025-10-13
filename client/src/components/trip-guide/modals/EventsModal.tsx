import React, { memo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { DailyEvent, Talent, ItineraryStop } from '@/data/trip-data';
import { findTalentInTitle } from '../utils/talentHelpers';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { formatTime } from '@/lib/timeFormat';
import { EventCard } from '../shared/EventCard';

interface EventsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDateEvents: DailyEvent[];
  selectedItineraryStop: { date: string; port: string; description?: string } | null;
  ITINERARY: ItineraryStop[];
  TALENT: Talent[];
  onTalentClick: (name: string) => void;
  onPartyClick: (party: DailyEvent) => void;
  onPartyThemeClick?: (partyTheme: any) => void;
  setCameFromEventsModal: (value: boolean) => void;
}

export const EventsModal = memo(function EventsModal({
  open,
  onOpenChange,
  selectedDateEvents,
  selectedItineraryStop,
  ITINERARY,
  TALENT,
  onTalentClick,
  onPartyClick,
  onPartyThemeClick,
  setCameFromEventsModal,
}: EventsModalProps) {
  const { timeFormat } = useTimeFormat();

  const handleTalentClick = useCallback(
    (name: string) => {
      setCameFromEventsModal(true);
      onTalentClick(name);
      onOpenChange(false); // Close events modal
    },
    [onTalentClick, setCameFromEventsModal, onOpenChange]
  );

  const handlePartyThemeClick = useCallback(
    (partyTheme: any) => {
      if (onPartyThemeClick) {
        setCameFromEventsModal(true);
        onPartyThemeClick(partyTheme);
        onOpenChange(false); // Close events modal
      }
    },
    [onPartyThemeClick, setCameFromEventsModal, onOpenChange]
  );

  // Get port description from itinerary (if available in extended type)
  const portDescription = selectedItineraryStop
    ? (ITINERARY.find(stop => stop.key === selectedItineraryStop.date) as any)?.description
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-3xl border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Events for {selectedItineraryStop?.port}</DialogTitle>
          <DialogDescription className="text-white/70">
            View scheduled events and activities for this port
          </DialogDescription>
        </DialogHeader>

        {/* Port Description */}
        {portDescription && (
          <div className="border-b border-white/10 pb-4 mb-4">
            <p className="text-white/80 text-sm leading-relaxed">{portDescription}</p>
          </div>
        )}

        <div className="space-y-3">
          {selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((event, index) => (
              <EventCard
                key={index}
                event={event}
                onTalentClick={handleTalentClick}
                onPartyThemeClick={handlePartyThemeClick}
              />
            ))
          ) : (
            <p className="text-center py-8 text-white/60">No scheduled events for this day</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
