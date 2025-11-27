/**
 * Trip Wizard Types
 * Types for the trip creation/editing wizard flow
 */

/**
 * Event data as used in the Trip Wizard
 */
export interface TripEvent {
  id?: number;
  tripId: number;
  date: string;
  time: string;
  title: string;
  shipVenueId: number | null;
  resortVenueId: number | null;
  venueName?: string;
  talentIds: number[];
  talentNames?: string[];
  talentImages?: string[];
  partyThemeId: number | null;
  partyThemeName?: string;
  eventTypeId: number;
  eventTypeName?: string;
  eventTypeColor?: string;
  eventTypeIcon?: string;
  imageUrl?: string;
  description?: string;
}

/**
 * Talent data with event assignments as used in the Trip Wizard
 */
export interface TripTalent {
  id: number;
  name: string;
  talentCategoryId: number;
  talentCategoryName?: string;
  bio?: string;
  knownFor?: string;
  profileImageUrl?: string;
  socialLinks?: SocialLinks;
  website?: string;
  assignedEvents?: TalentEventAssignment[];
  isUnassigned?: boolean;
}

/**
 * Social links structure for talent profiles
 */
export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  website?: string;
  tiktok?: string;
  youtube?: string;
}

/**
 * Minimal event assignment info for talent
 */
export interface TalentEventAssignment {
  id: number;
  title: string;
  date: string;
  dayNumber?: number;
}

/**
 * Form data for creating/editing talent
 */
export interface TalentFormData {
  name: string;
  talentCategoryId: number;
  bio?: string;
  knownFor?: string;
  profileImageUrl?: string;
  socialLinks?: SocialLinks;
  website?: string;
}

/**
 * Talent category reference
 */
export interface TalentCategory {
  id: number;
  category: string;
}

/**
 * Form data for basic trip info page
 */
export interface BasicInfoData {
  name: string;
  startDate: string;
  endDate: string;
  tripTypeId?: number;
  charterCompanyId?: number;
  status?: string;
  bookingUrl?: string;
  description?: string;
  highlights?: string;
  heroImageUrl?: string;
  mapUrl?: string;
}

/**
 * Ship data for cruise trips
 */
export interface ShipData {
  name: string;
  cruiseLineId?: number;
  cruiseLineName?: string;
  capacity?: number;
  decks?: number;
  imageUrl: string;
  description: string;
  deckPlansUrl: string;
}

/**
 * Event type reference
 */
export interface EventType {
  id: number;
  type: string;
  color?: string;
  icon?: string;
}

/**
 * Party theme reference
 */
export interface PartyTheme {
  id: number;
  theme: string;
  description?: string;
  imageUrl?: string;
}

/**
 * Venue reference (ship or resort)
 */
export interface Venue {
  id: number;
  name: string;
  description?: string;
  capacity?: number;
  imageUrl?: string;
}
