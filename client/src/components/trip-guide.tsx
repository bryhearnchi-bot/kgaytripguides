import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { dateOnly } from '@/lib/utils';
import HeroSection from '@/components/shadcn-studio/blocks/hero-section-01/hero-section-01';
import { StandardizedTabContainer } from '@/components/StandardizedTabContainer';
import { StandardizedContentLayout } from '@/components/StandardizedContentLayout';
import {
  Map,
  CalendarDays,
  PartyPopper,
  Star,
  Info,
  Eye,
  CheckCircle,
  HelpCircle,
  LayoutDashboard,
  Share2,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import type { Talent } from '@/data/trip-data';
import { useTripData, transformTripData } from '@/hooks/useTripData';
import { useTimeFormat } from '@/contexts/TimeFormatContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { EditTripModal } from '@/components/admin/EditTripModal/EditTripModal';
import type { Update } from '@/types/trip-info';
import { useHaptics } from '@/hooks/useHaptics';
import { useShare } from '@/hooks/useShare';

// Import refactored components
import { LoadingState, ErrorState } from './trip-guide/shared';
import { useLocalStorage } from './trip-guide/hooks/useLocalStorage';
import { useScheduledDaily } from './trip-guide/hooks/useScheduledDaily';
import { OverviewTab } from './trip-guide/tabs/OverviewTab';
import { ScheduleTab } from './trip-guide/tabs/ScheduleTab';
import { ItineraryTab } from './trip-guide/tabs/ItineraryTab';
import { TalentTabNew as TalentTab } from './trip-guide/tabs/TalentTabNew';
import { PartiesTab } from './trip-guide/tabs/PartiesTab';
import { InfoTab } from './trip-guide/tabs/InfoTab';
import { FAQTab } from './trip-guide/tabs/FAQTab';
import { TalentModal, EventsModal, PartyModal, PartyThemeModal } from './trip-guide/modals';

interface TripGuideProps {
  slug?: string;
}

export default function TripGuide({ slug }: TripGuideProps) {
  const { timeFormat } = useTimeFormat();
  const { toast } = useToast();
  const { profile } = useSupabaseAuth();
  const haptics = useHaptics();
  const { shareTrip } = useShare();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [showTalentModal, setShowTalentModal] = useState(false);
  const [selectedItineraryStop, setSelectedItineraryStop] = useState<any>(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);

  // Handler to navigate to tab and scroll to top
  const handleNavigateToTab = (tab: string) => {
    haptics.light();
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [cameFromEventsModal, setCameFromEventsModal] = useState(false);
  const [showPartyThemeModal, setShowPartyThemeModal] = useState(false);
  const [selectedPartyTheme, setSelectedPartyTheme] = useState<any>(null);
  const [collapsedDays, setCollapsedDays] = useLocalStorage<string[]>('collapsedDays', []);
  const [isApproving, setIsApproving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [hasInitializedCollapsedDays, setHasInitializedCollapsedDays] = useState(false);

  // Use the trip data hook
  const { data: tripData, isLoading, error, refetch } = useTripData(slug);

  // Fetch updates for this trip
  const [updates, setUpdates] = useState<Update[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(false);

  useEffect(() => {
    const fetchUpdates = async () => {
      if (!tripData?.trip?.id) return;

      try {
        setUpdatesLoading(true);
        const response = await api.get(`/api/trips/${tripData.trip.id}/updates`);
        if (response.ok) {
          const data = await response.json();
          setUpdates(data);
        }
      } catch (error) {
        console.error('Failed to fetch updates:', error);
      } finally {
        setUpdatesLoading(false);
      }
    };

    fetchUpdates();
  }, [tripData?.trip?.id]);

  const data = useMemo(() => {
    if (!tripData) return null;
    return transformTripData(tripData);
  }, [tripData]);

  // Listen for PWA refresh events
  useEffect(() => {
    const handlePWARefresh = () => {
      // Refetch trip data when app is opened from home screen
      if (refetch) {
        refetch();
      }
    };

    window.addEventListener('pwa-refresh-data', handlePWARefresh);

    return () => {
      window.removeEventListener('pwa-refresh-data', handlePWARefresh);
    };
  }, [refetch]);

  // Robust scroll to top when component content is ready
  useEffect(() => {
    if (!data || isLoading) {
      return undefined;
    }

    const forceScrollToTop = (): void => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };

    forceScrollToTop();
    const timeouts: number[] = [];
    const rafId = requestAnimationFrame(() => {
      forceScrollToTop();
      timeouts.push(window.setTimeout(forceScrollToTop, 1));
      timeouts.push(window.setTimeout(forceScrollToTop, 10));
      timeouts.push(window.setTimeout(forceScrollToTop, 50));
      timeouts.push(window.setTimeout(forceScrollToTop, 100));
      timeouts.push(window.setTimeout(forceScrollToTop, 300));
      timeouts.push(window.setTimeout(forceScrollToTop, 500));
    });

    return () => {
      cancelAnimationFrame(rafId);
      timeouts.forEach(id => clearTimeout(id));
    };
  }, [data, isLoading, slug]);

  const ITINERARY = data?.ITINERARY || [];
  const SCHEDULE = data?.SCHEDULE || [];
  const DAILY = data?.DAILY || [];

  // Determine if this is a cruise or resort based on ship_id vs resort_id
  const isCruise = !!tripData?.trip?.shipId;
  const isResort = !!tripData?.trip?.resortId;

  // Check for specific cruise types (for styling/backgrounds)
  const isGreekCruise = slug === 'greek-isles-egypt-med-cruise';
  const isDragStarsCruise = slug === 'drag-stars-at-sea';
  const isHalloweenCruise = slug === 'halloween-carribean-cruise';

  // Load party themes, talent, and important info if available
  const TALENT = data?.TALENT || [];
  const PARTY_THEMES = data?.PARTY_THEMES || [];
  const IMPORTANT_INFO = data?.IMPORTANT_INFO || {};

  // Calculate trip status based on start and end dates
  const tripStatus = useMemo(() => {
    if (!tripData?.trip?.startDate || !tripData?.trip?.endDate) return 'upcoming';

    const now = new Date();
    // Use local date instead of converting to UTC with toISOString()
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    const startDate = tripData.trip.startDate.split('T')[0];
    const endDate = tripData.trip.endDate.split('T')[0];

    const status = today < startDate ? 'upcoming' : today > endDate ? 'past' : 'current';
    return status;
  }, [tripData?.trip?.startDate, tripData?.trip?.endDate]);

  // Check if user can edit trips (super_admin or content_manager)
  const canEditTrip = profile?.role && ['super_admin', 'content_manager'].includes(profile.role);

  // Use the scheduled daily hook
  const SCHEDULED_DAILY = useScheduledDaily({ DAILY, tripStatus });

  // Initialize collapsed days to show only current day for active trips
  // This effect should only run ONCE when data is first loaded
  useEffect(() => {
    // Only initialize if:
    // 1. We have data (SCHEDULED_DAILY.length > 0)
    // 2. We haven't initialized yet (hasInitializedCollapsedDays is false)
    if (SCHEDULED_DAILY.length === 0 || hasInitializedCollapsedDays) return;

    // For active trips, show the current day expanded
    // For upcoming/past trips, collapse all days
    if (tripStatus === 'active') {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      // Find the current or next upcoming day
      const targetDayIndex = SCHEDULED_DAILY.findIndex(day => day.key >= today);

      // If all days are in the past, collapse all
      if (targetDayIndex === -1) {
        setCollapsedDays(SCHEDULED_DAILY.map(day => day.key));
      } else {
        // Collapse all days except the current day
        const daysToCollapse = SCHEDULED_DAILY.map(day => day.key).filter(
          (_, index) => index !== targetDayIndex
        );
        setCollapsedDays(daysToCollapse);
      }
    } else {
      // For upcoming or past trips, collapse all days
      setCollapsedDays(SCHEDULED_DAILY.map(day => day.key));
    }

    setHasInitializedCollapsedDays(true);
  }, [SCHEDULED_DAILY, hasInitializedCollapsedDays, tripStatus, setCollapsedDays]);

  // Event handlers with useCallback
  const toggleDayCollapse = useCallback(
    (dateKey: string) => {
      setCollapsedDays(currentCollapsedDays => {
        if (currentCollapsedDays.includes(dateKey)) {
          // Expand this day - remove from collapsed list
          return currentCollapsedDays.filter((d: string) => d !== dateKey);
        } else {
          // Collapse this day - add to collapsed list
          return [...currentCollapsedDays, dateKey];
        }
      });
    },
    [setCollapsedDays]
  );

  const handleCollapseAll = useCallback(() => {
    setCollapsedDays(currentCollapsedDays => {
      const allCollapsed = SCHEDULED_DAILY.length === currentCollapsedDays.length;
      if (allCollapsed) {
        // Expand all - empty array means all expanded
        return [];
      } else {
        // Collapse all - add all day keys
        return SCHEDULED_DAILY.map(day => day.key);
      }
    });
  }, [SCHEDULED_DAILY, setCollapsedDays]);

  const handleTalentClick = useCallback(
    (name: string) => {
      const talent = TALENT.find(t => t.name === name);
      if (talent) {
        setSelectedTalent({ ...talent, role: talent.knownFor });
        setShowTalentModal(true);
      }
    },
    [TALENT]
  );

  const handleViewEvents = useCallback(
    (dateKey: string, portName: string) => {
      const dayEvents = SCHEDULED_DAILY.find(day => day.key === dateKey);
      setSelectedDateEvents(dayEvents?.items || []);
      setSelectedItineraryStop({ port: portName, date: dateKey });
      setShowEventsModal(true);
    },
    [SCHEDULED_DAILY]
  );

  const handlePartyClick = useCallback((party: any) => {
    setSelectedParty(party);
    setShowPartyModal(true);
  }, []);

  const handlePartyThemeClick = useCallback((partyTheme: any) => {
    setSelectedPartyTheme(partyTheme);
    setShowPartyThemeModal(true);
  }, []);

  const handleTalentModalClose = useCallback(
    (open: boolean) => {
      setShowTalentModal(open);
      if (!open && cameFromEventsModal) {
        setShowEventsModal(true);
        setCameFromEventsModal(false);
      }
    },
    [cameFromEventsModal]
  );

  const handlePartyModalClose = useCallback(
    (open: boolean) => {
      setShowPartyModal(open);
      if (!open && cameFromEventsModal) {
        setShowEventsModal(true);
        setCameFromEventsModal(false);
      }
    },
    [cameFromEventsModal]
  );

  const handlePartyThemeModalClose = useCallback(
    (open: boolean) => {
      setShowPartyThemeModal(open);
      if (!open && cameFromEventsModal) {
        setShowEventsModal(true);
        setCameFromEventsModal(false);
      }
    },
    [cameFromEventsModal]
  );

  const handleApproveTripClick = useCallback(async () => {
    if (!tripData?.trip?.id) return;

    try {
      setIsApproving(true);

      const response = await api.patch(`/api/admin/trips/${tripData.trip.id}/approve`, {});

      if (!response.ok) {
        throw new Error('Failed to approve trip');
      }

      toast({
        title: 'Trip Approved!',
        description: 'This trip is now live on the site.',
      });

      // Refresh the page to show the updated status
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Failed to Approve',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsApproving(false);
    }
  }, [tripData?.trip?.id, toast]);

  const handleShareClick = useCallback(async () => {
    haptics.light();
    await shareTrip({ name: tripData?.trip?.name || '', slug: slug || '' });
  }, [haptics, shareTrip, tripData?.trip?.name, slug]);

  // Expose edit trip handler globally for navigation banner
  useEffect(() => {
    if (canEditTrip && tripData?.trip) {
      const handleEditTripEvent = () => {
        setShowEditModal(true);
      };

      // Register the handler
      window.addEventListener('request-edit-trip', handleEditTripEvent);

      // Dispatch event to notify that edit trip is available
      window.dispatchEvent(new CustomEvent('edit-trip-available', { detail: { available: true } }));

      return () => {
        window.removeEventListener('request-edit-trip', handleEditTripEvent);
        window.dispatchEvent(
          new CustomEvent('edit-trip-available', { detail: { available: false } })
        );
      };
    }
  }, [canEditTrip, tripData?.trip]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState />;
  }

  return (
    <div className="min-h-screen w-full relative">
      {isDragStarsCruise ? (
        /* Cosmic Aurora - Dragstar Cruise Only */
        <div className="absolute inset-0 z-0 bg-[#002147]" />
      ) : isHalloweenCruise ? (
        /* Halloween Cruise - Solid Color */
        <div className="absolute inset-0 z-0 bg-[#002147]" />
      ) : null}

      {/* Content Layer */}
      <div className="relative z-10">
        <HeroSection
          tripName={tripData?.trip?.name}
          tripDescription={null} // Description moved to Overview tab
          tripType={isCruise ? 'cruise' : isResort ? 'resort' : null}
          charterCompanyLogo={tripData?.trip?.charterCompanyLogo}
          charterCompanyName={tripData?.trip?.charterCompanyName}
          slug={slug}
          startDate={tripData?.trip?.startDate}
          endDate={tripData?.trip?.endDate}
          itinerary={data?.ITINERARY || []}
        />

        {/* Preview Mode Banner */}
        {tripData?.trip?.tripStatusId === 5 && !tripData?.trip?.isActive && (
          <div className="bg-amber-500/10 border-y border-amber-400/30 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4 max-w-6xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Preview Mode</h3>
                    <p className="text-xs text-white/70">Not live yet</p>
                  </div>
                </div>
                <Button
                  onClick={handleApproveTripClick}
                  disabled={isApproving}
                  className="h-10 px-4 sm:px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all disabled:opacity-40 w-full sm:w-auto"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">
                    {isApproving ? 'Approving...' : 'Approve & Publish'}
                  </span>
                  <span className="sm:hidden">{isApproving ? 'Approving...' : 'Approve'}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        <StandardizedContentLayout>
          {/* Tab Bar */}
          <div className="flex justify-center items-center mb-8 pt-8 sm:pt-16 lg:pt-16">
            <div className="bg-white/10 backdrop-blur-lg rounded-full p-1 inline-flex gap-1 border border-white/20">
              <button
                onClick={() => {
                  haptics.light();
                  setActiveTab('overview');
                }}
                className={`px-3 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
                  activeTab === 'overview'
                    ? 'bg-white text-ocean-900'
                    : 'text-white/70 hover:text-white'
                }`}
                aria-label="Overview"
              >
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Overview</span>
                {activeTab === 'overview' && <span className="sm:hidden">Overview</span>}
              </button>
              <button
                onClick={() => {
                  haptics.light();
                  setActiveTab('itinerary');
                }}
                className={`px-3 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
                  activeTab === 'itinerary'
                    ? 'bg-white text-ocean-900'
                    : 'text-white/70 hover:text-white'
                }`}
                aria-label={isCruise ? 'Itinerary' : 'Schedule'}
              >
                <Map className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{isCruise ? 'Itinerary' : 'Schedule'}</span>
                {activeTab === 'itinerary' && (
                  <span className="sm:hidden">{isCruise ? 'Itinerary' : 'Schedule'}</span>
                )}
              </button>
              <button
                onClick={() => {
                  haptics.light();
                  setActiveTab('schedule');
                }}
                className={`px-3 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
                  activeTab === 'schedule'
                    ? 'bg-white text-ocean-900'
                    : 'text-white/70 hover:text-white'
                }`}
                aria-label="Events"
              >
                <CalendarDays className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Events</span>
                {activeTab === 'schedule' && <span className="sm:hidden">Events</span>}
              </button>
              <button
                onClick={() => {
                  haptics.light();
                  setActiveTab('parties');
                }}
                className={`px-3 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
                  activeTab === 'parties'
                    ? 'bg-white text-ocean-900'
                    : 'text-white/70 hover:text-white'
                }`}
                aria-label="Parties"
              >
                <PartyPopper className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Parties</span>
                {activeTab === 'parties' && <span className="sm:hidden">Parties</span>}
              </button>
              <button
                onClick={() => {
                  haptics.light();
                  setActiveTab('talent');
                }}
                className={`px-3 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
                  activeTab === 'talent'
                    ? 'bg-white text-ocean-900'
                    : 'text-white/70 hover:text-white'
                }`}
                aria-label="Talent"
              >
                <Star className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Talent</span>
                {activeTab === 'talent' && <span className="sm:hidden">Talent</span>}
              </button>
              <button
                onClick={() => {
                  haptics.light();
                  setActiveTab('info');
                }}
                className={`px-3 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
                  activeTab === 'info'
                    ? 'bg-white text-ocean-900'
                    : 'text-white/70 hover:text-white'
                }`}
                aria-label="Info"
              >
                <Info className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Info</span>
                {activeTab === 'info' && <span className="sm:hidden">Info</span>}
              </button>
              <button
                onClick={() => {
                  haptics.light();
                  setActiveTab('faq');
                }}
                className={`px-3 sm:px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-2 min-w-[44px] min-h-[44px] ${
                  activeTab === 'faq' ? 'bg-white text-ocean-900' : 'text-white/70 hover:text-white'
                }`}
                aria-label="FAQ"
              >
                <HelpCircle className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">FAQ</span>
                {activeTab === 'faq' && <span className="sm:hidden">FAQ</span>}
              </button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="overview">
              <OverviewTab
                tripData={tripData}
                ship={tripData?.ship}
                ITINERARY={ITINERARY as any}
                SCHEDULE={SCHEDULE as any}
                DAILY={DAILY as any}
                TALENT={TALENT as any}
                PARTY_THEMES={PARTY_THEMES as any}
                updates={updates.map(update => ({
                  id: update.id,
                  timestamp: new Date(update.created_at).toLocaleDateString(),
                  title: update.custom_title || update.title,
                  description: update.description,
                  type: update.update_type.includes('new')
                    ? ('new' as const)
                    : update.update_type.includes('updated')
                      ? ('update' as const)
                      : ('info' as const),
                }))}
                onNavigateToTab={handleNavigateToTab}
              />
            </TabsContent>

            <TabsContent value="schedule">
              <ScheduleTab
                SCHEDULED_DAILY={SCHEDULED_DAILY}
                ITINERARY={ITINERARY as any}
                TALENT={TALENT as any}
                PARTY_THEMES={PARTY_THEMES}
                collapsedDays={collapsedDays}
                onToggleDayCollapse={toggleDayCollapse}
                onCollapseAll={handleCollapseAll}
                onTalentClick={handleTalentClick}
                onPartyClick={handlePartyClick}
                onPartyThemeClick={handlePartyThemeClick}
              />
            </TabsContent>

            <TabsContent value="itinerary">
              {isCruise ? (
                <ItineraryTab
                  ITINERARY={ITINERARY as any}
                  onViewEvents={handleViewEvents}
                  scheduledDaily={SCHEDULED_DAILY}
                  talent={TALENT as any}
                  tripStatus={tripStatus}
                />
              ) : (
                <ItineraryTab
                  ITINERARY={SCHEDULE as any}
                  onViewEvents={handleViewEvents}
                  scheduledDaily={SCHEDULED_DAILY}
                  talent={TALENT as any}
                  tripStatus={tripStatus}
                />
              )}
            </TabsContent>

            <TabsContent value="talent">
              <TalentTab
                TALENT={TALENT as any}
                SCHEDULED_DAILY={SCHEDULED_DAILY}
                onTalentClick={handleTalentClick}
              />
            </TabsContent>

            <TabsContent value="parties">
              <PartiesTab
                SCHEDULED_DAILY={SCHEDULED_DAILY}
                ITINERARY={ITINERARY as any}
                timeFormat={timeFormat}
                onPartyClick={handlePartyClick}
                tripStatus={tripStatus}
                tripId={tripData?.trip?.id}
              />
            </TabsContent>

            <TabsContent value="info">
              <InfoTab IMPORTANT_INFO={IMPORTANT_INFO} tripId={tripData?.trip?.id} />
            </TabsContent>

            <TabsContent value="faq">
              {tripData?.trip?.id && <FAQTab tripId={tripData.trip.id} />}
            </TabsContent>
          </Tabs>
        </StandardizedContentLayout>
      </div>

      {/* Modals */}
      <TalentModal
        open={showTalentModal}
        onOpenChange={handleTalentModalClose}
        selectedTalent={selectedTalent}
        SCHEDULED_DAILY={SCHEDULED_DAILY}
        ITINERARY={ITINERARY as any}
        TALENT={TALENT as any}
        tripStatus={tripStatus}
      />

      <EventsModal
        open={showEventsModal}
        onOpenChange={setShowEventsModal}
        selectedDateEvents={selectedDateEvents}
        selectedItineraryStop={selectedItineraryStop}
        ITINERARY={ITINERARY as any}
        TALENT={TALENT as any}
        onTalentClick={handleTalentClick}
        onPartyClick={handlePartyClick}
        onPartyThemeClick={handlePartyThemeClick}
        setCameFromEventsModal={setCameFromEventsModal}
      />

      <PartyModal
        open={showPartyModal}
        onOpenChange={handlePartyModalClose}
        selectedParty={selectedParty}
      />

      <PartyThemeModal
        open={showPartyThemeModal}
        onOpenChange={handlePartyThemeModalClose}
        selectedPartyTheme={selectedPartyTheme}
      />

      {/* Edit Trip Modal - Only for super_admin and content_manager */}
      {canEditTrip && tripData?.trip && (
        <EditTripModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          trip={{
            ...tripData.trip,
            itineraryEntries: tripData.itinerary,
            scheduleEntries: tripData.scheduleEntries,
            events: tripData.events,
            tripTalent: tripData.talent,
          }}
          onSuccess={() => {
            // Refresh the page to show updated data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
