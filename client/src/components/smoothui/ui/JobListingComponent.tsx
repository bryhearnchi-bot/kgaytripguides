import React, { useEffect, useRef, useState, type JSX } from 'react';
import type { SVGProps } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useOnClickOutside } from 'usehooks-ts';
import { EventCard } from '@/components/trip-guide/shared/EventCard';
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
  ChevronRight,
  CalendarDays,
  Map,
} from 'lucide-react';
import { ReactiveBottomSheet } from '@/components/ui/ReactiveBottomSheet';
import { getOptimizedImageUrl, IMAGE_PRESETS } from '@/lib/image-utils';
import { CardActionButton } from '@/components/ui/CardActionButton';

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
  job_description: string; // Location description (for modal)
  itinerary_description?: string; // Itinerary description (for card)
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
  const [showTalentDetail, setShowTalentDetail] = useState(false);
  const [showPartyThemeDetail, setShowPartyThemeDetail] = useState(false);
  const [showEventDescriptionModal, setShowEventDescriptionModal] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<any>(null);
  const [selectedPartyTheme, setSelectedPartyTheme] = useState<any>(null);
  const [dayEvents, setDayEvents] = useState<any[]>([]);
  const [showViewTypeModal, setShowViewTypeModal] = useState(false);
  const [showArtistSelectModal, setShowArtistSelectModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  // New fly-up states
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showEventsSheet, setShowEventsSheet] = useState(false);
  const [showEventDetailSheet, setShowEventDetailSheet] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<any>(null);
  const ref = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

  // Close itinerary card only if no other modals are open
  useOnClickOutside(ref, () => {
    if (!showTalentDetail && !showPartyThemeDetail && !showEventDescriptionModal) {
      setActiveItem(null);
    }
  });

  // Format day number with Pre-Cruise/Post-Cruise labels
  const formatDayLabel = (dayNumber?: number): string => {
    if (dayNumber === undefined) return '';
    if (dayNumber < 0) return 'Pre-Cruise';
    if (dayNumber >= 100) return 'Post-Cruise';
    return `Day ${dayNumber}`;
  };

  // Handle event card click
  const handleEventCardClick = (event: any) => {
    const hasArtists = event.talent && event.talent.length > 0;
    const hasPartyTheme = !!event.partyTheme;
    const hasBoth = hasArtists && hasPartyTheme;

    setCurrentEvent(event);

    if (hasBoth) {
      // Show view type selection modal
      setShowViewTypeModal(true);
    } else if (hasArtists && event.talent) {
      // Only artists
      if (event.talent.length === 1) {
        // Single artist - open directly
        setSelectedTalent(event.talent[0]);
        setShowTalentDetail(true);
      } else {
        // Multiple artists - show selection
        setShowArtistSelectModal(true);
      }
    } else if (hasPartyTheme && event.partyTheme) {
      // Only party theme
      setSelectedPartyTheme(event.partyTheme);
      setShowPartyThemeDetail(true);
    } else {
      // No artist or party theme - show event description modal
      setShowEventDescriptionModal(true);
    }
  };

  const handleViewArtists = () => {
    setShowViewTypeModal(false);
    if (currentEvent?.talent && currentEvent.talent.length === 1) {
      // Single artist - open directly
      setSelectedTalent(currentEvent.talent[0]);
      setShowTalentDetail(true);
    } else {
      // Multiple artists - show selection
      setShowArtistSelectModal(true);
    }
  };

  const handleViewPartyTheme = () => {
    setShowViewTypeModal(false);
    if (currentEvent?.partyTheme) {
      setSelectedPartyTheme(currentEvent.partyTheme);
      setShowPartyThemeDetail(true);
    }
  };

  const handleArtistSelect = (artist: any) => {
    setShowArtistSelectModal(false);
    setSelectedTalent(artist);
    setShowTalentDetail(true);
    setCurrentEvent(null);
  };

  useEffect(() => {
    function onKeyDown(event: { key: string }) {
      if (event.key === 'Escape') {
        // Close modals in reverse order (innermost to outermost)
        if (showArtistSelectModal) {
          setShowArtistSelectModal(false);
          setCurrentEvent(null);
        } else if (showViewTypeModal) {
          setShowViewTypeModal(false);
          setCurrentEvent(null);
        } else if (showEventDescriptionModal) {
          setShowEventDescriptionModal(false);
          setCurrentEvent(null);
        } else if (showPartyThemeDetail) {
          setShowPartyThemeDetail(false);
          setSelectedPartyTheme(null);
        } else if (showTalentDetail) {
          setShowTalentDetail(false);
          setSelectedTalent(null);
        } else if (activeItem) {
          setActiveItem(null);
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    showArtistSelectModal,
    showViewTypeModal,
    showEventDescriptionModal,
    showPartyThemeDetail,
    showTalentDetail,
    activeItem,
  ]);

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
              if (!showTalentDetail) {
                setActiveItem(null);
              }
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {activeItem && (
          <div className="pointer-events-none fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto pt-20 sm:pt-4">
            <motion.div
              className="pointer-events-auto bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-2xl flex h-fit w-full max-w-2xl flex-col items-start gap-4 overflow-hidden border border-white/10 p-4 sm:p-6 shadow-2xl my-4 sm:my-8 relative max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-8rem)] overflow-y-auto"
              ref={ref}
              layoutId={`workItem-${activeItem.job_time}`}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
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

                {/* Location Attractions - Top 3 Only */}
                {activeItem.attractions && activeItem.attractions.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ocean-300" />
                      <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-wide">
                        Top Attractions
                      </h3>
                    </div>
                    <ul className="space-y-1.5 text-white/90 text-sm">
                      {activeItem.attractions.slice(0, 3).map(attraction => (
                        <li key={attraction.id} className="flex items-center gap-2">
                          <span className="text-ocean-300 text-lg leading-none">•</span>
                          <span>{attraction.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* LGBT Venues - Top 3 Only */}
                {activeItem.lgbtVenues && activeItem.lgbtVenues.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm sm:text-base leading-none">🏳️‍🌈</span>
                      <h3 className="text-white font-bold text-xs sm:text-sm uppercase tracking-wide">
                        LGBT+ Venues
                      </h3>
                    </div>
                    <ul className="space-y-1.5 text-white/90 text-sm">
                      {activeItem.lgbtVenues.slice(0, 3).map(venue => (
                        <li key={venue.id} className="flex items-center gap-2">
                          <span className="text-purple-300 text-lg leading-none">•</span>
                          <span>{venue.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className={`relative flex items-start ${className || ''}`}>
        <div className="relative flex w-full flex-col items-center gap-4">
          {jobs.map((role, index) => {
            // Check if we need to show a date header (first item or date changed from previous)
            const prevJob = jobs[index - 1];
            const showDateHeader = index === 0 || (prevJob && prevJob.title !== role.title);

            // Determine the day label based on dayNumber
            let dayLabel = '';
            if (role.dayNumber !== undefined) {
              if (role.dayNumber < 0) {
                dayLabel = 'Pre-Cruise';
              } else if (role.dayNumber >= 100) {
                dayLabel = 'Post-Cruise';
              } else {
                dayLabel = `Day ${role.dayNumber}`;
              }
            }

            // Check for special location types from the company name
            const isEmbarkation = role.company?.includes('- Embarkation');
            const isDisembarkation = role.company?.includes('- Disembarkation');
            const isOvernightArrival =
              role.company?.includes('- Overnight') && !role.company?.includes('Full Day');
            const isOvernightFullDay = role.company?.includes('- Overnight Full Day');

            // Add special label to day
            if (isEmbarkation) {
              dayLabel += ' • Embarkation';
            } else if (isDisembarkation) {
              dayLabel += ' • Disembarkation';
            } else if (isOvernightArrival) {
              dayLabel += ' • Overnight';
            } else if (isOvernightFullDay) {
              dayLabel += ' • Overnight';
            }

            return (
              <React.Fragment key={role.job_time}>
                {showDateHeader && (
                  <div className="w-full flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-white">
                      {role.title}
                      {dayLabel && (
                        <>
                          <Circle className="w-1.5 h-1.5 fill-current inline-block mx-2 align-middle" />
                          <span className="text-white/90">{dayLabel}</span>
                        </>
                      )}
                    </h3>
                  </div>
                )}
                <motion.div
                  layoutId={
                    activeItem?.job_time === role.job_time ? undefined : `workItem-${role.job_time}`
                  }
                  className={`bg-white/5 rounded-xl border border-white/20 transition-all duration-200 overflow-hidden w-full ${!showDateHeader ? 'mt-1' : ''}`}
                  style={{ opacity: activeItem?.job_time === role.job_time ? 0 : 1 }}
                >
                  <div className="flex h-32">
                    <motion.div
                      layoutId={
                        activeItem?.job_time === role.job_time
                          ? undefined
                          : `workItemLogo-${role.job_time}`
                      }
                      className="w-1/3 flex-shrink-0"
                    >
                      {role.logo}
                    </motion.div>
                    <div className="flex-1 flex flex-col justify-center min-w-0 p-4">
                      <div className="space-y-1">
                        {/* Port/Location Name - cleaned up without suffixes */}
                        <div>
                          <motion.span
                            className="text-white font-bold text-base line-clamp-1"
                            layoutId={
                              activeItem?.job_time === role.job_time
                                ? undefined
                                : `workItemCompany-${role.job_time}`
                            }
                          >
                            {role.company
                              .replace(' - Embarkation', '')
                              .replace(' - Disembarkation', '')
                              .replace(' - Overnight', '')
                              .replace(' - Overnight Full Day', '')}
                          </motion.span>
                        </div>

                        {/* Arrive/Depart Times */}
                        {role.salary && (
                          <motion.div
                            className="text-ocean-200 text-xs"
                            layoutId={
                              activeItem?.job_time === role.job_time
                                ? undefined
                                : `workItemTitle-${role.job_time}`
                            }
                          >
                            {role.salary}
                          </motion.div>
                        )}

                        {/* All Aboard Time */}
                        {role.remote && (
                          <motion.div
                            className="text-pink-300 text-xs font-bold"
                            layoutId={
                              activeItem?.job_time === role.job_time
                                ? undefined
                                : `workItemExtras-${role.job_time}`
                            }
                          >
                            All Aboard: {role.remote}
                          </motion.div>
                        )}

                        {/* Itinerary Description */}
                        {role.itinerary_description && (
                          <motion.div
                            className="text-white/70 text-xs line-clamp-2"
                            layoutId={
                              activeItem?.job_time === role.job_time
                                ? undefined
                                : `workItemDescription-${role.job_time}`
                            }
                          >
                            {role.itinerary_description}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="bg-white/5 border-t border-white/10 px-3 py-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <CardActionButton
                        icon={<Map className="w-3.5 h-3.5" />}
                        label="Info"
                        onClick={() => {
                          setSelectedJob(role);
                          setShowInfoSheet(true);
                        }}
                      />
                      <CardActionButton
                        icon={<CalendarDays className="w-3.5 h-3.5" />}
                        label="Events"
                        onClick={() => {
                          setSelectedJob(role);
                          // Find events for this day - extract date from job_time (format: YYYY-MM-DD-locId-index)
                          const dateKey = role.job_time.split('-').slice(0, 3).join('-');
                          const events = scheduledDaily?.find(day => day.key === dateKey);
                          setDayEvents(events?.items || []);
                          setShowEventsSheet(true);
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Port Info Sheet */}
      <ReactiveBottomSheet
        open={showInfoSheet}
        onOpenChange={open => {
          setShowInfoSheet(open);
          if (!open) setSelectedJob(null);
        }}
        title={
          selectedJob
            ? selectedJob.company.replace(
                / - (Embarkation|Disembarkation|Overnight|Overnight Full Day)/g,
                ''
              )
            : 'Port Information'
        }
        subtitle={selectedJob?.title}
        icon={MapPin}
      >
        {selectedJob && (
          <div className="space-y-4">
            {/* Description */}
            {selectedJob.job_description && (
              <div>
                <h4 className="text-white/80 text-xs font-semibold uppercase tracking-wide mb-2">
                  About This Port
                </h4>
                <p className="text-white/70 text-sm leading-relaxed">
                  {selectedJob.job_description}
                </p>
              </div>
            )}

            {/* Location Attractions */}
            {selectedJob.attractions && selectedJob.attractions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-ocean-300" />
                  <h4 className="text-white font-bold text-sm uppercase tracking-wide">
                    Top Attractions
                  </h4>
                </div>
                <ul className="space-y-1.5 text-white/90 text-sm">
                  {selectedJob.attractions.slice(0, 3).map(attraction => (
                    <li key={attraction.id} className="flex items-center gap-2">
                      <span className="text-ocean-300 text-lg leading-none">•</span>
                      <span>{attraction.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* LGBT Venues */}
            {selectedJob.lgbtVenues && selectedJob.lgbtVenues.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base leading-none">🏳️‍🌈</span>
                  <h4 className="text-white font-bold text-sm uppercase tracking-wide">
                    LGBT+ Venues
                  </h4>
                </div>
                <ul className="space-y-1.5 text-white/90 text-sm">
                  {selectedJob.lgbtVenues.slice(0, 3).map(venue => (
                    <li key={venue.id} className="flex items-center gap-2">
                      <span className="text-purple-300 text-lg leading-none">•</span>
                      <span>{venue.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </ReactiveBottomSheet>

      {/* Events Sheet */}
      <ReactiveBottomSheet
        open={showEventsSheet}
        onOpenChange={open => {
          setShowEventsSheet(open);
          if (!open) {
            setSelectedJob(null);
            setDayEvents([]);
          }
        }}
        title={selectedJob ? `Events for ${selectedJob.title}` : 'Events'}
      >
        <div className="space-y-3">
          {dayEvents.length > 0 ? (
            dayEvents.map((event, idx) => (
              <EventCard key={idx} event={event} allSchedule={scheduledDaily} allTalent={talent} />
            ))
          ) : (
            <p className="text-white/60 text-center py-8">No events scheduled for this day</p>
          )}
        </div>
      </ReactiveBottomSheet>

      {/* Event Detail Sheet */}
      <ReactiveBottomSheet
        open={showEventDetailSheet}
        onOpenChange={open => {
          setShowEventDetailSheet(open);
          if (!open) setSelectedEventForDetail(null);
        }}
        title={selectedEventForDetail?.title || 'Event Details'}
      >
        {selectedEventForDetail && (
          <div className="space-y-4">
            {/* Event Image */}
            {selectedEventForDetail.imageUrl && (
              <img
                src={getOptimizedImageUrl(selectedEventForDetail.imageUrl, IMAGE_PRESETS.card)}
                alt={selectedEventForDetail.title}
                className="w-full aspect-video object-cover rounded-lg"
                loading="lazy"
              />
            )}

            {/* Time and Venue */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full bg-ocean-500/20 text-ocean-200 text-sm font-medium border border-ocean-400/30">
                {selectedEventForDetail.time}
              </span>
              {selectedEventForDetail.venue && (
                <span className="px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-200 text-sm font-medium border border-cyan-400/30">
                  {selectedEventForDetail.venue}
                </span>
              )}
            </div>

            {/* Description */}
            {selectedEventForDetail.description && (
              <p className="text-white/80 text-sm leading-relaxed">
                {selectedEventForDetail.description}
              </p>
            )}
          </div>
        )}
      </ReactiveBottomSheet>
    </>
  );
}
