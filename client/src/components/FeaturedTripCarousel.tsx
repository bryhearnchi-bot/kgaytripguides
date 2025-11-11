import React, { useState, useEffect } from 'react';
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
  charterCompanyName?: string;
  charterCompanyLogo?: string;
}

// Helper function to get trip status badge
function getTripStatusBadge(startDate: Date, endDate: Date, status: string) {
  const now = new Date();
  const daysUntilStart = differenceInCalendarDays(startDate, now);
  const daysUntilEnd = differenceInCalendarDays(endDate, now);

  // Trip is currently happening
  if (now >= startDate && now <= endDate) {
    return {
      text: 'Sailing Now',
      className: 'bg-emerald-500/90 backdrop-blur-sm text-white animate-pulse',
      show: true,
    };
  }

  // Trip starts in the next 30 days
  if (daysUntilStart > 0 && daysUntilStart <= 30) {
    const dayText = daysUntilStart === 1 ? 'day' : 'days';
    return {
      text: `${daysUntilStart} ${dayText} away`,
      className: 'bg-blue-500/90 backdrop-blur-sm text-white',
      show: true,
    };
  }

  // Don't show badge for trips far in the future or past trips
  return {
    text: '',
    className: '',
    show: false,
  };
}

interface FeaturedTripCarouselProps {
  trips: Trip[];
  onOpenFlyUp: (slug: string) => void;
}

// Regular TripCard component for mobile view
function TripCard({ trip, onOpenFlyUp }: { trip: Trip; onOpenFlyUp: (slug: string) => void }) {
  const startDate = dateOnly(trip.startDate);
  const endDate = dateOnly(trip.endDate);
  const duration = differenceInCalendarDays(endDate, startDate);
  const statusBadge = getTripStatusBadge(startDate, endDate, trip.status);

  return (
    <div className="rounded-2xl p-[2px] bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(255,0,255,0.5)] animate-gradient-x">
      <div className="group rounded-2xl overflow-hidden bg-white/10 backdrop-blur-lg shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] flex flex-col h-full">
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
            {statusBadge.show && (
              <div className="absolute top-3 left-3">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge.className} border border-white/30`}
                >
                  {statusBadge.text}
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
                {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')} • {duration} nights
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

          <Button
            onClick={() => onOpenFlyUp(trip.slug)}
            className="w-full py-3 bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            {getTripButtonText(trip.tripType)}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FeaturedTripCarousel({ trips, onOpenFlyUp }: FeaturedTripCarouselProps) {
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
  if (!currentTrip) return null;

  const startDate = dateOnly(currentTrip.startDate);
  const endDate = dateOnly(currentTrip.endDate);
  const duration = differenceInCalendarDays(endDate, startDate);
  const statusBadge = getTripStatusBadge(startDate, endDate, currentTrip.status);

  return (
    <div>
      {/* Mobile: Show regular TripCard (below sm breakpoint - 640px) */}
      <div className="sm:hidden">
        <TripCard trip={currentTrip} onOpenFlyUp={onOpenFlyUp} />
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
        {/* Main Featured Card - Side by Side Layout with Rainbow Border */}
        <div className="rounded-2xl p-[2px] bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-indigo-500 to-purple-500 shadow-[0_0_20px_rgba(255,0,255,0.5)] animate-gradient-x">
          <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl transition-all duration-300 hover:shadow-3xl">
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

                {/* Status Badge - Days away shown in top left */}
                {statusBadge.show && (
                  <div className="absolute top-4 left-4">
                    <span
                      className={`px-3 py-1.5 text-xs font-bold rounded-full ${statusBadge.className} border border-white/30`}
                    >
                      {statusBadge.text}
                    </span>
                  </div>
                )}
              </div>

              {/* Featured Content - Right Side */}
              <div className="p-6 flex flex-col justify-between">
                <div>
                  {/* Header with Charter Logo on top (right-aligned), Trip Name below (left-aligned) */}
                  <div className="flex flex-col gap-3 mb-3">
                    {/* Charter Logo - Right-aligned, conditional sizing based on company */}
                    {currentTrip.charterCompanyLogo && (
                      <img
                        src={currentTrip.charterCompanyLogo}
                        alt={currentTrip.charterCompanyName || 'Charter Company'}
                        className={`${
                          currentTrip.charterCompanyName?.toLowerCase().includes('atlantis')
                            ? 'h-5'
                            : currentTrip.charterCompanyName?.toLowerCase().includes('vakaya')
                              ? 'h-6'
                              : 'h-12'
                        } w-auto object-contain rounded shadow flex-shrink-0 self-end`}
                        loading="lazy"
                      />
                    )}
                    {/* Trip Name - Left-aligned, auto-sizing to fit one line */}
                    <h3
                      className="font-black text-white leading-tight whitespace-nowrap"
                      style={{
                        fontSize: `${Math.max(0.75, Math.min(1.5, 30 / currentTrip.name.length))}rem`,
                      }}
                    >
                      {currentTrip.name}
                    </h3>
                  </div>

                  {/* Description - smaller font, more lines */}
                  <p className="text-sm text-ocean-100 mb-5 leading-relaxed line-clamp-4">
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
                        <div className="text-xs text-ocean-200">{duration} nights</div>
                      </div>
                    </div>

                    {currentTrip.tripTypeId === 2
                      ? // Resort Trip
                        currentTrip.resortName && (
                          <div className="flex items-center gap-3 text-white">
                            <div className="w-9 h-9 rounded-full bg-ocean-600/30 flex items-center justify-center flex-shrink-0">
                              <Home className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{currentTrip.resortName}</div>
                              {currentTrip.resortLocation && (
                                <div className="text-xs text-ocean-200">
                                  {currentTrip.resortLocation}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      : // Cruise Trip
                        currentTrip.shipName && (
                          <div className="flex items-center gap-3 text-white">
                            <div className="w-9 h-9 rounded-full bg-ocean-600/30 flex items-center justify-center flex-shrink-0">
                              <Ship className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{currentTrip.shipName}</div>
                              {currentTrip.cruiseLine && (
                                <div className="text-xs text-ocean-200">
                                  {currentTrip.cruiseLine}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => onOpenFlyUp(currentTrip.slug)}
                  className="w-full py-3 bg-gradient-to-r from-ocean-500 to-ocean-600 hover:from-ocean-600 hover:to-ocean-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl text-sm"
                >
                  {getTripButtonText(currentTrip.tripType)} →
                </Button>
              </div>
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
