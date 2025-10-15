import React, { memo, useMemo } from 'react';
import { PartyPopper, MapPin, Calendar } from 'lucide-react';
import type { DailySchedule, ItineraryStop } from '@/data/trip-data';
import { PartyCard } from '../shared/PartyCard';

interface PartiesTabProps {
  SCHEDULED_DAILY: DailySchedule[];
  ITINERARY: ItineraryStop[];
  timeFormat: '12h' | '24h';
  onPartyClick?: (party: any) => void;
  tripStatus?: string;
}

export const PartiesTab = memo(function PartiesTab({
  SCHEDULED_DAILY,
  ITINERARY,
  timeFormat,
  onPartyClick,
  tripStatus = 'upcoming',
}: PartiesTabProps) {
  // Filter and organize party events by date
  const partyEventsByDate = useMemo(() => {
    // First, filter SCHEDULED_DAILY by date if it's a current trip
    let filteredScheduledDaily = SCHEDULED_DAILY;

    if (tripStatus === 'current') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      filteredScheduledDaily = SCHEDULED_DAILY.map(day => {
        const dayDate = day.key;

        // Future days - include all events
        if (dayDate > today) {
          return day;
        }

        // Past days - exclude completely
        if (dayDate < today) {
          return { ...day, items: [] };
        }

        // Today - filter events by time
        const filteredItems = day.items.filter(event => {
          const [eventHour, eventMinute] = event.time.split(':').map(Number);
          const eventTotalMinutes = eventHour * 60 + eventMinute;
          const currentTotalMinutes = currentHour * 60 + currentMinute;
          return eventTotalMinutes > currentTotalMinutes;
        });

        return { ...day, items: filteredItems };
      }).filter(day => day.items.length > 0);
    }

    return filteredScheduledDaily
      .map(day => {
        // Filter only party events (including 'after' type for after parties)
        const partyEvents = day.items.filter(
          event => event.type === 'party' || event.type === 'after'
        );

        const itineraryStop = ITINERARY.find(stop => stop.key === day.key);

        return {
          key: day.key,
          date: itineraryStop?.date || day.key,
          port: itineraryStop?.port,
          events: partyEvents,
          totalEvents: partyEvents.length,
        };
      })
      .filter(day => day.totalEvents > 0);
  }, [SCHEDULED_DAILY, ITINERARY, tripStatus]);

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
          {partyEventsByDate.map(day => (
            <div key={day.key} className="space-y-4">
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

              {/* Party Cards Grid - 2 columns max like Talent cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {day.events.map((event, eventIndex) => (
                  <PartyCard
                    key={`${day.key}-${eventIndex}`}
                    event={event}
                    partyTheme={event.partyTheme}
                    timeFormat={timeFormat}
                    onPartyClick={onPartyClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
