/**
 * Types for trip guide data structures
 * Used by trip-guide components for static/dynamic trip data
 */

export interface ItineraryStop {
  key: string;
  date: string;
  port: string;
  arrive: string;
  depart: string;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
  youtube?: string;
  linkedin?: string;
  linktree?: string;
}

export interface Talent {
  name: string;
  cat: string;
  role: string;
  knownFor: string;
  bio: string;
  img: string;
  social?: SocialLinks;
}

export interface DailyEvent {
  type: string;
  time: string;
  title: string;
  venue: string;
}

export interface DailySchedule {
  key: string;
  items: DailyEvent[];
}

export interface PartyTheme {
  key: string;
  desc: string;
  shortDesc: string;
  costumeIdeas?: string;
  imageUrl?: string;
  amazonShoppingListUrl?: string;
}

export interface CityAttraction {
  city: string;
  topAttractions: string[];
  otherThingsToDo: string[];
  gayBars: string[];
}

export interface CruiseInfo {
  ship: string;
  dates: string;
  ports: string[];
  theme: string;
  departureInfo: {
    port: string;
    pierOpens: string;
    luggageDropOff: string;
    sailawayParty: string;
    latestArrival: string;
  };
}

export interface ImportantInfo {
  entertainment: {
    bookingStart: string;
    walkIns: string;
    standbyRelease: string;
    rockstarSuites: string;
  };
  dining: {
    reservations: string;
    walkIns: string;
    included: string;
    lateNight: string;
  };
  firstDayTips: string[];
  virginApp: {
    registrationSteps: number;
    note: string;
  };
}
