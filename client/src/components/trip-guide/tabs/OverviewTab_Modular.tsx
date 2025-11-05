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
  Music,
} from 'lucide-react';

interface OverviewTabProps {
  tripData: any;
  statistics: {
    totalPorts: number;
    totalEvents: number;
    totalParties: number;
    totalTalent: number;
    daysOfTravel: number;
  };
  updates: Array<{
    id: number;
    timestamp: string;
    title: string;
    description: string;
    type: 'info' | 'update' | 'new';
  }>;
  shipInfo?: {
    imageUrl?: string;
    capacity?: string;
    crew?: string;
    tonnage?: string;
    length?: string;
    decks?: string;
    amenities?: string[];
    restaurants?: Array<{
      name: string;
      type?: string;
    }>;
  };
}

/**
 * Concept 3: Modular Grid
 * - Similar to InfoSectionsBentoGrid but for overview
 * - Small, focused cards
 * - Responsive grid that feels integrated
 */
export const OverviewTabModular = memo(function OverviewTabModular({
  tripData,
  statistics,
  updates,
  shipInfo,
}: OverviewTabProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4 -mt-2">
        <Info className="w-5 h-5 text-white/80" />
        <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Trip Overview</h2>
      </div>

      {/* Modular Grid - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Description - spans 2 columns on larger screens */}
        <div className="lg:col-span-2 bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div className="bg-ocean-500/30 p-1 rounded">
              <Info className="w-3 h-3 text-ocean-100" />
            </div>
            <h3 className="text-sm font-bold text-white/90">About This Trip</h3>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            {tripData?.trip?.description ||
              'Experience an unforgettable journey through stunning destinations.'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg">
          <div className="flex items-center space-x-2 mb-3">
            <div className="bg-blue-500/30 p-1 rounded">
              <Activity className="w-3 h-3 text-blue-100" />
            </div>
            <h3 className="text-sm font-bold text-white/90">Quick Stats</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-lg font-bold text-white">{statistics.daysOfTravel}</p>
              <p className="text-xs text-white/60">Days</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-lg font-bold text-white">{statistics.totalPorts}</p>
              <p className="text-xs text-white/60">Ports</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-lg font-bold text-white">{statistics.totalEvents}</p>
              <p className="text-xs text-white/60">Events</p>
            </div>
            <div className="bg-white/5 rounded-lg p-2">
              <p className="text-lg font-bold text-white">{statistics.totalParties}</p>
              <p className="text-xs text-white/60">Parties</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modular Grid - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ship Details - Expanded width to match About section */}
        <div className="lg:col-span-2 bg-white/10 border border-white/20 rounded-xl overflow-hidden shadow-lg">
          {/* Ship Image Header */}
          {shipInfo?.imageUrl && (
            <div className="h-32 overflow-hidden">
              <img
                src={shipInfo.imageUrl}
                alt={tripData?.trip?.shipName || 'Ship'}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <div className="bg-purple-500/30 p-1 rounded">
                <Ship className="w-3 h-3 text-purple-100" />
              </div>
              <h3 className="text-sm font-bold text-white/90">
                {tripData?.trip?.shipName || 'Ship'}
              </h3>
            </div>

            {/* Ship Stats Grid - Responsive: 2 cols on mobile, 4 on larger screens */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <div>
                <p className="text-xs text-white/60">Cruise Line</p>
                <p className="text-xs text-white/90">
                  {tripData?.trip?.cruiseLine || 'Virgin Voyages'}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/60">Capacity</p>
                <p className="text-xs text-white/90">{shipInfo?.capacity || '2,770 guests'}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Tonnage</p>
                <p className="text-xs text-white/90">{shipInfo?.tonnage || '110,000 GT'}</p>
              </div>
              <div>
                <p className="text-xs text-white/60">Decks</p>
                <p className="text-xs text-white/90">{shipInfo?.decks || '17 (14 guest)'}</p>
              </div>
            </div>

            {/* Amenities */}
            {shipInfo?.amenities && shipInfo.amenities.length > 0 && (
              <div className="border-t border-white/10 pt-3 mb-3">
                <div className="flex items-center space-x-1 mb-2">
                  <Sparkles className="w-3 h-3 text-white/60" />
                  <p className="text-xs font-semibold text-white/80">Amenities</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {shipInfo.amenities.slice(0, 6).map((amenity, idx) => (
                    <p key={idx} className="text-xs text-white/70 truncate">
                      • {amenity}
                    </p>
                  ))}
                </div>
                {shipInfo.amenities.length > 6 && (
                  <p className="text-xs text-white/50 mt-1">
                    +{shipInfo.amenities.length - 6} more
                  </p>
                )}
              </div>
            )}

            {/* Restaurants */}
            {shipInfo?.restaurants && shipInfo.restaurants.length > 0 && (
              <div className="border-t border-white/10 pt-3 mb-3">
                <div className="flex items-center space-x-1 mb-2">
                  <Utensils className="w-3 h-3 text-white/60" />
                  <p className="text-xs font-semibold text-white/80">Dining Venues</p>
                </div>
                <div className="space-y-0.5">
                  {shipInfo.restaurants.slice(0, 4).map((restaurant, idx) => (
                    <p key={idx} className="text-xs text-white/70">
                      • {restaurant.name}
                      {restaurant.type && (
                        <span className="text-white/50"> ({restaurant.type})</span>
                      )}
                    </p>
                  ))}
                </div>
                {shipInfo.restaurants.length > 4 && (
                  <p className="text-xs text-white/50 mt-1">
                    +{shipInfo.restaurants.length - 4} more venues
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* All Updates - Same width as Quick Stats */}
        <div className="lg:col-span-1 bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg max-h-[400px] overflow-y-auto">
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
                <div key={update.id} className="bg-white/5 rounded p-2">
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
            <div className="text-center py-8">
              <Bell className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/50">No updates yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
