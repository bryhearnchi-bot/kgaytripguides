import React, { memo, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { DailyEvent, Talent, ItineraryStop } from "@/data/trip-data";
import { findTalentInTitle } from "../utils/talentHelpers";
import { useTimeFormat } from "@/contexts/TimeFormatContext";
import { formatTime } from "@/lib/timeFormat";

interface EventsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDateEvents: DailyEvent[];
  selectedItineraryStop: { date: string; port: string; description?: string } | null;
  ITINERARY: ItineraryStop[];
  TALENT: Talent[];
  onTalentClick: (name: string) => void;
  onPartyClick: (party: DailyEvent) => void;
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
  setCameFromEventsModal
}: EventsModalProps) {
  const { timeFormat } = useTimeFormat();

  const handleEventClick = useCallback((event: DailyEvent, clickableNames: string[], isPartyEvent: boolean) => {
    if (clickableNames.length > 0 && clickableNames[0]) {
      // If there are talent names, click the first one
      setCameFromEventsModal(true);
      onTalentClick(clickableNames[0]);
      onOpenChange(false); // Close events modal
    } else if (isPartyEvent) {
      // If it's a party event, open party modal
      setCameFromEventsModal(true);
      onPartyClick(event);
      onOpenChange(false); // Close events modal
    }
  }, [onTalentClick, onPartyClick, setCameFromEventsModal, onOpenChange]);

  // Get port description from itinerary (if available in extended type)
  const portDescription = selectedItineraryStop
    ? (ITINERARY.find(stop => stop.key === selectedItineraryStop.date) as any)?.description
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Events for {selectedItineraryStop?.port}
          </DialogTitle>
          <DialogDescription>
            View scheduled events and activities for this port
          </DialogDescription>
        </DialogHeader>

        {/* Port Description */}
        {portDescription && (
          <div className="border-b pb-4 mb-4">
            <p className="text-gray-700 text-sm leading-relaxed">{portDescription}</p>
          </div>
        )}

        <div className="space-y-4">
          {selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((event, index) => {
              const clickableNames = findTalentInTitle(event.title, TALENT);
              const isPartyEvent = event.type === 'party' || event.type === 'club' || event.type === 'after';
              const isClickable = clickableNames.length > 0 || isPartyEvent;

              return (
                <div
                  key={index}
                  className={`border-l-4 border-ocean-500 pl-4 py-2 rounded-r-lg transition-all duration-200 ${
                    isClickable
                      ? 'cursor-pointer hover:bg-ocean-50 hover:shadow-md'
                      : ''
                  }`}
                  onClick={() => handleEventClick(event, clickableNames, isPartyEvent)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium ${isClickable ? 'text-ocean-700 hover:text-ocean-800' : 'text-gray-900'}`}>
                      {event.title}
                      {isClickable && <span className="ml-1 text-xs text-ocean-500">→</span>}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ocean-600 font-medium">
                        {formatTime(event.time, timeFormat)}
                      </span>
                      <Badge variant="secondary" className="bg-ocean-100 text-ocean-700">
                        {event.venue}
                      </Badge>
                    </div>
                  </div>
                  {(event as any).description && (
                    <p className="text-sm text-gray-600">{(event as any).description}</p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center py-8 text-gray-500">
              No scheduled events for this day
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});