import React, { memo, useCallback, useState, useMemo, useEffect, useRef } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  MapPin,
  PartyPopper,
  Filter,
  Info,
  Shirt,
} from 'lucide-react';
import { EventCard } from '../shared/EventCard';
import { PartyCard } from '../shared/PartyCard';
import { isDateInPast } from '../utils/dateHelpers';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { formatTime as globalFormatTime } from '@/lib/timeFormat';
import type { Talent } from '@/data/trip-data';
import { TabHeader } from '../shared/TabHeader';
import { api } from '@/lib/api-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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
  initialSubTab?: 'schedule' | 'parties';
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
  initialSubTab = 'schedule',
}: ScheduleTabProps) {
  const { timeFormat } = useTimeFormat();
  const [subTab, setSubTab] = useState<'schedule' | 'parties'>(initialSubTab);
  const [partyThemes, setPartyThemes] = useState<any[]>([]);
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('All Dates');
  const [selectedPartyDate, setSelectedPartyDate] = useState<string>('All Dates');
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const [selectedParty, setSelectedParty] = useState<any | null>(null);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showCostumeSheet, setShowCostumeSheet] = useState(false);

  // Update subTab when initialSubTab prop changes
  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  // Scroll to top when sub-tab changes
  useEffect(() => {
    // Try multiple methods to ensure scrolling works
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    // Reset sticky state when changing tabs
    setIsHeaderSticky(false);
  }, [subTab]);

  // Measure header height for placeholder
  useEffect(() => {
    if (headerRef.current) {
      const height = headerRef.current.offsetHeight;
      setHeaderHeight(height);
    }
  }, [subTab]);

  // Handle sticky header on scroll
  useEffect(() => {
    // Find the actual scrolling container (could be window or a parent element)
    const findScrollContainer = () => {
      let element = placeholderRef.current?.parentElement;
      while (element) {
        const style = window.getComputedStyle(element);
        if (
          style.overflow === 'auto' ||
          style.overflow === 'scroll' ||
          style.overflowY === 'auto' ||
          style.overflowY === 'scroll'
        ) {
          return element;
        }
        element = element.parentElement;
      }
      return null;
    };

    scrollContainerRef.current = findScrollContainer();

    const handleScroll = () => {
      if (!placeholderRef.current) return;

      const placeholderRect = placeholderRef.current.getBoundingClientRect();
      // When the placeholder's top goes above the viewport (or near top), make header sticky
      const shouldBeSticky = placeholderRect.top <= 0;

      if (shouldBeSticky !== isHeaderSticky) {
        setIsHeaderSticky(shouldBeSticky);
      }
    };

    // Listen on both window and any scroll container
    window.addEventListener('scroll', handleScroll, { passive: true });
    if (scrollContainerRef.current) {
      scrollContainerRef.current.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Also listen for touchmove as backup for mobile
    window.addEventListener('touchmove', handleScroll, { passive: true });

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isHeaderSticky]);

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

  // Filter schedule by selected date
  const filteredSchedule = useMemo(() => {
    if (selectedDate === 'All Dates') {
      return SCHEDULED_DAILY;
    }
    return SCHEDULED_DAILY.filter(day => day.key === selectedDate);
  }, [SCHEDULED_DAILY, selectedDate]);

  // Create date options for dropdown
  const dateOptions = useMemo(() => {
    return SCHEDULED_DAILY.map(day => {
      const itineraryStop = ITINERARY.find(stop => stop.key === day.key);
      return {
        key: day.key,
        label: itineraryStop?.date || day.key,
        port: itineraryStop?.port,
      };
    });
  }, [SCHEDULED_DAILY, ITINERARY]);

  // Filter parties by selected date
  const filteredPartyEvents = useMemo(() => {
    if (selectedPartyDate === 'All Dates') {
      return partyEventsByDate;
    }
    return partyEventsByDate.filter(day => day.key === selectedPartyDate);
  }, [partyEventsByDate, selectedPartyDate]);

  // Create date options for parties dropdown
  const partyDateOptions = useMemo(() => {
    return partyEventsByDate.map(day => {
      return {
        key: day.key,
        label: day.date,
        port: day.port,
      };
    });
  }, [partyEventsByDate]);

  return (
    <div className="relative">
      {/* Placeholder to maintain space when header becomes fixed */}
      <div
        ref={placeholderRef}
        className="relative"
        style={{ minHeight: isHeaderSticky ? headerHeight : 'auto' }}
      >
        {/* Header: Tab bar on left, filter on right - becomes fixed when scrolled */}
        <div
          ref={headerRef}
          className={`pb-4 pt-2 ${isHeaderSticky ? 'fixed top-0 left-0 right-0 z-50 px-4' : ''}`}
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between gap-4">
              {/* Sub-tabs on the left */}
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-full p-1 inline-flex gap-1">
                <button
                  onClick={() => setSubTab('schedule')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    subTab === 'schedule'
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Schedule
                </button>
                <button
                  onClick={() => setSubTab('parties')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    subTab === 'parties'
                      ? 'bg-pink-500/30 text-white'
                      : 'text-pink-300 hover:text-pink-200'
                  }`}
                >
                  <PartyPopper className="w-3.5 h-3.5" />
                  Parties
                </button>
              </div>

              {/* Date filter on the right */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors duration-200 border border-white/30 hover:border-white/50">
                    <Filter className="w-3 h-3" />
                    <span>
                      {subTab === 'schedule'
                        ? selectedDate === 'All Dates'
                          ? 'Select Date'
                          : dateOptions.find(opt => opt.key === selectedDate)?.label || selectedDate
                        : selectedPartyDate === 'All Dates'
                          ? 'Select Date'
                          : partyDateOptions.find(opt => opt.key === selectedPartyDate)?.label ||
                            selectedPartyDate}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-[#002147] border-white/20 min-w-[280px]"
                >
                  {subTab === 'schedule' ? (
                    <>
                      <DropdownMenuItem
                        onClick={() => setSelectedDate('All Dates')}
                        className={`cursor-pointer text-white hover:bg-white/10 ${
                          selectedDate === 'All Dates' ? 'bg-white/20' : ''
                        }`}
                      >
                        <CalendarDays className="w-4 h-4 mr-2" />
                        All Dates
                      </DropdownMenuItem>
                      {dateOptions.map(option => {
                        const isActive = selectedDate === option.key;
                        return (
                          <DropdownMenuItem
                            key={option.key}
                            onClick={() => setSelectedDate(option.key)}
                            className={`cursor-pointer text-white hover:bg-white/10 ${
                              isActive ? 'bg-white/20' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{option.label}</span>
                              {option.port && (
                                <>
                                  <span className="text-white/40">•</span>
                                  <span className="text-white/70">{option.port}</span>
                                </>
                              )}
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={() => setSelectedPartyDate('All Dates')}
                        className={`cursor-pointer text-white hover:bg-white/10 ${
                          selectedPartyDate === 'All Dates' ? 'bg-white/20' : ''
                        }`}
                      >
                        <CalendarDays className="w-4 h-4 mr-2" />
                        All Dates
                      </DropdownMenuItem>
                      {partyDateOptions.map(option => {
                        const isActive = selectedPartyDate === option.key;
                        return (
                          <DropdownMenuItem
                            key={option.key}
                            onClick={() => setSelectedPartyDate(option.key)}
                            className={`cursor-pointer text-white hover:bg-white/10 ${
                              isActive ? 'bg-white/20' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{option.label}</span>
                              {option.port && (
                                <>
                                  <span className="text-white/40">•</span>
                                  <span className="text-white/70">{option.port}</span>
                                </>
                              )}
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {subTab === 'schedule' ? (
        <div className="max-w-6xl mx-auto space-y-8">
          {filteredSchedule.length === 0 ? (
            <div className="bg-white/10 rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
              <CalendarDays className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No events found</h3>
              <p className="text-white/70">No events are currently scheduled.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredSchedule.map(day => {
                const itineraryStop = ITINERARY.find(stop => stop.key === day.key);

                return (
                  <div key={day.key} className="space-y-4">
                    {/* Compact Date Header */}
                    <div className="flex items-center gap-2 pb-2 mb-1">
                      <CalendarDays className="w-4 h-4 text-purple-400" />
                      <h3 className="text-sm font-semibold text-white">
                        {itineraryStop?.date || day.key}
                      </h3>
                      <div className="flex-1 h-px bg-white/20 mx-3"></div>
                      {itineraryStop && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-blue-300" />
                          <span className="text-sm text-white/70 font-medium">
                            {itineraryStop.port}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Event Cards */}
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
                            allSchedule={SCHEDULED_DAILY}
                            itinerary={ITINERARY}
                            allTalent={TALENT}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-8">
          {filteredPartyEvents.length === 0 && partyEventsByDate.length === 0 ? (
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
                          <div key={theme.id}>
                            {/* Party Image Container */}
                            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 overflow-hidden">
                              {theme.imageUrl && (
                                <img
                                  src={theme.imageUrl}
                                  alt={theme.name}
                                  className="w-full h-48 object-cover"
                                  loading="lazy"
                                />
                              )}
                            </div>
                            {/* Buttons - No background, sitting on page */}
                            <div className="px-3 py-1.5">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedParty(theme);
                                    setShowInfoSheet(true);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                  Party Info
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedParty(theme);
                                    setShowCostumeSheet(true);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                                >
                                  <Shirt className="w-3.5 h-3.5" />
                                  Costume Ideas
                                </button>
                              </div>
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
                          <div key={theme.id}>
                            {/* Party Image Container */}
                            <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 overflow-hidden">
                              {theme.imageUrl && (
                                <img
                                  src={theme.imageUrl}
                                  alt={theme.name}
                                  className="w-full h-48 object-cover"
                                  loading="lazy"
                                />
                              )}
                            </div>
                            {/* Buttons - No background, sitting on page */}
                            <div className="px-3 py-1.5">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedParty(theme);
                                    setShowInfoSheet(true);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                  Party Info
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedParty(theme);
                                    setShowCostumeSheet(true);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-1 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                                >
                                  <Shirt className="w-3.5 h-3.5" />
                                  Costume Ideas
                                </button>
                              </div>
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
          ) : filteredPartyEvents.length === 0 ? (
            <div className="bg-white/10 rounded-md p-6 shadow-sm text-center py-8 border border-white/20">
              <PartyPopper className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No parties found</h3>
              <p className="text-white/70">No parties scheduled for this date.</p>
            </div>
          ) : (
            <div className="space-y-10">
              {filteredPartyEvents.map(day => (
                <div key={day.key} className="space-y-4">
                  {/* Compact Date Header */}
                  <div className="flex items-center gap-2 pb-2 mb-1">
                    <CalendarDays className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-white">{day.date}</h3>
                    <div className="flex-1 h-px bg-white/20 mx-3"></div>
                    {day.port && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-300" />
                        <span className="text-sm text-white/70 font-medium">{day.port}</span>
                      </div>
                    )}
                  </div>

                  {/* Party Cards Grid - 2 columns max */}
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
      )}

      {/* Party Info Sheet */}
      <Sheet open={showInfoSheet} onOpenChange={setShowInfoSheet}>
        <SheetContent
          side="bottom"
          className="bg-[#002147] border-white/10 text-white h-[70vh] rounded-t-2xl"
        >
          <SheetHeader className="pb-4 border-b border-white/10">
            <SheetTitle className="text-white text-xl font-bold">{selectedParty?.name}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(70vh-120px)]">
            {selectedParty?.shortDescription && (
              <p className="text-white/90 text-base leading-relaxed">
                {selectedParty.shortDescription}
              </p>
            )}
            {selectedParty?.longDescription && (
              <p className="text-white/80 text-sm leading-relaxed">
                {selectedParty.longDescription}
              </p>
            )}
            {!selectedParty?.shortDescription && !selectedParty?.longDescription && (
              <p className="text-white/60 text-center py-8">No party information available yet.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Costume Ideas Sheet */}
      <Sheet open={showCostumeSheet} onOpenChange={setShowCostumeSheet}>
        <SheetContent
          side="bottom"
          className="bg-[#002147] border-white/10 text-white h-[70vh] rounded-t-2xl"
        >
          <SheetHeader className="pb-4 border-b border-white/10">
            <SheetTitle className="text-white text-xl font-bold flex items-center gap-2">
              <Shirt className="w-5 h-5 text-pink-300" />
              Costume Ideas for {selectedParty?.name}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4 overflow-y-auto max-h-[calc(70vh-120px)]">
            {selectedParty?.costumeIdeas ? (
              <p className="text-white/90 text-base leading-relaxed">
                {selectedParty.costumeIdeas}
              </p>
            ) : (
              <p className="text-white/60 text-center py-8">No costume ideas available yet.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
});
