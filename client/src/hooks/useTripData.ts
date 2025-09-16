import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTripSlug, getItineraryData, getTalentData, getDailyScheduleData, getPartyThemeData } from '../data/data-service';
import { dateOnly } from '@/lib/utils';

export interface TripData {
  trip: {
    id: number;
    name: string;
    slug: string;
    startDate: string;
    endDate: string;
    status: string;
    heroImageUrl: string | null;
    description: string | null;
    shortDescription: string | null;
    featured: boolean;
    shipName?: string;
    cruiseLine?: string;
  };
  itinerary: Array<{
    id: number;
    cruiseId: number;
    date: string;
    day: number;
    portName: string;
    country: string | null;
    arrivalTime: string | null;
    departureTime: string | null;
    allAboardTime?: string | null;
    portImageUrl: string | null;
    description: string | null;
    highlights?: any;
    orderIndex: number;
    segment?: string;
  }>;
  events: Array<{
    id: number;
    cruiseId: number;
    date: string;
    time: string;
    title: string;
    type: string;
    venue: string;
    deck?: string | null;
    description: string | null;
    shortDescription?: string | null;
    imageUrl?: string | null;
    themeDescription?: string | null;
    dressCode?: string | null;
    capacity?: number | null;
    requiresReservation?: boolean;
    talentIds?: any;
    createdAt?: string;
    updatedAt?: string;
  }>;
  talent: Array<{
    id: number;
    name: string;
    category: string;
    bio: string | null;
    knownFor: string | null;
    profileImageUrl: string | null;
    socialLinks?: any;
    website?: string | null;
    createdAt?: string;
    updatedAt?: string;
  }>;
  tripInfoSections?: Array<{
    id: number;
    cruiseId: number;
    title: string;
    content: string | null;
    orderIndex: number;
    updatedBy?: string | null;
    updatedAt?: string;
  }>;
}

// Transform database data to match the existing component format
export function transformTripData(data: TripData) {
  // Transform itinerary
  const itinerary = data.itinerary.map(stop => ({
    key: stop.date.split('T')[0],
    date: formatDate(dateOnly(stop.date)),
    rawDate: stop.date, // Keep raw date for component date operations
    port: (stop as any).port?.name || stop.portName, // Use port.name if available, fallback to portName
    arrive: stop.arrivalTime || '—',
    depart: stop.departureTime || '—',
    allAboard: stop.allAboardTime,
    imageUrl: (stop as any).port?.image_url || stop.portImageUrl, // Use port.image_url if available
    description: (stop as any).port?.description || stop.description, // Use port.description if available
    highlights: (stop as any).port?.highlights || stop.highlights, // Use port.highlights if available
    portDetails: (stop as any).port // Include full port details if available
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
      title: (event as any).party?.name || event.title, // Use party.name if available
      type: event.type,
      venue: (event as any).party?.venue_type || event.venue, // Use party.venue_type if available
      deck: event.deck,
      description: (event as any).party?.theme || event.description || event.themeDescription, // Use party.theme if available
      shortDescription: event.shortDescription,
      imageUrl: (event as any).party?.image_url || event.imageUrl, // Use party.image_url if available
      dressCode: (event as any).party?.dress_code || event.dressCode, // Use party.dress_code if available
      requiresReservation: event.requiresReservation,
      talent: eventTalent,
      partyDetails: (event as any).party // Include full party details if available
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
    { key: "Sail-Away Party", desc: "Top-deck vibes as we depart on our adventure! Join us poolside for departure cocktails and ocean views.", shortDesc: "Top-deck departure celebration" },
    { key: "Welcome Party", desc: "First night under the stars! Join your fellow travelers for cocktails, music, and the beginning of an unforgettable journey.", shortDesc: "First night celebration" },
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

  // Transform trip info sections from database
  const tripInfoSections = data.tripInfoSections || [];
  const importantInfo: any = {};

  // Parse info sections and organize them
  tripInfoSections.forEach(section => {
    const key = section.title.toLowerCase().replace(/\s+/g, '');

    if (section.content) {
      if (section.title === 'First Day Tips') {
        // Parse numbered list
        importantInfo.firstDayTips = section.content.split('\n').map(tip =>
          tip.replace(/^\d+\.\s*/, '')
        );
      } else if (section.title === 'Entertainment Booking') {
        // Parse key-value pairs
        const entertainment: any = {};
        section.content.split('\n').forEach(line => {
          if (line.includes(':')) {
            const [key, value] = line.split(':');
            const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '');
            entertainment[cleanKey] = value.trim();
          }
        });
        importantInfo.entertainment = entertainment;
      } else if (section.title === 'Dining Information') {
        // Parse key-value pairs
        const dining: any = {};
        section.content.split('\n').forEach(line => {
          if (line.includes(':')) {
            const [key, value] = line.split(':');
            const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '');
            dining[cleanKey] = value.trim();
          }
        });
        importantInfo.dining = dining;
      } else {
        // Generic key-value parsing
        const sectionData: any = {};
        section.content.split('\n').forEach(line => {
          if (line.includes(':')) {
            const [key, value] = line.split(':');
            const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '');
            sectionData[cleanKey] = value.trim();
          }
        });
        importantInfo[key] = sectionData;
      }
    }
  });

  const tripInfo = {
    ship: {
      name: "Resilient Lady", // Default ship for now
      line: "Virgin Voyages", // Default cruise line for now
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
        throw new Error(`Failed to fetch trip data: ${response.statusText}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}