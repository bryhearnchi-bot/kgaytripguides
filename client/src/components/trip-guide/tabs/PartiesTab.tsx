import React, { memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, MapPin, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DailyEvent, DailySchedule, ItineraryStop, PartyTheme } from '@/data/trip-data';
import { formatTime as globalFormatTime } from '@/lib/timeFormat';
import { getPartyIcon } from '../utils/iconHelpers';

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
  const handlePartyClick = useCallback(
    (party: DailyEvent) => {
      onPartyClick(party);
    },
    [onPartyClick]
  );

  // Filter and organize party events by date
  const partyEventsByDate = useMemo(() => {
    return SCHEDULED_DAILY.map(day => {
      const partyEvents = day.items.filter(
        event => event.type === 'party' || event.type === 'club' || event.type === 'after'
      );
      const itineraryStop = ITINERARY.find(stop => stop.key === day.key);

      return {
        key: day.key,
        date: itineraryStop?.date || day.key,
        port: itineraryStop?.port,
        events: partyEvents,
      };
    }).filter(day => day.events.length > 0);
  }, [SCHEDULED_DAILY, ITINERARY]);

  const getPartyTheme = useCallback(
    (eventTitle: string): PartyTheme | undefined => {
      return PARTY_THEMES.find(theme => eventTitle.toLowerCase().includes(theme.key.toLowerCase()));
    },
    [PARTY_THEMES]
  );

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center space-x-2 mb-2 -mt-2">
        <PartyPopper className="w-5 h-5 text-white/80" />
        <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Party Schedule</h2>
      </div>

      {partyEventsByDate.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
          <PartyPopper className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No parties scheduled</h3>
          <p className="text-white/70">Party information will be available soon.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {partyEventsByDate.map((day, dayIndex) => (
            <motion.div
              key={day.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: dayIndex * 0.03 }}
            >
              <div className="bg-white/85 backdrop-blur-sm border border-white/30 rounded-md overflow-hidden hover:shadow-xl transition-all duration-300">
                {/* Date Header */}
                <div className="p-3 bg-ocean-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-ocean-100 text-ocean-700 text-sm font-bold px-3 py-1 rounded-full flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {day.date}
                      </div>
                      {day.port && (
                        <div className="text-gray-600 text-sm flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {day.port}
                        </div>
                      )}
                    </div>
                    <Badge variant="secondary" className="bg-coral/20 text-coral font-bold">
                      {day.events.length} {day.events.length === 1 ? 'Event' : 'Events'}
                    </Badge>
                  </div>
                </div>

                {/* Party Events */}
                <div className="p-4 space-y-3">
                  {day.events.map((event, eventIndex) => {
                    const theme = getPartyTheme(event.title);

                    return (
                      <motion.div
                        key={`${event.title}-${event.time}-${eventIndex}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: dayIndex * 0.03 + eventIndex * 0.02 }}
                      >
                        <Card
                          className="p-4 bg-white hover:shadow-lg transition-all duration-300 border border-gray-200 cursor-pointer group"
                          onClick={() => handlePartyClick(event)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Party Icon */}
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-ocean-200 bg-gradient-to-br from-coral to-pink-500 shadow-md group-hover:scale-110 transition-transform">
                                {React.cloneElement(getPartyIcon(event.title), {
                                  className: 'w-6 h-6 text-white',
                                })}
                              </div>
                            </div>

                            {/* Event Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div className="bg-gradient-to-r from-coral to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                  {globalFormatTime(event.time, timeFormat)}
                                </div>
                                <Badge variant="secondary" className="bg-ocean-100 text-ocean-700">
                                  {event.venue}
                                </Badge>
                              </div>

                              <h4 className="text-base font-bold text-gray-900 mb-1 group-hover:text-ocean-600 transition-colors">
                                {event.title}
                              </h4>

                              {theme && (
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {theme.shortDesc || theme.desc}
                                </p>
                              )}

                              {event.type === 'after' && (
                                <Badge
                                  variant="outline"
                                  className="mt-2 text-xs border-coral text-coral"
                                >
                                  After Party
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
});
