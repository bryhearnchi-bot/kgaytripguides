import React, { memo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { EventCard } from '../shared/EventCard';
import { isDateInPast } from '../utils/dateHelpers';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { formatTime as globalFormatTime } from '@/lib/timeFormat';
import type { Talent } from '@/data/trip-data';

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
}: ScheduleTabProps) {
  const { timeFormat } = useTimeFormat();

  return (
    <div className="max-w-6xl mx-auto space-y-2 sm:space-y-4">
      <div className="flex items-center justify-between mb-4 -mt-2">
        <div className="flex items-center space-x-2">
          <CalendarDays className="w-5 h-5 text-white/80" />
          <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">
            Events Schedule
          </h2>
        </div>
        <div>
          <button
            onClick={onCollapseAll}
            className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-lg transition-all duration-200 border border-white/30 hover:border-white/50 backdrop-blur-sm"
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

      <div className="space-y-6">
        {SCHEDULED_DAILY.map((day, dayIndex) => {
          const isCollapsed = collapsedDays.includes(day.key);
          const itineraryStop = ITINERARY.find(stop => stop.key === day.key);
          const isPastDate = isDateInPast(day.key);

          return (
            <motion.div
              key={day.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: dayIndex * 0.02 }}
              className={`${isPastDate ? 'opacity-75' : ''}`}
            >
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.01] transition-all duration-300">
                <div
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    isCollapsed ? 'hover:bg-white/15' : 'bg-white/5'
                  }`}
                  onClick={() => onToggleDayCollapse(day.key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-ocean-500/30 text-ocean-100 text-sm font-bold px-4 py-1.5 rounded-full border border-ocean-400/30 backdrop-blur-sm">
                        {itineraryStop?.date || day.key}
                      </div>
                      {itineraryStop && (
                        <div className="text-white/80 text-sm flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{itineraryStop.port}</span>
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

                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-white/10"
                    >
                      <div className="px-4 pt-4 pb-4 bg-gradient-to-br from-slate-900/40 via-slate-800/40 to-slate-900/40 backdrop-blur-sm">
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {SCHEDULED_DAILY.length === 0 && (
        <div className="bg-white/10 backdrop-blur-lg rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
          <CalendarDays className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No events found</h3>
          <p className="text-white/70">No events are currently scheduled.</p>
        </div>
      )}
    </div>
  );
});
