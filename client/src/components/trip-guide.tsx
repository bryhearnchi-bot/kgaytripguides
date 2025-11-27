import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StandardizedContentLayout } from '@/components/StandardizedContentLayout';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import type { Talent } from '@/data/trip-data';
import { useTripData, transformTripData } from '@/hooks/useTripData';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { EditTripModal } from '@/components/admin/EditTripModal/EditTripModal';
import type { Update } from '@/types/trip-info';
import { useHaptics } from '@/hooks/useHaptics';
import { useShare } from '@/hooks/useShare';
import { useUpdate } from '@/context/UpdateContext';

// Import refactored components
import { LoadingState, ErrorState } from './trip-guide/shared';
import { useLocalStorage } from './trip-guide/hooks/useLocalStorage';
import { useScheduledDaily } from './trip-guide/hooks/useScheduledDaily';
import { OverviewTab } from './trip-guide/tabs/OverviewTab';
import { ScheduleTab } from './trip-guide/tabs/ScheduleTab';
import { ItineraryTab } from './trip-guide/tabs/ItineraryTab';
import { TalentTabNew as TalentTab } from './trip-guide/tabs/TalentTabNew';
import { InfoTab } from './trip-guide/tabs/InfoTab';
import { TalentModal, EventsModal, PartyModal, PartyThemeModal } from './trip-guide/modals';
import { BackToTopButton } from '@/components/ui/BackToTopButton';

// Import split components
import { TripGuideHeader } from './trip-guide/TripGuideHeader';
import { TripGuidePreviewBanner } from './trip-guide/TripGuidePreviewBanner';
import { TripGuideTabBar } from './trip-guide/TripGuideTabBar';
import { formatTripDates } from './trip-guide/utils/formatTripDates';
import { getTodayString } from '@/lib/timeFormat';

interface TripGuideProps {
  slug?: string;
  showBottomNav?: boolean;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function TripGuide({
  slug,
  showBottomNav = false,
  activeTab: externalActiveTab,
  onTabChange: externalOnTabChange,
}: TripGuideProps) {
  const { profile, user } = useSupabaseAuth();
  const haptics = useHaptics();
  const { updateAvailable } = useUpdate();
  const { shareTrip } = useShare();
  const [internalActiveTab, setInternalActiveTab] = useState('overview');
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [showTalentModal, setShowTalentModal] = useState(false);
  const [selectedItineraryStop, setSelectedItineraryStop] = useState<any>(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [cameFromEventsModal, setCameFromEventsModal] = useState(false);
  const [showPartyThemeModal, setShowPartyThemeModal] = useState(false);
  const [selectedPartyTheme, setSelectedPartyTheme] = useState<any>(null);
  const [collapsedDays, setCollapsedDays] = useLocalStorage<string[]>('collapsedDays', []);
  const [isApproving, setIsApproving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [hasInitializedCollapsedDays, setHasInitializedCollapsedDays] = useState(false);
  const [eventsSubTab, setEventsSubTab] = useState<'schedule' | 'parties'>('schedule');

  // Use external state if provided (for fly-up menu), otherwise use internal state
  const activeTab = showBottomNav ? externalActiveTab || 'overview' : internalActiveTab;
  const setActiveTab = showBottomNav
    ? externalOnTabChange || setInternalActiveTab
    : setInternalActiveTab;

  // Handler to navigate to tab and scroll to top
  const handleNavigateToTab = (tab: string) => {
    haptics.light();
    // Check if navigating to events with a specific sub-tab
    if (tab === 'events:parties') {
      setEventsSubTab('parties');
      setActiveTab('events');
    } else if (tab === 'events:schedule' || tab === 'events') {
      setEventsSubTab('schedule');
      setActiveTab('events');
    } else {
      setActiveTab(tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        logger.error('Failed to fetch updates', error instanceof Error ? error : undefined);
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

  // Listen for edit trip requests from navigation
  useEffect(() => {
    const handleEditRequest = () => {
      setShowEditModal(true);
    };

    window.addEventListener('request-edit-trip', handleEditRequest);

    return () => {
      window.removeEventListener('request-edit-trip', handleEditRequest);
    };
  }, []);

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

    const today = getTodayString();
    const startDate = tripData.trip.startDate.split('T')[0];
    const endDate = tripData.trip.endDate.split('T')[0];

    const status = today < startDate ? 'upcoming' : today > endDate ? 'past' : 'current';
    return status;
  }, [tripData?.trip?.startDate, tripData?.trip?.endDate]);

  // Check if user can edit trips (super_admin, content_manager, or admin)
  const canEditTrip =
    profile?.role && ['super_admin', 'content_manager', 'admin'].includes(profile.role);

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
    if (tripStatus === 'current') {
      const today = getTodayString();

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
      setCollapsedDays((currentCollapsedDays: string[]) => {
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
    setCollapsedDays((currentCollapsedDays: string[]) => {
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

      toast.success('Trip Approved!', {
        description: 'This trip is now live on the site.',
      });

      // Refresh the page to show the updated status
      window.location.reload();
    } catch (error) {
      toast.error('Failed to Approve', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsApproving(false);
    }
  }, [tripData?.trip?.id]);

  const handleShareClick = useCallback(async () => {
    haptics.light();
    await shareTrip({ name: tripData?.trip?.name || '', slug: slug || '' });
  }, [haptics, shareTrip, tripData?.trip?.name, slug]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState />;
  }

  // Compute trip dates and name
  const tripDates = formatTripDates(tripData?.trip?.startDate, tripData?.trip?.endDate);
  const tripName = tripData?.trip?.name || 'Your Next Adventure';

  return (
    <div className="min-h-screen w-full relative">
      {isDragStarsCruise ? (
        /* Cosmic Aurora - Dragstar Cruise Only */
        <div className="absolute inset-0 z-0 bg-[#002147]" />
      ) : isHalloweenCruise ? (
        /* Halloween Cruise - Solid Color */
        <div className="absolute inset-0 z-0 bg-[#002147]" />
      ) : (
        /* Default - Solid Oxford Blue */
        <div className="absolute inset-0 z-0 bg-[#002147]" />
      )}

      {/* Content Layer */}
      <div
        className="relative z-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 3.5rem)' }}
      >
        {/* Trip Header */}
        <TripGuideHeader tripName={tripName} tripDates={tripDates} />

        {/* Preview Mode Banner */}
        {tripData?.trip?.tripStatusId === 5 && !tripData?.trip?.isActive && (
          <TripGuidePreviewBanner isApproving={isApproving} onApprove={handleApproveTripClick} />
        )}

        <StandardizedContentLayout>
          {/* Add spacing when using bottom nav instead of middle tab bar */}
          {showBottomNav && <div className="pt-8 sm:pt-16 lg:pt-16" />}

          {/* Tab Bar - Only show when NOT using bottom navigation */}
          {!showBottomNav && (
            <TripGuideTabBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isLoggedIn={!!user}
              updateAvailable={updateAvailable}
            />
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full pb-12">
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
                isCruise={isCruise}
                isResort={isResort}
                slug={slug}
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

            <TabsContent value="events">
              <ScheduleTab
                SCHEDULED_DAILY={SCHEDULED_DAILY}
                ITINERARY={isCruise ? (ITINERARY as any) : (SCHEDULE as any)}
                TALENT={TALENT as any}
                PARTY_THEMES={PARTY_THEMES}
                collapsedDays={collapsedDays}
                onToggleDayCollapse={toggleDayCollapse}
                onCollapseAll={handleCollapseAll}
                onTalentClick={handleTalentClick}
                onPartyClick={handlePartyClick}
                onPartyThemeClick={handlePartyThemeClick}
                tripStatus={tripStatus}
                tripId={tripData?.trip?.id}
                initialSubTab={eventsSubTab}
              />
            </TabsContent>

            <TabsContent value="talent">
              <TalentTab
                TALENT={TALENT as any}
                SCHEDULED_DAILY={SCHEDULED_DAILY}
                ITINERARY={ITINERARY}
                onTalentClick={handleTalentClick}
              />
            </TabsContent>

            <TabsContent value="info">
              <InfoTab IMPORTANT_INFO={IMPORTANT_INFO} tripId={tripData?.trip?.id} />
            </TabsContent>
          </Tabs>
        </StandardizedContentLayout>
      </div>

      {/* Back to Top Button */}
      <BackToTopButton threshold={400} />

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
