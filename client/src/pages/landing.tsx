import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Ship, MapPin, Anchor, Clock, Calendar, History, Grid3X3 } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import React from "react";
import { dateOnly } from "@/lib/utils";
import { getTripButtonText } from "@/lib/tripUtils";

interface Trip {
  id: number;
  name: string;
  slug: string;
  shipName: string;
  cruiseLine: string;
  tripType?: string;
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
      <Link href={`/trip/${trip.slug}`}>
        <div className="relative overflow-hidden cursor-pointer">
          <img
            src={trip.heroImageUrl || "/images/ships/resilient-lady-hero.jpg"}
            alt={trip.name}
            className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = "/images/ships/resilient-lady-hero.jpg";
            }}
          />
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-ocean-100 text-ocean-700 border-ocean-200 text-xs">
              {trip.status === 'upcoming' && 'Upcoming'}
              {trip.status === 'current' && 'Current'}
              {trip.status === 'past' && 'Past'}
            </Badge>
          </div>
        </div>
      </Link>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-ocean-900 group-hover:text-ocean-700 transition-colors">
          {trip.name}
        </CardTitle>
        <CardDescription className="text-ocean-600 text-sm">
          {trip.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0 flex-1 flex flex-col">
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-ocean-700">
            <Ship className="h-3.5 w-3.5" />
            <span>{trip.shipName} • {trip.cruiseLine}</span>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-ocean-700">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>
              {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")} • {duration} days
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
          <Link href={`/trip/${trip.slug}`}>
            <Button className="w-full bg-gradient-to-r from-ocean-600 to-ocean-700 hover:from-ocean-700 hover:to-ocean-800 text-white text-sm py-2">
              {getTripButtonText(trip.tripType)}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Function to determine trip status based on dates
function getTripStatus(startDate: string, endDate: string): 'upcoming' | 'current' | 'past' {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize to start of day for comparison
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
  
  const { data: trips, isLoading, error } = useQuery<Trip[]>({
    queryKey: ["trips"],
    queryFn: async () => {
      const response = await fetch("/api/trips");
      if (!response.ok) {
        throw new Error("Failed to fetch trips");
      }
      const data = await response.json();
      // Calculate status for each trip based on dates
      return data.map((trip: Trip) => ({
        ...trip,
        status: getTripStatus(trip.startDate, trip.endDate)
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Determine if there are current trips
  const hasCurrent = trips?.some(trip => trip.status === 'current') || false;
  const [hasSetDefault, setHasSetDefault] = useState(false);

  // Set default filter when data loads
  React.useEffect(() => {
    if (trips && !hasSetDefault) {
      if (hasCurrent) {
        setActiveFilter('current');
      } else {
        setActiveFilter('all');
      }
      setHasSetDefault(true);
    }
  }, [trips, hasCurrent, hasSetDefault]);

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

  // Filter trips based on active filter
  const filteredTrips = trips?.filter(trip => 
    activeFilter === 'all' ? true : trip.status === activeFilter
  ) || [];

  // Group trips by status for "all" view
  const groupedTrips = trips ? {
    current: trips.filter(trip => trip.status === 'current'),
    upcoming: trips.filter(trip => trip.status === 'upcoming'),
    past: trips.filter(trip => trip.status === 'past')
  } : { current: [], upcoming: [], past: [] };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400">
      {/* Header */}
      <header className="cruise-gradient wave-pattern text-white fixed top-0 left-0 right-0 z-40 bg-ocean-600 opacity-100 pt-[15px] pb-[24px]">
        <div className="max-w-7xl mx-auto px-4 py-1">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
              Atlantis Trip / Events Guides
            </h1>
            <p className="text-white/80 text-base">
              Your complete guide to unforgettable trip experiences
            </p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <p className="text-white/60 text-xs">
                Thousands of gay men from around the world
              </p>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as 'all' | 'upcoming' | 'current' | 'past')}>
            <div className="flex justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-1">
                <TabsList className={`grid w-full ${hasCurrent ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  <TabsTrigger value="all" className="flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4" />
                    <span className="hidden sm:inline">All</span>
                  </TabsTrigger>
                  {hasCurrent && (
                    <TabsTrigger value="current" className="flex items-center gap-2 relative bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-400/30 shadow-lg">
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
              </div>
            </div>
          </Tabs>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pt-[24px] pb-[2px]">
        {/* Filtered Trips */}
        {filteredTrips.length > 0 ? (
          <section>
            {activeFilter === 'all' ? (
              // Sectioned view for "All" filter
              <div>
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Grid3X3 className="w-6 h-6 text-white/70" />
                    <h2 className="text-2xl font-semibold text-white">All Trip Guides</h2>
                  </div>
                  <p className="text-sm text-white/70">Explore all available trip guides and experiences</p>
                </div>

                {/* Current Trips Section */}
                {groupedTrips.current.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-6">
                      <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <h3 className="text-lg font-semibold text-white">Currently Sailing</h3>
                      <div className="flex-1 h-px bg-white/20 ml-3"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                      {groupedTrips.current.map((trip) => (
                        <TripCard key={trip.id} trip={trip} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Trips Section */}
                {groupedTrips.upcoming.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-6">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <h3 className="text-lg font-semibold text-white">Upcoming Adventures</h3>
                      <div className="flex-1 h-px bg-white/20 ml-3"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                      {groupedTrips.upcoming.map((trip) => (
                        <TripCard key={trip.id} trip={trip} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Trips Section */}
                {groupedTrips.past.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-6">
                      <History className="w-4 h-4 text-amber-400" />
                      <h3 className="text-lg font-semibold text-white">Past Adventures</h3>
                      <div className="flex-1 h-px bg-white/20 ml-3"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                      {groupedTrips.past.map((trip) => (
                        <TripCard key={trip.id} trip={trip} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Single section view for specific filters
              <div>
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    {activeFilter === 'upcoming' && <Calendar className="w-6 h-6 text-white/70" />}
                    {activeFilter === 'current' && <Clock className="w-6 h-6 text-emerald-400 animate-pulse" />}
                    {activeFilter === 'past' && <History className="w-6 h-6 text-white/70" />}
                    <h2 className="text-2xl font-semibold text-white">
                      {activeFilter === 'upcoming' && 'Upcoming Trips'}
                      {activeFilter === 'current' && 'Current Trips'}
                      {activeFilter === 'past' && 'Past Adventures'}
                    </h2>
                  </div>
                  <p className="text-sm text-white/70">
                    {activeFilter === 'upcoming' && 'Access your trip guide and plan your adventure'}
                    {activeFilter === 'current' && 'Currently sailing - access your trip guide'}
                    {activeFilter === 'past' && 'Relive the memories and revisit your trip guides'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                  {filteredTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-6">
              {activeFilter === 'all' && <Grid3X3 className="h-8 w-8 text-white" />}
              {activeFilter === 'upcoming' && <Calendar className="h-8 w-8 text-white" />}
              {activeFilter === 'current' && <Clock className="h-8 w-8 text-white" />}
              {activeFilter === 'past' && <History className="h-8 w-8 text-white" />}
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              {activeFilter === 'all' && 'No Trip Guides Available'}
              {activeFilter === 'upcoming' && 'No Upcoming Trips'}
              {activeFilter === 'current' && 'No Current Trips'}
              {activeFilter === 'past' && 'No Past Trips'}
            </h2>
            <p className="text-white/80 text-lg">
              {activeFilter === 'all' && 'No trip guides are currently available'}
              {activeFilter === 'upcoming' && 'Check back soon for new trip announcements!'}
              {activeFilter === 'current' && 'No trips are currently sailing'}
              {activeFilter === 'past' && 'No past trip guides available'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="atlantis-gradient wave-pattern text-white py-6 mt-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="https://atlantisevents.com/wp-content/themes/atlantis/assets/images/logos/atlantis-logo.png" 
              alt="Atlantis Events" 
              className="h-8 w-auto mr-3 brightness-0 invert"
            />
            <div className="text-left">
              <p className="text-sm text-white/80">All-Gay Vacations Since 1991</p>
            </div>
          </div>
          <p className="text-sm text-white/80">
            Your ultimate resource for cruise information and planning
          </p>
        </div>
      </footer>
    </div>
  );
}