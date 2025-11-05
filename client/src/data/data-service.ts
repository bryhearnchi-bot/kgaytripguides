// Data service - NO MOCK DATA ALLOWED per CLAUDE.md
// All data comes from trip-data.ts only
import { ITINERARY, TALENT, DAILY, PARTY_THEMES, CITY_ATTRACTIONS } from './trip-data';

// Always use real Greek trip data - NO MOCK DATA
export const getItineraryData = () => ITINERARY;

export const getTalentData = () => TALENT;

export const getDailyScheduleData = () => DAILY;

export const getPartyThemesData = () => PARTY_THEMES;

export const getCityAttractionsData = () => CITY_ATTRACTIONS;

// Get the trip slug - always real data
export const getTripSlug = () => 'hong-kong-to-singapore-cruise-2025';

// Helper to check if we're using mock data - always false
export const isUsingMockData = () => false;

// Alias for backward compatibility
export const getCruiseSlug = getTripSlug;
