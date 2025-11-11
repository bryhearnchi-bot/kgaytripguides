import React, { memo, useCallback, useState, useMemo } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, MapPin, Map } from 'lucide-react';
import { EventCard } from '../shared/EventCard';
import { isDateInPast } from '../utils/dateHelpers';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { formatTime as globalFormatTime } from '@/lib/timeFormat';
import { formatTime } from '@/lib/timeFormat';
import type { Talent } from '@/data/trip-data';
import { TabHeader } from '../shared/TabHeader';
import JobListingComponent, { type Job } from '@/components/smoothui/ui/JobListingComponent';

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
  onViewEvents: (dateKey: string, portName: string) => void;
  scheduledDaily?: any[];
  talent?: any[];
  tripStatus?: string;
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
  onViewEvents,
  scheduledDaily,
  talent,
  tripStatus = 'upcoming',
}: ScheduleTabProps) {
  const { timeFormat } = useTimeFormat();
  const [subTab, setSubTab] = useState<'itinerary' | 'events'>('itinerary');

  // Filter itinerary based on trip status
  const filteredItinerary = useMemo(() => {
    if (tripStatus !== 'current') {
      return ITINERARY;
    }

    const today = new Date().toISOString().split('T')[0];
    return ITINERARY.filter(stop => {
      const stopDate = stop.key || stop.date?.split('T')[0];
      return stopDate >= today;
    });
  }, [ITINERARY, tripStatus]);

  // Transform itinerary data to Job format for the component
  const jobsData: Job[] = filteredItinerary.map((stop, index) => {
    const isEmbarkation = stop.locationTypeId === 1;
    const isDisembarkation = stop.locationTypeId === 2;
    const isOvernightArrival = stop.locationTypeId === 8 || stop.locationTypeId === 11;
    const isOvernightDeparture = stop.locationTypeId === 9 || stop.locationTypeId === 12;
    const isFullDayOvernight = stop.locationTypeId === 10 || stop.locationTypeId === 13;
    const isPreCruise = stop.day < 0;
    const isPostCruise = stop.day >= 100;

    const uniqueKey = `${stop.key}-${stop.locationId || 'loc'}-${index}`;

    const isUSPort =
      stop.country &&
      (stop.country.toLowerCase() === 'united states' ||
        stop.country.toLowerCase() === 'usa' ||
        stop.country.toLowerCase() === 'us');

    const basePortName = stop.country && !isUSPort ? `${stop.port}, ${stop.country}` : stop.port;

    let portName = basePortName;
    let arriveDepart = '';
    let allAboard = '';

    if (isPreCruise || isPostCruise) {
      portName = basePortName;
      arriveDepart = '';
      allAboard = '';
    } else if (isEmbarkation) {
      portName = `${basePortName} - Embarkation`;
      arriveDepart =
        stop.depart && stop.depart !== '—' ? `Depart: ${formatTime(stop.depart, timeFormat)}` : '';
      allAboard =
        stop.allAboard && stop.allAboard !== '—' ? formatTime(stop.allAboard, timeFormat) : '';
    } else if (isDisembarkation) {
      portName = `${basePortName} - Disembarkation`;
      arriveDepart =
        stop.arrive && stop.arrive !== '—' ? `Arrive: ${formatTime(stop.arrive, timeFormat)}` : '';
    } else if (isOvernightArrival) {
      portName = `${basePortName} - Overnight`;
      arriveDepart =
        stop.arrive && stop.arrive !== '—' ? `Arrive: ${formatTime(stop.arrive, timeFormat)}` : '';
      allAboard = '';
    } else if (isOvernightDeparture) {
      portName = basePortName;
      arriveDepart =
        stop.depart && stop.depart !== '—' ? `Depart: ${formatTime(stop.depart, timeFormat)}` : '';
      allAboard =
        stop.allAboard && stop.allAboard !== '—' ? formatTime(stop.allAboard, timeFormat) : '';
    } else if (isFullDayOvernight) {
      portName = `${basePortName} - Overnight Full Day`;
      arriveDepart = '';
      allAboard = '';
    } else {
      const hasTimes = (stop.arrive && stop.arrive !== '—') || (stop.depart && stop.depart !== '—');
      if (hasTimes) {
        const arriveText =
          stop.arrive && stop.arrive !== '—'
            ? `Arrive: ${formatTime(stop.arrive, timeFormat)}`
            : '';
        const departText =
          stop.depart && stop.depart !== '—'
            ? `Depart: ${formatTime(stop.depart, timeFormat)}`
            : '';
        arriveDepart = [arriveText, departText].filter(Boolean).join(' • ');
      }
      allAboard =
        stop.allAboard && stop.allAboard !== '—' ? formatTime(stop.allAboard, timeFormat) : '';
    }

    return {
      company: portName,
      title: stop.date,
      logo: (
        <img
          src={
            stop.imageUrl
              ? `${stop.imageUrl}?t=${Date.now()}`
              : 'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg'
          }
          alt={stop.port}
          className="w-32 h-20 sm:w-52 sm:h-32 object-cover rounded"
          loading="lazy"
          onError={e => {
            e.currentTarget.src =
              'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/trip-images/virgin-resilient-lady.jpg';
          }}
        />
      ),
      job_description: stop.description || 'Description coming soon',
      salary: arriveDepart,
      location: '',
      remote: allAboard,
      job_time: uniqueKey,
      dayNumber: stop.day,
      attractions: stop.attractions || [],
      lgbtVenues: stop.lgbtVenues || [],
    };
  });

  return (
    <>
      <div className="max-w-6xl mx-auto pt-6 pb-2">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Schedule</h3>
          <div className="flex-1 h-px bg-white/20 mx-3"></div>
          {/* Sub-tabs on the right */}
          <div className="flex gap-2">
            <button
              onClick={() => setSubTab('itinerary')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                subTab === 'itinerary'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              Itinerary
            </button>
            <button
              onClick={() => setSubTab('events')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                subTab === 'events'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              Events
            </button>
          </div>
        </div>
      </div>

      {subTab === 'itinerary' ? (
        <div className="max-w-6xl mx-auto space-y-2 sm:space-y-4 pt-4">
          {filteredItinerary.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
              <Map className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No itinerary available</h3>
              <p className="text-white/70">Itinerary information will be available soon.</p>
            </div>
          ) : (
            <JobListingComponent
              jobs={jobsData}
              onViewEvents={onViewEvents}
              scheduledDaily={scheduledDaily}
              talent={talent}
            />
          )}
        </div>
      ) : (
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
      )}
    </>
  );
});
