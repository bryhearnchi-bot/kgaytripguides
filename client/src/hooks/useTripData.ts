import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getTripSlug,
  getItineraryData,
  getTalentData,
  getDailyScheduleData,
  getPartyThemesData,
} from '../data/data-service';
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
    shipId?: number | null;
    resortId?: number | null;
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
    locationId?: number | null;
    locationTypeId?: number | null;
  }>;
  scheduleEntries?: Array<{
    id: number;
    tripId: number;
    dayNumber: number;
    date: string;
    imageUrl?: string | null;
    description?: string | null;
    orderIndex: number;
  }>;
  events: Array<{
    id: number;
    tripId: number;
    date: string;
    time: string;
    title: string;
    type: string;
    venue?: {
      id: number;
      name: string;
      description?: string;
      venueTypeId?: number;
      venueType?: {
        id: number;
        name: string;
      };
    };
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
// v2.0: Phase 4 migration - using location fields instead of port fields
export function transformTripData(data: TripData) {
  // Determine trip type
  const isCruise = !!data.trip.shipId;
  const isResort = !!data.trip.resortId;

  // Helper function to format day number based on trip type
  const formatDayNumber = (dayNumber: number): string => {
    if (dayNumber < 0) {
      return isCruise ? 'Pre-Cruise' : 'Pre-Trip';
    } else if (dayNumber >= 100) {
      return isCruise ? 'Post-Cruise' : 'Post-Trip';
    } else {
      return `Day ${dayNumber}`;
    }
  };

  // Transform itinerary (defensive check)
  const itinerary = (data.itinerary || []).map(stop => ({
    key: stop.date.split('T')[0],
    date: formatDate(dateOnly(stop.date)),
    rawDate: stop.date, // Keep raw date for component date operations
    day: stop.day, // Day number for itinerary display
    port: stop.portName || (stop as any).locationName, // CRITICAL: Use portName (location_name from database) FIRST - this is the user-controlled text field
    arrive: stop.arrivalTime || '—',
    depart: stop.departureTime || '—',
    allAboard: stop.allAboardTime,
    imageUrl:
      (stop as any).location?.imageUrl || (stop as any).location?.image_url || stop.portImageUrl, // Use location.imageUrl if available
    // CRITICAL: Use itinerary description FIRST, then fallback to location description
    description: stop.description || (stop as any).location?.description || null,
    highlights: (stop as any).location?.highlights || stop.highlights, // Use location.highlights if available
    topAttractions: (stop as any).location?.topAttractions || [], // Location top attractions (JSONB field)
    topLgbtVenues: (stop as any).location?.topLgbtVenues || [], // Location LGBT venues (JSONB field)
    attractions: (stop as any).location?.attractions || [], // Location attractions from junction table
    lgbtVenues: (stop as any).location?.lgbtVenues || [], // Location LGBT venues from junction table
    locationId: (stop as any).location?.id, // Location ID for reference
    locationTypeId: stop.locationTypeId, // Location type ID for embarkation/disembarkation logic
    segment: stop.segment, // Segment for determining cruise phase
    portDetails: (stop as any).location, // Include full location details (renamed from port)
  }));

  // Transform schedule entries (for resort trips) to match itinerary format
  const schedule = (data.scheduleEntries || []).map(entry => ({
    key: entry.date,
    date: formatDate(dateOnly(entry.date)),
    rawDate: entry.date,
    port: formatDayNumber(entry.dayNumber), // Format day number with special logic
    arrive: '—',
    depart: '—',
    allAboard: undefined,
    imageUrl: entry.imageUrl,
    description: entry.description,
  }));

  // Group events by date (defensive check)
  const dailyEvents: Record<string, any[]> = {};
  (data.events || []).forEach(event => {
    const dateKey = event.date?.split('T')[0];
    if (!dateKey) return; // Skip if no valid date

    if (!dailyEvents[dateKey]) {
      dailyEvents[dateKey] = [];
    }

    // Map talent IDs to talent info (defensive check)
    const eventTalent = event.talentIds
      ? (data.talent || []).filter(t => event.talentIds?.includes(t.id))
      : [];

    dailyEvents[dateKey].push({
      time: event.time,
      title: event.title,
      type: (event as any).eventType?.name || event.type, // Use eventType.name from API
      venue: (event as any).venue?.name || 'TBD', // Get venue name from joined ship_venues or resort_venues
      deck: event.deck,
      description: event.description || event.themeDescription,
      shortDescription: event.shortDescription,
      imageUrl: (event as any).partyTheme?.imageUrl || event.imageUrl,
      dressCode: event.dressCode,
      requiresReservation: event.requiresReservation,
      talent: eventTalent,
      partyTheme: (event as any).partyTheme, // Include full party theme data if available
      partyThemeId: event.partyThemeId,
    });
  });

  // Transform daily events to match DAILY format
  const daily = Object.keys(dailyEvents).map(key => ({
    key,
    items: (dailyEvents[key] || []).sort((a, b) => (a.time || '').localeCompare(b.time || '')),
  }));

  // Transform talent (defensive check)
  const talent = (data.talent || []).map(t => ({
    name: t.name,
    cat: t.category,
    bio: t.bio || '',
    knownFor: t.knownFor || '',
    img: t.profileImageUrl || '',
    social: t.socialLinks || {},
  }));

  // Extract unique party themes from events (defensive check)
  const uniquePartyThemes = new Map();
  (data.events || []).forEach(event => {
    if ((event as any).partyTheme) {
      const theme = (event as any).partyTheme;
      if (!uniquePartyThemes.has(theme.id)) {
        uniquePartyThemes.set(theme.id, {
          key: theme.name,
          desc: theme.longDescription || theme.long_description || theme.description || '',
          shortDesc:
            theme.shortDescription ||
            theme.short_description ||
            (theme.longDescription ? `${theme.longDescription.substring(0, 50)}...` : ''),
          costumeIdeas: theme.costumeIdeas || theme.costume_ideas,
          amazonShoppingListUrl:
            theme.amazonShoppingListUrl ||
            theme.amazon_shopping_list_url ||
            theme.shoppingList ||
            theme.shopping_list,
          imageUrl: theme.imageUrl || theme.image_url,
          longDescription: theme.longDescription || theme.long_description,
          shortDescription: theme.shortDescription || theme.short_description,
        });
      }
    }
  });

  // Convert to array
  const partyThemes = Array.from(uniquePartyThemes.values());

  // City attractions (keep static for now)
  const cityAttractions: any[] = [];

  // Transform trip info sections from database
  const tripInfoSections = data.tripInfoSections || [];
  const importantInfo: any = {};

  // Parse info sections and organize them
  tripInfoSections.forEach(section => {
    const key = section.title.toLowerCase().replace(/\s+/g, '');
    const titleLower = section.title.toLowerCase();

    if (section.content) {
      if (titleLower.includes('first day tips')) {
        // Parse numbered list
        importantInfo.firstDayTips = section.content
          .split('\n')
          .map(tip => tip.replace(/^\d+\.\s*/, '').trim())
          .filter(tip => tip.length > 0);
      } else if (titleLower.includes('entertainment booking')) {
        // Parse key-value pairs
        const entertainment: any = {};
        section.content.split('\n').forEach(line => {
          if (line.includes(':')) {
            const parts = line.split(':');
            const key = parts[0];
            const value = parts.slice(1).join(':');
            if (key && value) {
              const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '');
              entertainment[cleanKey] = value.trim();
            }
          }
        });
        importantInfo.entertainment = entertainment;
      } else if (titleLower.includes('dining information')) {
        // Parse key-value pairs
        const dining: any = {};
        section.content.split('\n').forEach(line => {
          if (line.includes(':')) {
            const parts = line.split(':');
            const key = parts[0];
            const value = parts.slice(1).join(':');
            if (key && value) {
              const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '');
              dining[cleanKey] = value.trim();
            }
          }
        });
        importantInfo.dining = dining;
      } else if (titleLower.includes('virgin voyages app')) {
        // Parse key-value pairs for app info
        const app: any = {};
        section.content.split('\n').forEach(line => {
          if (line.includes(':')) {
            const parts = line.split(':');
            const key = parts[0];
            const value = parts.slice(1).join(':');
            if (key && value) {
              const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '');
              app[cleanKey] = value.trim();
            }
          }
        });
        importantInfo.app = app;
      } else {
        // Generic key-value parsing for any other sections
        const sectionData: any = {};
        section.content.split('\n').forEach(line => {
          if (line.includes(':')) {
            const parts = line.split(':');
            const key = parts[0];
            const value = parts.slice(1).join(':');
            if (key && value) {
              const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '');
              sectionData[cleanKey] = value.trim();
            }
          }
        });
        importantInfo[key] = sectionData;
      }
    }
  });

  const tripInfo = {
    ship: {
      name: 'Resilient Lady', // Default ship for now
      line: 'Virgin Voyages', // Default cruise line for now
      capacity: '2,770 guests',
      crew: '1,160 crew members',
      tonnage: '110,000 gross tons',
      length: '278 meters',
      decks: '17 decks (14 guest accessible)',
    },
    amenities: [
      'Multiple restaurants and dining venues',
      'The Manor nightclub',
      'Red Room theater',
      'Aquatic Club pool deck',
      'Redemption Spa',
      'Fitness center',
      'Running track',
      'Casino',
    ],
    departureInfo: {
      port: 'Athens (Piraeus), Greece',
      pierOpens: '2:00 PM',
      luggageDropOff: 'Available from 12:00 PM',
      sailawayParty: '6:30 PM on Pool Deck',
      latestArrival: '5:30 PM (ship departs at 7:00 PM)',
    },
  };

  return {
    ITINERARY: itinerary,
    SCHEDULE: schedule,
    DAILY: daily,
    TALENT: talent,
    PARTY_THEMES: partyThemes,
    CITY_ATTRACTIONS: cityAttractions,
    IMPORTANT_INFO: importantInfo,
    TRIP_INFO: tripInfo,
  };
}

function formatDate(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

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
