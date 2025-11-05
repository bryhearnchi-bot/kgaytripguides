import React, { useState } from 'react';
import { OverviewTabCompactStats } from '@/components/trip-guide/tabs/OverviewTab_CompactStats';
import { OverviewTabTimeline } from '@/components/trip-guide/tabs/OverviewTab_Timeline';
import { OverviewTabModular } from '@/components/trip-guide/tabs/OverviewTab_Modular';
import { OverviewTabTabbed } from '@/components/trip-guide/tabs/OverviewTab_Tabbed';
import { OverviewTabCollapsible } from '@/components/trip-guide/tabs/OverviewTab_Collapsible';
import { Button } from '@/components/ui/button';

export default function OverviewTemplatesPreview() {
  const [activeTemplate, setActiveTemplate] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Mock data for preview
  const mockTripData = {
    trip: {
      id: 1,
      name: 'Greek Isles & Dalmatian Coast Cruise',
      description:
        'Embark on an unforgettable 8-day journey through the stunning Greek Isles and the breathtaking Dalmatian Coast. Experience ancient history, crystal-clear waters, and vibrant Mediterranean culture as we visit iconic destinations including Athens, Mykonos, Santorini, Dubrovnik, and Split. This cruise combines luxurious onboard amenities with world-class entertainment and authentic local experiences at each port of call.',
      shipName: 'Resilient Lady',
      cruiseLine: 'Virgin Voyages',
      slug: 'greek-isles-cruise',
    },
  };

  const mockStatistics = {
    totalPorts: 7,
    totalEvents: 42,
    totalParties: 12,
    totalTalent: 8,
    daysOfTravel: 8,
  };

  const mockUpdates = [
    {
      id: 1,
      timestamp: '2 hours ago',
      title: 'New Party Theme Added',
      description: 'Mykonos White Party has been added to Day 4. Check out the costume ideas!',
      type: 'new' as const,
    },
    {
      id: 2,
      timestamp: '1 day ago',
      title: 'Port Time Updated',
      description: 'Santorini arrival time changed to 9:00 AM (was 10:00 AM)',
      type: 'update' as const,
    },
    {
      id: 3,
      timestamp: '2 days ago',
      title: 'Talent Announcement',
      description: 'Bianca Del Rio added to the entertainment lineup for Athens departure party',
      type: 'new' as const,
    },
    {
      id: 4,
      timestamp: '3 days ago',
      title: 'Venue Change',
      description: 'Sail Away Party moved from Pool Deck to The Manor due to weather',
      type: 'info' as const,
    },
  ];

  const mockShipInfo = {
    imageUrl:
      'https://bxiiodeyqvqqcgzzqzvt.supabase.co/storage/v1/object/public/app-images/ships/resilient-lady.jpg',
    capacity: '2,770 guests',
    crew: '1,160 crew members',
    tonnage: '110,000 gross tons',
    length: '278 meters',
    decks: '17 decks (14 guest accessible)',
    amenities: [
      'Multiple restaurants',
      'The Manor nightclub',
      'Red Room theater',
      'Aquatic Club pool deck',
      'Redemption Spa',
      'Fitness center',
      'Running track',
      'Casino',
      'Tattoo parlor',
      'Arcade',
      'Champagne bar',
      'Outdoor gym',
    ],
    restaurants: [
      { name: 'The Wake', type: 'Steakhouse' },
      { name: 'Razzle Dazzle', type: 'Vegetarian' },
      { name: 'Pink Agave', type: 'Mexican' },
      { name: 'Extra Virgin', type: 'Italian' },
      { name: 'Test Kitchen', type: 'Experimental' },
      { name: 'Gunbae', type: 'Korean BBQ' },
      { name: 'The Galley', type: 'Food Hall' },
      { name: 'The Dock', type: 'Mediterranean' },
    ],
  };

  const templates = [
    {
      id: 1,
      name: '1. Compact Stats Bar',
      description: 'Horizontal stats bar with refined, compact elements that match existing tabs',
      component: OverviewTabCompactStats,
    },
    {
      id: 2,
      name: '2. Timeline Feed',
      description: 'Vertical timeline with integrated stats and updates',
      component: OverviewTabTimeline,
    },
    {
      id: 3,
      name: '3. Modular Grid',
      description: 'Small focused cards similar to InfoSectionsBentoGrid',
      component: OverviewTabModular,
    },
    {
      id: 4,
      name: '4. Tabbed Subsections',
      description: 'Mini tabs for Details, Stats, and Updates within the Overview',
      component: OverviewTabTabbed,
    },
    {
      id: 5,
      name: '5. Collapsible Sections',
      description: 'Expandable sections like the Schedule tab days',
      component: OverviewTabCollapsible,
    },
  ];

  const ActiveComponent = templates[activeTemplate - 1].component;

  return (
    <div className="min-h-screen w-full relative bg-[#0f172a]">
      {/* Deep Ocean Glow Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(70% 55% at 50% 50%, #2a5d77 0%, #184058 18%, #0f2a43 34%, #0a1b30 50%, #071226 66%, #040d1c 80%, #020814 92%, #01040d 97%, #000309 100%), radial-gradient(160% 130% at 10% 10%, rgba(0,0,0,0) 38%, #000309 76%, #000208 100%), radial-gradient(160% 130% at 90% 90%, rgba(0,0,0,0) 38%, #000309 76%, #000208 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Overview Tab Design Templates</h1>
          <p className="text-white/70 text-lg mb-6">
            Preview all three layout options for the new Overview tab
          </p>

          {/* Template Selector */}
          <div className="flex justify-center gap-4 flex-wrap">
            {templates.map(template => (
              <Button
                key={template.id}
                onClick={() => setActiveTemplate(template.id as 1 | 2 | 3 | 4 | 5)}
                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                  activeTemplate === template.id
                    ? 'bg-ocean-500 hover:bg-ocean-600 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
                }`}
              >
                {template.name}
              </Button>
            ))}
          </div>

          {/* Template Description */}
          <div className="mt-4 text-white/60 text-sm">
            {templates[activeTemplate - 1].description}
          </div>
        </div>

        {/* Template Preview */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <ActiveComponent
            tripData={mockTripData}
            statistics={mockStatistics}
            updates={mockUpdates}
            shipInfo={activeTemplate === 3 ? mockShipInfo : undefined}
          />
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-blue-500/10 border border-blue-400/30 rounded-lg px-6 py-4">
            <p className="text-white/90 text-sm">
              <strong>Note:</strong> This is a preview page. The actual implementation will pull
              live data from your database.
            </p>
            <p className="text-white/60 text-xs mt-2">
              Navigate to{' '}
              <code className="bg-white/10 px-2 py-1 rounded">/overview-templates-preview</code> to
              view this page
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
