import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Ship, MapPin, Clock, Calendar, History, Grid3X3, Home } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { useState } from 'react';
import React from 'react';
import { dateOnly } from '@/lib/utils';
import { getTripButtonText } from '@/lib/tripUtils';
import { UniversalHero } from '@/components/UniversalHero';
import { StandardizedTabContainer } from '@/components/StandardizedTabContainer';
import { StandardizedContentLayout } from '@/components/StandardizedContentLayout';
import { FeaturedTripCarousel } from '@/components/FeaturedTripCarousel';

interface Trip {
  id: number;
  name: string;
  slug: string;
  shipName: string;
  cruiseLine: string;
  tripType?: string;
  tripTypeId?: number;
  startDate: string;
  endDate: string;
  status: string;
  heroImageUrl: string | null;
  description: string | null;
  highlights: string[] | null;
}

function TripCard({ trip }: { trip: Trip }) {
  const startDate = dateOnly(trip.startDate);
  const endDate = dateOnly(trip.endDate);
  const duration = differenceInCalendarDays(endDate, startDate);

  return (
    <div className="group rounded-2xl overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] flex flex-col h-full">
      <Link
        href={`/trip/${trip.slug}`}
        onClick={() => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }}
      >
        <div className="relative h-48 overflow-hidden cursor-pointer">
          <img
            src={trip.heroImageUrl || '/images/ships/resilient-lady-hero.jpg'}
            alt={trip.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={e => {
              e.currentTarget.src = '/images/ships/resilient-lady-hero.jpg';
            }}
          />
          <div className="absolute top-3 left-3">
            {trip.tripTypeId === 2 ? (
              <span className="px-3 py-1 bg-cyan-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full flex items-center gap-1.5 border border-white/30">
                <Home className="h-3 w-3" />
                Resort
              </span>
            ) : trip.tripTypeId === 1 ? (
              <span className="px-3 py-1 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full flex items-center gap-1.5 border border-white/30">
                <Ship className="h-3 w-3" />
                Cruise
              </span>
            ) : null}
          </div>
          <div className="absolute top-3 right-3">
            {trip.status === 'current' && (
              <span className="px-3 py-1 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full animate-pulse">
                Sailing Now
              </span>
            )}
            {trip.status === 'upcoming' && duration <= 30 && (
              <span className="px-3 py-1 bg-blue-400/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                {duration} days away
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col">
        <h4 className="text-xl font-bold text-white mb-2 group-hover:text-ocean-200 transition-colors">
          {trip.name}
        </h4>
        <p className="text-ocean-200 text-sm mb-4 line-clamp-2">
          {trip.description || 'An exciting adventure awaits'}
        </p>

        <div className="space-y-2 mb-4 flex-1">
          <div className="flex items-center gap-2 text-ocean-100 text-sm">
            <CalendarDays className="w-4 h-4 flex-shrink-0" />
            <span>
              {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')} • {duration} days
            </span>
          </div>
          <div className="flex items-center gap-2 text-ocean-100 text-sm">
            <Ship className="w-4 h-4 flex-shrink-0" />
            <span>{trip.shipName || 'Ship Details Coming Soon'}</span>
          </div>
          {trip.highlights && trip.highlights.length > 0 && (
            <div className="flex items-center gap-2 text-ocean-100 text-sm">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="line-clamp-1">{trip.highlights[0]}</span>
            </div>
          )}
        </div>

        <Link
          href={`/trip/${trip.slug}`}
          onClick={() => {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
          }}
        >
          <Button className="w-full py-3 bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl">
            {getTripButtonText(trip.tripType)}
          </Button>
        </Link>
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

export default function LandingPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'current' | 'past'>('all');

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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const hasCurrent = trips?.some(trip => trip.status === 'current') || false;
  const [hasSetDefault, setHasSetDefault] = useState(false);

  React.useEffect(() => {
    if (trips && !hasSetDefault) {
      setActiveFilter('all');
      setHasSetDefault(true);
    }
  }, [trips, hasSetDefault]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading trip guides...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400 flex items-center justify-center">
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

  const filteredTrips =
    trips?.filter(trip => (activeFilter === 'all' ? true : trip.status === activeFilter)) || [];

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

  return (
    <div className="min-h-screen w-full bg-black relative">
      {/* Deep Ocean Glow Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(70% 55% at 50% 50%, #2a5d77 0%, #184058 18%, #0f2a43 34%, #0a1b30 50%, #071226 66%, #040d1c 80%, #020814 92%, #01040d 97%, #000309 100%), radial-gradient(160% 130% at 10% 10%, rgba(0,0,0,0) 38%, #000309 76%, #000208 100%), radial-gradient(160% 130% at 90% 90%, rgba(0,0,0,0) 38%, #000309 76%, #000208 100%)',
        }}
      />

      {/* Content Layer */}
      <div className="relative z-10">
        {/* Floating Hero Section */}
        <section className="pt-16 pb-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-6 animate-float">
              {/* Upcoming Trips Badge */}
              {(groupedTrips.current?.length || 0) + (groupedTrips.upcoming?.length || 0) > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-lg text-white/90 text-sm mb-5 border border-white/20">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  {(groupedTrips.current?.length || 0) + (groupedTrips.upcoming?.length || 0)}{' '}
                  upcoming trips
                </div>
              )}

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-2xl">
                Your Guide to an
                <br />
                Unforgettable Experience
              </h2>

              <p className="text-lg text-ocean-100 max-w-2xl mx-auto">
                Immerse yourself in extraordinary LGBTQ+ travel experiences with world-class talent,
                breathtaking destinations, and a vibrant community that feels like home.
              </p>
            </div>
          </div>
        </section>

        <StandardizedContentLayout>
          {/* Tab Bar - Glass Effect Style */}
          <div id="trips" className="flex justify-center sm:justify-end mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-full p-1 inline-flex gap-1 border border-white/20">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeFilter === 'all'
                    ? 'bg-white text-ocean-900'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4 flex-shrink-0" />
                <span className={activeFilter === 'all' ? 'inline' : 'hidden sm:inline'}>
                  All Sailings
                </span>
              </button>
              {hasCurrent && (
                <button
                  onClick={() => setActiveFilter('current')}
                  className={`px-3 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeFilter === 'current'
                      ? 'bg-white text-ocean-900'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0"></span>
                  <span className={activeFilter === 'current' ? 'inline' : 'hidden sm:inline'}>
                    Current
                  </span>
                </button>
              )}
              <button
                onClick={() => setActiveFilter('upcoming')}
                className={`px-3 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeFilter === 'upcoming'
                    ? 'bg-white text-ocean-900'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className={activeFilter === 'upcoming' ? 'inline' : 'hidden sm:inline'}>
                  Upcoming
                </span>
              </button>
              <button
                onClick={() => setActiveFilter('past')}
                className={`px-3 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeFilter === 'past'
                    ? 'bg-white text-ocean-900'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <History className="w-4 h-4 flex-shrink-0" />
                <span className={activeFilter === 'past' ? 'inline' : 'hidden sm:inline'}>
                  Past
                </span>
              </button>
            </div>
          </div>
          {filteredTrips.length > 0 ? (
            <section>
              {activeFilter === 'all' ? (
                <div>
                  {hasFeaturedTrip && (
                    <div className="mb-8">
                      {/* Featured Trip Header - Changes based on current vs upcoming */}
                      <div className="flex items-center gap-3 mb-6">
                        <span
                          className={`w-3 h-3 rounded-full ${isFeaturedUpcoming ? 'bg-blue-400' : 'bg-emerald-400 animate-pulse'}`}
                        ></span>
                        <h3 className="text-2xl font-bold text-white">
                          {isFeaturedUpcoming ? 'Next Trip' : 'Current Trips'}
                        </h3>
                        <div className="flex-1 h-px bg-white/20"></div>
                      </div>

                      {/* Featured Trip + Latest News Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Featured Trip Carousel - 2 columns wide */}
                        <div className="lg:col-span-2">
                          <FeaturedTripCarousel trips={featuredTrips} />
                        </div>

                        {/* Latest News Card - 1 column wide */}
                        <div className="group rounded-2xl overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl flex flex-col h-full">
                          <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                              <Clock className="w-5 h-5 text-emerald-400 animate-pulse" />
                              <h3 className="text-xl font-bold text-white">Latest News</h3>
                            </div>

                            <div className="space-y-4 flex-1">
                              {/* News Item 1 - New Cruise Released (Clickable) */}
                              <Link
                                href="#"
                                className="block pb-4 border-b border-white/10 transition-all hover:bg-white/5 hover:-translate-x-1 px-2 -mx-2 py-2 rounded-lg cursor-pointer"
                              >
                                <p className="text-sm text-emerald-400 font-semibold mb-1 flex items-center gap-2">
                                  New Cruise Released
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </p>
                                <p className="text-sm text-ocean-200">
                                  Exciting new destinations added for 2026 season!
                                </p>
                              </Link>

                              {/* News Item 2 - Trip Guide Updated (Clickable) */}
                              <Link
                                href="#"
                                className="block pb-4 border-b border-white/10 transition-all hover:bg-white/5 hover:-translate-x-1 px-2 -mx-2 py-2 rounded-lg cursor-pointer"
                              >
                                <p className="text-sm text-blue-400 font-semibold mb-1 flex items-center gap-2">
                                  Trip Guide Updated
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </p>
                                <p className="text-sm text-ocean-200">
                                  Greek Isles guide now includes new events and performers.
                                </p>
                              </Link>

                              {/* News Item 3 - Trip Guide Live (Clickable) */}
                              <Link
                                href="#"
                                className="block pb-4 transition-all hover:bg-white/5 hover:-translate-x-1 px-2 -mx-2 py-2 rounded-lg cursor-pointer"
                              >
                                <p className="text-sm text-purple-400 font-semibold mb-1 flex items-center gap-2">
                                  Trip Guide Live
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </p>
                                <p className="text-sm text-ocean-200">
                                  Drag Stars at Sea guide is now available with full details.
                                </p>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {upcomingTrips.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-6">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">Upcoming Adventures</h3>
                        <div className="flex-1 h-px bg-white/20 ml-3"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                        {upcomingTrips.map(trip => (
                          <TripCard key={trip.id} trip={trip} />
                        ))}
                      </div>
                    </div>
                  )}

                  {groupedTrips.past.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-6">
                        <History className="w-4 h-4 text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">Past Adventures</h3>
                        <div className="flex-1 h-px bg-white/20 ml-3"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                        {groupedTrips.past.map(trip => (
                          <TripCard key={trip.id} trip={trip} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      {activeFilter === 'current' && (
                        <Clock className="w-6 h-6 text-emerald-400 animate-pulse" />
                      )}
                      {activeFilter === 'upcoming' && (
                        <Calendar className="w-6 h-6 text-blue-400" />
                      )}
                      {activeFilter === 'past' && <History className="w-6 h-6 text-purple-400" />}
                      <h2 className="text-2xl font-semibold text-white capitalize">
                        {activeFilter === 'current' ? 'Active Trips' : `${activeFilter} Adventures`}
                      </h2>
                    </div>
                    <p className="text-sm text-white/70">
                      {activeFilter === 'current' && 'Experience the journey as it unfolds'}
                      {activeFilter === 'upcoming' && 'Get ready for your next adventure'}
                      {activeFilter === 'past' && 'Relive the memories of past adventures'}
                    </p>
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
                No {activeFilter === 'all' ? '' : activeFilter} trips found
              </h3>
              <p className="text-white/70 mb-4">
                {activeFilter === 'all'
                  ? 'Check back soon for exciting new adventures!'
                  : `No ${activeFilter} trips are currently available.`}
              </p>
              {activeFilter !== 'all' && (
                <Button
                  onClick={() => setActiveFilter('all')}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/20"
                >
                  View All Trips
                </Button>
              )}
            </div>
          )}
        </StandardizedContentLayout>
      </div>
    </div>
  );
}
