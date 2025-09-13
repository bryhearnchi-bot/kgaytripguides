// Data service that provides environment-based data selection
import { ITINERARY, TALENT, DAILY, PARTY_THEMES, CITY_ATTRACTIONS } from './trip-data';
import { MOCK_ITINERARY, MOCK_TALENT, MOCK_DAILY, MOCK_PARTY_THEMES, MOCK_CITY_ATTRACTIONS } from './mock-data';

const isProduction = import.meta.env.NODE_ENV === 'production';
const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';

// In production, always use real Greek trip data
// In development, allow mock data if VITE_USE_MOCK_DATA is set to 'true'
const shouldUseMockData = !isProduction && useMockData;

export const getItineraryData = () => {
  return shouldUseMockData ? MOCK_ITINERARY : ITINERARY;
};

export const getTalentData = () => {
  return shouldUseMockData ? MOCK_TALENT : TALENT;
};

export const getDailyScheduleData = () => {
  return shouldUseMockData ? MOCK_DAILY : DAILY;
};

export const getPartyThemesData = () => {
  return shouldUseMockData ? MOCK_PARTY_THEMES : PARTY_THEMES;
};

export const getCityAttractionsData = () => {
  return shouldUseMockData ? MOCK_CITY_ATTRACTIONS : CITY_ATTRACTIONS;
};

// Get the appropriate trip slug based on environment
export const getTripSlug = () => {
  return shouldUseMockData ? 'mock-trip-2024' : 'greek-isles-2025';
};

// Helper to check if we're using mock data
export const isUsingMockData = () => shouldUseMockData;

// Alias for backward compatibility
export const getCruiseSlug = getTripSlug;