import React, { memo, useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { PartyPopper, MapPin, Calendar } from 'lucide-react';
import type { DailyEvent, DailySchedule, ItineraryStop, PartyTheme } from '@/data/trip-data';
import { PartyCardOptimized } from '../shared/PartyCardOptimized';

interface PartiesTabProps {
  SCHEDULED_DAILY: DailySchedule[];
  ITINERARY: ItineraryStop[];
  PARTY_THEMES: PartyTheme[];
  timeFormat: '12h' | '24h';
  onPartyClick: (party: DailyEvent) => void;
}

// Pre-calculate animation variants
const dayVariants = {
  initial: { opacity: 0, y: 8 },
  animate: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      delay: custom * 0.03,
    },
  }),
};

// Memoized date header component
const DateHeader = memo(function DateHeader({ date, port }: { date: string; port?: string }) {
  return (
    <div className="flex items-center gap-3 pb-2 mb-1">
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-400/30">
        <Calendar className="w-3.5 h-3.5 text-purple-300" />
        <h3 className="text-sm font-bold text-white">{date}</h3>
      </div>
      {port && (
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-blue-300" />
          <span className="text-sm text-white/70 font-medium">{port}</span>
        </div>
      )}
    </div>
  );
});

// Memoized empty state component
const EmptyState = memo(function EmptyState() {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl text-center py-8 border border-white/20">
      <PartyPopper className="w-16 h-16 text-white/40 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">No parties scheduled</h3>
      <p className="text-white/70">Party information will be available soon.</p>
    </div>
  );
});

// Virtual scrolling component for large lists
const VirtualizedPartyGrid = memo(function VirtualizedPartyGrid({
  events,
  partyThemes,
  timeFormat,
  onPartyClick,
  expandedCardId,
  onCardToggle,
  dayKey,
  dayIndex,
}: {
  events: DailyEvent[];
  partyThemes: Map<string, PartyTheme>;
  timeFormat: '12h' | '24h';
  onPartyClick: (party: DailyEvent) => void;
  expandedCardId: string | null;
  onCardToggle: (cardId: string) => void;
  dayKey: string;
  dayIndex: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 9 });

  // Set up intersection observer for virtual scrolling
  useEffect(() => {
    if (!containerRef.current || events.length <= 9) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setVisibleRange(prev => ({
              start: Math.max(0, index - 3),
              end: Math.min(events.length, index + 6),
            }));
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '100px',
        threshold: 0,
      }
    );

    // Observe sentinel elements
    const sentinels = containerRef.current.querySelectorAll('.party-sentinel');
    sentinels.forEach(sentinel => observer.observe(sentinel));

    return () => observer.disconnect();
  }, [events.length]);

  return (
    <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event, eventIndex) => {
        const cardId = `${dayKey}-${event.title}-${event.time}`;
        const isExpanded = expandedCardId === cardId;
        const isVisible =
          events.length <= 9 || (eventIndex >= visibleRange.start && eventIndex < visibleRange.end);

        // For virtual scrolling, render placeholder for invisible items
        if (!isVisible && events.length > 9) {
          return (
            <div
              key={cardId}
              data-index={eventIndex}
              className="party-sentinel h-48 sm:h-56"
              style={{ visibility: 'hidden' }}
            />
          );
        }

        const theme = partyThemes.get(event.title.toLowerCase());

        return (
          <PartyCardOptimized
            key={cardId}
            event={event}
            partyTheme={theme}
            timeFormat={timeFormat}
            onClick={() => onPartyClick(event)}
            delay={dayIndex * 0.05 + eventIndex * 0.06}
            isExpanded={isExpanded}
            onToggleExpand={() => onCardToggle(cardId)}
          />
        );
      })}
    </div>
  );
});

export const PartiesTabOptimized = memo(
  function PartiesTabOptimized({
    SCHEDULED_DAILY,
    ITINERARY,
    PARTY_THEMES,
    timeFormat,
    onPartyClick,
  }: PartiesTabProps) {
    // Track which card is currently expanded (only one at a time)
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

    // Pre-process party themes into a Map for O(1) lookups
    const partyThemesMap = useMemo(() => {
      const map = new Map<string, PartyTheme>();
      PARTY_THEMES.forEach(theme => {
        map.set(theme.key.toLowerCase(), theme);
      });
      return map;
    }, [PARTY_THEMES]);

    // Filter and organize party events by date with optimized processing
    const partyEventsByDate = useMemo(() => {
      // Pre-create itinerary map for O(1) lookups
      const itineraryMap = new Map<string, ItineraryStop>();
      ITINERARY.forEach(stop => {
        itineraryMap.set(stop.key, stop);
      });

      return SCHEDULED_DAILY.map(day => {
        // Filter only party events
        const partyEvents = day.items.filter(
          event => event.type === 'party' || event.type === 'after'
        );

        // Skip if no events
        if (partyEvents.length === 0) return null;

        // Sort events by time
        partyEvents.sort((a, b) => a.time.localeCompare(b.time));

        const itineraryStop = itineraryMap.get(day.key);

        return {
          key: day.key,
          date: itineraryStop?.date || day.key,
          port: itineraryStop?.port,
          events: partyEvents,
          totalEvents: partyEvents.length,
        };
      }).filter((day): day is NonNullable<typeof day> => day !== null && day.totalEvents > 0);
    }, [SCHEDULED_DAILY, ITINERARY]);

    // Memoized card toggle handler
    const handleCardToggle = useCallback((cardId: string) => {
      setExpandedCardId(prev => (prev === cardId ? null : cardId));
    }, []);

    return (
      <LazyMotion features={domAnimation}>
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center space-x-2 mb-6 -mt-2">
            <PartyPopper className="w-5 h-5 text-white/80" />
            <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">
              Party Schedule
            </h2>
          </div>

          {partyEventsByDate.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-10">
              {partyEventsByDate.map((day, dayIndex) => (
                <m.div
                  key={day.key}
                  custom={dayIndex}
                  initial="initial"
                  animate="animate"
                  variants={dayVariants}
                  className="space-y-4"
                >
                  <DateHeader date={day.date} port={day.port} />

                  <VirtualizedPartyGrid
                    events={day.events}
                    partyThemes={partyThemesMap}
                    timeFormat={timeFormat}
                    onPartyClick={onPartyClick}
                    expandedCardId={expandedCardId}
                    onCardToggle={handleCardToggle}
                    dayKey={day.key}
                    dayIndex={dayIndex}
                  />
                </m.div>
              ))}
            </div>
          )}
        </div>
      </LazyMotion>
    );
  },
  // Custom comparison to prevent re-renders
  (prevProps, nextProps) => {
    // Only re-render if data actually changed
    return (
      prevProps.SCHEDULED_DAILY === nextProps.SCHEDULED_DAILY &&
      prevProps.ITINERARY === nextProps.ITINERARY &&
      prevProps.PARTY_THEMES === nextProps.PARTY_THEMES &&
      prevProps.timeFormat === nextProps.timeFormat &&
      prevProps.onPartyClick === nextProps.onPartyClick
    );
  }
);
