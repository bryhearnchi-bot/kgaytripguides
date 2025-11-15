import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Circle,
  X,
  ChevronRight,
  CalendarDays,
  Info,
  User,
  Globe,
  Youtube,
  Linkedin,
  Link,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { formatTime } from '@/lib/timeFormat';
import { ReactiveBottomSheet } from '@/components/ui/ReactiveBottomSheet';

// Social media icon components
const InstagramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const TikTokIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const LinktreeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.953 15.066l-.038-4.51 4.58-4.17-.046-4.564-4.544 4.132-4.19-4.59-2.264 2.3 4.59 4.148-4.588 4.17 2.26 2.306 4.24-4.222zm8.047 0l4.24 4.222 2.26-2.306-4.588-4.17 4.59-4.148-2.264-2.3-4.19 4.59-4.544-4.132-.046 4.564 4.58 4.17-.038 4.51zm-4 6.934h4v-8h-4z" />
  </svg>
);

const getSocialIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <InstagramIcon />;
    case 'twitter':
    case 'x':
      return <XIcon />;
    case 'tiktok':
      return <TikTokIcon />;
    case 'youtube':
      return <Youtube className="w-5 h-5" />;
    case 'linkedin':
      return <Linkedin className="w-5 h-5" />;
    case 'linktree':
      return <LinktreeIcon />;
    case 'website':
      return <Globe className="w-5 h-5" />;
    default:
      return <Link className="w-5 h-5" />;
  }
};

export interface EventCardProps {
  event: {
    time: string;
    title: string;
    venue?: string;
    description?: string;
    imageUrl?: string;
    talent?: Array<{
      id: number;
      name: string;
      profileImageUrl?: string;
    }>;
    partyTheme?: {
      id: number;
      name: string;
      longDescription?: string;
      costumeIdeas?: string;
      imageUrl?: string;
    };
  };
  onTalentClick?: (name: string) => void;
  onPartyThemeClick?: (partyTheme: any) => void;
  className?: string;
  allSchedule?: Array<{
    key: string;
    date?: string;
    items: Array<{
      time: string;
      title: string;
      venue?: string;
      talent?: Array<{
        id: number;
        name: string;
        profileImageUrl?: string;
      }>;
    }>;
  }>;
  itinerary?: Array<{
    key: string;
    date?: string;
    port?: string;
  }>;
  allTalent?: Array<{
    id?: number;
    name: string;
    bio?: string;
    img?: string;
    profileImageUrl?: string;
    socialLinks?: any;
    social?: {
      instagram?: string;
      twitter?: string;
      tiktok?: string;
      website?: string;
      youtube?: string;
      linkedin?: string;
      linktree?: string;
    };
    website?: string;
    knownFor?: string;
    cat?: string;
  }>;
}

// Helper function to get category badge color
const getCategoryBadgeColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'headliners':
      return 'bg-amber-500/20 text-amber-200 border-amber-400/30';
    case 'comedy':
      return 'bg-green-500/20 text-green-200 border-green-400/30';
    case 'drag & variety':
      return 'bg-pink-500/20 text-pink-200 border-pink-400/30';
    case "dj's":
      return 'bg-blue-500/20 text-blue-200 border-blue-400/30';
    case 'piano bar / cabaret':
      return 'bg-rose-500/20 text-rose-200 border-rose-400/30';
    case 'shows':
      return 'bg-orange-500/20 text-orange-200 border-orange-400/30';
    case 'vocalists':
      return 'bg-cyan-500/20 text-cyan-200 border-cyan-400/30';
    default:
      return 'bg-purple-500/20 text-purple-200 border-purple-400/30';
  }
};

export const EventCard = memo<EventCardProps>(function EventCard({
  event,
  onTalentClick,
  onPartyThemeClick,
  className = '',
  allSchedule = [],
  itinerary = [],
  allTalent = [],
}) {
  const { timeFormat } = useTimeFormat();
  const [showEventInfoSlideUp, setShowEventInfoSlideUp] = useState(false);
  const [showArtistScheduleSlideUp, setShowArtistScheduleSlideUp] = useState(false);
  const [showArtistInfoSlideUp, setShowArtistInfoSlideUp] = useState(false);
  const [selectedArtistIndex, setSelectedArtistIndex] = useState<number | null>(null);

  // Lock body scroll when modals are open
  useEffect(() => {
    if (showEventInfoSlideUp || showArtistScheduleSlideUp || showArtistInfoSlideUp) {
      // Store current scroll position
      const scrollY = window.scrollY;

      // Lock scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        // Restore scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showEventInfoSlideUp, showArtistScheduleSlideUp, showArtistInfoSlideUp]);

  // Memoize computed values with fallback chain: event image → talent image → party theme image
  const eventImage = useMemo(
    () => event.imageUrl || event.talent?.[0]?.profileImageUrl || event.partyTheme?.imageUrl,
    [event.imageUrl, event.talent, event.partyTheme]
  );

  const hasArtists = useMemo(() => event.talent && event.talent.length > 0, [event.talent]);

  const hasPartyTheme = useMemo(() => !!event.partyTheme, [event.partyTheme]);

  const hasBoth = useMemo(() => hasArtists && hasPartyTheme, [hasArtists, hasPartyTheme]);

  // Get full talent data for event artists
  const fullTalentData = useMemo(() => {
    if (!hasArtists || !event.talent) return [];

    return event.talent.map(eventTalent => {
      const fullData = allTalent.find(t => t.name === eventTalent.name || t.id === eventTalent.id);
      return {
        ...eventTalent,
        bio: fullData?.bio || '',
        social: fullData?.social || fullData?.socialLinks || {},
        website: fullData?.website || fullData?.social?.website || '',
        knownFor: fullData?.knownFor || '',
        profileImageUrl:
          eventTalent.profileImageUrl || fullData?.img || fullData?.profileImageUrl || '',
        category: fullData?.cat || '',
      };
    });
  }, [hasArtists, event.talent, allTalent]);

  // Get the primary category for display (use first artist's category)
  const primaryCategory = useMemo(() => {
    if (fullTalentData.length > 0 && fullTalentData[0].category) {
      return fullTalentData[0].category;
    }
    return '';
  }, [fullTalentData]);

  // Get all OTHER events where any of the current event's artists appear (excluding current event)
  const otherArtistPerformances = useMemo(() => {
    if (!hasArtists || !event.talent) return [];

    const artistNames = event.talent.map(t => t.name);
    const schedule: Array<{ date: string; dateKey: string; events: any[] }> = [];

    allSchedule.forEach(day => {
      const matchingEvents = day.items.filter(item => {
        // Check if event has the same artist(s)
        const hasMatchingArtist = item.talent?.some(t => artistNames.includes(t.name));
        // Exclude the current event (same title and time)
        const isCurrentEvent = item.title === event.title && item.time === event.time;
        return hasMatchingArtist && !isCurrentEvent;
      });

      if (matchingEvents.length > 0) {
        const itineraryStop = itinerary.find(stop => stop.key === day.key);
        schedule.push({
          date: itineraryStop?.date || day.date || day.key,
          dateKey: day.key,
          events: matchingEvents,
        });
      }
    });

    return schedule;
  }, [hasArtists, event.talent, event.title, event.time, allSchedule, itinerary]);

  // Check if artist has other performances
  const hasOtherPerformances = useMemo(() => {
    return otherArtistPerformances.some(day => day.events.length > 0);
  }, [otherArtistPerformances]);

  const handleCardClick = useCallback(() => {
    // Always open the Event Info slide-up when clicking the card
    setShowEventInfoSlideUp(true);
  }, []);

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`bg-white/5 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg overflow-hidden ${className}`}
      >
        <div className="flex h-32">
          {/* Event/Artist Image - Takes up left third, full height */}
          {eventImage && (
            <div className="w-1/3 flex-shrink-0">
              <img
                src={eventImage}
                alt={event.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Event Details */}
          <div className="flex-1 flex flex-col justify-center min-w-0 p-4 relative">
            {/* Category Badge - Top Right Corner */}
            {(hasArtists || hasPartyTheme) && (
              <div className="absolute top-2 right-2 z-10">
                {/* Category Badge - for events with artists */}
                {hasArtists && primaryCategory && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryBadgeColor(primaryCategory)}`}
                  >
                    {primaryCategory}
                  </span>
                )}
                {/* Party Badge - for events with party themes (HARDCODED - remove when event categories are added to database) */}
                {hasPartyTheme && !hasArtists && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-200 text-xs font-medium border border-fuchsia-400/30">
                    Party
                  </span>
                )}
              </div>
            )}

            <div className="space-y-2 pt-4">
              {/* Event Title */}
              <div>
                <span className="text-white font-bold text-base line-clamp-1">{event.title}</span>
              </div>

              {/* Time • Venue on one line */}
              <div className="flex items-center gap-2">
                <span className="text-ocean-200 text-xs font-semibold">
                  {formatTime(event.time, timeFormat)}
                </span>
                <Circle className="w-1.5 h-1.5 fill-current text-ocean-300" />
                <span className="text-cyan-200 text-xs font-medium">{event.venue || 'TBD'}</span>
              </div>

              {/* Multiple Artists Badge */}
              {hasArtists && event.talent && event.talent.length > 1 && (
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 text-xs font-medium border border-purple-400/30">
                    <User className="w-3 h-3 mr-1" />
                    Multiple Artists
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="bg-white/5 border-t border-white/10 px-3 py-1.5">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={e => {
                e.stopPropagation();
                setShowEventInfoSlideUp(true);
              }}
              className="flex items-center justify-center gap-1.5 py-1 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/20 transition-all"
            >
              <Info className="w-3.5 h-3.5" />
              Event Info
            </button>
            {hasArtists && (
              <>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowArtistInfoSlideUp(true);
                  }}
                  className="flex items-center justify-center gap-1.5 py-1 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/20 transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  Artist Info
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowArtistScheduleSlideUp(true);
                  }}
                  className="flex items-center justify-center gap-1.5 py-1 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/20 transition-all"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>
                    Other<span className="hidden sm:inline"> Times</span>
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Event Info Slide-Up Card */}
      <ReactiveBottomSheet
        open={showEventInfoSlideUp}
        onOpenChange={setShowEventInfoSlideUp}
        title="Event Info"
        icon={Info}
        subtitle={
          hasArtists && primaryCategory ? (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryBadgeColor(primaryCategory)}`}
            >
              {primaryCategory}
            </span>
          ) : hasPartyTheme ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-200 text-xs font-medium border border-fuchsia-400/30">
              Party
            </span>
          ) : null
        }
      >
        <div className="space-y-6">
          {event.partyTheme ? (
            /* Party Theme Event - Show party theme as main content */
            <>
              {/* Party Theme Image */}
              {event.partyTheme.imageUrl && (
                <div className="w-full">
                  <img
                    src={event.partyTheme.imageUrl}
                    alt={event.partyTheme.name}
                    className="w-full aspect-video object-cover rounded-xl border-2 border-blue-400/30 shadow-lg"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Party Theme Name */}
              <h2 className="text-2xl font-bold text-white">{event.partyTheme.name}</h2>

              {/* Time and Venue */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-full bg-ocean-500/20 text-ocean-200 text-sm font-medium border border-ocean-400/30">
                  {formatTime(event.time, timeFormat)}
                </span>
                {event.venue && (
                  <span className="px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-200 text-sm font-medium border border-cyan-400/30">
                    {event.venue}
                  </span>
                )}
              </div>

              {/* Long Description */}
              {event.partyTheme.longDescription && (
                <div>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {event.partyTheme.longDescription}
                  </p>
                </div>
              )}

              {/* Costume Ideas */}
              {event.partyTheme.costumeIdeas && (
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-2">
                    Costume Ideas
                  </h4>
                  <p className="text-white/80 text-sm leading-relaxed">
                    {event.partyTheme.costumeIdeas}
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Regular Event - Show event info */
            <div className="flex flex-col md:flex-row-reverse gap-6">
              {/* Event Image */}
              {eventImage && (
                <div className="w-full md:w-64 md:flex-shrink-0">
                  <img
                    src={eventImage}
                    alt={event.title}
                    className="w-full aspect-square object-cover rounded-xl border-2 border-cyan-400/30 shadow-lg"
                    loading="lazy"
                  />
                </div>
              )}

              {/* Event Details */}
              <div className="flex-1">
                {/* Event Name */}
                <h2 className="text-2xl font-bold mb-4 text-white">{event.title}</h2>

                {/* Time and Venue */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-ocean-500/20 text-ocean-200 text-sm font-medium border border-ocean-400/30">
                    {formatTime(event.time, timeFormat)}
                  </span>
                  {event.venue && (
                    <span className="px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-200 text-sm font-medium border border-cyan-400/30">
                      {event.venue}
                    </span>
                  )}
                </div>

                {/* Description */}
                {event.description && (
                  <div className="mb-6">
                    <p className="text-blue-50 text-sm leading-relaxed">{event.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </ReactiveBottomSheet>

      {/* Other Performance Times Slide-Up Card */}
      <ReactiveBottomSheet
        open={showArtistScheduleSlideUp}
        onOpenChange={setShowArtistScheduleSlideUp}
        title="Other Performance Times"
        icon={CalendarDays}
      >
        <div className="space-y-6">
          {/* Artist Info with Photo - No Background */}
          {event.talent && event.talent.length > 0 && (
            <div className="space-y-4 mb-6">
              {event.talent.map((artist, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  {artist.profileImageUrl && (
                    <img
                      src={artist.profileImageUrl}
                      alt={artist.name}
                      className="w-20 h-20 rounded-lg object-cover border border-purple-400/30"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{artist.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Other Performance Times */}
          {otherArtistPerformances.length > 0 ? (
            <div className="space-y-2">
              {otherArtistPerformances.map(day => (
                <div key={day.dateKey}>
                  {/* Events for this date */}
                  {day.events.map((evt, evtIdx) => (
                    <div
                      key={evtIdx}
                      className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all mb-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm mb-1">{evt.title}</p>
                          <p className="text-white/60 text-xs">
                            {formatTime(evt.time, timeFormat)} • {evt.venue || 'TBD'}
                          </p>
                        </div>
                        <div className="ml-3">
                          <div className="inline-flex items-center px-2.5 py-1 bg-purple-500/20 rounded-full border border-purple-400/30">
                            <span className="text-xs font-semibold text-white whitespace-nowrap">
                              {day.date}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/60 text-sm italic">No additional performances scheduled.</p>
          )}
        </div>
      </ReactiveBottomSheet>

      {/* Artist Info Slide-Up Card */}
      <ReactiveBottomSheet
        open={showArtistInfoSlideUp}
        onOpenChange={open => {
          setShowArtistInfoSlideUp(open);
          if (!open) setSelectedArtistIndex(null);
        }}
        title={
          selectedArtistIndex !== null
            ? fullTalentData[selectedArtistIndex]?.name || 'Artist Info'
            : fullTalentData.length === 1
              ? fullTalentData[0]?.name || 'Artist Info'
              : 'Select Artist'
        }
        icon={User}
        subtitle={
          selectedArtistIndex !== null
            ? fullTalentData[selectedArtistIndex]?.cat && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryBadgeColor(fullTalentData[selectedArtistIndex].cat)}`}
                >
                  {fullTalentData[selectedArtistIndex].cat}
                </span>
              )
            : fullTalentData.length === 1 &&
              fullTalentData[0]?.cat && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryBadgeColor(fullTalentData[0].cat)}`}
                >
                  {fullTalentData[0].cat}
                </span>
              )
        }
      >
        <div className="space-y-6">
          {fullTalentData.length > 0 && (
            <>
              {/* Multiple artists - show selection or detail view */}
              {fullTalentData.length > 1 && selectedArtistIndex === null ? (
                /* Artist Selection Grid */
                <div className="space-y-3">
                  <p className="text-white/60 text-sm">Tap an artist to view their info:</p>
                  <div className="grid grid-cols-1 gap-3">
                    {fullTalentData.map((artist, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedArtistIndex(idx)}
                        className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-purple-400/30 transition-all text-left"
                      >
                        {artist.profileImageUrl && (
                          <img
                            src={artist.profileImageUrl}
                            alt={artist.name}
                            className="w-16 h-16 rounded-lg object-cover border border-purple-400/30 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-white truncate">{artist.name}</h3>
                          {artist.knownFor && (
                            <p className="text-purple-300 text-xs font-medium truncate">
                              {artist.knownFor}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Single artist or selected artist detail view */
                <div className="space-y-4">
                  {/* Back button for multiple artists */}
                  {fullTalentData.length > 1 && selectedArtistIndex !== null && (
                    <button
                      onClick={() => setSelectedArtistIndex(null)}
                      className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Back to all artists
                    </button>
                  )}

                  {(() => {
                    const artist =
                      selectedArtistIndex !== null
                        ? fullTalentData[selectedArtistIndex]
                        : fullTalentData[0];
                    return (
                      <>
                        {/* Artist Photo - Large Square */}
                        {artist.profileImageUrl && (
                          <div className="w-full">
                            <img
                              src={artist.profileImageUrl}
                              alt={artist.name}
                              className="w-full aspect-square object-cover rounded-xl border-2 border-purple-400/30 shadow-lg"
                              loading="lazy"
                            />
                          </div>
                        )}

                        {/* Known For */}
                        {artist.knownFor && (
                          <p className="text-purple-300 text-sm font-medium">{artist.knownFor}</p>
                        )}

                        {/* Bio */}
                        {artist.bio && (
                          <div>
                            <p className="text-white/80 text-sm leading-relaxed">{artist.bio}</p>
                          </div>
                        )}

                        {/* Social Links */}
                        {(artist.website ||
                          (artist.social && Object.keys(artist.social).length > 0)) && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
                              Connect
                            </h4>
                            <div className="flex items-center gap-3">
                              {artist.website && !artist.social?.website && (
                                <a
                                  href={artist.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-white/70 hover:text-white transition-colors"
                                  onClick={e => e.stopPropagation()}
                                  aria-label="Website"
                                >
                                  <Globe className="w-6 h-6" />
                                </a>
                              )}
                              {artist.social &&
                                typeof artist.social === 'object' &&
                                Object.entries(artist.social).map(
                                  ([platform, url]) =>
                                    url && (
                                      <a
                                        key={platform}
                                        href={url as string}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white/70 hover:text-white transition-colors"
                                        onClick={e => e.stopPropagation()}
                                        aria-label={platform === 'twitter' ? 'X' : platform}
                                      >
                                        {getSocialIcon(platform)}
                                      </a>
                                    )
                                )}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      </ReactiveBottomSheet>
    </>
  );
});
