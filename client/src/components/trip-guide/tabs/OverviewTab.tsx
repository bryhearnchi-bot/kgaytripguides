import React, { memo } from 'react';
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
} from 'lucide-react';

interface OverviewTabProps {
  tripData: any;
  ship?: any;
  ITINERARY: any[];
  SCHEDULE: any[];
  DAILY: any[];
  TALENT: any[];
  PARTY_THEMES: any[];
  updates?: Array<{
    id: number;
    timestamp: string;
    title: string;
    description: string;
    type: 'info' | 'update' | 'new';
  }>;
}

export const OverviewTab = memo(function OverviewTab({
  tripData,
  ship,
  ITINERARY,
  SCHEDULE,
  DAILY,
  TALENT,
  PARTY_THEMES,
  updates = [],
}: OverviewTabProps) {
  // Calculate statistics from actual data
  const statistics = {
    totalPorts: ITINERARY.filter(stop => stop.port && !stop.port.toLowerCase().includes('sea day'))
      .length,
    totalEvents: DAILY.reduce((acc, day) => acc + (day.items?.length || 0), 0),
    totalParties: DAILY.reduce(
      (acc, day) =>
        acc +
        (day.items?.filter(
          (item: any) => item.type?.toLowerCase().includes('party') || item.partyThemeId
        ).length || 0),
      0
    ),
    totalTalent: TALENT.length,
    daysOfTravel: Math.max(ITINERARY.length, SCHEDULE.length, 1),
  };

  // Get ship info from ship prop
  const shipInfo = {
    imageUrl:
      ship?.imageUrl ||
      'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/ships/resilient-lady.jpg',
    capacity: ship?.capacity ? `${ship.capacity.toLocaleString()} guests` : '2,770 guests',
    crew: '1,160 crew members',
    tonnage: '110,000 gross tons',
    length: '278 meters',
    decks: ship?.decks
      ? `${ship.decks} decks (14 guest accessible)`
      : '17 decks (14 guest accessible)',
    amenities: [
      'Multiple restaurants',
      'The Manor nightclub',
      'Red Room theater',
      'Aquatic Club pool deck',
      'Redemption Spa',
      'Fitness center',
      'Running track',
      'Casino',
    ],
    restaurants: [
      { name: 'The Wake', type: 'Steakhouse' },
      { name: 'Razzle Dazzle', type: 'Vegetarian' },
      { name: 'Pink Agave', type: 'Mexican' },
      { name: 'Extra Virgin', type: 'Italian' },
      { name: 'Test Kitchen', type: 'Experimental' },
      { name: 'Gunbae', type: 'Korean BBQ' },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4 -mt-2">
        <LayoutDashboard className="w-5 h-5 text-white/80" />
        <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Trip Overview</h2>
      </div>

      {/* All content in single flow */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:items-start">
        {/* About This Trip */}
        <div className="bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg order-1 lg:order-1 lg:col-span-2 lg:self-start">
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
                  className="w-full md:w-48 h-48 md:h-32 object-cover rounded-lg"
                />
              </div>
            )}
            <p className="text-xs text-white/80 leading-relaxed flex-1">
              {tripData?.trip?.description ||
                'Experience an unforgettable journey through stunning destinations with world-class entertainment and amenities.'}
            </p>
          </div>
        </div>

        {/* Cruise Map */}
        <div className="bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg order-3 lg:order-2 lg:col-span-1 lg:self-start">
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

        {/* Ship Details */}
        <div className="bg-white/10 border border-white/20 rounded-xl shadow-lg p-4 md:p-6 order-2 lg:order-3 lg:col-span-2 lg:self-start">
          {/* Ship Header */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="bg-purple-500/30 p-1 rounded">
              <Ship className="w-3 h-3 text-purple-100" />
            </div>
            <h3 className="text-sm font-bold text-white/90">
              {ship?.name || tripData?.trip?.shipName || 'Ship'}
            </h3>
          </div>

          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            {/* Ship Image - Mobile: Below Header, Desktop: Right Side */}
            {shipInfo?.imageUrl && (
              <div className="flex-shrink-0 w-full md:w-56 flex justify-center md:justify-end md:order-2">
                <img
                  src={shipInfo.imageUrl}
                  alt={ship?.name || tripData?.trip?.shipName || 'Ship'}
                  className="w-full md:w-56 h-48 md:h-36 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Ship Info Section - Mobile: Below image, Desktop: Left side */}
            <div className="flex-1 md:order-1">
              {/* Ship Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                <div>
                  <p className="text-xs text-white/60">Cruise Line</p>
                  <p className="text-xs text-white/90">
                    {ship?.cruiseLineName || tripData?.trip?.cruiseLine || 'Virgin Voyages'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/60">Capacity</p>
                  <p className="text-xs text-white/90">{shipInfo?.capacity || '2,770 guests'}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60">Decks</p>
                  <p className="text-xs text-white/90">{shipInfo?.decks || '17 (14 guest)'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Restaurants - Full width on mobile, below everything else */}
          {shipInfo?.restaurants && shipInfo.restaurants.length > 0 && (
            <div className="border-t border-white/10 pt-4 pb-4 mt-4">
              <div className="flex items-center space-x-1 mb-3">
                <Utensils className="w-3 h-3 text-white/60" />
                <p className="text-xs font-semibold text-white/80">Dining Venues</p>
              </div>
              {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                {shipInfo.restaurants.slice(0, 6).map((restaurant, idx) => (
                  <p key={idx} className="text-xs text-white/70">
                    • {restaurant.name}
                    {restaurant.type && <span className="text-white/50"> ({restaurant.type})</span>}
                  </p>
                ))}
              </div>
              {shipInfo.restaurants.length > 6 && (
                <p className="text-xs text-white/50 mt-2">
                  +{shipInfo.restaurants.length - 6} more venues
                </p>
              )}
            </div>
          )}

          {/* Amenities - Full Width */}
          {shipInfo?.amenities && shipInfo.amenities.length > 0 && (
            <div className="border-t border-white/10 pt-4 pb-2">
              <div className="flex items-center space-x-1 mb-3">
                <Sparkles className="w-3 h-3 text-white/60" />
                <p className="text-xs font-semibold text-white/80">Amenities</p>
              </div>
              {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
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

        {/* Updates */}
        <div className="bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg order-4 lg:order-4 lg:col-span-1 lg:self-start">
          <div className="flex items-center space-x-2 mb-3">
            <div className="bg-amber-500/30 p-1 rounded">
              <Bell className="w-3 h-3 text-amber-100" />
            </div>
            <h3 className="text-sm font-bold text-white/90">Updates</h3>
            {updates && updates.length > 0 && (
              <span className="text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full">
                {updates.length}
              </span>
            )}
          </div>

          {updates && updates.length > 0 ? (
            <div className="space-y-2">
              {updates.map(update => (
                <div key={update.id} className="bg-white/5 rounded-lg p-2">
                  <div className="flex items-start justify-between mb-1">
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        update.type === 'new'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : update.type === 'update'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-white/20 text-white/60'
                      }`}
                    >
                      {update.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-white/50">{update.timestamp}</span>
                  </div>
                  <p className="text-xs font-medium text-white/90">{update.title}</p>
                  <p className="text-xs text-white/60 line-clamp-2 mt-0.5">{update.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Bell className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/50">No updates yet</p>
            </div>
          )}
        </div>

        {/* Trip Statistics */}
        <div className="bg-white/10 border border-white/20 rounded-xl p-3 md:p-4 shadow-lg order-5 lg:order-5 lg:col-span-2 lg:self-start">
          <div className="flex items-center space-x-2 mb-2 md:mb-3">
            <div className="bg-blue-500/30 p-1 rounded">
              <Activity className="w-3 h-3 text-blue-100" />
            </div>
            <h3 className="text-sm font-bold text-white/90">Trip Statistics</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
            <div className="bg-white/5 rounded-lg p-2 md:p-3 text-center">
              <p className="text-xl md:text-2xl font-bold text-white">{statistics.daysOfTravel}</p>
              <p className="text-[10px] md:text-xs text-white/60 mt-0.5 md:mt-1">Days of Travel</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 md:p-3 text-center">
              <p className="text-xl md:text-2xl font-bold text-white">{statistics.totalPorts}</p>
              <p className="text-[10px] md:text-xs text-white/60 mt-0.5 md:mt-1">Ports of Call</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 md:p-3 text-center">
              <p className="text-xl md:text-2xl font-bold text-white">{statistics.totalEvents}</p>
              <p className="text-[10px] md:text-xs text-white/60 mt-0.5 md:mt-1">Total Events</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 md:p-3 text-center">
              <p className="text-xl md:text-2xl font-bold text-white">{statistics.totalParties}</p>
              <p className="text-[10px] md:text-xs text-white/60 mt-0.5 md:mt-1">Theme Parties</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2 md:p-3 text-center">
              <p className="text-xl md:text-2xl font-bold text-white">{statistics.totalTalent}</p>
              <p className="text-[10px] md:text-xs text-white/60 mt-0.5 md:mt-1">Performers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
