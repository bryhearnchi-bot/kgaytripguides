import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Ship, MapPin, Anchor, Clock, Calendar, History, Grid3X3 } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import React from "react";

interface Cruise {
  id: number;
  name: string;
  slug: string;
  shipName: string;
  cruiseLine: string;
  startDate: string;
  endDate: string;
  status: string;
  heroImageUrl: string | null;
  description: string | null;
  highlights: string[] | null;
}

function CruiseCard({ cruise }: { cruise: Cruise }) {
  const startDate = new Date(cruise.startDate);
  const endDate = new Date(cruise.endDate);
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white/95 backdrop-blur-sm border-ocean-200/60">
      <Link href={`/cruise/${cruise.slug}`}>
        <div className="relative overflow-hidden cursor-pointer">
          <img
            src={cruise.heroImageUrl || "/images/ships/resilient-lady-hero.jpg"}
            alt={cruise.name}
            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = "/images/ships/resilient-lady-hero.jpg";
            }}
          />
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-ocean-100 text-ocean-700 border-ocean-200">
              {cruise.status === 'upcoming' && 'Upcoming'}
              {cruise.status === 'current' && 'Current'}
              {cruise.status === 'past' && 'Past'}
            </Badge>
          </div>
        </div>
      </Link>
      
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-ocean-900 group-hover:text-ocean-700 transition-colors">
          {cruise.name}
        </CardTitle>
        <CardDescription className="text-ocean-600">
          {cruise.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-ocean-700">
            <Ship className="h-4 w-4" />
            <span>{cruise.shipName} • {cruise.cruiseLine}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-ocean-700">
            <CalendarDays className="h-4 w-4" />
            <span>
              {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")} • {duration} days
            </span>
          </div>
          
          {cruise.highlights && cruise.highlights.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-ocean-700">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{cruise.highlights[0]}</span>
            </div>
          )}
        </div>
        
        <Link href={`/cruise/${cruise.slug}`}>
          <Button className="w-full bg-gradient-to-r from-ocean-600 to-ocean-700 hover:from-ocean-700 hover:to-ocean-800 text-white">
            View Cruise Guide
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Function to determine cruise status based on dates
function getCruiseStatus(startDate: string, endDate: string): 'upcoming' | 'current' | 'past' {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
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
  
  const { data: cruises, isLoading, error } = useQuery<Cruise[]>({
    queryKey: ["cruises"],
    queryFn: async () => {
      const response = await fetch("/api/cruises");
      if (!response.ok) {
        throw new Error("Failed to fetch cruises");
      }
      const data = await response.json();
      // Calculate status for each cruise based on dates
      return data.map((cruise: Cruise) => ({
        ...cruise,
        status: getCruiseStatus(cruise.startDate, cruise.endDate)
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Determine if there are current cruises
  const hasCurrent = cruises?.some(cruise => cruise.status === 'current') || false;
  const [hasSetDefault, setHasSetDefault] = useState(false);

  // Set default filter when data loads
  React.useEffect(() => {
    if (cruises && !hasSetDefault) {
      if (hasCurrent) {
        setActiveFilter('current');
      } else {
        setActiveFilter('all');
      }
      setHasSetDefault(true);
    }
  }, [cruises, hasCurrent, hasSetDefault]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading cruise guides...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400 flex items-center justify-center">
        <div className="text-center text-white">
          <Ship className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Unable to load cruise guides</h2>
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

  // Filter cruises based on active filter
  const filteredCruises = cruises?.filter(cruise => 
    activeFilter === 'all' ? true : cruise.status === activeFilter
  ) || [];

  // Group cruises by status for "all" view
  const groupedCruises = cruises ? {
    current: cruises.filter(cruise => cruise.status === 'current'),
    upcoming: cruises.filter(cruise => cruise.status === 'upcoming'),
    past: cruises.filter(cruise => cruise.status === 'past')
  } : { current: [], upcoming: [], past: [] };

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400">
      {/* Header */}
      <header className="cruise-gradient wave-pattern text-white fixed top-0 left-0 right-0 z-40 bg-ocean-600 opacity-100 pt-[15px] pb-[24px]">
        <div className="max-w-7xl mx-auto px-4 py-1">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
              Atlantis Cruise Guides
            </h1>
            <p className="text-white/80 text-base">
              Your complete guide to unforgettable cruise experiences
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
      <div className="max-w-7xl mx-auto px-4 pt-[180px] pb-[24px]">
        {/* Filtered Cruises */}
        {filteredCruises.length > 0 ? (
          <section>
            {activeFilter === 'all' ? (
              // Sectioned view for "All" filter
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-white mb-2">All Cruise Guides</h2>
                  <p className="text-sm text-white/70">Explore all available cruise guides and experiences</p>
                </div>

                {/* Current Cruises Section */}
                {groupedCruises.current.length > 0 && (
                  <div className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                      <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <h3 className="text-lg font-semibold text-white">Currently Sailing</h3>
                      <div className="flex-1 h-px bg-white/20 ml-3"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {groupedCruises.current.map((cruise) => (
                        <CruiseCard key={cruise.id} cruise={cruise} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Cruises Section */}
                {groupedCruises.upcoming.length > 0 && (
                  <div className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <h3 className="text-lg font-semibold text-white">Upcoming Adventures</h3>
                      <div className="flex-1 h-px bg-white/20 ml-3"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {groupedCruises.upcoming.map((cruise) => (
                        <CruiseCard key={cruise.id} cruise={cruise} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Cruises Section */}
                {groupedCruises.past.length > 0 && (
                  <div className="mb-16">
                    <div className="flex items-center gap-2 mb-6">
                      <History className="w-4 h-4 text-amber-400" />
                      <h3 className="text-lg font-semibold text-white">Past Adventures</h3>
                      <div className="flex-1 h-px bg-white/20 ml-3"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {groupedCruises.past.map((cruise) => (
                        <CruiseCard key={cruise.id} cruise={cruise} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Single section view for specific filters
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-semibold text-white mb-2">
                    {activeFilter === 'upcoming' && 'Upcoming Cruises'}
                    {activeFilter === 'current' && 'Current Cruises'}
                    {activeFilter === 'past' && 'Past Adventures'}
                  </h2>
                  <p className="text-sm text-white/70">
                    {activeFilter === 'upcoming' && 'Access your cruise guide and plan your adventure'}
                    {activeFilter === 'current' && 'Currently sailing - access your cruise guide'}
                    {activeFilter === 'past' && 'Relive the memories and revisit your cruise guides'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredCruises.map((cruise) => (
                    <CruiseCard key={cruise.id} cruise={cruise} />
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
              {activeFilter === 'all' && 'No Cruise Guides Available'}
              {activeFilter === 'upcoming' && 'No Upcoming Cruises'}
              {activeFilter === 'current' && 'No Current Cruises'}
              {activeFilter === 'past' && 'No Past Cruises'}
            </h2>
            <p className="text-white/80 text-lg">
              {activeFilter === 'all' && 'No cruise guides are currently available'}
              {activeFilter === 'upcoming' && 'Check back soon for new cruise announcements!'}
              {activeFilter === 'current' && 'No cruises are currently sailing'}
              {activeFilter === 'past' && 'No past cruise guides available'}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="atlantis-gradient wave-pattern text-white py-12 mt-16">
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