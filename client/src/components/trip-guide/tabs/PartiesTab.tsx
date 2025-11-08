import React, { memo, useMemo, useState, useEffect } from 'react';
import { PartyPopper, MapPin, Calendar } from 'lucide-react';
import type { DailySchedule, ItineraryStop } from '@/data/trip-data';
import { PartyCard } from '../shared/PartyCard';
import { api } from '@/lib/api-client';

interface PartyTheme {
  id: number;
  name: string;
  longDescription: string;
  shortDescription: string;
  costumeIdeas: string;
  imageUrl: string | null;
  partyType: 'T-Dance' | 'Night Party';
  orderIndex: number;
}

interface PartiesTabProps {
  SCHEDULED_DAILY: DailySchedule[];
  ITINERARY: ItineraryStop[];
  timeFormat: '12h' | '24h';
  onPartyClick?: (party: any) => void;
  tripStatus?: string;
  tripId?: number;
}

export const PartiesTab = memo(function PartiesTab({
  SCHEDULED_DAILY,
  ITINERARY,
  timeFormat,
  onPartyClick,
  tripStatus = 'upcoming',
  tripId,
}: PartiesTabProps) {
  const [partyThemes, setPartyThemes] = useState<PartyTheme[]>([]);
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);

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

  // Fetch party themes if no events exist
  useEffect(() => {
    if (tripId && partyEventsByDate.length === 0) {
      setIsLoadingThemes(true);
      api
        .get(`/api/trips/${tripId}/party-themes`, { requireAuth: false })
        .then(async response => {
          const data = await response.json();
          setPartyThemes(data || []);
        })
        .catch(error => {
          console.error('[PartiesTab] Failed to fetch party themes:', error);
          setPartyThemes([]);
        })
        .finally(() => {
          setIsLoadingThemes(false);
        });
    }
  }, [tripId, partyEventsByDate.length]);

  // Organize party themes by type (T-Dances first, then Night Parties)
  const organizedPartyThemes = useMemo(() => {
    const tDances = partyThemes.filter(theme => theme.partyType === 'T-Dance');
    const nightParties = partyThemes.filter(theme => theme.partyType === 'Night Party');
    return [...tDances, ...nightParties];
  }, [partyThemes]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center space-x-2 mb-6 -mt-2">
        <PartyPopper className="w-5 h-5 text-white/80" />
        <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Party Schedule</h2>
      </div>

      {partyEventsByDate.length === 0 ? (
        isLoadingThemes ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl text-center py-8 border border-white/20">
            <PartyPopper className="w-16 h-16 text-white/40 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-medium text-white mb-2">Loading party themes...</h3>
          </div>
        ) : organizedPartyThemes.length > 0 ? (
          <div className="space-y-8">
            {/* T-Dances Section */}
            {organizedPartyThemes.some(theme => theme.partyType === 'T-Dance') && (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-400/30">
                  <h3 className="text-sm font-bold text-white">T-Dances</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organizedPartyThemes
                    .filter(theme => theme.partyType === 'T-Dance')
                    .map(theme => (
                      <div
                        key={theme.id}
                        className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-white/20 hover:border-white/40 transition-all cursor-pointer"
                      >
                        {theme.imageUrl && (
                          <div className="h-48 overflow-hidden">
                            <img
                              src={theme.imageUrl}
                              alt={theme.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4 space-y-2">
                          <h4 className="text-lg font-bold text-white">{theme.name}</h4>
                          {theme.shortDescription && (
                            <p className="text-sm text-white/70">{theme.shortDescription}</p>
                          )}
                          {theme.costumeIdeas && (
                            <div className="text-xs text-white/60 mt-2">
                              <span className="font-semibold">Costume Ideas:</span>{' '}
                              {theme.costumeIdeas}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Night Parties Section */}
            {organizedPartyThemes.some(theme => theme.partyType === 'Night Party') && (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-400/30">
                  <h3 className="text-sm font-bold text-white">Night Parties</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organizedPartyThemes
                    .filter(theme => theme.partyType === 'Night Party')
                    .map(theme => (
                      <div
                        key={theme.id}
                        className="bg-white/10 backdrop-blur-lg rounded-xl overflow-hidden border border-white/20 hover:border-white/40 transition-all cursor-pointer"
                      >
                        {theme.imageUrl && (
                          <div className="h-48 overflow-hidden">
                            <img
                              src={theme.imageUrl}
                              alt={theme.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4 space-y-2">
                          <h4 className="text-lg font-bold text-white">{theme.name}</h4>
                          {theme.shortDescription && (
                            <p className="text-sm text-white/70">{theme.shortDescription}</p>
                          )}
                          {theme.costumeIdeas && (
                            <div className="text-xs text-white/60 mt-2">
                              <span className="font-semibold">Costume Ideas:</span>{' '}
                              {theme.costumeIdeas}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl text-center py-8 border border-white/20">
            <PartyPopper className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No parties scheduled</h3>
            <p className="text-white/70">Party information will be available soon.</p>
          </div>
        )
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
