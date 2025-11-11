import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Trip } from '@/types/trip';
import { Loader2, History, MapPin, Ship, Home, CalendarDays } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { dateOnly } from '@/lib/utils';
import { getTripButtonText } from '@/lib/tripUtils';
import { Button } from '@/components/ui/button';
import { FlyUpMenu } from '@/components/ui/FlyUpMenu';
import TripGuide from '@/components/trip-guide';
import { TripGuideBottomNav } from '@/components/TripGuideBottomNav';

function TripCard({ trip, onOpenFlyUp }: { trip: Trip; onOpenFlyUp: (slug: string) => void }) {
  const startDate = dateOnly(trip.startDate);
  const endDate = dateOnly(trip.endDate);
  const tripDuration = differenceInCalendarDays(endDate, startDate);

  return (
    <div className="group rounded-2xl overflow-hidden bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] flex flex-col h-full">
      <div onClick={() => onOpenFlyUp(trip.slug)} className="cursor-pointer">
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

        <Button
          onClick={() => onOpenFlyUp(trip.slug)}
          className="w-full py-3 bg-ocean-600 hover:bg-ocean-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
        >
          {getTripButtonText(trip.tripType)}
        </Button>
      </div>
    </div>
  );
}

export default function PastTrips() {
  const [flyUpOpen, setFlyUpOpen] = useState(false);
  const [selectedTripSlug, setSelectedTripSlug] = useState<string | null>(null);
  const [tripGuideActiveTab, setTripGuideActiveTab] = useState('overview');

  // Handler to open trip in fly-up menu
  const handleOpenFlyUp = (slug: string) => {
    setSelectedTripSlug(slug);
    setTripGuideActiveTab('overview'); // Reset to overview tab
    setFlyUpOpen(true);
  };

  // Handler to close fly-up
  const handleCloseFlyUp = () => {
    setFlyUpOpen(false);
    // Small delay before clearing slug to allow animation to complete
    setTimeout(() => {
      setSelectedTripSlug(null);
      setTripGuideActiveTab('overview');
    }, 200);
  };

  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await api.get('/api/trips');
      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Filter to only show past trips
  const pastTrips = useMemo(() => {
    if (!trips) return [];

    const now = new Date();
    return trips
      .filter(trip => {
        const endDate = new Date(trip.endDate);
        return endDate < now;
      })
      .sort((a, b) => {
        // Sort by end date, most recent first
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      });
  }, [trips]);

  // Get selected trip data for fly-up header
  const selectedTrip = trips?.find(trip => trip.slug === selectedTripSlug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      {/* Hero Section */}
      <section className="pt-24 pb-0 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 drop-shadow-2xl">
              <span className="relative inline-block">
                Once
                <svg
                  width="223"
                  height="12"
                  viewBox="0 0 223 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute inset-x-0 bottom-0 w-full translate-y-1/2"
                >
                  <defs>
                    <linearGradient id="rainbow-gradient-past" x1="0%" y1="0%" x2="100%" y2="0%">
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
                    stroke="url(#rainbow-gradient-past)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{' '}
              Upon a Time
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-ocean-200 max-w-3xl mx-auto px-4 line-clamp-2">
              Interactive Guides of the Past to Relive the Memories.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        {/* Header - Sticky */}
        <div className="safari-sticky-header sticky top-16 z-20 mt-4 mb-2 pb-6 -mx-4 px-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Past Trips</h3>
            <div className="flex-1 h-px bg-white/20 ml-3"></div>
          </div>
        </div>

        {pastTrips.length === 0 ? (
          <div className="text-center py-16">
            <History className="w-20 h-20 text-white/20 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-white/60 mb-3">No past trips</h3>
            <p className="text-sm text-white/40">Your completed trips will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
            {pastTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} onOpenFlyUp={handleOpenFlyUp} />
            ))}
          </div>
        )}
      </div>

      {/* Full-page fly-up menu for trip guide */}
      <FlyUpMenu
        open={flyUpOpen}
        onOpenChange={open => {
          if (!open) handleCloseFlyUp();
        }}
        variant="full"
        charterCompanyLogo={selectedTrip?.charterCompanyLogo}
        charterCompanyName={selectedTrip?.charterCompanyName}
        tripType={selectedTrip?.tripTypeId === 2 ? 'resort' : 'cruise'}
        bottomNavigation={
          <TripGuideBottomNav
            activeTab={tripGuideActiveTab}
            onTabChange={setTripGuideActiveTab}
            isCruise={selectedTrip?.tripTypeId !== 2}
          />
        }
      >
        {selectedTripSlug && (
          <TripGuide
            slug={selectedTripSlug}
            showBottomNav={true}
            activeTab={tripGuideActiveTab}
            onTabChange={setTripGuideActiveTab}
          />
        )}
      </FlyUpMenu>
    </div>
  );
}
