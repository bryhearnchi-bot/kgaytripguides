import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CalendarDays,
  Ship,
  MapPin,
  Clock,
  Calendar,
  History,
  Home,
  Bookmark,
  Info,
  Download,
  X,
} from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { useState, useEffect } from 'react';
import React from 'react';
import { dateOnly } from '@/lib/utils';
import { getTripButtonText } from '@/lib/tripUtils';
import { StandardizedTabContainer } from '@/components/StandardizedTabContainer';
import { StandardizedContentLayout } from '@/components/StandardizedContentLayout';
import { FeaturedTripCarousel } from '@/components/FeaturedTripCarousel';
import { isNative } from '@/lib/capacitor';
import { useHomeMetadata } from '@/hooks/useHomeMetadata';
import type { Update, UpdateType } from '@/types/trip-info';
import { useLocation } from 'wouter';

interface Trip {
  id: number;
  name: string;
  slug: string;
  shipName: string;
  cruiseLine: string;
  resortName?: string;
  resortLocation?: string;
  tripType?: string;
  tripTypeId?: number;
  startDate: string;
  endDate: string;
  status: string;
  heroImageUrl: string | null;
  description: string | null;
  highlights: string[] | null;
  bookingUrl?: string | null;
  charterCompanyName?: string;
  charterCompanyLogo?: string;
}

function TripCard({ trip }: { trip: Trip }) {
  const [, setLocation] = useLocation();
  const startDate = dateOnly(trip.startDate);
  const endDate = dateOnly(trip.endDate);
  const tripDuration = differenceInCalendarDays(endDate, startDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const daysUntilStart = differenceInCalendarDays(startDate, now);
  const isPastTrip = trip.status === 'past';
  const showBookButton = daysUntilStart >= 10;

  const handleCardClick = () => {
    // In PWA mode, use window.location to maintain PWA context
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      window.location.href = `/trip/${trip.slug}?pwa=true`;
    } else {
      setLocation(`/trip/${trip.slug}`);
    }
  };

  return (
    <div className="group bg-white/5 rounded-2xl overflow-hidden border border-white/20 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] flex flex-col h-full">
      <div onClick={handleCardClick} className="cursor-pointer">
        <div className="relative h-48 overflow-hidden">
          <img
            src={trip.heroImageUrl || '/images/ships/resilient-lady-hero.jpg'}
            alt={trip.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={e => {
              e.currentTarget.src = '/images/ships/resilient-lady-hero.jpg';
            }}
          />
          {/* Charter Logo - Top Right with frosted glass background */}
          {trip.charterCompanyLogo && (
            <div className="absolute top-3 right-3">
              <div className="bg-white/60 backdrop-blur-lg rounded-lg px-2 py-1 shadow-lg border border-white/30">
                <img
                  src={trip.charterCompanyLogo}
                  alt={trip.charterCompanyName || 'Charter Company'}
                  className={`${
                    trip.charterCompanyName?.toLowerCase().includes('atlantis') ? 'h-5' : 'h-6'
                  } w-auto object-contain`}
                  loading="lazy"
                />
              </div>
            </div>
          )}
          {/* Status Badge - Days away shown in top left */}
          {trip.status === 'upcoming' && daysUntilStart > 0 && (
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 bg-blue-400/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                {daysUntilStart} {daysUntilStart === 1 ? 'day' : 'days'} away
              </span>
            </div>
          )}
          {/* Current trip badge - shown in top right if charter logo exists, otherwise top left */}
          {trip.status === 'current' && (
            <div
              className={`absolute top-3 ${trip.charterCompanyLogo ? 'bottom-3 right-3' : 'left-3'}`}
            >
              <span className="px-3 py-1 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full animate-pulse border border-white/30">
                Sailing Now
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h4 className="text-lg font-bold text-white mb-2.5 group-hover:text-ocean-200 transition-colors line-clamp-2">
          {trip.name}
        </h4>

        <div className="space-y-1.5 mb-3 flex-1">
          <div className="flex items-center gap-2 text-ocean-100 text-sm">
            <CalendarDays className="w-4 h-4 flex-shrink-0" />
            <span>
              {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')} • {tripDuration}{' '}
              nights
            </span>
          </div>
          {trip.tripTypeId === 2 ? (
            // Resort Trip
            <>
              {trip.resortName && (
                <div className="flex items-center gap-2 text-ocean-100 text-sm">
                  <Home className="w-4 h-4 flex-shrink-0" />
                  <span>{trip.resortName}</span>
                </div>
              )}
              {trip.resortLocation && (
                <div className="flex items-center gap-2 text-ocean-100 text-sm">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{trip.resortLocation}</span>
                </div>
              )}
            </>
          ) : (
            // Cruise Trip
            <>
              {trip.shipName && (
                <div className="flex items-center gap-2 text-ocean-100 text-sm">
                  <Ship className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {trip.shipName}
                    {trip.cruiseLine && <> - {trip.cruiseLine}</>}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {isPastTrip ? (
          <Button
            onClick={handleCardClick}
            className="w-full bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl text-sm"
            style={{ padding: '8px 16px', minHeight: 'auto', height: 'auto', lineHeight: '1.2' }}
          >
            {getTripButtonText(trip.tripType)} →
          </Button>
        ) : showBookButton ? (
          <TooltipProvider>
            <div className="grid grid-cols-3 gap-2">
              {trip.bookingUrl ? (
                <Button
                  onClick={e => {
                    e.stopPropagation();
                    window.open(trip.bookingUrl!, '_blank', 'noopener,noreferrer');
                  }}
                  className="bg-orange-500/75 backdrop-blur-lg hover:bg-orange-600/75 text-white font-medium rounded-lg transition-all text-sm shadow-lg hover:shadow-xl border border-orange-500/30"
                  style={{
                    padding: '8px 16px',
                    minHeight: 'auto',
                    height: 'auto',
                    lineHeight: '1.2',
                  }}
                >
                  <Info className="w-3.5 h-3.5 mr-1" />
                  Book
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={e => {
                        e.stopPropagation();
                      }}
                      disabled
                      className="bg-orange-500/20 text-orange-300/60 font-medium rounded-lg transition-all text-sm border border-orange-500/20 cursor-not-allowed"
                      style={{
                        padding: '8px 16px',
                        minHeight: 'auto',
                        height: 'auto',
                        lineHeight: '1.2',
                      }}
                    >
                      <Info className="w-3.5 h-3.5 mr-1" />
                      Book
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">Booking not yet available</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Button
                onClick={handleCardClick}
                className="col-span-2 bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-semibold rounded-lg transition-all text-sm"
                style={{
                  padding: '8px 16px',
                  minHeight: 'auto',
                  height: 'auto',
                  lineHeight: '1.2',
                }}
              >
                View Trip Guide →
              </Button>
            </div>
          </TooltipProvider>
        ) : (
          <Button
            onClick={handleCardClick}
            className="w-full bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl text-sm"
            style={{ padding: '8px 16px', minHeight: 'auto', height: 'auto', lineHeight: '1.2' }}
          >
            {getTripButtonText(trip.tripType)} →
          </Button>
        )}
      </div>
    </div>
  );
}

function getTripStatus(startDate: string, endDate: string): 'upcoming' | 'current' | 'past' {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = dateOnly(startDate);
  const end = dateOnly(endDate);

  if (now < start) {
    return 'upcoming';
  } else if (now >= start && now <= end) {
    return 'current';
  } else {
    return 'past';
  }
}

// Helper function to get color class for update type
function getUpdateTypeColor(updateType: UpdateType): string {
  const colors: Record<UpdateType, string> = {
    new_cruise: 'text-emerald-400',
    party_themes_released: 'text-orange-400',
    guide_updated: 'text-blue-400',
    guide_live: 'text-purple-400',
    new_event: 'text-cyan-400',
    new_artist: 'text-pink-400',
    schedule_updated: 'text-amber-400',
    ship_info_updated: 'text-slate-400',
    custom: 'text-white',
  };
  return colors[updateType] || colors.custom;
}

export default function LandingPage() {
  // Set home page metadata including theme-color for Safari iOS
  useHomeMetadata();

  // Ensure body is scrollable (in case it got stuck from modal)
  useEffect(() => {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.height = '';
  }, []);

  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'current' | 'past'>('upcoming');
  const [showPWAWelcome, setShowPWAWelcome] = useState(false);

  // Check if this is first PWA launch and show welcome message
  useEffect(() => {
    const isPWA =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    const hasSeenWelcome = localStorage.getItem('pwa-welcome-seen');

    if (isPWA && !hasSeenWelcome) {
      setShowPWAWelcome(true);
    }
  }, []);

  const dismissPWAWelcome = () => {
    setShowPWAWelcome(false);
    localStorage.setItem('pwa-welcome-seen', 'true');
  };

  // Save scroll position when navigating away, restore when coming back
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('landing-scroll');
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll));
      sessionStorage.removeItem('landing-scroll');
    }

    return () => {
      // Save scroll position when unmounting (navigating to trip)
      sessionStorage.setItem('landing-scroll', window.scrollY.toString());
    };
  }, []);

  const {
    data: trips,
    isLoading,
    error,
  } = useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await fetch('/api/trips');
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      const data = await response.json();
      return data.map((trip: Trip) => ({
        ...trip,
        status: getTripStatus(trip.startDate, trip.endDate),
      }));
    },
    staleTime: 1 * 60 * 1000, // Reduced to 1 minute for faster updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  // Fetch homepage updates
  const { data: homepageUpdates, isLoading: updatesLoading } = useQuery<
    Array<Update & { trips: { slug: string } }>
  >({
    queryKey: ['homepage-updates'],
    queryFn: async () => {
      const response = await fetch('/api/updates/homepage?limit=3');
      if (!response.ok) {
        throw new Error('Failed to fetch updates');
      }
      return response.json();
    },
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const hasCurrent = trips?.some(trip => trip.status === 'current') || false;
  const [hasSetDefault, setHasSetDefault] = useState(false);

  React.useEffect(() => {
    if (trips && !hasSetDefault) {
      setActiveFilter('upcoming');
      setHasSetDefault(true);
    }
  }, [trips, hasSetDefault]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading trip guides...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <Ship className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Unable to load trip guides</h2>
          <p className="text-lg mb-4">Please try refreshing the page</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/20"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const filteredTrips = trips?.filter(trip => trip.status === activeFilter) || [];

  const groupedTrips = trips
    ? {
        current: trips.filter(trip => trip.status === 'current'),
        upcoming: trips.filter(trip => trip.status === 'upcoming'),
        past: trips.filter(trip => trip.status === 'past'),
      }
    : { current: [], upcoming: [], past: [] };

  // If no current trips, use the first upcoming trip as featured
  const hasFeaturedTrip = groupedTrips.current.length > 0 || groupedTrips.upcoming.length > 0;
  const featuredTrips =
    groupedTrips.current.length > 0 ? groupedTrips.current : groupedTrips.upcoming.slice(0, 1);
  const isFeaturedUpcoming = groupedTrips.current.length === 0 && groupedTrips.upcoming.length > 0;

  // Remove the featured trip from upcoming list if it's being shown as featured
  const upcomingTrips = isFeaturedUpcoming ? groupedTrips.upcoming.slice(1) : groupedTrips.upcoming;

  const handleFilterChange = (filter: 'upcoming' | 'current' | 'past') => {
    setActiveFilter(filter);
  };

  return (
    <>
      <div className="min-h-screen w-full">
        {/* Content Layer */}
        <div className="relative z-10">
          {/* PWA Welcome Alert - First time PWA users */}
          {showPWAWelcome && (
            <div
              className="px-4 sm:px-6 lg:px-8"
              style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4.5rem)' }}
            >
              <div className="max-w-3xl mx-auto mb-4">
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 relative">
                  <button
                    onClick={dismissPWAWelcome}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>

                  <div className="flex items-start gap-3 pr-6">
                    <div className="flex-shrink-0 p-2 bg-blue-500/30 rounded-lg">
                      <Download className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-blue-400 mb-1">
                        Welcome to your Trip Guide App!
                      </h3>
                      <p className="text-sm text-white/80 leading-relaxed">
                        This app works offline! To save a trip guide for offline access, open the
                        trip you want, tap the{' '}
                        <span className="font-medium text-amber-400">bell icon</span> in the top
                        menu, and click <span className="font-medium">Download Now</span>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Floating Hero Section */}
          <section
            className={`pb-1.5 px-4 sm:px-6 lg:px-8 ${showPWAWelcome ? '' : ''}`}
            style={{
              paddingTop: showPWAWelcome ? '1rem' : 'calc(env(safe-area-inset-top) + 5rem)',
            }}
          >
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-[21px]">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-2xl">
                  Experiences of a{' '}
                  <span className="relative inline-block">
                    Lifetime
                    <svg
                      width="223"
                      height="12"
                      viewBox="0 0 223 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute inset-x-0 bottom-0 w-full translate-y-1/2"
                    >
                      <defs>
                        <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="16.67%" stopColor="#f97316" />
                          <stop offset="33.33%" stopColor="#eab308" />
                          <stop offset="50%" stopColor="#22c55e" />
                          <stop offset="66.67%" stopColor="#3b82f6" />
                          <stop offset="83.33%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M1.11716 10.428C39.7835 4.97282 75.9074 2.70494 114.894 1.98894C143.706 1.45983 175.684 0.313587 204.212 3.31596C209.925 3.60546 215.144 4.59884 221.535 5.74551"
                        stroke="url(#rainbow-gradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </h2>

                <p className="text-sm sm:text-base md:text-lg text-white max-w-3xl mx-auto px-4 line-clamp-2">
                  The <span className="text-orange-400 font-semibold">INTERACTIVE</span> guides to
                  immerse yourself in unforgettable LGBTQ+ travel experiences.
                </p>
              </div>
            </div>
          </section>

          <StandardizedContentLayout>
            {filteredTrips.length > 0 ? (
              <section>
                {/* Next Trip - Always visible regardless of toggle */}
                {hasFeaturedTrip && (
                  <div className="mb-8">
                    {/* Featured Trip Header - Changes based on current vs upcoming */}
                    <div className="flex items-center gap-2 mb-6">
                      <Calendar
                        className={`w-4 h-4 ${isFeaturedUpcoming ? 'text-blue-400' : 'text-emerald-400'}`}
                      />
                      <h3 className="text-base font-semibold text-white">
                        {isFeaturedUpcoming ? 'Next Trip' : 'Current Trips'}
                      </h3>
                      <div className="flex-1 h-px bg-white/20 ml-3"></div>
                    </div>

                    {/* Featured Trip Carousel - Full Width */}
                    <FeaturedTripCarousel trips={featuredTrips} />
                  </div>
                )}

                {/* Toggle Header - Between Next Trip and grid */}
                <div className="pb-3 mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {activeFilter === 'upcoming' ? (
                        <Calendar className="w-4 h-4 text-blue-400" />
                      ) : (
                        <History className="w-4 h-4 text-purple-400" />
                      )}
                      <h3 className="text-base font-semibold text-white">
                        {activeFilter === 'upcoming' ? 'Upcoming Trips' : 'Past Trips'}
                      </h3>
                    </div>

                    {/* Toggle bubble - like Schedule/Parties */}
                    <div className="bg-white/25 backdrop-blur-lg border border-white/20 rounded-full p-1 inline-flex gap-1">
                      <button
                        onClick={() => setActiveFilter('upcoming')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          activeFilter === 'upcoming'
                            ? 'bg-white/20 text-white'
                            : 'text-white/60 hover:text-white/80'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Upcoming
                      </button>
                      <button
                        onClick={() => setActiveFilter('past')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          activeFilter === 'past'
                            ? 'bg-purple-500/30 text-white'
                            : 'text-purple-300 hover:text-purple-200'
                        }`}
                      >
                        <History className="w-3.5 h-3.5" />
                        Past
                      </button>
                    </div>
                  </div>
                </div>

                {/* Grid of trips - Changes based on toggle */}
                {activeFilter === 'upcoming' ? (
                  upcomingTrips.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                      {upcomingTrips.map(trip => (
                        <TripCard key={trip.id} trip={trip} />
                      ))}
                    </div>
                  )
                ) : activeFilter === 'past' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                    {filteredTrips.map(trip => (
                      <TripCard key={trip.id} trip={trip} />
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="text-center mb-8">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        <Clock className="w-6 h-6 text-emerald-400 animate-pulse" />
                        <h2 className="text-2xl font-semibold text-white capitalize">
                          Current Trips
                        </h2>
                      </div>
                      <p className="text-sm text-white/70">Experience the journey as it unfolds</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                      {filteredTrips.map(trip => (
                        <TripCard key={trip.id} trip={trip} />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <div className="text-center py-16">
                <Ship className="h-16 w-16 mx-auto mb-4 text-white/40" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No {activeFilter} trips found
                </h3>
                <p className="text-white/70 mb-4">
                  {activeFilter === 'upcoming'
                    ? 'Check back soon for exciting new adventures!'
                    : `No ${activeFilter} trips are currently available.`}
                </p>
                {activeFilter !== 'upcoming' && (
                  <Button
                    onClick={() => setActiveFilter('upcoming')}
                    className="bg-white/20 hover:bg-white/30 text-white border border-white/20"
                  >
                    View Upcoming Trips
                  </Button>
                )}
              </div>
            )}
          </StandardizedContentLayout>
        </div>
      </div>
    </>
  );
}
