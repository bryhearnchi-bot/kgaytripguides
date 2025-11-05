import React, { memo, useState } from 'react';
import { Info, Ship, Activity, Bell, ChevronDown, ChevronUp } from 'lucide-react';

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
 * Concept 5: Collapsible Sections
 * - Similar to how days collapse in ScheduleTab
 * - Each section can be expanded/collapsed
 * - Clean and organized
 */
export const OverviewTabCollapsible = memo(function OverviewTabCollapsible({
  tripData,
  statistics,
  updates,
}: OverviewTabProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['description', 'stats'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const sections = [
    {
      id: 'description',
      title: 'Trip Overview',
      icon: Info,
      badge: null,
    },
    {
      id: 'stats',
      title: 'Quick Statistics',
      icon: Activity,
      badge: `${statistics.totalPorts} ports • ${statistics.totalEvents} events`,
    },
    {
      id: 'ship',
      title: tripData?.trip?.shipName || 'Ship Details',
      icon: Ship,
      badge: tripData?.trip?.cruiseLine || 'Virgin Voyages',
    },
    {
      id: 'updates',
      title: 'Recent Updates',
      icon: Bell,
      badge: updates && updates.length > 0 ? `${updates.length} new` : null,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 -mt-2">
        <div className="flex items-center space-x-2">
          <Info className="w-5 h-5 text-white/80" />
          <h2 className="text-lg font-bold text-white/90 tracking-wide uppercase">Trip Overview</h2>
        </div>
        <button
          onClick={() =>
            expandedSections.size === sections.length
              ? setExpandedSections(new Set())
              : setExpandedSections(new Set(sections.map(s => s.id)))
          }
          className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors duration-200 border border-white/30 hover:border-white/50"
        >
          {expandedSections.size === sections.length ? (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>Collapse All</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              <span>Expand All</span>
            </>
          )}
        </button>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-3">
        {sections.map(section => {
          const Icon = section.icon;
          const isExpanded = expandedSections.has(section.id);

          return (
            <div
              key={section.id}
              className="bg-white/10 border border-white/20 rounded-xl overflow-hidden shadow-lg"
            >
              {/* Section Header */}
              <div
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  isExpanded ? 'bg-white/5' : 'hover:bg-white/15'
                }`}
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-ocean-500/30 p-1.5 rounded">
                      <Icon className="w-4 h-4 text-ocean-100" />
                    </div>
                    <span className="text-sm font-bold text-white/90">{section.title}</span>
                    {section.badge && (
                      <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded">
                        {section.badge}
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-white/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/60" />
                  )}
                </div>
              </div>

              {/* Section Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0">
                  <div className="border-t border-white/10 pt-4">
                    {section.id === 'description' && (
                      <p className="text-sm text-white/80 leading-relaxed">
                        {tripData?.trip?.description ||
                          'Experience an unforgettable journey through stunning destinations.'}
                      </p>
                    )}

                    {section.id === 'stats' && (
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        <div className="bg-white/5 rounded p-3 text-center">
                          <p className="text-xl font-bold text-white">{statistics.daysOfTravel}</p>
                          <p className="text-xs text-white/60">Days</p>
                        </div>
                        <div className="bg-white/5 rounded p-3 text-center">
                          <p className="text-xl font-bold text-white">{statistics.totalPorts}</p>
                          <p className="text-xs text-white/60">Ports</p>
                        </div>
                        <div className="bg-white/5 rounded p-3 text-center">
                          <p className="text-xl font-bold text-white">{statistics.totalEvents}</p>
                          <p className="text-xs text-white/60">Events</p>
                        </div>
                        <div className="bg-white/5 rounded p-3 text-center">
                          <p className="text-xl font-bold text-white">{statistics.totalParties}</p>
                          <p className="text-xs text-white/60">Parties</p>
                        </div>
                        <div className="bg-white/5 rounded p-3 text-center">
                          <p className="text-xl font-bold text-white">{statistics.totalTalent}</p>
                          <p className="text-xs text-white/60">Talent</p>
                        </div>
                      </div>
                    )}

                    {section.id === 'ship' && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                        <div className="col-span-2 sm:col-span-4">
                          <p className="text-xs text-white/60 mb-1">Amenities</p>
                          <p className="text-sm text-white/90">
                            Multiple restaurants • The Manor nightclub • Red Room theater • Pool
                            deck • Spa • Fitness center
                          </p>
                        </div>
                      </div>
                    )}

                    {section.id === 'updates' && (
                      <>
                        {updates && updates.length > 0 ? (
                          <div className="space-y-2">
                            {updates.map(update => (
                              <div key={update.id} className="bg-white/5 rounded p-3">
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
                                <p className="text-sm font-medium text-white/90 mb-0.5">
                                  {update.title}
                                </p>
                                <p className="text-xs text-white/70">{update.description}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-white/50 text-center py-4">
                            No updates at this time
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
