import React, { memo, useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, User, CalendarDays, Globe } from 'lucide-react';
import type { Talent } from '@/data/trip-data';
import { ReactiveBottomSheet } from '@/components/ui/ReactiveBottomSheet';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { formatTime, formatDateKey } from '@/lib/timeFormat';
import { getSocialIcon } from '@/components/ui/SocialIcons';
import { CardActionButton } from '@/components/ui/CardActionButton';

// Helper function to get category badge color - matches EventCard colors
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

interface TalentCardProps {
  talent: Talent;
  onClick: () => void;
  delay?: number;
  categoryIcon?: LucideIcon;
  hideCategoryBadge?: boolean;
  useYellowBadge?: boolean;
  disableAnimation?: boolean;
  scheduledDaily?: Array<{
    key: string;
    date?: string;
    items: Array<{
      time: string;
      title: string;
      venue: string;
      talent?: Array<{ name: string }>;
    }>;
  }>;
  itinerary?: Array<{
    key: string;
    date?: string;
    port?: string;
  }>;
}

export const TalentCard = memo<TalentCardProps>(function TalentCard({
  talent,
  onClick,
  delay = 0,
  categoryIcon: CategoryIcon,
  hideCategoryBadge = false,
  useYellowBadge = false,
  disableAnimation = false,
  scheduledDaily = [],
  itinerary = [],
}) {
  const { timeFormat } = useTimeFormat();
  const [showArtistInfoSlideUp, setShowArtistInfoSlideUp] = useState(false);
  const [showArtistScheduleSlideUp, setShowArtistScheduleSlideUp] = useState(false);

  // Lock body scroll when modals are open
  useEffect(() => {
    if (showArtistInfoSlideUp || showArtistScheduleSlideUp) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
    return undefined;
  }, [showArtistInfoSlideUp, showArtistScheduleSlideUp]);

  // Get all performances for this talent
  const artistPerformances = useMemo(() => {
    const performances: Array<{
      dateKey: string;
      date: string;
      events: Array<{
        time: string;
        title: string;
        venue: string;
      }>;
    }> = [];

    scheduledDaily.forEach(day => {
      const eventsForArtist = day.items.filter(item =>
        item.talent?.some(t => t.name === talent.name)
      );

      if (eventsForArtist.length > 0) {
        // Find the formatted date from itinerary
        const itineraryDay = itinerary.find(it => it.key === day.key);
        // Use itinerary date, then day.date, then format the key if needed
        const formattedDate = itineraryDay?.date || day.date || formatDateKey(day.key);

        performances.push({
          dateKey: day.key,
          date: formattedDate,
          events: eventsForArtist.map(evt => ({
            time: evt.time,
            title: evt.title,
            venue: evt.venue,
          })),
        });
      }
    });

    return performances;
  }, [scheduledDaily, itinerary, talent.name]);

  const cardClassName =
    'group relative bg-white/5 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300';

  const cardContent = (
    <>
      <div className="flex flex-row">
        {/* Left: Artist Image - Square aspect ratio */}
        <div className="relative w-32 sm:w-40 md:w-48 aspect-square flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
          <img
            src={talent.img}
            alt={talent.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={e => {
              e.currentTarget.src = 'https://via.placeholder.com/300x300?text=No+Image';
            }}
          />
        </div>

        {/* Right: Content */}
        <div className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col min-w-0 relative">
          {/* Talent Type Badge - Top Right Corner */}
          {!hideCategoryBadge && (
            <div className="absolute top-2 right-2 z-10">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  useYellowBadge
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-yellow-400/50'
                    : getCategoryBadgeColor(talent.cat)
                }`}
              >
                {CategoryIcon && <CategoryIcon className="w-3 h-3" />}
                {talent.cat}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col justify-center pt-6">
            {/* Artist Name */}
            <h3 className="text-white font-bold text-base sm:text-lg mb-1.5 sm:mb-2 group-hover:text-ocean-200 transition-colors">
              {talent.name}
            </h3>

            {/* Bio - Small font underneath name */}
            {talent.bio && (
              <p className="text-white/70 text-xs leading-relaxed line-clamp-3 mb-2">
                {talent.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white/5 border-t border-white/10 px-3 py-1.5">
        <div className="flex gap-2">
          <CardActionButton
            icon={<User className="w-3.5 h-3.5" />}
            label="Artist Info"
            onClick={() => setShowArtistInfoSlideUp(true)}
            className="flex-1"
          />
          <CardActionButton
            icon={<CalendarDays className="w-3.5 h-3.5" />}
            label="Schedule"
            onClick={() => setShowArtistScheduleSlideUp(true)}
            className="flex-1"
          />
        </div>
      </div>
    </>
  );

  const slideUps = (
    <>
      {/* Artist Info Slide-Up */}
      <ReactiveBottomSheet
        open={showArtistInfoSlideUp}
        onOpenChange={setShowArtistInfoSlideUp}
        title={talent.name}
        icon={User}
        subtitle={
          talent.cat && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryBadgeColor(talent.cat)}`}
            >
              {talent.cat}
            </span>
          )
        }
      >
        <div className="space-y-4">
          {/* Artist Photo - Large Square */}
          {talent.img && (
            <div className="w-full">
              <img
                src={talent.img}
                alt={talent.name}
                className="w-full aspect-square object-cover rounded-xl border-2 border-purple-400/30 shadow-lg"
                loading="lazy"
              />
            </div>
          )}

          {/* Known For */}
          {talent.knownFor && (
            <p className="text-purple-300 text-sm font-medium">{talent.knownFor}</p>
          )}

          {/* Bio */}
          {talent.bio && (
            <div>
              <p className="text-white/80 text-sm leading-relaxed">{talent.bio}</p>
            </div>
          )}

          {/* Social Links */}
          {(talent.social?.website || (talent.social && Object.keys(talent.social).length > 0)) && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wide">
                Connect
              </h4>
              <div className="flex items-center gap-3">
                {talent.social?.website && (
                  <a
                    href={talent.social.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/70 hover:text-white transition-colors"
                    onClick={e => e.stopPropagation()}
                    aria-label="Website"
                  >
                    <Globe className="w-6 h-6" />
                  </a>
                )}
                {talent.social &&
                  typeof talent.social === 'object' &&
                  Object.entries(talent.social).map(
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
        </div>
      </ReactiveBottomSheet>

      {/* Artist Schedule Slide-Up */}
      <ReactiveBottomSheet
        open={showArtistScheduleSlideUp}
        onOpenChange={setShowArtistScheduleSlideUp}
        title="Artist Schedule"
        icon={CalendarDays}
      >
        <div className="space-y-6">
          {/* Artist Info with Photo */}
          <div className="flex items-center gap-4">
            {talent.img && (
              <img
                src={talent.img}
                alt={talent.name}
                className="w-20 h-20 rounded-lg object-cover border border-purple-400/30"
              />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">{talent.name}</h3>
            </div>
          </div>

          {/* All Performance Times */}
          {artistPerformances.length > 0 ? (
            <div className="space-y-2">
              {artistPerformances.map(day => (
                <div key={day.dateKey}>
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
            <p className="text-white/60 text-sm">
              This artist is scheduled to perform. Dates and times will be available soon. Check
              your cruise line app for the latest scheduling updates.
            </p>
          )}
        </div>
      </ReactiveBottomSheet>
    </>
  );

  if (disableAnimation) {
    return (
      <>
        <div className={cardClassName}>{cardContent}</div>
        {slideUps}
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        className={cardClassName}
      >
        {cardContent}
      </motion.div>
      {slideUps}
    </>
  );
});
