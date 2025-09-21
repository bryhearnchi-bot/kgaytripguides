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
    tripId: number;
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
    tripId: number;
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
    partyThemeId?: number | null;
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
    tripId: number;
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
      title: event.title,
      type: event.type,
      venue: event.venue,
      deck: event.deck,
      description: event.description || event.themeDescription,
      shortDescription: event.shortDescription,
      imageUrl: (event as any).partyTheme?.imageUrl || event.imageUrl,
      dressCode: event.dressCode,
      requiresReservation: event.requiresReservation,
      talent: eventTalent,
      partyTheme: (event as any).partyTheme, // Include full party theme data if available
      partyThemeId: event.partyThemeId
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

  // Extract unique party themes from events
  const uniquePartyThemes = new Map();
  data.events.forEach(event => {
    if ((event as any).partyTheme) {
      const theme = (event as any).partyTheme;
      if (!uniquePartyThemes.has(theme.id)) {
        uniquePartyThemes.set(theme.id, {
          key: theme.name,
          desc: theme.longDescription || theme.long_description || theme.description || '',
          shortDesc: theme.shortDescription || theme.short_description || (theme.longDescription ? theme.longDescription.substring(0, 50) + '...' : ''),
          costumeIdeas: theme.costumeIdeas || theme.costume_ideas,
          shoppingList: theme.amazonShoppingListUrl || theme.amazon_shopping_list_url || theme.shoppingList || theme.shopping_list,
          imageUrl: theme.imageUrl || theme.image_url,
          longDescription: theme.longDescription || theme.long_description,
          shortDescription: theme.shortDescription || theme.short_description
        });
      }
    }
  });

  // Convert to array
  const partyThemes = Array.from(uniquePartyThemes.values());

  // If no themes from database, use fallback (this shouldn't happen if data is loaded correctly)
  if (partyThemes.length === 0) {
    console.warn('No party themes found in database data, using fallback');
  }

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