import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { Circle, ChevronRight, CalendarDays, Info, User, Globe } from 'lucide-react';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { formatTime, formatDateKey } from '@/lib/timeFormat';
import { ReactiveBottomSheet } from '@/components/ui/ReactiveBottomSheet';
import { getOptimizedImageUrl, IMAGE_PRESETS } from '@/lib/image-utils';
import { getSocialIcon } from '@/components/ui/SocialIcons';
import { CardActionButton } from '@/components/ui/CardActionButton';

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
    return undefined;
  }, [showEventInfoSlideUp, showArtistScheduleSlideUp, showArtistInfoSlideUp]);

  // Memoize computed values with fallback chain: event image → talent image → party theme image
  const eventImage = useMemo(
    () => event.imageUrl || event.talent?.[0]?.profileImageUrl || event.partyTheme?.imageUrl,
    [event.imageUrl, event.talent, event.partyTheme]
  );

  // Optimized image URLs for card and modal display
  const cardImageUrl = useMemo(
    () => (eventImage ? getOptimizedImageUrl(eventImage, IMAGE_PRESETS.card) : undefined),
    [eventImage]
  );

  // Modal image URL for larger display in slide-up sheets (600x600)
  const modalImageUrl = useMemo(
    () => (eventImage ? getOptimizedImageUrl(eventImage, IMAGE_PRESETS.modal) : undefined),
    [eventImage]
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
    if (fullTalentData.length > 0 && fullTalentData[0]?.category) {
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
          date: itineraryStop?.date || day.date || formatDateKey(day.key),
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
          {cardImageUrl && (
            <div className="w-1/3 flex-shrink-0">
              <img
                src={cardImageUrl}
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
            <CardActionButton
              icon={<Info className="w-3.5 h-3.5" />}
              label="Event Info"
              onClick={() => setShowEventInfoSlideUp(true)}
            />
            {hasArtists && (
              <>
                <CardActionButton
                  icon={<User className="w-3.5 h-3.5" />}
                  label="Artist Info"
                  onClick={() => setShowArtistInfoSlideUp(true)}
                />
                <CardActionButton
                  icon={<CalendarDays className="w-3.5 h-3.5" />}
                  label={
                    <>
                      <span>Other</span>
                      <span className="hidden sm:inline"> Times</span>
                    </>
                  }
                  onClick={() => setShowArtistScheduleSlideUp(true)}
                />
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
                    src={getOptimizedImageUrl(event.partyTheme.imageUrl, IMAGE_PRESETS.card)}
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
              {modalImageUrl && (
                <div className="w-full md:w-64 md:flex-shrink-0">
                  <img
                    src={modalImageUrl}
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
                      src={getOptimizedImageUrl(artist.profileImageUrl, IMAGE_PRESETS.thumbnail)}
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
            ? fullTalentData[selectedArtistIndex]?.category && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryBadgeColor(fullTalentData[selectedArtistIndex].category)}`}
                >
                  {fullTalentData[selectedArtistIndex].category}
                </span>
              )
            : fullTalentData.length === 1 &&
              fullTalentData[0]?.category && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryBadgeColor(fullTalentData[0].category)}`}
                >
                  {fullTalentData[0].category}
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
                            src={getOptimizedImageUrl(
                              artist.profileImageUrl,
                              IMAGE_PRESETS.thumbnail
                            )}
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
                    if (!artist) return null;
                    return (
                      <>
                        {/* Artist Photo - Large Square */}
                        {artist.profileImageUrl && (
                          <div className="w-full">
                            <img
                              src={getOptimizedImageUrl(
                                artist.profileImageUrl,
                                IMAGE_PRESETS.modal
                              )}
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
