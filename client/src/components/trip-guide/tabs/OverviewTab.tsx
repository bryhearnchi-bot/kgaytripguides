import React, { memo, useState } from 'react';
import {
  Info,
  Ship,
  MapPin,
  Calendar,
  Users,
  Bell,
  Anchor,
  Activity,
  Utensils,
  Sparkles,
  LayoutDashboard,
  Map,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useHaptics } from '@/hooks/useHaptics';
import { cn, dateOnly } from '@/lib/utils';
import { differenceInCalendarDays } from 'date-fns';
import HeroSection from '@/components/shadcn-studio/blocks/hero-section-01/hero-section-01';
import { TabHeader } from '../shared/TabHeader';

interface OverviewTabProps {
  tripData: any;
  ship?: any;
  ITINERARY: any[];
  SCHEDULE: any[];
  DAILY: any[];
  TALENT: any[];
  PARTY_THEMES: any[];
  onNavigateToTab?: (tab: string) => void;
  isCruise?: boolean;
  isResort?: boolean;
  slug?: string;
}

export const OverviewTab = memo(function OverviewTab({
  tripData,
  ship,
  ITINERARY,
  SCHEDULE,
  DAILY,
  TALENT,
  PARTY_THEMES,
  onNavigateToTab,
  isCruise = false,
  isResort = false,
  slug,
}: OverviewTabProps) {
  const haptics = useHaptics();
  const [isShipExpanded, setIsShipExpanded] = useState(false);

  const toggleShipInfo = () => {
    haptics.light();
    setIsShipExpanded(prev => !prev);
  };

  // Calculate booking button visibility
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const startDate = tripData?.trip?.startDate ? dateOnly(tripData.trip.startDate) : null;
  const endDate = tripData?.trip?.endDate ? dateOnly(tripData.trip.endDate) : null;
  const daysUntilStart = startDate ? differenceInCalendarDays(startDate, now) : 0;
  const isPastTrip = endDate ? now > endDate : false;
  const showBookButton = tripData?.trip?.bookingUrl && daysUntilStart >= 10 && !isPastTrip;

  // Get embarkation info from first stop
  const embarkationStop = ITINERARY[0];

  // Calculate statistics from actual data
  const statistics = {
    // Count unique ports (overnight stays at same port only count once)
    totalPorts: (() => {
      const ports = ITINERARY.filter(
        stop => stop.port && !stop.port.toLowerCase().includes('sea day')
      );
      let uniquePortCount = 0;
      let lastPort = '';

      ports.forEach(stop => {
        // Only count if different from previous port (handles overnight stays)
        if (stop.port !== lastPort) {
          uniquePortCount++;
          lastPort = stop.port;
        }
      });

      return uniquePortCount;
    })(),
    // Count sea days
    seaDays: ITINERARY.filter(
      stop =>
        !stop.port ||
        stop.port.toLowerCase().includes('sea day') ||
        stop.port.toLowerCase().includes('at sea')
    ).length,
    // Count total events from schedule (excluding parties)
    totalEvents: DAILY.reduce(
      (acc, day) =>
        acc +
        (day.items?.filter(
          (item: any) => !item.type?.toLowerCase().includes('party') && !item.partyThemeId
        ).length || 0),
      0
    ),
    // Count party themes (from PARTY_THEMES array)
    totalParties: PARTY_THEMES.length,
    // Count talent/performers
    totalTalent: TALENT.length,
    // Calculate nights from actual trip dates (not itinerary length)
    nights: (() => {
      if (tripData?.trip?.startDate && tripData?.trip?.endDate) {
        const startDate = dateOnly(tripData.trip.startDate);
        const endDate = dateOnly(tripData.trip.endDate);
        // Days between dates minus 1 = nights (e.g., Nov 16-28 is 12 days = 11 nights)
        const days = differenceInCalendarDays(endDate, startDate);
        return days > 0 ? days : 1;
      }
      return Math.max(ITINERARY.length, SCHEDULE.length, 1) - 1;
    })(),
  };

  // Get ship info from ship prop
  const shipInfo = {
    imageUrl: ship?.imageUrl || tripData?.trip?.heroImageUrl,
    capacity: ship?.capacity ? `${ship.capacity.toLocaleString()} guests` : undefined,
    decks: ship?.decks ? `${ship.decks} decks` : undefined,
    amenities: ship?.amenities || [],
    restaurants:
      ship?.venues?.filter((v: any) => ['Restaurant', 'Casual Dining'].includes(v.venueType)) || [],
  };

  return (
    <>
      {/* Hero Section - Only visible on Overview tab */}
      <HeroSection
        tripName={tripData?.trip?.name}
        tripDescription={null} // Description moved to Overview tab
        tripType={isCruise ? 'cruise' : isResort ? 'resort' : null}
        charterCompanyLogo={tripData?.trip?.charterCompanyLogo}
        charterCompanyName={tripData?.trip?.charterCompanyName}
        slug={slug}
        startDate={tripData?.trip?.startDate}
        endDate={tripData?.trip?.endDate}
        itinerary={ITINERARY || []}
      />

      {/* Book Button - Below carousel, before Overview header */}
      {showBookButton && (
        <div className="max-w-6xl mx-auto px-4 mb-3 md:mt-3 flex justify-center">
          <button
            onClick={() => window.open(tripData.trip.bookingUrl, '_blank', 'noopener,noreferrer')}
            className="w-full bg-orange-500/30 backdrop-blur-lg hover:bg-orange-500/40 text-white font-medium rounded-lg transition-all text-sm shadow-lg hover:shadow-xl border border-orange-500/40"
            style={{
              padding: '8px 16px',
              minHeight: 'auto',
              height: 'auto',
              lineHeight: '1.2',
              maxWidth: '390px',
            }}
          >
            <Info
              className="w-3.5 h-3.5 mr-1"
              style={{ display: 'inline-block', verticalAlign: 'middle' }}
            />
            Click Here for Booking Info
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <TabHeader icon={LayoutDashboard} title="Overview" iconColor="text-blue-400" />
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        {/* Desktop: 3-column grid, Mobile: stack with custom order */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4">
          {/* Left Column - Statistics, About, Ship */}
          <div className="flex flex-col gap-4 lg:col-span-2 lg:order-none">
            {/* Trip Statistics - Desktop/iPad only (at top of left column) */}
            <div className="hidden lg:block bg-white/10 border border-white/20 rounded-xl p-3 md:p-4 shadow-lg">
              <div className="flex items-center space-x-2 mb-2 md:mb-3">
                <div className="bg-blue-500/30 p-1 rounded">
                  <Activity className="w-3 h-3 text-blue-100" />
                </div>
                <h3 className="text-sm font-bold text-white/90">Trip Statistics</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <button
                  onClick={() => onNavigateToTab?.('itinerary')}
                  className="bg-white/5 hover:bg-white/10 rounded-lg p-2 text-center transition-colors cursor-pointer"
                >
                  <p className="text-lg md:text-xl font-bold text-white">{statistics.nights}</p>
                  <p className="text-[10px] md:text-xs text-white/60 mt-0.5">Nights</p>
                </button>
                <button
                  onClick={() => onNavigateToTab?.('itinerary')}
                  className="bg-white/5 hover:bg-white/10 rounded-lg p-2 text-center transition-colors cursor-pointer"
                >
                  <p className="text-lg md:text-xl font-bold text-white">{statistics.totalPorts}</p>
                  <p className="text-[10px] md:text-xs text-white/60 mt-0.5">Ports of Call</p>
                </button>
                <button
                  onClick={() => onNavigateToTab?.('itinerary')}
                  className="bg-white/5 hover:bg-white/10 rounded-lg p-2 text-center transition-colors cursor-pointer"
                >
                  <p className="text-lg md:text-xl font-bold text-white">{statistics.seaDays}</p>
                  <p className="text-[10px] md:text-xs text-white/60 mt-0.5">Sea Days</p>
                </button>
                <button
                  onClick={() => onNavigateToTab?.('parties')}
                  className="bg-blue-500/20 hover:bg-blue-500/30 rounded-lg p-2 text-center transition-colors cursor-pointer"
                >
                  <p className="text-lg md:text-xl font-bold text-white">
                    {statistics.totalParties}
                  </p>
                  <p className="text-[10px] md:text-xs text-white/60 mt-0.5">Theme Parties</p>
                </button>
                <button
                  onClick={() => onNavigateToTab?.('schedule')}
                  className="bg-blue-500/20 hover:bg-blue-500/30 rounded-lg p-2 text-center transition-colors cursor-pointer"
                >
                  <p className="text-lg md:text-xl font-bold text-white">
                    {statistics.totalEvents}
                  </p>
                  <p className="text-[10px] md:text-xs text-white/60 mt-0.5">Total Events</p>
                </button>
                <button
                  onClick={() => onNavigateToTab?.('talent')}
                  className="bg-blue-500/20 hover:bg-blue-500/30 rounded-lg p-2 text-center transition-colors cursor-pointer"
                >
                  <p className="text-lg md:text-xl font-bold text-white">
                    {statistics.totalTalent}
                  </p>
                  <p className="text-[10px] md:text-xs text-white/60 mt-0.5">Performers</p>
                </button>
              </div>
            </div>

            {/* About This Trip - Mobile: 2nd */}
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg order-2 lg:order-none">
              <div className="flex items-center space-x-2 mb-3">
                <div className="bg-ocean-500/30 p-1 rounded">
                  <Info className="w-3 h-3 text-ocean-100" />
                </div>
                <h3 className="text-sm font-bold text-white/90">About This Trip</h3>
              </div>

              {/* Mobile: Stack vertically, Desktop: Side by side */}
              <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* Trip Hero Image */}
                {tripData?.trip?.heroImageUrl && (
                  <div className="flex-shrink-0 w-full md:w-48 flex justify-center md:justify-start">
                    <img
                      src={tripData.trip.heroImageUrl}
                      alt={tripData.trip.name}
                      className="w-full md:w-48 h-48 md:h-32 object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <p className="text-xs text-white/80 leading-relaxed">
                    {tripData?.trip?.description ||
                      'Experience an unforgettable journey through stunning destinations with world-class entertainment and amenities.'}
                  </p>

                  {/* Time badges */}
                  {(embarkationStop?.depart || embarkationStop?.allAboard) && (
                    <div className="flex flex-wrap gap-2">
                      {embarkationStop?.depart && (
                        <div className="flex items-center gap-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full px-3 py-1">
                          <Clock className="w-3 h-3 text-blue-300" />
                          <span className="text-xs text-blue-100 font-medium">Depart:</span>
                          <span className="text-xs text-white font-semibold">
                            {embarkationStop.depart}
                          </span>
                        </div>
                      )}
                      {embarkationStop?.allAboard && (
                        <div className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-400/30 rounded-full px-3 py-1">
                          <Clock className="w-3 h-3 text-orange-300" />
                          <span className="text-xs text-orange-100 font-medium">All Aboard:</span>
                          <span className="text-xs text-white font-semibold">
                            {embarkationStop.allAboard}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ship Details - Mobile: 3rd (collapsible) */}
            <div className="bg-white/10 border border-white/20 rounded-xl shadow-lg p-4 md:p-6 order-3 lg:order-none">
              {/* Ship Header */}
              <div className="flex items-center space-x-2 mb-3">
                <div className="bg-purple-500/30 p-1 rounded">
                  <Ship className="w-3 h-3 text-purple-100" />
                </div>
                <h3 className="text-sm font-bold text-white/90">
                  {ship?.name || tripData?.trip?.shipName || 'Ship'}
                </h3>
              </div>

              {/* Ship Content */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                {/* Ship Image - Always visible */}
                {shipInfo?.imageUrl && (
                  <div className="flex-shrink-0 w-full md:w-56 flex justify-center md:justify-end md:order-2">
                    <img
                      src={shipInfo.imageUrl}
                      alt={ship?.name || tripData?.trip?.shipName || 'Ship'}
                      className="w-full md:w-56 h-48 md:h-36 object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Ship Info Section - Always visible on mobile */}
                <div className="flex-1 md:order-1">
                  {/* Ship Stats Grid - Always visible */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    <div>
                      <p className="text-xs text-white/60">Cruise Line</p>
                      <p className="text-xs text-white/90">
                        {ship?.cruiseLineName || tripData?.trip?.cruiseLine || 'Virgin Voyages'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Capacity</p>
                      <p className="text-xs text-white/90">
                        {shipInfo?.capacity || '2,770 guests'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Decks</p>
                      <p className="text-xs text-white/90">{shipInfo?.decks || '17 (14 guest)'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collapsible content on mobile, always visible on desktop */}
              <div
                className={cn(
                  'lg:block', // Always visible on desktop
                  isShipExpanded ? 'block' : 'hidden' // Toggle on mobile
                )}
              >
                {/* Restaurants */}
                {shipInfo?.restaurants && shipInfo.restaurants.length > 0 && (
                  <div className="border-t border-white/10 pt-4 pb-4 mt-4">
                    <div className="flex items-center space-x-1 mb-3">
                      <Utensils className="w-3 h-3 text-white/60" />
                      <p className="text-xs font-semibold text-white/80">Dining Venues</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
                      {shipInfo.restaurants.map((restaurant, idx) => (
                        <p key={idx} className="text-xs text-white/70">
                          • {restaurant.name}
                          {restaurant.venueType && (
                            <span className="text-white/50"> ({restaurant.venueType})</span>
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {shipInfo?.amenities && shipInfo.amenities.length > 0 && (
                  <div className="border-t border-white/10 pt-4 pb-2">
                    <div className="flex items-center space-x-1 mb-3">
                      <Sparkles className="w-3 h-3 text-white/60" />
                      <p className="text-xs font-semibold text-white/80">Amenities</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1">
                      {shipInfo.amenities.map((amenity, idx) => (
                        <p key={idx} className="text-xs text-white/70">
                          • {amenity}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile-only collapse button - Bottom right */}
              <div className="lg:hidden flex justify-end mt-4">
                <button
                  onClick={toggleShipInfo}
                  className="flex items-center gap-1 text-xs text-white/70 hover:text-white/90 transition-colors px-3 py-1.5 rounded-md hover:bg-white/5 border border-white/20"
                >
                  {isShipExpanded ? (
                    <>
                      Less Info
                      <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      More Info
                      <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Cruise Route */}
          <div className="flex flex-col gap-4 lg:col-span-1 lg:order-none">
            {/* Cruise Route */}
            <div className="bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg">
              <div className="flex items-center space-x-2 mb-3">
                <div className="bg-emerald-500/30 p-1 rounded">
                  <Map className="w-3 h-3 text-emerald-100" />
                </div>
                <h3 className="text-sm font-bold text-white/90">Cruise Route</h3>
              </div>
              {tripData?.trip?.mapUrl ? (
                <img
                  src={tripData.trip.mapUrl}
                  alt={`${tripData.trip.name} Route Map`}
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-48 bg-white/5 rounded-lg">
                  <Map className="w-8 h-8 text-white/20 mb-2" />
                  <p className="text-xs text-white/50">Map not available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trip Statistics - Bottom on mobile only */}
        <div className="bg-white/10 border border-white/20 rounded-xl p-3 md:p-4 shadow-lg lg:hidden">
          <div className="flex items-center space-x-2 mb-2 md:mb-3">
            <div className="bg-blue-500/30 p-1 rounded">
              <Activity className="w-3 h-3 text-blue-100" />
            </div>
            <h3 className="text-sm font-bold text-white/90">Trip Statistics</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={() => onNavigateToTab?.('itinerary')}
              className="bg-white/5 hover:bg-white/10 rounded-lg p-2 text-center transition-colors cursor-pointer"
            >
              <p className="text-lg md:text-xl font-bold text-white">{statistics.nights}</p>
              <p className="text-[10px] md:text-xs text-white/60 mt-0.5">Nights</p>
            </button>
            <button
              onClick={() => onNavigateToTab?.('itinerary')}
              className="bg-white/5 hover:bg-white/10 rounded-lg p-2 text-center transition-colors cursor-pointer"
            >
              <p className="text-lg md:text-xl font-bold text-white">{statistics.totalPorts}</p>
              <p className="text-[10px] md:text-xs text-white/60 mt-0.5">Ports of Call</p>
            </button>
            <button
              onClick={() => onNavigateToTab?.('itinerary')}
              className="bg-white/5 hover:bg-white/10 rounded-lg p-2 text-center transition-colors cursor-pointer"
            >
              <p className="text-lg md:text-xl font-bold text-white">{statistics.seaDays}</p>
              <p className="text-[10px] md:text-xs text-white/60 mt-0.5">Sea Days</p>
            </button>
            <button
              onClick={() => onNavigateToTab?.('schedule')}
              className="bg-white/5 hover:bg-white/10 rounded-lg p-2 text-center transition-colors cursor-pointer"
            >
              <p className="text-lg md:text-xl font-bold text-white">{statistics.totalEvents}</p>
              <p className="text-[10px] md:text-xs text-white/60 mt-0.5">Total Events</p>
            </button>
            <button
              onClick={() => onNavigateToTab?.('parties')}
              className="bg-white/5 hover:bg-white/10 rounded-lg p-2 text-center transition-colors cursor-pointer"
            >
              <p className="text-lg md:text-xl font-bold text-white">{statistics.totalParties}</p>
              <p className="text-[10px] md:text-xs text-white/60 mt-0.5">Theme Parties</p>
            </button>
            <button
              onClick={() => onNavigateToTab?.('talent')}
              className="bg-white/5 hover:bg-white/10 rounded-lg p-2 text-center transition-colors cursor-pointer"
            >
              <p className="text-lg md:text-xl font-bold text-white">{statistics.totalTalent}</p>
              <p className="text-[10px] md:text-xs text-white/60 mt-0.5">Performers</p>
            </button>
          </div>
        </div>
      </div>
    </>
  );
});
