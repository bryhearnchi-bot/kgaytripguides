import React, { memo, useCallback, useState, useMemo, useEffect } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, MapPin, PartyPopper } from 'lucide-react';
import { EventCard } from '../shared/EventCard';
import { PartyCard } from '../shared/PartyCard';
import { isDateInPast } from '../utils/dateHelpers';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { formatTime as globalFormatTime } from '@/lib/timeFormat';
import type { Talent } from '@/data/trip-data';
import { TabHeader } from '../shared/TabHeader';
import { api } from '@/lib/api-client';

interface ScheduleTabProps {
  SCHEDULED_DAILY: any[];
  ITINERARY: any[];
  TALENT: Talent[];
  PARTY_THEMES: any[];
  collapsedDays: string[];
  onToggleDayCollapse: (dateKey: string) => void;
  onCollapseAll: () => void;
  onTalentClick: (name: string) => void;
  onPartyClick: (party: any) => void;
  onPartyThemeClick?: (partyTheme: any) => void;
  tripStatus?: string;
  tripId?: number;
}

export const ScheduleTab = memo(function ScheduleTab({
  SCHEDULED_DAILY,
  ITINERARY,
  TALENT,
  PARTY_THEMES,
  collapsedDays,
  onToggleDayCollapse,
  onCollapseAll,
  onTalentClick,
  onPartyClick,
  onPartyThemeClick,
  tripStatus = 'upcoming',
  tripId,
}: ScheduleTabProps) {
  const { timeFormat } = useTimeFormat();
  const [subTab, setSubTab] = useState<'schedule' | 'parties'>('schedule');
  const [partyThemes, setPartyThemes] = useState<any[]>([]);
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);

  // Filter and organize party events by date
  const partyEventsByDate = useMemo(() => {
    let filteredScheduledDaily = SCHEDULED_DAILY;

    if (tripStatus === 'current') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      filteredScheduledDaily = SCHEDULED_DAILY.map(day => {
        const dayDate = day.key;

        if (dayDate > today) {
          return day;
        }

        if (dayDate < today) {
          return { ...day, items: [] };
        }

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

  // Fetch party themes if no party events exist
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
          console.error('[ScheduleTab] Failed to fetch party themes:', error);
          setPartyThemes([]);
        })
        .finally(() => {
          setIsLoadingThemes(false);
        });
    }
  }, [tripId, partyEventsByDate.length]);

  // Organize party themes by type
  const organizedPartyThemes = useMemo(() => {
    const tDances = partyThemes.filter(theme => theme.partyType === 'T-Dance');
    const nightParties = partyThemes.filter(theme => theme.partyType === 'Night Party');
    return [...tDances, ...nightParties];
  }, [partyThemes]);

  return (
    <>
      <div className="max-w-6xl mx-auto pt-6 pb-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Events</h3>
          <div className="flex-1 h-px bg-white/20 mx-3"></div>
          {/* Sub-tabs on the right */}
          <div className="flex gap-2">
            <button
              onClick={() => setSubTab('schedule')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                subTab === 'schedule'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              Schedule
            </button>
            <button
              onClick={() => setSubTab('parties')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                subTab === 'parties'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              Parties
            </button>
          </div>
        </div>
      </div>

      {subTab === 'schedule' ? (
        <>
          <div className="max-w-6xl mx-auto pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="flex-1"></div>
              <button
                onClick={onCollapseAll}
                className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors duration-200 border border-white/30 hover:border-white/50"
              >
                {SCHEDULED_DAILY.length === collapsedDays.length ? (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>Expand All</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Collapse All</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="max-w-6xl mx-auto space-y-2 sm:space-y-4">
            <div className="space-y-6">
              {SCHEDULED_DAILY.map((day, dayIndex) => {
                const isCollapsed = collapsedDays.includes(day.key);
                const itineraryStop = ITINERARY.find(stop => stop.key === day.key);
                const isPastDate = isDateInPast(day.key);

                // Format the date from YYYY-MM-DD to a readable format with day of week
                const formatDateKey = (dateKey: string) => {
                  const [year, month, dayNum] = dateKey.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(dayNum));
                  return date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });
                };

                return (
                  <div key={day.key} className={`${isPastDate ? 'opacity-75' : ''}`}>
                    <div className="bg-white/10 border border-white/20 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
                      <div
                        className={`p-4 cursor-pointer transition-all duration-200 ${
                          isCollapsed ? 'hover:bg-white/15' : 'bg-white/5'
                        }`}
                        onClick={() => onToggleDayCollapse(day.key)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-ocean-500/30 text-ocean-100 text-sm font-bold px-4 py-1.5 rounded-full border border-ocean-400/30">
                              {itineraryStop?.date || formatDateKey(day.key)}
                            </div>
                            {itineraryStop && (
                              <div className="text-white/80 text-sm flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                <span>{itineraryStop.port}</span>
                              </div>
                            )}
                            {/* Event count badge */}
                            {day.items.length > 0 && (
                              <div className="bg-purple-500/30 text-purple-200 text-xs font-bold px-2 py-0.5 rounded-full border border-purple-400/40">
                                {day.items.length} {day.items.length === 1 ? 'event' : 'events'}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            {day.items.length > 0 && (
                              <span className="text-xs text-white/50 hidden sm:inline">
                                Last event:{' '}
                                {globalFormatTime(day.items[day.items.length - 1].time, timeFormat)}
                              </span>
                            )}
                            {isCollapsed ? (
                              <ChevronDown className="w-5 h-5 text-ocean-300 hover:text-ocean-200 transition-colors" />
                            ) : (
                              <ChevronUp className="w-5 h-5 text-ocean-300 hover:text-ocean-200 transition-colors" />
                            )}
                          </div>
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="border-t border-white/10">
                          <div className="px-4 pt-4 pb-4 bg-gradient-to-br from-slate-900/40 via-slate-800/40 to-slate-900/40">
                            {day.items.length === 0 ? (
                              <p className="text-white/60 text-center py-8">
                                No scheduled events for this day
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {day.items.map((event: any, idx: number) => (
                                  <EventCard
                                    key={idx}
                                    event={event}
                                    onTalentClick={onTalentClick}
                                    onPartyThemeClick={onPartyThemeClick}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {SCHEDULED_DAILY.length === 0 && (
              <div className="bg-white/10 rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
                <CalendarDays className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No events found</h3>
                <p className="text-white/70">No events are currently scheduled.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="max-w-6xl mx-auto space-y-8 pt-4">
          {partyEventsByDate.length === 0 ? (
            isLoadingThemes ? (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl text-center py-8 border border-white/20">
                <PartyPopper className="w-16 h-16 text-white/40 mx-auto mb-4 animate-pulse" />
                <h3 className="text-lg font-medium text-white mb-2">Loading party themes...</h3>
              </div>
            ) : organizedPartyThemes.length > 0 ? (
              <div className="space-y-8">
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
                              <img
                                src={theme.imageUrl}
                                alt={theme.name}
                                className="w-full h-48 object-cover"
                                loading="lazy"
                              />
                            )}
                            <div className="p-4">
                              <h4 className="text-lg font-bold text-white mb-2">{theme.name}</h4>
                              <p className="text-sm text-white/70">{theme.shortDescription}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                {organizedPartyThemes.some(theme => theme.partyType === 'Night Party') && (
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/20 backdrop-blur-sm rounded-full border border-pink-400/30">
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
                              <img
                                src={theme.imageUrl}
                                alt={theme.name}
                                className="w-full h-48 object-cover"
                                loading="lazy"
                              />
                            )}
                            <div className="p-4">
                              <h4 className="text-lg font-bold text-white mb-2">{theme.name}</h4>
                              <p className="text-sm text-white/70">{theme.shortDescription}</p>
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
            <div className="space-y-6">
              {partyEventsByDate.map(day => (
                <PartyCard
                  key={day.key}
                  date={day.date}
                  port={day.port}
                  events={day.events}
                  timeFormat={timeFormat}
                  onPartyClick={onPartyClick}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
});
