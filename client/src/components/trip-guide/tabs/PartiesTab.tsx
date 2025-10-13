import React, { memo, useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, MapPin, Calendar } from 'lucide-react';
import type { DailyEvent, DailySchedule, ItineraryStop, PartyTheme } from '@/data/trip-data';
import { PartyCard } from '../shared/PartyCard';

interface PartiesTabProps {
  SCHEDULED_DAILY: DailySchedule[];
  ITINERARY: ItineraryStop[];
  PARTY_THEMES: PartyTheme[];
  timeFormat: '12h' | '24h';
  onPartyClick: (party: DailyEvent) => void;
}

export const PartiesTab = memo(function PartiesTab({
  SCHEDULED_DAILY,
  ITINERARY,
  PARTY_THEMES,
  timeFormat,
  onPartyClick,
}: PartiesTabProps) {
  // Track which card is currently expanded (only one at a time)
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Filter and organize party events by date
  const partyEventsByDate = useMemo(() => {
    return SCHEDULED_DAILY.map(day => {
      // Filter only party events (including 'after' type for after parties)
      const partyEvents = day.items.filter(
        event => event.type === 'party' || event.type === 'after'
      );

      // Sort events by time
      partyEvents.sort((a, b) => a.time.localeCompare(b.time));

      const itineraryStop = ITINERARY.find(stop => stop.key === day.key);

      return {
        key: day.key,
        date: itineraryStop?.date || day.key,
        port: itineraryStop?.port,
        events: partyEvents,
        totalEvents: partyEvents.length,
      };
    }).filter(day => day.totalEvents > 0);
  }, [SCHEDULED_DAILY, ITINERARY]);

  const getPartyTheme = useCallback(
    (eventTitle: string): PartyTheme | undefined => {
      return PARTY_THEMES.find(theme => eventTitle.toLowerCase().includes(theme.key.toLowerCase()));
    },
    [PARTY_THEMES]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center space-x-2 mb-6 -mt-2">
        <PartyPopper className="w-5 h-5 text-white/80" />
        <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Party Schedule</h2>
      </div>

      {partyEventsByDate.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl text-center py-8 border border-white/20">
          <PartyPopper className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No parties scheduled</h3>
          <p className="text-white/70">Party information will be available soon.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {partyEventsByDate.map((day, dayIndex) => (
            <motion.div
              key={day.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: dayIndex * 0.03 }}
              className="space-y-4"
            >
              {/* Compact Date Header */}
              <div className="flex items-center gap-3 pb-2 mb-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-400/30">
                  <Calendar className="w-3.5 h-3.5 text-purple-300" />
                  <h3 className="text-sm font-bold text-white">{day.date}</h3>
                </div>
                {day.port && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-300" />
                    <span className="text-sm text-white/70 font-medium">{day.port}</span>
                  </div>
                )}
              </div>

              {/* Party Cards Grid - Compact and fun */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {day.events.map((event, eventIndex) => {
                  const theme = getPartyTheme(event.title);
                  const cardId = `${day.key}-${event.title}-${event.time}`;
                  const isExpanded = expandedCardId === cardId;

                  return (
                    <PartyCard
                      key={`${event.title}-${event.time}-${eventIndex}`}
                      event={event}
                      partyTheme={theme}
                      timeFormat={timeFormat}
                      onClick={() => onPartyClick(event)}
                      delay={dayIndex * 0.05 + eventIndex * 0.06}
                      isExpanded={isExpanded}
                      onToggleExpand={() => {
                        // Toggle: if this card is expanded, collapse it; otherwise expand it (and collapse others)
                        setExpandedCardId(isExpanded ? null : cardId);
                      }}
                    />
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
});
