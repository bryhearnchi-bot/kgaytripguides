import React, { memo } from 'react';
import { Info, Ship, MapPin, Calendar, Users, Clock, Activity } from 'lucide-react';

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
 * Concept 2: Timeline/Activity Feed
 * - Updates and trip info as a vertical timeline
 * - Stats integrated inline
 * - Similar to social media feed but refined
 */
export const OverviewTabTimeline = memo(function OverviewTabTimeline({
  tripData,
  statistics,
  updates,
}: OverviewTabProps) {
  // Combine different types of content into timeline items
  const timelineItems = [
    {
      id: 'description',
      type: 'overview',
      title: 'Trip Overview',
      content: tripData?.trip?.description,
      icon: Info,
      color: 'ocean',
    },
    {
      id: 'stats',
      type: 'stats',
      title: 'Trip Statistics',
      stats: statistics,
      icon: Activity,
      color: 'blue',
    },
    {
      id: 'ship',
      type: 'ship',
      title: tripData?.trip?.shipName || 'Ship Details',
      details: {
        'Cruise Line': tripData?.trip?.cruiseLine || 'Virgin Voyages',
        Capacity: '2,770 guests',
        Tonnage: '110,000 GT',
        Decks: '17 (14 guest)',
      },
      icon: Ship,
      color: 'purple',
    },
    ...(updates || []).map(u => ({
      id: `update-${u.id}`,
      type: 'update',
      title: u.title,
      content: u.description,
      timestamp: u.timestamp,
      updateType: u.type,
      icon: Clock,
      color: u.type === 'new' ? 'emerald' : u.type === 'update' ? 'blue' : 'gray',
    })),
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4 -mt-2">
        <Info className="w-5 h-5 text-white/80" />
        <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Trip Overview</h2>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-white/10"></div>

        {/* Timeline items */}
        <div className="space-y-4">
          {timelineItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative flex items-start space-x-4">
                {/* Timeline dot */}
                <div
                  className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center ${
                    item.color === 'ocean'
                      ? 'bg-ocean-500/20'
                      : item.color === 'blue'
                        ? 'bg-blue-500/20'
                        : item.color === 'purple'
                          ? 'bg-purple-500/20'
                          : item.color === 'emerald'
                            ? 'bg-emerald-500/20'
                            : 'bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4 text-white/70" />
                </div>

                {/* Content */}
                <div className="flex-1 bg-white/10 border border-white/20 rounded-xl p-4 shadow-lg">
                  {item.type === 'overview' && (
                    <>
                      <h3 className="text-sm font-bold text-white/90 mb-2">{item.title}</h3>
                      <p className="text-sm text-white/80 leading-relaxed">{item.content}</p>
                    </>
                  )}

                  {item.type === 'stats' && (
                    <>
                      <h3 className="text-sm font-bold text-white/90 mb-3">{item.title}</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{item.stats.daysOfTravel}</p>
                          <p className="text-xs text-white/60">Days</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{item.stats.totalPorts}</p>
                          <p className="text-xs text-white/60">Ports</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{item.stats.totalEvents}</p>
                          <p className="text-xs text-white/60">Events</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{item.stats.totalParties}</p>
                          <p className="text-xs text-white/60">Parties</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-white">{item.stats.totalTalent}</p>
                          <p className="text-xs text-white/60">Talent</p>
                        </div>
                      </div>
                    </>
                  )}

                  {item.type === 'ship' && (
                    <>
                      <h3 className="text-sm font-bold text-white/90 mb-3">{item.title}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(item.details).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs text-white/60 mb-0.5">{key}</p>
                            <p className="text-sm text-white/90">{value}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {item.type === 'update' && (
                    <>
                      <div className="flex items-start justify-between mb-1">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded ${
                            item.updateType === 'new'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.updateType === 'update'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-white/20 text-white/60'
                          }`}
                        >
                          {item.updateType}
                        </span>
                        <span className="text-xs text-white/50">{item.timestamp}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white/90 mb-1">{item.title}</h3>
                      <p className="text-sm text-white/70">{item.content}</p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
