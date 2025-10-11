import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays, Ship, MapPin, Clock, Home } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { dateOnly } from '@/lib/utils';
import { getTripButtonText } from '@/lib/tripUtils';

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

interface FeaturedTripCarouselProps {
  trips: Trip[];
}

// Regular TripCard component for mobile view
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

export function FeaturedTripCarousel({ trips }: FeaturedTripCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance every 7 seconds
  useEffect(() => {
    if (trips.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % trips.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [trips.length, isPaused]);

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev - 1 + trips.length) % trips.length);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % trips.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (trips.length === 0) return null;

  const currentTrip = trips[currentIndex];
  const startDate = dateOnly(currentTrip.startDate);
  const endDate = dateOnly(currentTrip.endDate);
  const duration = differenceInCalendarDays(endDate, startDate);

  return (
    <div className="mb-12">
      <div className="flex items-center justify-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-emerald-400 animate-pulse" />
        <h2 className="text-2xl font-bold text-white">Current Trips</h2>
      </div>

      {/* Mobile: Show regular TripCard (below sm breakpoint - 640px) */}
      <div className="sm:hidden">
        <TripCard trip={currentTrip} />
        {/* Dot Indicators for Mobile */}
        {trips.length > 1 && (
          <div className="flex justify-center gap-2 mt-5">
            {trips.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all ${
                  index === currentIndex
                    ? 'w-6 h-2 rounded bg-emerald-400'
                    : 'w-2 h-2 rounded-full bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to trip ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Tablet & Desktop: Show Featured Layout (sm breakpoint and above - 640px+) */}
      <div
        className="hidden sm:block relative max-w-3xl mx-auto"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Main Featured Card - Side by Side Layout */}
        <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl transition-all duration-300 hover:shadow-3xl">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Featured Image - Left Side */}
            <div className="relative h-48 md:h-96">
              <img
                src={currentTrip.heroImageUrl || '/images/ships/resilient-lady-hero.jpg'}
                alt={currentTrip.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={e => {
                  e.currentTarget.src = '/images/ships/resilient-lady-hero.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

              {/* Trip Type Badge */}
              <div className="absolute top-4 left-4">
                {currentTrip.tripTypeId === 2 ? (
                  <span className="px-3 py-1.5 bg-cyan-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full flex items-center gap-1.5 border border-white/30">
                    <Home className="h-3.5 w-3.5" />
                    Resort
                  </span>
                ) : currentTrip.tripTypeId === 1 ? (
                  <span className="px-3 py-1.5 bg-blue-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-full flex items-center gap-1.5 border border-white/30">
                    <Ship className="h-3.5 w-3.5" />
                    Cruise
                  </span>
                ) : null}
              </div>

              {/* Sailing Now Badge */}
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1.5 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-full animate-pulse border border-white/30 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Sailing Now
                </span>
              </div>

              {/* Duration Badge at Bottom */}
              <div className="absolute bottom-4 left-4">
                <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm text-ocean-900 text-xs font-semibold rounded-full">
                  {duration} Days
                </span>
              </div>
            </div>

            {/* Featured Content - Right Side */}
            <div className="p-6 flex flex-col justify-between">
              <div>
                {/* Location */}
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-ocean-300" />
                  <span className="text-ocean-200 text-sm font-medium">
                    {currentTrip.highlights && currentTrip.highlights.length > 0
                      ? currentTrip.highlights[0]
                      : 'Multiple Destinations'}
                  </span>
                </div>

                {/* Trip Name */}
                <h3 className="text-2xl font-black text-white mb-3 leading-tight">
                  {currentTrip.name}
                </h3>

                {/* Description */}
                <p className="text-ocean-100 mb-5 leading-relaxed line-clamp-2">
                  {currentTrip.description || 'An exciting adventure awaits'}
                </p>

                {/* Details Grid */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-9 h-9 rounded-full bg-ocean-600/30 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">
                        {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-ocean-200">{duration} days of adventure</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-white">
                    <div className="w-9 h-9 rounded-full bg-ocean-600/30 flex items-center justify-center flex-shrink-0">
                      <Ship className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">
                        {currentTrip.shipName || 'Ship Details Coming Soon'}
                      </div>
                      {currentTrip.cruiseLine && (
                        <div className="text-xs text-ocean-200">{currentTrip.cruiseLine}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Highlights Tags */}
                {currentTrip.highlights && currentTrip.highlights.length > 1 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {currentTrip.highlights.slice(1, 4).map((highlight, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-ocean-700/40 text-ocean-100 rounded-full text-xs font-medium border border-ocean-500/30"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <Link
                href={`/trip/${currentTrip.slug}`}
                onClick={() => {
                  window.scrollTo(0, 0);
                  document.documentElement.scrollTop = 0;
                  document.body.scrollTop = 0;
                }}
              >
                <Button className="w-full py-3 bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl text-sm">
                  {getTripButtonText(currentTrip.tripType)} →
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {trips.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2.5 rounded-full transition-all shadow-lg hover:shadow-xl border border-white/30 z-10"
              aria-label="Previous trip"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2.5 rounded-full transition-all shadow-lg hover:shadow-xl border border-white/30 z-10"
              aria-label="Next trip"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {trips.length > 1 && (
          <div className="flex justify-center gap-2 mt-5">
            {trips.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all ${
                  index === currentIndex
                    ? 'w-6 h-2 rounded bg-emerald-400'
                    : 'w-2 h-2 rounded-full bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to trip ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
