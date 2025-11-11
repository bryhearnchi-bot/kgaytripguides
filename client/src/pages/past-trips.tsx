import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { api } from '@/lib/api-client';
import type { Trip } from '@/types/trip';
import { Loader2, History, MapPin, Ship, Home, CalendarDays } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { dateOnly } from '@/lib/utils';
import { getTripButtonText } from '@/lib/tripUtils';
import { Button } from '@/components/ui/button';

function TripCard({ trip }: { trip: Trip }) {
  const startDate = dateOnly(trip.startDate);
  const endDate = dateOnly(trip.endDate);
  const tripDuration = differenceInCalendarDays(endDate, startDate);

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
          {trip.charterCompanyLogo && (
            <div className="absolute top-3 right-3">
              <div className="bg-white/60 backdrop-blur-lg rounded-lg px-2 py-1 shadow-lg border border-white/30">
                <img
                  src={trip.charterCompanyLogo}
                  alt={trip.charterCompanyName || 'Charter Company'}
                  className="h-6 w-auto object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col">
        <h4 className="text-xl font-bold text-white mb-4 group-hover:text-ocean-200 transition-colors">
          {trip.name}
        </h4>

        <div className="space-y-2 mb-4 flex-1">
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
                <div className="text-ocean-100 text-sm">
                  <div className="flex items-center gap-2">
                    <Ship className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{trip.shipName}</span>
                  </div>
                  {trip.cruiseLine && (
                    <div className="ml-6 text-xs text-ocean-200 mt-0.5">{trip.cruiseLine}</div>
                  )}
                </div>
              )}
            </>
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
          <Button className="w-full py-3 bg-ocean-600 hover:bg-ocean-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl">
            {getTripButtonText(trip.tripType)}
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function PastTrips() {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pt-16 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mt-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <History className="w-8 h-8 text-white/80" />
            <h1 className="text-3xl font-bold text-white">Past Trips</h1>
          </div>
          <p className="text-sm text-white/70">
            {pastTrips.length === 0
              ? 'No past trips yet'
              : `${pastTrips.length} trip${pastTrips.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {pastTrips.length === 0 ? (
          <div className="text-center py-16">
            <History className="w-20 h-20 text-white/20 mx-auto mb-6" />
            <h3 className="text-xl font-medium text-white/60 mb-3">No past trips</h3>
            <p className="text-sm text-white/40">Your completed trips will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastTrips.map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
