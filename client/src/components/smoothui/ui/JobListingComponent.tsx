import { useEffect, useRef, useState, type JSX } from 'react';
import type { SVGProps } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useOnClickOutside } from 'usehooks-ts';
import {
  Circle,
  MapPin,
  Sparkles,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  Globe,
  Music,
  X,
} from 'lucide-react';

export interface LocationAttraction {
  id: number;
  locationId: number;
  name: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  websiteUrl?: string;
  orderIndex: number;
}

export interface LocationLgbtVenue {
  id: number;
  locationId: number;
  name: string;
  venueType?: string;
  description?: string;
  address?: string;
  imageUrl?: string;
  websiteUrl?: string;
  orderIndex: number;
}

export interface Job {
  company: string;
  title: string;
  logo: React.ReactNode;
  job_description: string;
  salary: string;
  location: string;
  remote: string;
  job_time: string;
  dayNumber?: number;
  attractions?: LocationAttraction[];
  lgbtVenues?: LocationLgbtVenue[];
  events?: any[]; // Events for this day
  talent?: any[]; // Talent list for the trip
}

export interface JobListingComponentProps {
  jobs: Job[];
  className?: string;
  onJobClick?: (job: Job) => void;
  onViewEvents?: (dateKey: string, portName: string) => void;
  scheduledDaily?: any[]; // Full SCHEDULED_DAILY data
  talent?: any[]; // Full TALENT list
}

export const Resend = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 600 600"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M186 447.471V154H318.062C336.788 154 353.697 158.053 368.79 166.158C384.163 174.263 396.181 185.443 404.845 199.698C413.51 213.672 417.842 229.604 417.842 247.491C417.842 265.938 413.51 282.568 404.845 297.381C396.181 311.915 384.302 323.375 369.209 331.759C354.117 340.144 337.067 344.337 318.062 344.337H253.917V447.471H186ZM348.667 447.471L274.041 314.99L346.99 304.509L430 447.471H348.667ZM253.917 289.835H311.773C319.04 289.835 325.329 288.298 330.639 285.223C336.229 281.869 340.421 277.258 343.216 271.388C346.291 265.519 347.828 258.811 347.828 251.265C347.828 243.718 346.151 237.15 342.797 231.56C339.443 225.691 334.552 221.219 328.124 218.144C321.975 215.07 314.428 213.533 305.484 213.533H253.917V289.835Z"
      fill="inherit"
    />
  </svg>
);

export const Turso = (props: SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="1em"
    viewBox="0 0 201 170"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="m100.055 170c-2.1901 0-18.2001-12.8-21.3001-16.45-2.44 3.73-6.44 7.96-6.44 7.96-11.05-5.57-25.17-20.06-27.83-25.13-2.62-5-12.13-62.58-12.39-79.3-.34-9.41 5.85-28.49 67.9601-28.49 62.11 0 68.29 19.08 67.96 28.49-.25 16.72-9.76 74.3-12.39 79.3-2.66 5.07-16.78 19.56-27.83 25.13 0 0-4-4.23-6.44-7.96-3.1 3.65-19.11 16.45-21.3 16.45z"
      fill="#1ebca1"
    />
    <path
      d="m100.055 132.92c-20.7301 0-33.9601-10.95-33.9601-10.95l1.91-26.67-21.75-1.94-3.91-31.55h115.4301l-3.91 31.55-21.75 1.94 1.91 26.67s-13.23 10.95-33.96 10.95z"
      fill="#183134"
    />
    <path
      d="m121.535 75.79 78.52-27.18c-4.67-27.94-29.16-48.61-29.16-48.61v30.78l-14.54 3.75-9.11-10.97-7.8 15.34-39.38 10.16-39.3801-10.16-7.8-15.34-9.11 10.97-14.54-3.75v-30.78s-24.50997 20.67-29.1799684 48.61l78.5199684 27.18-2.8 37.39c6.7 1.7 13.75 3.39 24.2801 3.39 10.53 0 17.57-1.69 24.27-3.39l-2.8-37.39z"
      fill="#4ff8d2"
    />
  </svg>
);

export const Supabase = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 109 113"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    {...props}
  >
    <path
      d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
      fill="url(#paint0_linear)"
    />
    <path
      d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z"
      fill="url(#paint1_linear)"
      fillOpacity={0.2}
    />
    <path
      d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.041L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z"
      fill="#3ECF8E"
    />
    <defs>
      <linearGradient
        id="paint0_linear"
        x1={53.9738}
        y1={54.974}
        x2={94.1635}
        y2={71.8295}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#249361" />
        <stop offset={1} stopColor="#3ECF8E" />
      </linearGradient>
      <linearGradient
        id="paint1_linear"
        x1={36.1558}
        y1={30.578}
        x2={54.4844}
        y2={65.0806}
        gradientUnits="userSpaceOnUse"
      >
        <stop />
        <stop offset={1} stopOpacity={0} />
      </linearGradient>
    </defs>
  </svg>
);

export default function JobListingComponent({
  jobs,
  className,
  onJobClick,
  onViewEvents,
  scheduledDaily,
  talent,
}: JobListingComponentProps) {
  const [activeItem, setActiveItem] = useState<Job | null>(null);
  const [showEventsSlideUp, setShowEventsSlideUp] = useState(false);
  const [showTalentDetail, setShowTalentDetail] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<any>(null);
  const [dayEvents, setDayEvents] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const slideUpRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // Close itinerary card only if no other modals are open
  useOnClickOutside(ref, () => {
    if (!showEventsSlideUp && !showTalentDetail) {
      setActiveItem(null);
    }
  });

  // Close events panel only if talent detail is not showing
  useOnClickOutside(slideUpRef, () => {
    if (showEventsSlideUp && !showTalentDetail) {
      setShowEventsSlideUp(false);
      setDayEvents([]);
    }
  });

  // Format day number with Pre-Cruise/Post-Cruise labels
  const formatDayLabel = (dayNumber?: number): string => {
    if (dayNumber === undefined) return '';
    if (dayNumber < 0) return 'Pre-Cruise';
    if (dayNumber >= 100) return 'Post-Cruise';
    return `Day ${dayNumber}`;
  };

  useEffect(() => {
    function onKeyDown(event: { key: string }) {
      if (event.key === 'Escape') {
        // Close modals in reverse order (innermost to outermost)
        if (showTalentDetail) {
          setShowTalentDetail(false);
          setSelectedTalent(null);
        } else if (showEventsSlideUp) {
          setShowEventsSlideUp(false);
          setDayEvents([]);
        } else if (activeItem) {
          setActiveItem(null);
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showTalentDetail, showEventsSlideUp, activeItem]);

  return (
    <>
      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              // Only close if no modals are open
              if (!showEventsSlideUp && !showTalentDetail) {
                setActiveItem(null);
              }
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {activeItem && (
          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4 overflow-y-auto">
            <motion.div
              className="pointer-events-auto bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-2xl flex h-fit w-[90%] max-w-2xl flex-col items-start gap-4 overflow-hidden border border-white/10 p-6 shadow-2xl my-8 relative"
              ref={ref}
              layoutId={`workItem-${activeItem.job_time}`}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{
                opacity: showEventsSlideUp ? 0 : 1,
                scale: showEventsSlideUp ? 0.95 : 1,
                y: showEventsSlideUp ? -100 : 0,
              }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ borderRadius: 16 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button - Top Right */}
              <button
                onClick={e => {
                  e.stopPropagation();
                  setShowTalentDetail(false);
                  setSelectedTalent(null);
                  setShowEventsSlideUp(false);
                  setDayEvents([]);
                  setActiveItem(null);
                }}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              <div className="flex w-full items-center gap-4">
                {/* Hide image on mobile phones (max-width: 640px), show on tablets and up */}
                <motion.div
                  layoutId={`workItemLogo-${activeItem.job_time}`}
                  className="hidden sm:block"
                >
                  {activeItem.logo}
                </motion.div>
                <div className="flex grow items-center justify-between">
                  <div className="flex w-full flex-col gap-0.5">
                    {/* Day Number and Date Row */}
                    <motion.div
                      className="text-ocean-200 text-sm font-medium flex items-center gap-2"
                      layoutId={`workItemDayDate-${activeItem.job_time}`}
                    >
                      <span>{formatDayLabel(activeItem.dayNumber)}</span>
                      {activeItem.dayNumber !== undefined && (
                        <>
                          <Circle className="w-1.5 h-1.5 fill-current" />
                          <span>{activeItem.title}</span>
                        </>
                      )}
                    </motion.div>

                    <motion.div
                      className="text-white text-lg font-bold"
                      layoutId={`workItemCompany-${activeItem.job_time}`}
                    >
                      {activeItem.company}
                    </motion.div>
                    <motion.p
                      layoutId={`workItemTitle-${activeItem.job_time}`}
                      className="text-ocean-100 text-sm"
                    >
                      {activeItem.salary}
                    </motion.p>
                    {/* All Aboard Time - Pink/Red Badge */}
                    {activeItem.remote && (
                      <motion.div
                        className="flex flex-row gap-2 text-xs mt-2"
                        layoutId={`workItemExtras-${activeItem.job_time}`}
                      >
                        <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-red-500/20 backdrop-blur-sm border border-pink-300/30 text-pink-100 text-xs font-semibold shadow-md">
                          All Aboard: {activeItem.remote}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
              {/* Description */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
                className="w-full"
              >
                <p className="text-ocean-50 text-sm leading-relaxed mb-4">
                  {activeItem.job_description}
                </p>

                {/* Location Attractions */}
                {activeItem.attractions && activeItem.attractions.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-ocean-300" />
                      <h3 className="text-white font-bold text-sm uppercase tracking-wide">
                        Top Attractions
                      </h3>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 shadow-lg">
                      <div className="space-y-3">
                        {activeItem.attractions.map((attraction, idx) => (
                          <div
                            key={attraction.id}
                            className={idx !== 0 ? 'pt-3 border-t border-white/10' : ''}
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-ocean-400/30 flex items-center justify-center mt-0.5">
                                <span className="text-ocean-200 text-xs font-bold">{idx + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-semibold text-xs leading-tight">
                                  {attraction.name}
                                </h4>
                                {attraction.category && (
                                  <span className="inline-block px-2 py-0.5 text-[10px] bg-ocean-500/30 text-ocean-100 rounded mt-1 font-medium">
                                    {attraction.category}
                                  </span>
                                )}
                                {attraction.description && (
                                  <p className="text-ocean-100 text-[11px] mt-1.5 leading-snug">
                                    {attraction.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* LGBT Venues */}
                {activeItem.lgbtVenues && activeItem.lgbtVenues.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base leading-none">🏳️‍🌈</span>
                      <h3 className="text-white font-bold text-sm uppercase tracking-wide">
                        LGBT+ Venues
                      </h3>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/15 via-pink-500/15 to-purple-500/15 backdrop-blur-md rounded-xl p-4 border border-purple-400/30 shadow-lg">
                      <div className="space-y-3">
                        {activeItem.lgbtVenues.map((venue, idx) => (
                          <div
                            key={venue.id}
                            className={idx !== 0 ? 'pt-3 border-t border-white/10' : ''}
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-400/30 flex items-center justify-center mt-0.5">
                                <Sparkles className="w-3 h-3 text-purple-200" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-semibold text-xs leading-tight">
                                  {venue.name}
                                </h4>
                                {venue.venueType && (
                                  <span className="inline-block px-2 py-0.5 text-[10px] bg-purple-500/30 text-purple-100 rounded mt-1 font-medium">
                                    {venue.venueType}
                                  </span>
                                )}
                                {venue.description && (
                                  <p className="text-purple-50 text-[11px] mt-1.5 leading-snug">
                                    {venue.description}
                                  </p>
                                )}
                                {venue.address && (
                                  <p className="text-purple-200 text-[10px] mt-1 opacity-80">
                                    📍 {venue.address}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* View Events Button */}
                {onViewEvents && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      // Find events for this day
                      const events = scheduledDaily?.find(day => day.key === activeItem.job_time);
                      setDayEvents(events?.items || []);
                      setShowEventsSlideUp(true);
                    }}
                    className="w-full mt-4 px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-400/30 backdrop-blur-md border border-white/10 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    View Events for This Day
                  </button>
                )}
              </motion.div>
            </motion.div>

            {/* Slide-Up Events Card - Now independent, outside itinerary card */}
            <AnimatePresence>
              {showEventsSlideUp && activeItem && (
                <>
                  {/* Backdrop for events panel */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm"
                    onClick={e => {
                      e.stopPropagation();
                      if (!showTalentDetail) {
                        setShowEventsSlideUp(false);
                        setDayEvents([]);
                      }
                    }}
                  />
                  <motion.div
                    ref={slideUpRef}
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-3xl border-t border-white/20 rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto flex flex-col z-[60] pointer-events-auto"
                    style={{ borderRadius: '16px 16px 0 0', touchAction: 'pan-y' }}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-3xl border-b border-white/20 p-6 pb-4 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold text-lg">
                          Events for {activeItem.title}
                        </h3>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setShowEventsSlideUp(false);
                            setDayEvents([]);
                          }}
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110"
                          aria-label="Close Events"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Scrollable Events List */}
                    <div className="p-6 pt-4">
                      {dayEvents.length > 0 ? (
                        <div className="space-y-3">
                          {dayEvents.map((event, idx) => {
                            console.log('Event data:', {
                              title: event.title,
                              venue: event.venue,
                              hasVenue: !!event.venue,
                            });
                            return (
                              <div
                                key={idx}
                                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
                              >
                                <div className="flex flex-col gap-2">
                                  {/* Time */}
                                  <div className="text-ocean-200 text-sm font-medium">
                                    {event.time}
                                  </div>

                                  {/* Event Title */}
                                  <div className="text-white font-semibold text-base">
                                    {event.title}
                                  </div>

                                  {/* Venue/Location */}
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-200 text-xs font-medium border border-cyan-400/30">
                                      {event.venue || 'TBD'}
                                    </span>
                                  </div>

                                  {/* Artists */}
                                  {event.talent && event.talent.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {event.talent.map((t: any, tidx: number) => (
                                        <button
                                          key={tidx}
                                          onClick={e => {
                                            e.stopPropagation();
                                            setSelectedTalent(t);
                                            setShowTalentDetail(true);
                                          }}
                                          className="text-xs px-2.5 py-1 bg-purple-500/20 text-purple-200 rounded-full hover:bg-purple-500/30 transition-colors border border-purple-400/30 font-medium flex items-center gap-1 group"
                                        >
                                          <span>{t.name}</span>
                                          <span className="text-purple-300 group-hover:translate-x-0.5 transition-transform text-[10px]">
                                            →
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* Description (if available) */}
                                  {event.description && (
                                    <p className="text-ocean-50 text-xs mt-1 pt-2 border-t border-white/10">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-ocean-200 text-center py-8">
                          No events scheduled for this day
                        </p>
                      )}
                    </div>

                    {/* Talent Detail Slide-In - slides over ENTIRE events card including header */}
                    <AnimatePresence>
                      {showTalentDetail && selectedTalent && (
                        <motion.div
                          initial={{ x: '100%' }}
                          animate={{ x: 0 }}
                          exit={{ x: '100%' }}
                          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                          className="absolute inset-0 z-[70] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-3xl overflow-y-auto"
                          style={{ borderRadius: '16px 16px 0 0' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="p-6">
                            <div className="text-white">
                              {/* Circular Back Button */}
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setShowTalentDetail(false);
                                  setSelectedTalent(null);
                                }}
                                className="w-10 h-10 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 flex items-center justify-center mb-4 transition-all hover:scale-110"
                                aria-label="Back to Events"
                              >
                                <span className="text-purple-200 text-xl">←</span>
                              </button>

                              {/* Profile Image - Full Width at Top */}
                              {selectedTalent.profileImageUrl && (
                                <div className="w-full mb-6">
                                  <img
                                    src={selectedTalent.profileImageUrl}
                                    alt={selectedTalent.name}
                                    className="w-full h-64 object-cover rounded-xl border-2 border-purple-400/30 shadow-lg"
                                  />
                                </div>
                              )}

                              {/* Artist Name */}
                              <h2 className="text-2xl font-bold mb-2">{selectedTalent.name}</h2>

                              {/* Known For */}
                              {selectedTalent.knownFor && (
                                <p className="text-purple-200 text-sm mb-4">
                                  {selectedTalent.knownFor}
                                </p>
                              )}

                              {/* Bio */}
                              {selectedTalent.bio && (
                                <div className="mb-6">
                                  <p className="text-purple-50 text-sm leading-relaxed">
                                    {selectedTalent.bio}
                                  </p>
                                </div>
                              )}

                              {/* Performances */}
                              <div className="mb-6">
                                <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-3">
                                  Performances
                                </h3>
                                <div className="space-y-2">
                                  {scheduledDaily?.map(day => {
                                    const talentEvents = day.items.filter((event: any) =>
                                      event.talent?.some((t: any) => t.id === selectedTalent.id)
                                    );

                                    if (talentEvents.length === 0) return null;

                                    // Find the corresponding itinerary entry to get the formatted date
                                    const itineraryEntry = jobs.find(
                                      job => job.job_time === day.key
                                    );
                                    const dateDisplay = itineraryEntry?.title || day.key;

                                    return (
                                      <div key={day.key}>
                                        {talentEvents.map((event: any, eventIdx: number) => (
                                          <div
                                            key={eventIdx}
                                            className="bg-purple-500/10 backdrop-blur-md rounded-lg p-3 border border-purple-400/20"
                                          >
                                            <div className="flex flex-col gap-1">
                                              {/* Date and Time on same line */}
                                              <div className="flex items-center gap-2 text-sm">
                                                <span className="text-purple-200 font-medium">
                                                  {dateDisplay}
                                                </span>
                                                <Circle className="w-1.5 h-1.5 fill-current text-purple-400" />
                                                <span className="text-white font-semibold">
                                                  {event.time}
                                                </span>
                                              </div>
                                              {/* Venue */}
                                              {event.venue && (
                                                <div className="text-purple-100 text-xs">
                                                  {event.venue}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Social Links */}
                              {selectedTalent.socialLinks &&
                                Object.keys(selectedTalent.socialLinks).length > 0 && (
                                  <div>
                                    <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-3">
                                      Social Links
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                      {Object.entries(selectedTalent.socialLinks).map(
                                        ([platform, url]: [string, any]) => {
                                          const platformLower = platform.toLowerCase();
                                          let Icon = Globe; // Default icon

                                          if (platformLower.includes('instagram')) Icon = Instagram;
                                          else if (
                                            platformLower.includes('twitter') ||
                                            platformLower.includes('x')
                                          )
                                            Icon = Twitter;
                                          else if (platformLower.includes('facebook'))
                                            Icon = Facebook;
                                          else if (platformLower.includes('youtube'))
                                            Icon = Youtube;
                                          else if (
                                            platformLower.includes('spotify') ||
                                            platformLower.includes('music')
                                          )
                                            Icon = Music;

                                          return (
                                            <a
                                              key={platform}
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded-lg border border-purple-400/30 transition-all hover:scale-110"
                                              title={platform}
                                            >
                                              <Icon className="w-5 h-5" />
                                            </a>
                                          );
                                        }
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </AnimatePresence>
      <div className={`relative flex items-start ${className || ''}`}>
        <div className="relative flex w-full flex-col items-center gap-4">
          {jobs.map(role => (
            <motion.div
              layoutId={
                activeItem?.job_time === role.job_time ? undefined : `workItem-${role.job_time}`
              }
              key={role.job_time}
              className="group bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.01] flex w-full cursor-pointer flex-row items-center gap-4 py-3 pl-3 pr-5 min-h-[140px]"
              onClick={() => {
                setActiveItem(role);
                if (onJobClick) onJobClick(role);
              }}
              style={{ borderRadius: 12, opacity: activeItem?.job_time === role.job_time ? 0 : 1 }}
            >
              <motion.div
                layoutId={
                  activeItem?.job_time === role.job_time
                    ? undefined
                    : `workItemLogo-${role.job_time}`
                }
              >
                {role.logo}
              </motion.div>
              <div className="flex w-full flex-col items-start justify-between gap-0.5">
                {/* Day Number and Date Row */}
                <motion.div
                  className="text-ocean-100 text-sm font-medium flex items-center gap-2"
                  layoutId={
                    activeItem?.job_time === role.job_time
                      ? undefined
                      : `workItemDayDate-${role.job_time}`
                  }
                >
                  <span>{formatDayLabel(role.dayNumber)}</span>
                  {role.dayNumber !== undefined && (
                    <>
                      <Circle className="w-1.5 h-1.5 fill-current" />
                      <span>{role.title}</span>
                    </>
                  )}
                </motion.div>

                <motion.div
                  className="text-white font-bold text-lg group-hover:text-ocean-200 transition-colors"
                  layoutId={
                    activeItem?.job_time === role.job_time
                      ? undefined
                      : `workItemCompany-${role.job_time}`
                  }
                >
                  {role.company}
                </motion.div>
                <motion.div
                  className="text-ocean-200 text-sm"
                  layoutId={
                    activeItem?.job_time === role.job_time
                      ? undefined
                      : `workItemTitle-${role.job_time}`
                  }
                >
                  {role.salary}
                </motion.div>

                {/* All Aboard Time - Frosted Pink/Red Badge */}
                {role.remote && (
                  <motion.div
                    className="flex flex-row gap-2 text-sm mt-1"
                    layoutId={
                      activeItem?.job_time === role.job_time
                        ? undefined
                        : `workItemExtras-${role.job_time}`
                    }
                  >
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-red-500/20 backdrop-blur-sm border border-pink-300/30 text-pink-100 text-xs font-semibold shadow-md">
                      All Aboard: {role.remote}
                    </span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
}
