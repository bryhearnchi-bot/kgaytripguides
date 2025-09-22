/**
 * Location Validation Schemas
 *
 * Comprehensive validation schemas for ports, ships, venues,
 * and other location-related endpoints.
 */

import { z } from 'zod';
import { paginationSchema, searchSchema, sortingSchema, urlSchema, coordinatesSchema } from './common';

// ============ LOCATION SCHEMAS ============

/**
 * Location type enum
 */
export const locationTypeEnum = z.enum(['port', 'sea_day', 'embark', 'disembark', 'private_island']);

/**
 * Region enum
 */
export const regionEnum = z.enum([
  'caribbean',
  'mediterranean',
  'northern_europe',
  'baltic',
  'alaska',
  'asia',
  'australia_new_zealand',
  'south_pacific',
  'transatlantic',
  'middle_east',
  'africa',
  'south_america',
  'antarctica'
]);

/**
 * Create location schema
 */
export const createLocationSchema = z.object({
  name: z.string()
    .min(1, 'Location name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim(),

  country: z.string()
    .min(1, 'Country is required')
    .max(100, 'Country must be less than 100 characters')
    .trim(),

  region: regionEnum.optional(),

  locationType: locationTypeEnum.optional().default('port'),

  locationCode: z.string()
    .length(3, 'Location code must be 3 characters (IATA/UN/LOCODE)')
    .regex(/^[A-Z]{3}$/, 'Location code must be 3 uppercase letters')
    .optional(),

  coordinates: coordinatesSchema.optional(),

  timezone: z.string()
    .max(50, 'Timezone must be less than 50 characters')
    .optional(),

  description: z.string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),

  shortDescription: z.string()
    .max(500, 'Short description must be less than 500 characters')
    .optional(),

  imageUrl: urlSchema.optional().or(z.literal('')),

  thumbnailUrl: urlSchema.optional().or(z.literal('')),

  // Location facilities
  facilities: z.object({
    terminal: z.boolean().optional(),
    shuttleService: z.boolean().optional(),
    wifi: z.boolean().optional(),
    parking: z.boolean().optional(),
    shopping: z.boolean().optional(),
    restaurants: z.boolean().optional(),
    currency_exchange: z.boolean().optional(),
    medical: z.boolean().optional()
  }).optional(),

  // Distance information
  distanceFromCity: z.number()
    .positive('Distance must be positive')
    .optional(),

  distanceUnit: z.enum(['km', 'miles']).optional().default('km'),

  transportOptions: z.array(z.enum(['taxi', 'bus', 'train', 'shuttle', 'walk', 'rental_car']))
    .optional(),

  // Popular attractions
  attractions: z.array(z.object({
    name: z.string().max(255),
    description: z.string().max(1000).optional(),
    distance: z.number().positive().optional(),
    estimatedTime: z.string().optional()
  })).max(20, 'Maximum 20 attractions')
    .optional(),

  // Practical information
  currency: z.string()
    .length(3, 'Currency must be 3-letter code')
    .optional(),

  languages: z.array(z.string().max(50))
    .max(5, 'Maximum 5 languages')
    .optional(),

  visaRequired: z.boolean().optional(),

  safetyRating: z.number()
    .min(1, 'Safety rating must be between 1 and 5')
    .max(5, 'Safety rating must be between 1 and 5')
    .optional(),

  // Status
  isPopular: z.boolean().optional().default(false),

  isActive: z.boolean().optional().default(true),

  // SEO
  seoTitle: z.string()
    .max(255, 'SEO title must be less than 255 characters')
    .optional(),

  seoDescription: z.string()
    .max(500, 'SEO description must be less than 500 characters')
    .optional(),

  tags: z.array(z.string().max(50))
    .max(20, 'Maximum 20 tags allowed')
    .optional(),

  metadata: z.record(z.any()).optional()
});

/**
 * Update location schema
 */
export const updateLocationSchema = createLocationSchema.partial();

/**
 * Location filter schema
 */
export const locationFilterSchema = z.object({})
  .merge(paginationSchema)
  .merge(searchSchema)
  .merge(sortingSchema)
  .extend({
    country: z.string().optional(),

    region: regionEnum.optional(),

    locationType: locationTypeEnum.optional(),

    isPopular: z.string()
      .transform(val => val === 'true')
      .optional(),

    isActive: z.string()
      .transform(val => val === 'true')
      .optional(),

    hasCoordinates: z.string()
      .transform(val => val === 'true')
      .optional(),

    visaRequired: z.string()
      .transform(val => val === 'true')
      .optional(),

    minSafetyRating: z.string()
      .transform(Number)
      .optional(),

    tags: z.string()
      .transform(val => val.split(',').map(t => t.trim()))
      .optional()
  });

// ============ SHIP SCHEMAS ============

/**
 * Ship class enum
 */
export const shipClassEnum = z.enum([
  'mega',
  'large',
  'mid_size',
  'small',
  'river',
  'expedition',
  'yacht',
  'sailing'
]);

/**
 * Cruise line enum (common ones, can be extended)
 */
export const cruiseLineEnum = z.enum([
  'atlantis',
  'rsvp',
  'olivia',
  'vacaya',
  'royal_caribbean',
  'celebrity',
  'norwegian',
  'msc',
  'carnival',
  'princess',
  'holland_america',
  'virgin_voyages',
  'other'
]);

/**
 * Create ship schema
 */
export const createShipSchema = z.object({
  name: z.string()
    .min(1, 'Ship name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim(),

  cruiseLine: z.string()
    .min(1, 'Cruise line is required')
    .max(255, 'Cruise line must be less than 255 characters')
    .trim(),

  shipCode: z.string()
    .max(50, 'Ship code must be less than 50 characters')
    .optional(),

  imoNumber: z.string()
    .regex(/^IMO\d{7}$/, 'IMO number must be in format IMO followed by 7 digits')
    .optional(),

  // Ship specifications
  capacity: z.number()
    .int('Capacity must be an integer')
    .positive('Capacity must be positive')
    .max(10000, 'Capacity seems unrealistic')
    .optional(),

  crewSize: z.number()
    .int('Crew size must be an integer')
    .positive('Crew size must be positive')
    .max(5000, 'Crew size seems unrealistic')
    .optional(),

  grossTonnage: z.number()
    .positive('Gross tonnage must be positive')
    .optional(),

  lengthMeters: z.number()
    .positive('Length must be positive')
    .max(500, 'Length seems unrealistic')
    .optional(),

  beamMeters: z.number()
    .positive('Beam must be positive')
    .max(100, 'Beam seems unrealistic')
    .optional(),

  draftMeters: z.number()
    .positive('Draft must be positive')
    .max(20, 'Draft seems unrealistic')
    .optional(),

  decks: z.number()
    .int('Decks must be an integer')
    .positive('Decks must be positive')
    .max(30, 'Number of decks seems unrealistic')
    .optional(),

  speed: z.number()
    .positive('Speed must be positive')
    .max(40, 'Speed seems unrealistic (knots)')
    .optional(),

  // Ship history
  builtYear: z.number()
    .int('Year must be an integer')
    .min(1900, 'Built year seems unrealistic')
    .max(new Date().getFullYear() + 5, 'Built year cannot be too far in the future')
    .optional(),

  refurbishedYear: z.number()
    .int('Year must be an integer')
    .min(1900, 'Refurbished year seems unrealistic')
    .max(new Date().getFullYear(), 'Refurbished year cannot be in the future')
    .optional(),

  shipClass: shipClassEnum.optional(),

  flag: z.string()
    .max(100, 'Flag must be less than 100 characters')
    .optional(),

  registryPort: z.string()
    .max(255, 'Registry port must be less than 255 characters')
    .optional(),

  // Images
  imageUrl: urlSchema.optional().or(z.literal('')),

  deckPlansUrl: urlSchema.optional().or(z.literal('')),

  virtualTourUrl: urlSchema.optional().or(z.literal('')),

  // Amenities
  amenities: z.object({
    pools: z.number().int().min(0).optional(),
    restaurants: z.number().int().min(0).optional(),
    bars: z.number().int().min(0).optional(),
    lounges: z.number().int().min(0).optional(),
    casino: z.boolean().optional(),
    spa: z.boolean().optional(),
    gym: z.boolean().optional(),
    theater: z.boolean().optional(),
    cinema: z.boolean().optional(),
    nightclub: z.boolean().optional(),
    library: z.boolean().optional(),
    kids_club: z.boolean().optional(),
    waterslide: z.boolean().optional(),
    rock_climbing: z.boolean().optional(),
    mini_golf: z.boolean().optional(),
    basketball: z.boolean().optional(),
    jogging_track: z.boolean().optional()
  }).optional(),

  // Dining venues
  diningVenues: z.array(z.object({
    name: z.string().max(255),
    type: z.enum(['main_dining', 'buffet', 'specialty', 'cafe', 'room_service']),
    cuisine: z.string().max(100).optional(),
    dresscode: z.string().max(100).optional(),
    surcharge: z.boolean().optional()
  })).max(30, 'Maximum 30 dining venues')
    .optional(),

  // Entertainment venues
  entertainmentVenues: z.array(z.object({
    name: z.string().max(255),
    type: z.enum(['theater', 'lounge', 'nightclub', 'casino', 'cinema', 'comedy_club']),
    capacity: z.number().int().positive().optional(),
    deck: z.string().max(50).optional()
  })).max(20, 'Maximum 20 entertainment venues')
    .optional(),

  // Stateroom categories
  stateroomCategories: z.array(z.object({
    category: z.string().max(50),
    name: z.string().max(255),
    size_sqft: z.number().positive().optional(),
    occupancy: z.number().int().positive(),
    hasBalcony: z.boolean().optional(),
    hasWindow: z.boolean().optional(),
    count: z.number().int().positive().optional()
  })).max(50, 'Maximum 50 stateroom categories')
    .optional(),

  // Content
  description: z.string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),

  highlights: z.array(z.string().max(255))
    .max(10, 'Maximum 10 highlights')
    .optional(),

  // Status
  isActive: z.boolean().optional().default(true),

  isFeatured: z.boolean().optional().default(false),

  // SEO
  seoTitle: z.string()
    .max(255, 'SEO title must be less than 255 characters')
    .optional(),

  seoDescription: z.string()
    .max(500, 'SEO description must be less than 500 characters')
    .optional(),

  tags: z.array(z.string().max(50))
    .max(20, 'Maximum 20 tags allowed')
    .optional(),

  metadata: z.record(z.any()).optional()

}).refine(
  data => !data.refurbishedYear || !data.builtYear || data.refurbishedYear >= data.builtYear,
  { message: 'Refurbished year must be after built year', path: ['refurbishedYear'] }
);

/**
 * Update ship schema - manually define partial schema due to refine constraints
 */
export const updateShipSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  cruiseLine: z.string().min(1).max(255).trim().optional(),
  shipCode: z.string().max(50).optional(),
  imoNumber: z.string().regex(/^IMO\d{7}$/, 'IMO number must be in format IMO followed by 7 digits').optional(),

  // Ship specifications
  capacity: z.number().int().positive().max(10000).optional(),
  crewSize: z.number().int().positive().max(5000).optional(),
  grossTonnage: z.number().positive().optional(),
  lengthMeters: z.number().positive().max(500).optional(),
  beamMeters: z.number().positive().max(100).optional(),
  draftMeters: z.number().positive().max(20).optional(),
  decks: z.number().int().positive().max(30).optional(),
  speed: z.number().positive().max(40).optional(),

  // Ship history
  builtYear: z.number().int().min(1900).max(new Date().getFullYear() + 5).optional(),
  refurbishedYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  shipClass: shipClassEnum.optional(),
  flag: z.string().max(100).optional(),
  registryPort: z.string().max(255).optional(),

  // Images
  imageUrl: urlSchema.optional().or(z.literal('')),
  deckPlansUrl: urlSchema.optional().or(z.literal('')),
  virtualTourUrl: urlSchema.optional().or(z.literal('')),

  // Amenities
  amenities: z.object({
    pools: z.number().int().min(0).optional(),
    restaurants: z.number().int().min(0).optional(),
    bars: z.number().int().min(0).optional(),
    lounges: z.number().int().min(0).optional(),
    casino: z.boolean().optional(),
    spa: z.boolean().optional(),
    gym: z.boolean().optional(),
    theater: z.boolean().optional(),
    cinema: z.boolean().optional(),
    nightclub: z.boolean().optional(),
    library: z.boolean().optional(),
    kids_club: z.boolean().optional(),
    waterslide: z.boolean().optional(),
    rock_climbing: z.boolean().optional(),
    mini_golf: z.boolean().optional(),
    basketball: z.boolean().optional(),
    jogging_track: z.boolean().optional()
  }).optional(),

  // Dining venues
  diningVenues: z.array(z.object({
    name: z.string().max(255),
    type: z.enum(['main_dining', 'buffet', 'specialty', 'cafe', 'room_service']),
    cuisine: z.string().max(100).optional(),
    dresscode: z.string().max(100).optional(),
    surcharge: z.boolean().optional()
  })).max(30).optional(),

  // Entertainment venues
  entertainmentVenues: z.array(z.object({
    name: z.string().max(255),
    type: z.enum(['theater', 'lounge', 'nightclub', 'casino', 'cinema', 'comedy_club']),
    capacity: z.number().int().positive().optional(),
    deck: z.string().max(50).optional()
  })).max(20).optional(),

  // Stateroom categories
  stateroomCategories: z.array(z.object({
    category: z.string().max(50),
    name: z.string().max(255),
    size_sqft: z.number().positive().optional(),
    occupancy: z.number().int().positive(),
    hasBalcony: z.boolean().optional(),
    hasWindow: z.boolean().optional(),
    count: z.number().int().positive().optional()
  })).max(50).optional(),

  // Content
  description: z.string().max(5000).optional(),
  highlights: z.array(z.string().max(255)).max(10).optional(),

  // Status
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),

  // SEO
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Ship filter schema
 */
export const shipFilterSchema = z.object({})
  .merge(paginationSchema)
  .merge(searchSchema)
  .merge(sortingSchema)
  .extend({
    cruiseLine: z.string().optional(),

    shipClass: shipClassEnum.optional(),

    minCapacity: z.string()
      .transform(Number)
      .optional(),

    maxCapacity: z.string()
      .transform(Number)
      .optional(),

    builtAfter: z.string()
      .transform(Number)
      .optional(),

    hasAmenity: z.string().optional(),

    isActive: z.string()
      .transform(val => val === 'true')
      .optional(),

    isFeatured: z.string()
      .transform(val => val === 'true')
      .optional(),

    tags: z.string()
      .transform(val => val.split(',').map(t => t.trim()))
      .optional()
  });

// ============ VENUE SCHEMAS ============

/**
 * Venue type enum
 */
export const venueTypeEnum = z.enum([
  'theater',
  'lounge',
  'nightclub',
  'pool_deck',
  'restaurant',
  'bar',
  'casino',
  'spa',
  'gym',
  'conference',
  'outdoor',
  'other'
]);

/**
 * Create venue schema
 */
export const createVenueSchema = z.object({
  shipId: z.number()
    .int('Ship ID must be an integer')
    .positive('Ship ID must be positive'),

  name: z.string()
    .min(1, 'Venue name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim(),

  type: venueTypeEnum,

  deck: z.string()
    .max(50, 'Deck must be less than 50 characters'),

  capacity: z.number()
    .int('Capacity must be an integer')
    .positive('Capacity must be positive')
    .max(5000, 'Capacity seems unrealistic')
    .optional(),

  description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),

  amenities: z.array(z.string().max(100))
    .max(20, 'Maximum 20 amenities')
    .optional(),

  imageUrl: urlSchema.optional().or(z.literal('')),

  openHours: z.object({
    monday: z.string().optional(),
    tuesday: z.string().optional(),
    wednesday: z.string().optional(),
    thursday: z.string().optional(),
    friday: z.string().optional(),
    saturday: z.string().optional(),
    sunday: z.string().optional()
  }).optional(),

  requiresReservation: z.boolean().optional().default(false),

  dresscode: z.string()
    .max(100, 'Dress code must be less than 100 characters')
    .optional(),

  ageRestriction: z.number()
    .int('Age must be an integer')
    .min(0)
    .max(21)
    .optional(),

  isActive: z.boolean().optional().default(true),

  metadata: z.record(z.any()).optional()
});

/**
 * Update venue schema
 */
export const updateVenueSchema = createVenueSchema.partial().omit({ shipId: true });

export default {
  // Location schemas
  createLocationSchema,
  updateLocationSchema,
  locationFilterSchema,
  locationTypeEnum,
  regionEnum,

  // Ship schemas
  createShipSchema,
  updateShipSchema,
  shipFilterSchema,
  shipClassEnum,
  cruiseLineEnum,

  // Venue schemas
  createVenueSchema,
  updateVenueSchema,
  venueTypeEnum
};