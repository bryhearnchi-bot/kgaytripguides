import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Ship, MapPin, Clock, Calendar, History, Grid3X3, Home } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import React from 'react';
import { dateOnly } from '@/lib/utils';
import { getTripButtonText } from '@/lib/tripUtils';
import { UniversalHero } from '@/components/UniversalHero';
import { StandardizedTabContainer } from '@/components/StandardizedTabContainer';
import { StandardizedContentLayout } from '@/components/StandardizedContentLayout';

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
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white/95 backdrop-blur-sm border-ocean-200/60 flex flex-col h-full">
      <Link
        href={`/trip/${trip.slug}`}
        onClick={() => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }}
      >
        <div className="relative overflow-hidden cursor-pointer">
          <img
            src={trip.heroImageUrl || '/images/ships/resilient-lady-hero.jpg'}
            alt={trip.name}
            className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={e => {
              e.currentTarget.src = '/images/ships/resilient-lady-hero.jpg';
            }}
          />
          <div className="absolute top-3 left-3">
            {trip.tripTypeId === 2 ? (
              <Badge
                variant="secondary"
                className="bg-cyan-100 text-cyan-700 border-cyan-200 text-xs flex items-center gap-1"
              >
                <Home className="h-3 w-3" />
                Resort
              </Badge>
            ) : trip.tripTypeId === 1 ? (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-700 border-blue-200 text-xs flex items-center gap-1"
              >
                <Ship className="h-3 w-3" />
                Cruise
              </Badge>
            ) : null}
          </div>
        </div>
      </Link>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-ocean-900 group-hover:text-ocean-700 transition-colors">
          {trip.name}
        </CardTitle>
        <CardDescription className="text-ocean-600 text-sm">{trip.description}</CardDescription>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col">
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-ocean-700">
            <Ship className="h-3.5 w-3.5" />
            <span>
              {trip.shipName} • {trip.cruiseLine}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-ocean-700">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>
              {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')} • {duration} days
            </span>
          </div>

          {trip.highlights && trip.highlights.length > 0 && (
            <div className="flex items-start gap-1.5 text-xs text-ocean-700">
              <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{trip.highlights[0]}</span>
            </div>
          )}
        </div>

        <div className="mt-auto">
          <Link
            href={`/trip/${trip.slug}`}
            onClick={() => {
              window.scrollTo(0, 0);
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
            }}
          >
            <Button className="w-full bg-gradient-to-r from-ocean-600 to-ocean-700 hover:from-ocean-700 hover:to-ocean-800 text-white text-sm py-2">
              {getTripButtonText(trip.tripType)}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400">
      <UniversalHero
        variant="landing"
        title="Atlantis Events Guides"
        subtitle="Your complete guide to unforgettable trip experiences"
        tabSection={
          <StandardizedTabContainer>
            <Tabs
              value={activeFilter}
              onValueChange={value =>
                setActiveFilter(value as 'all' | 'upcoming' | 'current' | 'past')
              }
            >
              <TabsList className={`grid w-full ${hasCurrent ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  <span className="hidden sm:inline">All</span>
                </TabsTrigger>
                {hasCurrent && (
                  <TabsTrigger
                    value="current"
                    className="flex items-center gap-2 relative bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 shadow-lg"
                  >
                    <Clock className="w-4 h-4 animate-pulse text-emerald-600" />
                    <span className="hidden sm:inline font-semibold text-emerald-700">Current</span>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></div>
                  </TabsTrigger>
                )}
                <TabsTrigger value="upcoming" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Upcoming</span>
                </TabsTrigger>
                <TabsTrigger value="past" className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  <span className="hidden sm:inline">Past</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </StandardizedTabContainer>
        }
      />

      <StandardizedContentLayout>
        {filteredTrips.length > 0 ? (
          <section>
            {activeFilter === 'all' ? (
              <div>
                {groupedTrips.current.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-6">
                      <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <h3 className="text-lg font-semibold text-white">Active Trips</h3>
                      <div className="flex-1 h-px bg-white/20 ml-3"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                      {groupedTrips.current.map(trip => (
                        <TripCard key={trip.id} trip={trip} />
                      ))}
                    </div>
                  </div>
                )}

                {groupedTrips.upcoming.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-6">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <h3 className="text-lg font-semibold text-white">Upcoming Adventures</h3>
                      <div className="flex-1 h-px bg-white/20 ml-3"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                      {groupedTrips.upcoming.map(trip => (
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
                    {activeFilter === 'upcoming' && <Calendar className="w-6 h-6 text-blue-400" />}
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
  );
}
