import React, { memo, useState } from 'react';
import { Info, Ship, Activity, Bell } from 'lucide-react';

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
 * Concept 4: Tabbed Subsections
 * - Mini tabs within the Overview tab
 * - Clean switching between Details, Stats, Updates
 * - Matches the main tab aesthetic
 */
export const OverviewTabTabbed = memo(function OverviewTabTabbed({
  tripData,
  statistics,
  updates,
}: OverviewTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'details' | 'stats' | 'updates'>('details');

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4 -mt-2">
        <Info className="w-5 h-5 text-white/80" />
        <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Trip Overview</h2>
      </div>

      {/* Sub Tab Bar - smaller than main tabs */}
      <div className="bg-white/10 backdrop-blur-lg rounded-lg p-1 inline-flex gap-1 border border-white/20">
        <button
          onClick={() => setActiveSubTab('details')}
          className={`px-4 py-2 rounded text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'details'
              ? 'bg-ocean-500/30 text-white'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <Info className="w-3 h-3" />
          Details
        </button>
        <button
          onClick={() => setActiveSubTab('stats')}
          className={`px-4 py-2 rounded text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'stats'
              ? 'bg-ocean-500/30 text-white'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <Activity className="w-3 h-3" />
          Statistics
        </button>
        <button
          onClick={() => setActiveSubTab('updates')}
          className={`px-4 py-2 rounded text-xs font-semibold transition-all flex items-center gap-2 ${
            activeSubTab === 'updates'
              ? 'bg-ocean-500/30 text-white'
              : 'text-white/60 hover:text-white/80'
          }`}
        >
          <Bell className="w-3 h-3" />
          Updates
          {updates && updates.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {updates.length}
            </span>
          )}
        </button>
      </div>

      {/* Content based on active sub-tab */}
      <div className="bg-white/10 border border-white/20 rounded-xl shadow-lg">
        {activeSubTab === 'details' && (
          <div className="p-4 space-y-4">
            {/* Description */}
            <div>
              <h3 className="text-sm font-bold text-white/90 mb-2">About This Trip</h3>
              <p className="text-sm text-white/80 leading-relaxed">
                {tripData?.trip?.description ||
                  'Experience an unforgettable journey through stunning destinations.'}
              </p>
            </div>

            {/* Ship Details */}
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <Ship className="w-4 h-4 text-white/60" />
                <h3 className="text-sm font-bold text-white/90">
                  {tripData?.trip?.shipName || 'Ship Details'}
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

            {/* Highlights */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="text-sm font-bold text-white/90 mb-2">Highlights</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-ocean-500/10 rounded p-2 text-white/80">
                  • All restaurants included
                </div>
                <div className="bg-ocean-500/10 rounded p-2 text-white/80">
                  • World-class entertainment
                </div>
                <div className="bg-ocean-500/10 rounded p-2 text-white/80">
                  • Adults-only experience
                </div>
                <div className="bg-ocean-500/10 rounded p-2 text-white/80">
                  • No buffets or main dining
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'stats' && (
          <div className="p-4">
            <h3 className="text-sm font-bold text-white/90 mb-4">Trip Statistics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-ocean-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">{statistics.daysOfTravel}</p>
                <p className="text-xs text-white/60 mt-1">Days of Travel</p>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">{statistics.totalPorts}</p>
                <p className="text-xs text-white/60 mt-1">Ports of Call</p>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">{statistics.totalEvents}</p>
                <p className="text-xs text-white/60 mt-1">Total Events</p>
              </div>
              <div className="bg-pink-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">{statistics.totalParties}</p>
                <p className="text-xs text-white/60 mt-1">Theme Parties</p>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">{statistics.totalTalent}</p>
                <p className="text-xs text-white/60 mt-1">Featured Talent</p>
              </div>
              <div className="bg-amber-500/10 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-xs text-white/60 mt-1">Fun Guaranteed</p>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'updates' && (
          <div className="p-4">
            <h3 className="text-sm font-bold text-white/90 mb-3">Recent Updates</h3>
            {updates && updates.length > 0 ? (
              <div className="space-y-3">
                {updates.map(update => (
                  <div key={update.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
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
                    <p className="text-sm font-medium text-white/90 mb-1">{update.title}</p>
                    <p className="text-xs text-white/70">{update.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-white/50">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No updates at this time</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
