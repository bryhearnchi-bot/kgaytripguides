import React, { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, CalendarDays, History, Home, Ship, Sparkles, TimerReset } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TripMock {
  id: string;
  name: string;
  status: 'current' | 'upcoming' | 'past';
  region: string;
  startDate: string;
  endDate: string;
  nights: number;
  ship: string;
  cruiseLine: string;
  tripType?: 'cruise' | 'resort';
  image: string;
  highlight: string;
  secondaryHighlight: string;
  vibe: string[];
  watchers: number;
}

const tripMockData: TripMock[] = [
  {
    id: 'trip-1',
    name: 'Greek Isles Atlantis Cruise',
    status: 'current',
    region: 'Greece & Mediterranean',
    startDate: 'Aug 21',
    endDate: 'Aug 31, 2025',
    nights: 10,
    ship: 'Resilient Lady',
    cruiseLine: 'Virgin Voyages',
    tripType: 'cruise',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
    highlight:
      'Set sail through crystal seas, explore ancient Athens, and dance until dawn on Santorini’s white cliffs.',
    secondaryHighlight: 'Deck parties, sunrise yoga, and floating discos with superstar DJs.',
    vibe: ['Drag Shows', 'Live DJs', 'Beach Parties'],
    watchers: 328,
  },
  {
    id: 'trip-2',
    name: 'Queer Riviera Soirée',
    status: 'upcoming',
    region: 'Riviera & Western Med',
    startDate: 'Jul 05',
    endDate: 'Jul 12, 2025',
    nights: 7,
    ship: 'Norwegian Viva',
    cruiseLine: 'Norwegian Cruise Line',
    tripType: 'cruise',
    image:
      'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=1600&q=80',
    highlight:
      'Sunset sail-aways, rooftop drag brunches, and pink lagoon pool parties under the Riviera stars.',
    secondaryHighlight: 'Chic excursions from Nice to Ibiza with curated foodie adventures.',
    vibe: ['Chill Luxe', 'Pool Lounges', 'House Beats'],
    watchers: 187,
  },
  {
    id: 'trip-3',
    name: 'Caribbean Heatwave Resort',
    status: 'upcoming',
    region: 'Aruba & Caribbean',
    startDate: 'Feb 14',
    endDate: 'Feb 21, 2026',
    nights: 7,
    ship: 'Sunset Haven Resort',
    cruiseLine: 'Atlantis Events',
    tripType: 'resort',
    image:
      'https://images.unsplash.com/photo-1526779259212-939e64758f81?auto=format&fit=crop&w=1600&q=80',
    highlight:
      'Pool deck afterglows hosted by superstar DJs with luxe beachfront villas steps away from the action.',
    secondaryHighlight: 'Private island excursions, sunset mixers, and champagne cabanas.',
    vibe: ['Beach Clubs', 'Late Nights', 'Wellness'],
    watchers: 264,
  },
  {
    id: 'trip-4',
    name: 'Mexico Halloween Cruise',
    status: 'past',
    region: 'Pacific Mexico',
    startDate: 'Oct 27',
    endDate: 'Nov 03, 2024',
    nights: 7,
    ship: 'Navigator of the Seas',
    cruiseLine: 'Royal Caribbean',
    tripType: 'cruise',
    image:
      'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1600&q=80',
    highlight:
      'Mega costume float parades and Dia de los Muertos takeovers from Cabo to Puerto Vallarta.',
    secondaryHighlight: 'Drag super shows, masquerade sunsets, and neon night markets.',
    vibe: ['Costume Balls', 'Drag Shows', 'Spectacle'],
    watchers: 402,
  },
  {
    id: 'trip-5',
    name: 'Barcelona Nightfall City Break',
    status: 'past',
    region: 'Barcelona, Spain',
    startDate: 'Apr 18',
    endDate: 'Apr 21, 2024',
    nights: 4,
    ship: 'Hotel Skyfall',
    cruiseLine: 'Atlantis Events',
    tripType: 'resort',
    image:
      'https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?auto=format&fit=crop&w=1600&q=80',
    highlight:
      'Old town tapas crawls, rooftop discos, and sunrise sets overlooking the Gothic Quarter.',
    secondaryHighlight: 'Immersive art walks, queer speakeasies, and harbor boat afters.',
    vibe: ['City Nights', 'Art Walks', 'After Hours'],
    watchers: 289,
  },
];

type DisplayStatus = 'upcoming' | 'past';

const modernHeroGallery = [
  {
    src: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
    alt: 'Architectural home with warm lighting at dusk',
  },
  {
    src: 'https://images.unsplash.com/photo-1529429617124-aee711a2a748?auto=format&fit=crop&w=800&q=80',
    alt: 'Minimalist concrete home exterior',
  },
  {
    src: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
    alt: 'Modern home exterior with glowing interior lights',
  },
];

function getTripKind(trip: TripMock) {
  if (trip.tripType === 'resort') return 'resort';
  return 'cruise';
}

function getBadgeLabel(trip: TripMock) {
  return getTripKind(trip) === 'cruise' ? 'Cruise' : 'Resort';
}

function getCharterLabel(trip: TripMock) {
  return trip.cruiseLine || 'Atlantis Events';
}

function getCharterInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('');
}

function HeroSection() {
  return (
    <section className="space-y-6 text-white">
      <div className="relative overflow-hidden rounded-[48px] border border-white/10 bg-[#161616] px-6 pb-10 pt-8 shadow-[0_45px_90px_-60px_rgba(0,0,0,0.8)] sm:px-10 lg:px-14">
        <div className="flex flex-col gap-10 lg:gap-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-6">
              <h1 className="font-serif text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
                Find Your Perfect Home in
                <br />
                Your City
              </h1>
            </div>

            <div className="hidden shrink-0 flex-col gap-4 lg:flex">
              {modernHeroGallery.slice(1).map(image => (
                <div
                  key={image.src}
                  className="h-28 w-36 overflow-hidden rounded-[28px] border border-white/10 bg-black/40 shadow-lg"
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-10 hidden h-24 w-24 rounded-full bg-[#1c1c1c] md:block"></div>
            <div className="absolute bottom-8 -right-10 hidden h-28 w-28 rounded-full bg-[#1c1c1c] md:block"></div>
            <div className="relative overflow-hidden rounded-[40px] border border-white/10 bg-black/40">
              <img
                src={modernHeroGallery[0].src}
                alt={modernHeroGallery[0].alt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <Button className="absolute bottom-6 left-6 rounded-full bg-white px-6 py-2 text-sm font-semibold text-black shadow-lg hover:bg-white/90">
                Contact Us <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="mt-6 flex justify-center">
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm text-white/70">
                <span className="inline-block h-2 w-2 rounded-full bg-white/70"></span>
                Reminders
              </div>
            </div>
          </div>

          <div className="flex gap-4 lg:hidden">
            {modernHeroGallery.slice(1).map(image => (
              <div
                key={`mobile-${image.src}`}
                className="flex-1 overflow-hidden rounded-[24px] border border-white/10 bg-black/40"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface StatusTabsProps {
  activeStatus: DisplayStatus;
  onStatusChange: React.Dispatch<React.SetStateAction<DisplayStatus>>;
  charterOptions: string[];
  selectedCharter: string;
  onCharterChange: React.Dispatch<React.SetStateAction<string>>;
}

function StatusTabs({
  activeStatus,
  onStatusChange,
  charterOptions,
  selectedCharter,
  onCharterChange,
}: StatusTabsProps) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <Tabs
        value={activeStatus}
        onValueChange={value => onStatusChange(value as DisplayStatus)}
        className="w-full sm:w-auto"
      >
        <TabsList className="mx-auto flex w-full justify-center gap-2 rounded-full bg-white/5 p-1 text-white/80 backdrop-blur sm:w-auto">
          {[
            { value: 'upcoming' as DisplayStatus, icon: CalendarDays, label: 'Upcoming' },
            { value: 'past' as DisplayStatus, icon: History, label: 'Past' },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'group flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.25em] transition data-[state=active]:bg-white data-[state=active]:text-black',
                'sm:px-4 sm:text-sm sm:tracking-[0.3em]'
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="inline sm:hidden group-data-[state=inactive]:text-white/60 group-data-[state=active]:font-semibold">
                {activeStatus === tab.value ? tab.label : ''}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="w-full max-w-xs sm:w-auto">
        <Select value={selectedCharter} onValueChange={onCharterChange}>
          <SelectTrigger className="w-full border-white/20 bg-white/5 text-white">
            <SelectValue placeholder="Filter by charter" />
          </SelectTrigger>
          <SelectContent className="bg-ocean-900/95 text-white">
            <SelectItem value="all">All charter partners</SelectItem>
            {charterOptions.map(option => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

interface TripFlipCardProps {
  trip: TripMock;
  variant?: 'standard' | 'compact';
}

function TripFlipCard({ trip, variant = 'standard' }: TripFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const isResort = getTripKind(trip) === 'resort';
  const heightClass = variant === 'compact' ? 'h-[240px]' : 'h-[320px]';
  const imageHeight = variant === 'compact' ? 'h-32' : 'h-40';

  useEffect(() => {
    setFlipped(false);
  }, [trip.id]);

  return (
    <div className="group" style={{ perspective: '2000px' }} onMouseLeave={() => setFlipped(false)}>
      <div
        className={cn(
          'relative w-full transition-transform duration-700 [transform-style:preserve-3d]',
          flipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
        )}
      >
        <Card
          className={cn(
            'absolute inset-0 flex flex-col overflow-hidden border-white/15 bg-white/10 text-white backdrop-blur transition-shadow duration-500',
            'hover:border-white/30 hover:shadow-2xl',
            heightClass,
            '[backface-visibility:hidden]'
          )}
        >
          <div className={cn('relative', imageHeight)}>
            <img
              src={trip.image}
              alt={trip.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <Badge className="absolute left-3 top-3 flex items-center gap-1 bg-white/20 px-3 py-1 text-xs uppercase tracking-[0.3em]">
              {isResort ? <Home className="h-3.5 w-3.5" /> : <Ship className="h-3.5 w-3.5" />}
              {getBadgeLabel(trip)}
            </Badge>
            <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-xs font-semibold uppercase tracking-wide text-white">
              {getCharterInitials(getCharterLabel(trip))}
            </div>
          </div>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg text-white">{trip.name}</CardTitle>
            <CardDescription className="text-white/70">
              {isResort ? 'Hosted by KGay Travel' : getCharterLabel(trip)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 text-sm text-white/70">
            <p>{trip.highlight}</p>
          </CardContent>
          <CardContent className="border-t border-white/10 bg-white/5 p-4">
            <Button
              variant="ghost"
              className="w-full text-white hover:bg-white/10"
              onClick={() => setFlipped(true)}
            >
              Preview trip details
            </Button>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'absolute inset-0 flex flex-col justify-between border-white/15 bg-white/10 text-white backdrop-blur',
            heightClass,
            '[transform:rotateY(180deg)] [backface-visibility:hidden]'
          )}
        >
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg text-white">Itinerary snapshot</CardTitle>
            <CardDescription className="text-white/70">
              {trip.startDate} – {trip.endDate} • {trip.nights} nights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/80">
            <p>{trip.secondaryHighlight}</p>
            <div className="flex flex-wrap gap-2">
              {trip.vibe.map(item => (
                <Badge
                  key={`${trip.id}-${item}`}
                  className="bg-white/10 px-3 py-1 text-xs text-white"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
          <CardContent className="border-t border-white/10 bg-white/5 p-4">
            <Button className="w-full bg-white text-black hover:bg-white/90">
              View Trip Guide <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CurrentTripHighlight({ trips }: { trips: TripMock[] }) {
  if (trips.length === 0) return null;

  return (
    <div className={cn('grid gap-6', trips.length === 2 ? 'md:grid-cols-2' : '')}>
      {trips.map(trip => (
        <Card
          key={trip.id}
          className="overflow-hidden border-transparent bg-gradient-to-br from-white/10 via-white/5 to-white/10 text-white shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="relative">
              <img
                src={trip.image}
                alt={trip.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <Badge className="absolute left-4 top-4 flex items-center gap-2 bg-emerald-400/90 px-3 py-1 text-xs font-semibold text-black">
                <Sparkles className="h-3.5 w-3.5" /> Sailing Now
              </Badge>
              <div className="absolute bottom-4 left-4 flex gap-2">
                <Badge className="bg-white/90 px-3 py-1 text-xs font-semibold text-black">
                  {getBadgeLabel(trip)}
                </Badge>
                <Badge className="bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                  {trip.nights} nights
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-6 p-6">
              <div className="space-y-2">
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">{trip.region}</p>
                <h2 className="text-2xl font-semibold sm:text-3xl">{trip.name}</h2>
                <p className="text-white/70">{trip.highlight}</p>
              </div>

              <div className="space-y-4 text-sm text-white/80">
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-white/70" />
                  <div>
                    <p className="font-medium text-white">
                      {trip.startDate} – {trip.endDate}
                    </p>
                    <p className="text-white/60">{trip.nights} days of curated adventures</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Ship className="h-5 w-5 text-white/70" />
                  <div>
                    <p className="font-medium text-white">{trip.ship}</p>
                    <p className="text-white/60">{getCharterLabel(trip)}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {trip.vibe.map(item => (
                  <Badge
                    key={`${trip.id}-badge-${item}`}
                    className="bg-white/15 px-3 py-1 text-xs text-white"
                  >
                    {item}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button className="bg-white text-black hover:bg-white/90">
                  View Complete Trip Guide <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Get Live Updates
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function LandingMockupsPage() {
  const currentTrips = useMemo(() => tripMockData.filter(trip => trip.status === 'current'), []);
  const upcomingTripsAll = useMemo(
    () => tripMockData.filter(trip => trip.status === 'upcoming'),
    []
  );
  const pastTripsAll = useMemo(() => tripMockData.filter(trip => trip.status === 'past'), []);
  const charterOptions = useMemo(() => {
    const set = new Set<string>();
    tripMockData.forEach(trip => {
      if (trip.cruiseLine) {
        set.add(trip.cruiseLine);
      }
    });
    return Array.from(set);
  }, []);

  const [activeStatus, setActiveStatus] = useState<DisplayStatus>('upcoming');
  const [selectedCharter, setSelectedCharter] = useState<string>('all');

  const filteredCurrentTrips = useMemo(() => {
    if (selectedCharter === 'all') return currentTrips;
    return currentTrips.filter(trip => getCharterLabel(trip) === selectedCharter);
  }, [currentTrips, selectedCharter]);

  const filteredUpcomingTrips = useMemo(() => {
    if (selectedCharter === 'all') return upcomingTripsAll;
    return upcomingTripsAll.filter(trip => getCharterLabel(trip) === selectedCharter);
  }, [selectedCharter, upcomingTripsAll]);

  const filteredPastTrips = useMemo(() => {
    if (selectedCharter === 'all') return pastTripsAll;
    return pastTripsAll.filter(trip => getCharterLabel(trip) === selectedCharter);
  }, [selectedCharter, pastTripsAll]);

  const hasCurrentTrips = filteredCurrentTrips.length > 0;

  return (
    <div className="relative min-h-screen w-full bg-black">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 100%, rgba(70, 85, 110, 0.5) 0%, transparent 60%), radial-gradient(circle at 50% 100%, rgba(99, 102, 241, 0.4) 0%, transparent 70%), radial-gradient(circle at 50% 100%, rgba(181, 184, 208, 0.3) 0%, transparent 80%)',
        }}
      />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-24 pt-32">
        <HeroSection />

        {hasCurrentTrips && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-white/70">
              <TimerReset className="h-5 w-5" />
              <p className="text-sm uppercase tracking-[0.3em] text-white/60">Currently Sailing</p>
            </div>
            <CurrentTripHighlight trips={filteredCurrentTrips} />
          </section>
        )}

        <section className="space-y-8">
          <StatusTabs
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
            charterOptions={charterOptions}
            selectedCharter={selectedCharter}
            onCharterChange={setSelectedCharter}
          />

          {activeStatus === 'upcoming' ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredUpcomingTrips.length > 0 ? (
                filteredUpcomingTrips.map(trip => <TripFlipCard key={trip.id} trip={trip} />)
              ) : (
                <div className="text-white/70">
                  <p>No upcoming trips match that charter yet. Try another filter.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {filteredPastTrips.length > 0 ? (
                filteredPastTrips.map(trip => (
                  <TripFlipCard key={trip.id} trip={trip} variant="compact" />
                ))
              ) : (
                <div className="text-white/70">
                  <p>No past trips found for that charter just yet.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
