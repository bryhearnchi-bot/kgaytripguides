import React, { memo } from 'react';
import { Info, Ship, MapPin, Calendar, Users, PartyPopper, Bell } from 'lucide-react';

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
}

/**
 * Concept 1: Compact Stats Bar
 * - Matches the existing tab aesthetic with small, refined elements
 * - Horizontal stats bar like a dashboard widget
 * - Compact cards with subtle backgrounds
 */
export const OverviewTabCompactStats = memo(function OverviewTabCompactStats({
  tripData,
  statistics,
  updates,
}: OverviewTabProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header - matching ScheduleTab style */}
      <div className="flex items-center space-x-2 mb-4 -mt-2">
        <Info className="w-5 h-5 text-white/80" />
        <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Trip Overview</h2>
      </div>

      {/* Compact Stats Bar */}
      <div className="bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-6">
            {/* Days */}
            <div className="flex items-center space-x-2">
              <div className="bg-ocean-500/30 p-1.5 rounded">
                <Calendar className="w-4 h-4 text-ocean-100" />
              </div>
              <div>
                <p className="text-xs text-white/60">Duration</p>
                <p className="text-sm font-bold text-white">{statistics.daysOfTravel} days</p>
              </div>
            </div>

            {/* Ports */}
            <div className="flex items-center space-x-2">
              <div className="bg-ocean-500/30 p-1.5 rounded">
                <MapPin className="w-4 h-4 text-ocean-100" />
              </div>
              <div>
                <p className="text-xs text-white/60">Ports</p>
                <p className="text-sm font-bold text-white">{statistics.totalPorts}</p>
              </div>
            </div>

            {/* Events */}
            <div className="flex items-center space-x-2">
              <div className="bg-ocean-500/30 p-1.5 rounded">
                <Calendar className="w-4 h-4 text-ocean-100" />
              </div>
              <div>
                <p className="text-xs text-white/60">Events</p>
                <p className="text-sm font-bold text-white">{statistics.totalEvents}</p>
              </div>
            </div>

            {/* Parties */}
            <div className="flex items-center space-x-2">
              <div className="bg-ocean-500/30 p-1.5 rounded">
                <PartyPopper className="w-4 h-4 text-ocean-100" />
              </div>
              <div>
                <p className="text-xs text-white/60">Parties</p>
                <p className="text-sm font-bold text-white">{statistics.totalParties}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card - compact like existing cards */}
      <div className="bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg">
        <h3 className="text-sm font-bold text-white/90 mb-3">About This Trip</h3>
        <p className="text-sm text-white/80 leading-relaxed">
          {tripData?.trip?.description ||
            'Experience an unforgettable journey through stunning destinations with world-class entertainment and amenities.'}
        </p>
      </div>

      {/* Ship Details - two column layout, compact */}
      <div className="bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg">
        <div className="flex items-center space-x-2 mb-3">
          <Ship className="w-4 h-4 text-white/60" />
          <h3 className="text-sm font-bold text-white/90">
            {tripData?.trip?.shipName || 'Ship Details'}
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-white/60 mb-0.5">Cruise Line</p>
            <p className="text-sm text-white/90">
              {tripData?.trip?.cruiseLine || 'Virgin Voyages'}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-0.5">Capacity</p>
            <p className="text-sm text-white/90">2,770 guests</p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-0.5">Tonnage</p>
            <p className="text-sm text-white/90">110,000 GT</p>
          </div>
          <div>
            <p className="text-xs text-white/60 mb-0.5">Decks</p>
            <p className="text-sm text-white/90">17 (14 guest)</p>
          </div>
        </div>
      </div>

      {/* Recent Updates - compact list */}
      {updates && updates.length > 0 && (
        <div className="bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Bell className="w-4 h-4 text-white/60" />
            <h3 className="text-sm font-bold text-white/90">Recent Updates</h3>
          </div>
          <div className="space-y-2">
            {updates.slice(0, 3).map(update => (
              <div key={update.id} className="flex items-start space-x-2 text-sm">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    update.type === 'new'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : update.type === 'update'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-white/20 text-white/60'
                  }`}
                >
                  {update.type}
                </span>
                <div className="flex-1">
                  <p className="text-white/90">{update.title}</p>
                  <p className="text-xs text-white/50 mt-0.5">{update.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
