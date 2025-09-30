import React, { memo, useMemo } from "react";
import { Music, Instagram, Twitter, Youtube, ExternalLink, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Talent, DailySchedule, ItineraryStop } from "@/data/trip-data";
import { findTalentInTitle } from "../utils/talentHelpers";
import { useTimeFormat } from "@/contexts/TimeFormatContext";
import { formatTime } from "@/lib/timeFormat";

interface TalentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTalent: Talent | null;
  SCHEDULED_DAILY: DailySchedule[];
  ITINERARY: ItineraryStop[];
  TALENT: Talent[];
  tripStatus: string;
}

// Helper function to filter events by timing
const filterEventsByTiming = (events: any[], cruiseStatus: string) => {
  if (cruiseStatus !== 'current') {
    // For upcoming or past cruises, show all events
    return events;
  }

  // For current cruise, filter out past events
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return events.filter(event => {
    const eventDate = event.dateKey || event.key;

    // Future dates are always included
    if (today && eventDate > today) return true;

    // Past dates are excluded
    if (today && eventDate < today) return false;

    // For today, check the time
    if (today && eventDate === today) {
      const [eventHour, eventMinute] = event.time.split(':').map(Number);
      const eventTotalMinutes = eventHour * 60 + eventMinute;
      const currentTotalMinutes = currentHour * 60 + currentMinute;

      // Only show future events
      return eventTotalMinutes > currentTotalMinutes;
    }

    return true;
  });
};

export const TalentModal = memo(function TalentModal({
  open,
  onOpenChange,
  selectedTalent,
  SCHEDULED_DAILY,
  ITINERARY,
  TALENT,
  tripStatus
}: TalentModalProps) {
  const { timeFormat } = useTimeFormat();

  // Find all performances for this talent
  const talentPerformances = useMemo(() => {
    if (!selectedTalent) return [];

    const allTalentPerformances = SCHEDULED_DAILY.flatMap(day =>
      day.items
        .filter(event =>
          findTalentInTitle(event.title, TALENT).includes(selectedTalent.name) ||
          ((event as any).talent && (event as any).talent.some((t: any) => t.name === selectedTalent.name))
        )
        .map(event => ({
          ...event,
          dateKey: day.key,
          date: ITINERARY.find(stop => stop.key === day.key)?.date || day.key
        }))
    ).sort((a, b) => {
      const dateCompare = a.dateKey.localeCompare(b.dateKey);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    // Apply timing filter for talent performances
    return filterEventsByTiming(allTalentPerformances, tripStatus);
  }, [selectedTalent, SCHEDULED_DAILY, ITINERARY, TALENT, tripStatus]);

  if (!selectedTalent) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {selectedTalent.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Biography and information for {selectedTalent.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Talent Info */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-shrink-0">
              <img
                src={selectedTalent.img}
                alt={selectedTalent.name}
                className="w-32 h-32 rounded-md object-cover mx-auto lg:mx-0"
                loading="lazy"
              />
            </div>
            <div className="flex-1 text-center lg:text-left min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 break-words">
                {selectedTalent.name}
              </h2>
              <Badge variant="secondary" className="mb-2">
                {selectedTalent.cat}
              </Badge>
              <p className="text-ocean-600 font-medium mb-2 break-words">
                {selectedTalent.role || selectedTalent.knownFor}
              </p>
              <p className="text-gray-700 leading-relaxed break-words">
                {selectedTalent.bio}
              </p>
            </div>
          </div>

          {/* Performance Schedule */}
          {talentPerformances.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Music className="w-4 h-4 mr-2" />
                Performance Schedule
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {talentPerformances.map((performance, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 py-2 px-2 bg-gray-50 rounded"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-900 break-words">
                        {performance.title}
                      </span>
                      <span className="text-xs text-gray-500 ml-2 break-words">
                        ({performance.venue})
                      </span>
                    </div>
                    <div className="text-sm text-ocean-600 font-medium whitespace-nowrap">
                      {performance.date} • {formatTime(performance.time, timeFormat)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {selectedTalent.social && Object.keys(selectedTalent.social).length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <ExternalLink className="w-4 h-4 mr-2" />
                Social Links & Website
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedTalent.social.instagram && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={selectedTalent.social.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="w-4 h-4 mr-2" />
                      Instagram
                    </a>
                  </Button>
                )}
                {selectedTalent.social.twitter && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={selectedTalent.social.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter className="w-4 h-4 mr-2" />
                      Twitter
                    </a>
                  </Button>
                )}
                {selectedTalent.social.youtube && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={selectedTalent.social.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Youtube className="w-4 h-4 mr-2" />
                      YouTube
                    </a>
                  </Button>
                )}
                {selectedTalent.social.website && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={selectedTalent.social.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
                {selectedTalent.social.linktree && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={selectedTalent.social.linktree}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Linktree
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});