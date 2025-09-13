import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTripSlug } from '../data/data-service';
import { dateOnly } from '@/lib/utils';

export interface TripData {
  trip: {
    id: number;
    name: string;
    slug: string;
    shipName: string;
    cruiseLine: string;
    startDate: string;
    endDate: string;
    status: string;
    heroImageUrl: string | null;
    description: string | null;
    highlights: any;
    includesInfo: any;
    pricing: any;
  };
  itinerary: Array<{
    id: number;
    tripId: number;
    date: string;
    day: number;
    portName: string;
    country: string | null;
    arrivalTime: string | null;
    departureTime: string | null;
    allAboardTime: string | null;
    portImageUrl: string | null;
    description: string | null;
    highlights: any;
    orderIndex: number;
  }>;
  events: Array<{
    id: number;
    tripId: number;
    date: string;
    time: string;
    title: string;
    type: string;
    venue: string;
    deck: string | null;
    description: string | null;
    shortDescription: string | null;
    imageUrl: string | null;
    themeDescription: string | null;
    dressCode: string | null;
    capacity: number | null;
    requiresReservation: boolean;
    talentIds: any;
    createdAt: string;
    updatedAt: string;
  }>;
  talent: Array<{
    id: number;
    name: string;
    category: string;
    bio: string | null;
    knownFor: string | null;
    profileImageUrl: string | null;
    socialLinks: any;
    website: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

// Transform database data to match the existing component format
export function transformTripData(data: TripData) {
  // Transform itinerary
  const itinerary = data.itinerary.map(stop => ({
    key: stop.date.split('T')[0],
    date: formatDate(dateOnly(stop.date)),
    port: stop.portName,
    arrive: stop.arrivalTime || '—',
    depart: stop.departureTime || '—',
    allAboard: stop.allAboardTime,
    // Normalize image URL field - check all possible variations and ensure leading slash
    imageUrl: stop.portImageUrl || (stop as any).port_image_url || null,
    description: stop.description,
    highlights: stop.highlights
  }));

  // Group events by date
  const dailyEvents: Record<string, any[]> = {};
  data.events.forEach(event => {
    const dateKey = event.date.split('T')[0];
    if (!dailyEvents[dateKey]) {
      dailyEvents[dateKey] = [];
    }
    
    // Map talent IDs to talent info
    const eventTalent = event.talentIds ? 
      data.talent.filter(t => event.talentIds.includes(t.id)) : [];
    
    dailyEvents[dateKey].push({
      time: event.time,
      title: event.title,
      type: event.type,
      venue: event.venue,
      deck: event.deck,
      description: event.description || event.themeDescription,
      shortDescription: event.shortDescription,
      imageUrl: event.imageUrl,
      dressCode: event.dressCode,
      requiresReservation: event.requiresReservation,
      talent: eventTalent
    });
  });

  // Transform daily events to match DAILY format
  const daily = Object.keys(dailyEvents).map(key => ({
    key,
    items: dailyEvents[key].sort((a, b) => a.time.localeCompare(b.time))
  }));

  // Transform talent
  const talent = data.talent.map(t => ({
    name: t.name,
    cat: t.category,
    bio: t.bio || '',
    knownFor: t.knownFor || '',
    img: t.profileImageUrl || '',
    social: t.socialLinks || {}
  }));

  // Party themes (we'll keep these static for now as they're descriptive content)
  const partyThemes = [
    { key: "Dog Tag", desc: "The legendary Dog Tag T-Dance is back! Celebrate your pride with thousands of men from around the world.", shortDesc: "The legendary pride celebration" },
    { key: "UNITE", desc: "We Are Family! Let's celebrate our global LGBTQ+ community in this joyous evening of connection.", shortDesc: "Celebrating our global community" },
    { key: "Atlantis Empires", desc: "A celebration of legendary civilizations and mythical realms. Choose your empire and rule the night!", shortDesc: "Choose your empire and rule" },
    { key: "Greek Isles", desc: "Opa! Channel your inner Greek god in togas, gladiator gear, or mythological inspired looks.", shortDesc: "Channel your inner Greek god" },
    { key: "Here We Go Again", desc: "Mamma Mia! A celebration of ABBA and all things disco. Dancing queens, this is your night!", shortDesc: "ABBA and disco celebration" },
    { key: "Lost At Sea", desc: "From sailors to sea creatures, pirates to mermaids - embrace all things nautical and aquatic.", shortDesc: "Nautical and aquatic adventure" },
    { key: "Neon", desc: "Glow up the night in your brightest neon colors, UV reactive gear, and fluorescent fashion.", shortDesc: "Glow in neon and UV" },
    { key: "Think Pink", desc: "Pretty in pink! From blush to hot pink, show us your rosiest, most fabulous looks.", shortDesc: "Show your rosiest looks" },
    { key: "Virgin White", desc: "The classic all-white party at sea. Crisp, clean, and sophisticated elegance required.", shortDesc: "Classic all-white elegance" },
    { key: "Revival", desc: "A throwback celebration of disco, funk, and soul. Get down with your grooviest retro looks.", shortDesc: "Disco, funk, and soul throwback" },
    { key: "Atlantis Classics", desc: "Celebrating the timeless anthems that have soundtracked our journeys together.", shortDesc: "Timeless Atlantis anthems" },
    { key: "Off-White", desc: "Not quite white, not quite cream - explore the subtle shades of off-white elegance.", shortDesc: "Subtle off-white elegance" },
    { key: "Last Dance", desc: "One final celebration under the stars. Make it count with your most memorable look!", shortDesc: "Final celebration under stars" }
  ];

  // City attractions (keep static for now)
  const cityAttractions: any[] = [];

  // Important info (keep static for now)
  const importantInfo = {
    checkIn: {
      location: "Trip Terminal A - World Trade Center Barcelona",
      address: "Moll de Barcelona, s/n, 08039 Barcelona, Spain",
      time: "2:00 PM - 5:00 PM",
      documents: ["Passport", "Trip documents", "Proof of citizenship"]
    },
    departure: {
      sailAway: "7:00 PM",
      allAboard: "5:30 PM"
    },
    disembarkation: {
      date: "Sunday, August 31, 2025",
      time: "Beginning at 8:00 AM",
      location: "Barcelona, Spain"
    },
    firstDayTips: [
      "Download the Virgin Voyages app before boarding - it's your key to everything onboard",
      "Book dinner reservations and shows early - popular times fill up fast",
      "Attend the mandatory safety drill at 4:00 PM - it's quick and required for all guests",
      "Visit Sailor Services on Deck 5 for any questions or assistance",
      "The Galley food court on Deck 15 is open for lunch when you board",
      "Set up your onboard account at any bar or restaurant to start charging to your cabin",
      "Join the Atlantis welcome reception at 5:30 PM in The Manor nightclub"
    ],
    entertainment: {
      bookingStart: "Starting 10:00 AM on embarkation day",
      walkIns: "Available 15 minutes before showtime if space permits",
      standbyRelease: "10 minutes before showtime",
      rockstarSuites: "Rockstar guests get priority booking and reserved seating"
    },
    dining: {
      reservations: "Book via the Virgin Voyages app or at the restaurant host stand",
      walkIns: "All restaurants accept walk-ins when space is available",
      included: "All specialty restaurants are included in your trip fare - no extra charges!"
    }
  };

  const tripInfo = {
    ship: {
      name: data.trip.shipName,
      line: data.trip.cruiseLine,
      capacity: "2,770 guests",
      crew: "1,160 crew members",
      tonnage: "110,000 gross tons",
      length: "278 meters",
      decks: "17 decks (14 guest accessible)"
    },
    amenities: [
      "Multiple restaurants and dining venues",
      "The Manor nightclub",
      "Red Room theater",
      "Aquatic Club pool deck",
      "Redemption Spa",
      "Fitness center",
      "Running track",
      "Casino"
    ],
    departureInfo: {
      port: "Athens (Piraeus), Greece",
      pierOpens: "2:00 PM",
      luggageDropOff: "Available from 12:00 PM",
      sailawayParty: "6:30 PM on Pool Deck",
      latestArrival: "5:30 PM (ship departs at 7:00 PM)"
    }
  };

  return {
    ITINERARY: itinerary,
    DAILY: daily,
    TALENT: talent,
    PARTY_THEMES: partyThemes,
    CITY_ATTRACTIONS: cityAttractions,
    IMPORTANT_INFO: importantInfo,
    TRIP_INFO: tripInfo
  };
}

function formatDate(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayNum = date.getDate();
  
  return `${dayName}, ${monthName} ${dayNum}`;
}

export function useTripData(slug: string = getTripSlug()) {
  return useQuery<TripData>({
    queryKey: ['trip', slug],
    queryFn: async () => {
      const response = await fetch(`/api/trips/${slug}/complete`);
      if (!response.ok) {
        throw new Error('Failed to fetch trip data');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}