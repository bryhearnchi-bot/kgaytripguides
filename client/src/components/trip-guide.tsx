import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { dateOnly } from "@/lib/utils";
import { UniversalHero } from "@/components/UniversalHero";
import { StandardizedTabContainer } from "@/components/StandardizedTabContainer";
import { StandardizedContentLayout } from "@/components/StandardizedContentLayout";
import { Map, CalendarDays, PartyPopper, Star, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Talent } from "@/data/trip-data";
import { useTripData, transformTripData } from "@/hooks/useTripData";
import { useTimeFormat } from '@/contexts/TimeFormatContext';

// Import refactored components
import { LoadingState, ErrorState } from "./trip-guide/shared";
import { useLocalStorage } from "./trip-guide/hooks/useLocalStorage";
import { useScheduledDaily } from "./trip-guide/hooks/useScheduledDaily";
import { ScheduleTab } from "./trip-guide/tabs/ScheduleTab";
import { ItineraryTab } from "./trip-guide/tabs/ItineraryTab";
import { TalentTab } from "./trip-guide/tabs/TalentTab";
import { PartiesTab } from "./trip-guide/tabs/PartiesTab";
import { InfoTab } from "./trip-guide/tabs/InfoTab";
import { TalentModal, EventsModal, PartyModal } from "./trip-guide/modals";

interface TripGuideProps {
  slug?: string;
}

export default function TripGuide({ slug }: TripGuideProps) {
  const { timeFormat } = useTimeFormat();
  const [activeTab, setActiveTab] = useState("itinerary");
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [showTalentModal, setShowTalentModal] = useState(false);
  const [selectedItineraryStop, setSelectedItineraryStop] = useState<any>(null);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState<any[]>([]);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [selectedParty, setSelectedParty] = useState<any>(null);
  const [cameFromEventsModal, setCameFromEventsModal] = useState(false);
  const [collapsedDays, setCollapsedDays] = useLocalStorage<string[]>('collapsedDays', []);

  // Use the trip data hook
  const { data: tripData, isLoading, error } = useTripData(slug);

  const data = useMemo(() => {
    if (!tripData) return null;
    return transformTripData(tripData);
  }, [tripData]);

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
  const DAILY = data?.DAILY || [];

  // Show party themes, talent, and important info for cruises that have talent
  const isGreekCruise = slug === 'greek-isles-2025';
  const isDragStarsCruise = slug === 'drag-stars-at-sea-2025';
  const hasTalent = isGreekCruise || isDragStarsCruise;
  const TALENT = hasTalent ? (data?.TALENT || []) : [];
  const PARTY_THEMES = hasTalent ? (data?.PARTY_THEMES || []) : [];
  const IMPORTANT_INFO = hasTalent ? (data?.IMPORTANT_INFO || {}) : {};
  const tripStatus = (data?.TRIP_INFO as any)?.status || 'upcoming';

  // Use the scheduled daily hook
  const SCHEDULED_DAILY = useScheduledDaily({ DAILY, tripStatus });

  // Event handlers with useCallback
  const toggleDayCollapse = useCallback((dateKey: string) => {
    const newCollapsedDays = collapsedDays.includes(dateKey)
      ? collapsedDays.filter((d: string) => d !== dateKey)
      : [...collapsedDays, dateKey];
    setCollapsedDays(newCollapsedDays);
  }, [collapsedDays, setCollapsedDays]);

  const handleCollapseAll = useCallback(() => {
    const allCollapsed = SCHEDULED_DAILY.length === collapsedDays.length;
    setCollapsedDays(allCollapsed ? [] : SCHEDULED_DAILY.map(day => day.key));
  }, [SCHEDULED_DAILY, collapsedDays, setCollapsedDays]);

  const handleTalentClick = useCallback((name: string) => {
    const talent = TALENT.find(t => t.name === name);
    if (talent) {
      setSelectedTalent({ ...talent, role: talent.knownFor });
      setShowTalentModal(true);
    }
  }, [TALENT]);

  const handleViewEvents = useCallback((dateKey: string, portName: string) => {
    const dayEvents = SCHEDULED_DAILY.find(day => day.key === dateKey);
    setSelectedDateEvents(dayEvents?.items || []);
    setSelectedItineraryStop({ port: portName, date: dateKey });
    setShowEventsModal(true);
  }, [SCHEDULED_DAILY]);

  const handlePartyClick = useCallback((party: any) => {
    setSelectedParty(party);
    setShowPartyModal(true);
  }, []);

  const handleTalentModalClose = useCallback((open: boolean) => {
    setShowTalentModal(open);
    if (!open && cameFromEventsModal) {
      setShowEventsModal(true);
      setCameFromEventsModal(false);
    }
  }, [cameFromEventsModal]);

  const handlePartyModalClose = useCallback((open: boolean) => {
    setShowPartyModal(open);
    if (!open && cameFromEventsModal) {
      setShowEventsModal(true);
      setCameFromEventsModal(false);
    }
  }, [cameFromEventsModal]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-ocean-600 via-ocean-500 to-ocean-400">
      <UniversalHero
        variant="trip"
        tripImageUrl={tripData?.trip?.heroImageUrl || undefined}
        title={tripData?.trip?.name || "Trip Guide"}
        subtitle=""
        additionalInfo={tripData?.trip?.startDate && tripData?.trip?.endDate
          ? `${format(dateOnly(tripData.trip.startDate), 'MMMM d')} - ${format(dateOnly(tripData.trip.endDate), 'MMMM d, yyyy')}`
          : ''
        }
        tabSection={
          <StandardizedTabContainer>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="itinerary" className="flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  <span className="hidden sm:inline">Itinerary</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  <span className="hidden sm:inline">Schedule</span>
                </TabsTrigger>
                <TabsTrigger value="parties" className="flex items-center gap-2">
                  <PartyPopper className="w-4 h-4" />
                  <span className="hidden sm:inline">Parties</span>
                </TabsTrigger>
                <TabsTrigger value="talent" className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <span className="hidden sm:inline">Talent</span>
                </TabsTrigger>
                <TabsTrigger value="info" className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span className="hidden sm:inline">Info</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </StandardizedTabContainer>
        }
      />

      <StandardizedContentLayout>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            />
          </TabsContent>

          <TabsContent value="itinerary">
            <ItineraryTab
              ITINERARY={ITINERARY as any}
              onViewEvents={handleViewEvents}
            />
          </TabsContent>

          <TabsContent value="talent">
            <TalentTab
              TALENT={TALENT as any}
              onTalentClick={handleTalentClick}
            />
          </TabsContent>

          <TabsContent value="parties">
            <PartiesTab
              SCHEDULED_DAILY={SCHEDULED_DAILY}
              ITINERARY={ITINERARY as any}
              PARTY_THEMES={PARTY_THEMES as any}
              timeFormat={timeFormat}
              onPartyClick={handlePartyClick}
            />
          </TabsContent>

          <TabsContent value="info">
            <InfoTab IMPORTANT_INFO={IMPORTANT_INFO} />
          </TabsContent>
        </Tabs>
      </StandardizedContentLayout>

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
        setCameFromEventsModal={setCameFromEventsModal}
      />

      <PartyModal
        open={showPartyModal}
        onOpenChange={handlePartyModalClose}
        selectedParty={selectedParty}
      />

      {/* Footer */}
      <footer className="atlantis-gradient wave-pattern text-white py-6 mt-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src="https://atlantisevents.com/wp-content/themes/atlantis/assets/images/logos/atlantis-logo.png"
              alt="Atlantis Events"
              className="h-8 w-auto mr-3 brightness-0 invert"
              loading="lazy"
            />
            <div className="text-left">
              <p className="text-sm text-white/80">All-Gay Vacations Since 1991</p>
            </div>
          </div>
          <p className="text-sm text-white/80">
            Your ultimate resource for cruise information and planning
          </p>
        </div>
      </footer>
    </div>
  );
}