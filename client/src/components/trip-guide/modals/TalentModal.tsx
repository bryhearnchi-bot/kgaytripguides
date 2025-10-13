import React, { memo, useMemo } from 'react';
import {
  Music,
  Instagram,
  Twitter,
  Youtube,
  ExternalLink,
  Globe,
  Facebook,
  Circle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Talent, DailySchedule, ItineraryStop } from '@/data/trip-data';
import { findTalentInTitle } from '../utils/talentHelpers';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { formatTime } from '@/lib/timeFormat';

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
  tripStatus,
}: TalentModalProps) {
  const { timeFormat } = useTimeFormat();

  // Find all performances for this talent
  const talentPerformances = useMemo(() => {
    if (!selectedTalent) return [];

    const allTalentPerformances = SCHEDULED_DAILY.flatMap(day =>
      day.items
        .filter(
          event =>
            findTalentInTitle(event.title, TALENT).includes(selectedTalent.name) ||
            ((event as any).talent &&
              (event as any).talent.some((t: any) => t.name === selectedTalent.name))
        )
        .map(event => ({
          ...event,
          dateKey: day.key,
          date: ITINERARY.find(stop => stop.key === day.key)?.date || day.key,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-3xl border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="sr-only">{selectedTalent.name}</DialogTitle>
          <DialogDescription className="sr-only">
            Biography and information for {selectedTalent.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Talent Info */}
          <div className="flex flex-col md:flex-row-reverse gap-6">
            {/* Profile Image - Perfect Square */}
            {selectedTalent.img && (
              <div className="w-full md:w-64 md:flex-shrink-0">
                <img
                  src={selectedTalent.img}
                  alt={selectedTalent.name}
                  className="w-full aspect-square object-cover rounded-xl border-2 border-purple-400/30 shadow-lg"
                  loading="lazy"
                />
              </div>
            )}

            {/* Artist Info */}
            <div className="flex-1">
              {/* Artist Name */}
              <h2 className="text-2xl font-bold mb-2 text-white">{selectedTalent.name}</h2>

              {/* Known For */}
              {(selectedTalent.role || selectedTalent.knownFor) && (
                <p className="text-purple-200 text-sm mb-4">
                  {selectedTalent.role || selectedTalent.knownFor}
                </p>
              )}

              {/* Bio */}
              {selectedTalent.bio && (
                <div className="mb-4">
                  <p className="text-purple-50 text-sm leading-relaxed">{selectedTalent.bio}</p>
                </div>
              )}

              {/* Social Links - Under Bio */}
              {selectedTalent.social && Object.keys(selectedTalent.social).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedTalent.social).map(([platform, url]: [string, any]) => {
                    const platformLower = platform.toLowerCase();
                    let Icon = Globe; // Default icon

                    if (platformLower.includes('instagram')) Icon = Instagram;
                    else if (platformLower.includes('twitter') || platformLower.includes('x'))
                      Icon = Twitter;
                    else if (platformLower.includes('facebook')) Icon = Facebook;
                    else if (platformLower.includes('youtube')) Icon = Youtube;
                    else if (platformLower.includes('spotify') || platformLower.includes('music'))
                      Icon = Music;

                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded-lg border border-purple-400/30 transition-all hover:scale-110"
                        title={platform}
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Performances */}
          {talentPerformances.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-4">
                Performances
              </h3>
              <div className="space-y-3">
                {talentPerformances.map((performance, index) => (
                  <div
                    key={index}
                    className="bg-purple-500/10 backdrop-blur-md rounded-lg p-4 border border-purple-400/20"
                  >
                    <div className="flex flex-col gap-2">
                      {/* Line 1: Date • Time */}
                      <div className="flex items-center gap-2">
                        <span className="text-purple-200 font-medium text-sm">
                          {performance.date}
                        </span>
                        <Circle className="w-1.5 h-1.5 fill-current text-purple-400" />
                        <span className="text-white font-semibold text-sm">
                          {formatTime(performance.time, timeFormat)}
                        </span>
                      </div>
                      {/* Line 2: Venue */}
                      {performance.venue && (
                        <div className="text-purple-100 text-sm">{performance.venue}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});
