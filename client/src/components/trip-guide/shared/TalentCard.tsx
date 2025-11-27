import React, { memo, useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  LucideIcon,
  User,
  CalendarDays,
  Globe,
  Youtube,
  Linkedin,
  Link,
} from 'lucide-react';
import type { Talent } from '@/data/trip-data';
import { ReactiveBottomSheet } from '@/components/ui/ReactiveBottomSheet';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { formatTime } from '@/lib/timeFormat';

// Helper function to format dateKey (YYYY-MM-DD) to readable format (Thu, Nov 15)
function formatDateKey(dateKey: string): string {
  // Parse YYYY-MM-DD without timezone conversion
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return dateKey;

  const date = new Date(year, month - 1, day);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

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
          <button
            onClick={e => {
              e.stopPropagation();
              setShowArtistInfoSlideUp(true);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/20 transition-all"
          >
            <User className="w-3.5 h-3.5" />
            Artist Info
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              setShowArtistScheduleSlideUp(true);
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/20 transition-all"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Schedule
          </button>
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
