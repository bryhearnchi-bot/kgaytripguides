/**
 * Trip & Cruise Validation Schemas
 *
 * Comprehensive validation schemas for trip management, cruise operations,
 * itinerary planning, and event scheduling endpoints.
 */

import { z } from 'zod';
import {
  idParamSchema,
  slugParamSchema,
  paginationSchema,
  searchSchema,
  sortingSchema,
  dateRangeSchema,
  timeSchema,
  urlSchema,
  priceSchema,
} from './common';

// ============ TRIP/CRUISE SCHEMAS ============

/**
 * Trip status enum
 */
export const tripStatusEnum = z.enum(['upcoming', 'ongoing', 'past', 'cancelled', 'draft']);

/**
 * Trip type enum
 */
export const tripTypeEnum = z.enum(['cruise', 'resort', 'tour', 'event']);

/**
 * Create trip request schema
 */
export const createTripSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Trip name is required')
      .max(255, 'Trip name must be less than 255 characters')
      .trim(),

    slug: z
      .string()
      .min(1, 'Slug is required')
      .max(255, 'Slug must be less than 255 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
      .trim(),

    tripType: tripTypeEnum.default('cruise'),

    status: tripStatusEnum.optional().default('draft'),

    // Ship information
    shipId: z
      .number()
      .int('Ship ID must be an integer')
      .positive('Ship ID must be positive')
      .optional(),

    shipName: z
      .string()
      .min(1, 'Ship name is required')
      .max(255, 'Ship name must be less than 255 characters')
      .trim(),

    cruiseLine: z
      .string()
      .max(255, 'Cruise line must be less than 255 characters')
      .trim()
      .optional(),

    // Dates
    startDate: z
      .string()
      .refine(val => !isNaN(Date.parse(val)), 'Invalid start date format')
      .transform(val => new Date(val).toISOString()),

    endDate: z
      .string()
      .refine(val => !isNaN(Date.parse(val)), 'Invalid end date format')
      .transform(val => new Date(val).toISOString()),

    bookingDeadline: z
      .string()
      .optional()
      .refine(val => !val || !isNaN(Date.parse(val)), 'Invalid booking deadline format')
      .transform(val => (val ? new Date(val).toISOString() : undefined)),

    // Content
    heroImageUrl: urlSchema.optional().or(z.literal('')),

    description: z.string().max(5000, 'Description must be less than 5000 characters').optional(),

    shortDescription: z
      .string()
      .max(500, 'Short description must be less than 500 characters')
      .optional(),

    highlights: z.array(z.string().max(255)).max(10, 'Maximum 10 highlights allowed').optional(),

    // Pricing
    pricing: z
      .object({
        startingFrom: priceSchema.optional(),
        currency: z.string().length(3, 'Currency must be 3-letter code').default('USD'),
        includesTaxes: z.boolean().default(false),
        categories: z
          .array(
            z.object({
              name: z.string().max(100),
              price: priceSchema,
              description: z.string().optional(),
            })
          )
          .optional(),
      })
      .optional(),

    // Capacity
    maxGuests: z
      .number()
      .int('Max guests must be an integer')
      .positive('Max guests must be positive')
      .max(10000, 'Max guests seems unrealistic')
      .optional(),

    currentBookings: z
      .number()
      .int('Current bookings must be an integer')
      .min(0, 'Current bookings cannot be negative')
      .optional()
      .default(0),

    // Metadata
    tags: z.array(z.string().max(50)).max(20, 'Maximum 20 tags allowed').optional(),

    isFeature: z.boolean().optional().default(false),
    isPublished: z.boolean().optional().default(false),

    // Additional info as JSON
    includesInfo: z.record(z.any()).optional(),
    excludesInfo: z.record(z.any()).optional(),
    termsAndConditions: z.string().max(10000).optional(),
  })
  .refine(data => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'Start date must be before or equal to end date',
    path: ['endDate'],
  })
  .refine(
    data => !data.bookingDeadline || new Date(data.bookingDeadline) <= new Date(data.startDate),
    { message: 'Booking deadline must be before trip start date', path: ['bookingDeadline'] }
  );

/**
 * Update trip request schema
 */
export const updateTripSchema = z.object({
  name: z
    .string()
    .min(1, 'Trip name is required')
    .max(255, 'Trip name must be less than 255 characters')
    .trim()
    .optional(),

  tripType: tripTypeEnum.optional(),
  status: tripStatusEnum.optional(),

  // Ship information
  shipId: z
    .number()
    .int('Ship ID must be an integer')
    .positive('Ship ID must be positive')
    .optional(),

  shipName: z
    .string()
    .min(1, 'Ship name is required')
    .max(255, 'Ship name must be less than 255 characters')
    .trim()
    .optional(),

  cruiseLine: z.string().max(255, 'Cruise line must be less than 255 characters').trim().optional(),

  // Dates
  startDate: z
    .string()
    .refine(val => !isNaN(Date.parse(val)), 'Invalid start date format')
    .transform(val => new Date(val).toISOString())
    .optional(),

  endDate: z
    .string()
    .refine(val => !isNaN(Date.parse(val)), 'Invalid end date format')
    .transform(val => new Date(val).toISOString())
    .optional(),

  bookingDeadline: z
    .string()
    .optional()
    .refine(val => !val || !isNaN(Date.parse(val)), 'Invalid booking deadline format')
    .transform(val => (val ? new Date(val).toISOString() : undefined)),

  // Content
  heroImageUrl: urlSchema.optional().or(z.literal('')),
  mapUrl: urlSchema.optional().or(z.literal('')),
  bookingUrl: urlSchema.optional().or(z.literal('')),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(500).optional(),
  highlights: z.array(z.string().max(255)).max(10).optional(),

  // Pricing
  pricing: z
    .object({
      startingFrom: priceSchema.optional(),
      currency: z.string().length(3).optional(),
      includesTaxes: z.boolean().optional(),
      categories: z
        .array(
          z.object({
            name: z.string().max(100),
            price: priceSchema,
            description: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),

  // Capacity
  maxGuests: z.number().int().positive().max(10000).optional(),
  currentBookings: z.number().int().min(0).optional(),

  // Metadata
  tags: z.array(z.string().max(50)).max(20).optional(),
  isFeature: z.boolean().optional(),
  isPublished: z.boolean().optional(),

  // Additional info
  includesInfo: z.record(z.any()).optional(),
  excludesInfo: z.record(z.any()).optional(),
  termsAndConditions: z.string().max(10000).optional(),
});

/**
 * Trip duplicate request schema
 */
export const duplicateTripSchema = z.object({
  newName: z
    .string()
    .min(1, 'New name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim(),

  newSlug: z
    .string()
    .min(1, 'New slug is required')
    .max(255, 'Slug must be less than 255 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .trim(),

  copyItinerary: z.boolean().optional().default(true),
  copyEvents: z.boolean().optional().default(true),
  copyTalent: z.boolean().optional().default(false),
});

/**
 * Trip search/filter schema
 */
export const tripFilterSchema = paginationSchema
  .merge(searchSchema)
  .merge(sortingSchema)
  .extend({
    startDate: z
      .string()
      .optional()
      .refine(val => !val || !isNaN(Date.parse(val)), 'Invalid start date format'),
    endDate: z
      .string()
      .optional()
      .refine(val => !val || !isNaN(Date.parse(val)), 'Invalid end date format'),
    status: tripStatusEnum.optional(),
    tripType: tripTypeEnum.optional(),
    shipId: z.string().transform(Number).optional(),
    cruiseLine: z.string().optional(),
    isFeature: z
      .string()
      .transform(val => val === 'true')
      .optional(),
    isPublished: z
      .string()
      .transform(val => val === 'true')
      .optional(),
    hasAvailability: z
      .string()
      .transform(val => val === 'true')
      .optional(),
  });

// ============ EVENT SCHEMAS ============

/**
 * Event type enum
 */
export const eventTypeEnum = z.enum([
  'party',
  'show',
  'dining',
  'lounge',
  'fun',
  'club',
  'after',
  'workshop',
  'meetup',
]);

/**
 * Create event schema
 */
export const createEventSchema = z
  .object({
    cruiseId: z.number().int('Cruise ID must be an integer').positive('Cruise ID must be positive'),

    date: z
      .string()
      .refine(val => !isNaN(Date.parse(val)), 'Invalid date format')
      .transform(val => new Date(val).toISOString()),

    time: timeSchema,

    endTime: timeSchema.optional(),

    title: z
      .string()
      .min(1, 'Event title is required')
      .max(255, 'Title must be less than 255 characters')
      .trim(),

    type: eventTypeEnum,

    venue: z
      .string()
      .min(1, 'Venue is required')
      .max(255, 'Venue must be less than 255 characters')
      .trim(),

    deck: z.string().max(50, 'Deck must be less than 50 characters').optional(),

    description: z.string().max(5000, 'Description must be less than 5000 characters').optional(),

    shortDescription: z
      .string()
      .max(500, 'Short description must be less than 500 characters')
      .optional(),

    imageUrl: urlSchema.optional().or(z.literal('')),

    // Party theme details
    party_id: z
      .number()
      .int('Party ID must be an integer')
      .positive('Party ID must be positive')
      .optional(),

    themeDescription: z
      .string()
      .max(1000, 'Theme description must be less than 1000 characters')
      .optional(),

    dressCode: z.string().max(255, 'Dress code must be less than 255 characters').optional(),

    // Capacity and reservations
    capacity: z
      .number()
      .int('Capacity must be an integer')
      .positive('Capacity must be positive')
      .max(5000, 'Capacity seems unrealistic')
      .optional(),

    currentReservations: z
      .number()
      .int('Reservations must be an integer')
      .min(0, 'Reservations cannot be negative')
      .optional()
      .default(0),

    requiresReservation: z.boolean().optional().default(false),

    reservationLink: urlSchema.optional(),

    // Talent
    talentIds: z
      .array(z.number().int().positive())
      .max(20, 'Maximum 20 talent assignments per event')
      .optional(),

    // Pricing
    price: priceSchema.optional(),

    currency: z.string().length(3, 'Currency must be 3-letter code').optional().default('USD'),

    // Status
    isCancelled: z.boolean().optional().default(false),
    isPrivate: z.boolean().optional().default(false),
    isHighlight: z.boolean().optional().default(false),

    // Additional metadata
    tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional(),
  })
  .refine(data => !data.endTime || data.time < data.endTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

/**
 * Update event schema
 */
export const updateEventSchema = z.object({
  date: z
    .string()
    .refine(val => !isNaN(Date.parse(val)), 'Invalid date format')
    .transform(val => new Date(val).toISOString())
    .optional(),

  time: timeSchema.optional(),
  endTime: timeSchema.optional(),

  title: z
    .string()
    .min(1, 'Event title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim()
    .optional(),

  type: eventTypeEnum.optional(),

  venue: z
    .string()
    .min(1, 'Venue is required')
    .max(255, 'Venue must be less than 255 characters')
    .trim()
    .optional(),

  deck: z.string().max(50).optional(),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(500).optional(),
  imageUrl: urlSchema.optional().or(z.literal('')),

  // Party theme details
  party_id: z.number().int().positive().optional(),
  themeDescription: z.string().max(1000).optional(),
  dressCode: z.string().max(255).optional(),

  // Capacity and reservations
  capacity: z.number().int().positive().max(5000).optional(),
  currentReservations: z.number().int().min(0).optional(),
  requiresReservation: z.boolean().optional(),
  reservationLink: urlSchema.optional(),

  // Talent
  talentIds: z.array(z.number().int().positive()).max(20).optional(),

  // Pricing
  price: priceSchema.optional(),
  currency: z.string().length(3).optional(),

  // Status
  isCancelled: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  isHighlight: z.boolean().optional(),

  // Additional metadata
  tags: z.array(z.string().max(50)).max(10).optional(),
});

/**
 * Bulk events create/update schema
 */
export const bulkEventsSchema = z.object({
  cruiseId: z.number().int().positive(),

  events: z
    .array(
      z.object({
        id: z.number().int().positive().optional(), // For updates
        date: z
          .string()
          .refine(val => !isNaN(Date.parse(val)), 'Invalid date format')
          .transform(val => new Date(val).toISOString()),
        time: timeSchema,
        endTime: timeSchema.optional(),
        title: z.string().min(1).max(255).trim(),
        type: eventTypeEnum,
        venue: z.string().min(1).max(255).trim(),
        deck: z.string().max(50).optional(),
        description: z.string().max(5000).optional(),
        shortDescription: z.string().max(500).optional(),
        imageUrl: urlSchema.optional().or(z.literal('')),
        party_id: z.number().int().positive().optional(),
        themeDescription: z.string().max(1000).optional(),
        dressCode: z.string().max(255).optional(),
        capacity: z.number().int().positive().max(5000).optional(),
        currentReservations: z.number().int().min(0).optional().default(0),
        requiresReservation: z.boolean().optional().default(false),
        reservationLink: urlSchema.optional(),
        talentIds: z.array(z.number().int().positive()).max(20).optional(),
        price: priceSchema.optional(),
        currency: z.string().length(3).optional().default('USD'),
        isCancelled: z.boolean().optional().default(false),
        isPrivate: z.boolean().optional().default(false),
        isHighlight: z.boolean().optional().default(false),
        tags: z.array(z.string().max(50)).max(10).optional(),
      })
    )
    .min(1, 'At least one event is required')
    .max(50, 'Maximum 50 events can be processed at once'),
});

/**
 * Event filter schema
 */
export const eventFilterSchema = paginationSchema
  .merge(searchSchema)
  .merge(sortingSchema)
  .extend({
    cruiseId: z.string().transform(Number).optional(),
    type: eventTypeEnum.optional(),
    date: z.string().optional(),
    venue: z.string().optional(),
    requiresReservation: z
      .string()
      .transform(val => val === 'true')
      .optional(),
    hasAvailability: z
      .string()
      .transform(val => val === 'true')
      .optional(),
    talentId: z.string().transform(Number).optional(),
  });

// ============ ITINERARY SCHEMAS ============

/**
 * Port segment enum
 */
export const portSegmentEnum = z.enum(['pre', 'main', 'post']);

/**
 * Create itinerary stop schema
 */
export const createItineraryStopSchema = z
  .object({
    cruiseId: z.number().int('Cruise ID must be an integer').positive('Cruise ID must be positive'),

    date: z
      .string()
      .refine(val => !isNaN(Date.parse(val)), 'Invalid date format')
      .transform(val => new Date(val).toISOString()),

    day: z
      .number()
      .int('Day must be an integer')
      .positive('Day must be positive')
      .max(365, 'Day seems unrealistic'),

    port_id: z
      .number()
      .int('Port ID must be an integer')
      .positive('Port ID must be positive')
      .optional(),

    portName: z
      .string()
      .min(1, 'Port name is required')
      .max(255, 'Port name must be less than 255 characters')
      .trim(),

    country: z.string().max(100, 'Country must be less than 100 characters').trim().optional(),

    arrivalTime: timeSchema.optional(),
    departureTime: timeSchema.optional(),
    allAboardTime: timeSchema.optional(),

    portImageUrl: urlSchema.optional().or(z.literal('')),

    description: z.string().max(5000, 'Description must be less than 5000 characters').optional(),

    highlights: z.array(z.string().max(255)).max(10, 'Maximum 10 highlights allowed').optional(),

    segment: portSegmentEnum.optional().default('main'),

    orderIndex: z
      .number()
      .int('Order index must be an integer')
      .min(0, 'Order index cannot be negative'),

    // Additional info
    isSeaDay: z.boolean().optional().default(false),
    isEmbarkation: z.boolean().optional().default(false),
    isDisembarkation: z.boolean().optional().default(false),

    excursions: z
      .array(
        z.object({
          name: z.string().max(255),
          description: z.string().optional(),
          price: priceSchema.optional(),
          duration: z.string().optional(),
        })
      )
      .optional(),
  })
  .refine(
    data => !data.departureTime || !data.arrivalTime || data.arrivalTime < data.departureTime,
    { message: 'Arrival time must be before departure time', path: ['departureTime'] }
  )
  .refine(
    data => !data.allAboardTime || !data.departureTime || data.allAboardTime < data.departureTime,
    { message: 'All aboard time must be before departure time', path: ['allAboardTime'] }
  );

/**
 * Update itinerary stop schema
 */
export const updateItineraryStopSchema = z.object({
  date: z
    .string()
    .refine(val => !isNaN(Date.parse(val)), 'Invalid date format')
    .transform(val => new Date(val).toISOString())
    .optional(),

  day: z
    .number()
    .int('Day must be an integer')
    .positive('Day must be positive')
    .max(365, 'Day seems unrealistic')
    .optional(),

  port_id: z.number().int().positive().optional(),
  portName: z.string().min(1).max(255).trim().optional(),
  country: z.string().max(100).trim().optional(),

  arrivalTime: timeSchema.optional(),
  departureTime: timeSchema.optional(),
  allAboardTime: timeSchema.optional(),

  portImageUrl: urlSchema.optional().or(z.literal('')),
  description: z.string().max(5000).optional(),
  highlights: z.array(z.string().max(255)).max(10).optional(),

  segment: portSegmentEnum.optional(),
  orderIndex: z.number().int().min(0).optional(),

  isSeaDay: z.boolean().optional(),
  isEmbarkation: z.boolean().optional(),
  isDisembarkation: z.boolean().optional(),

  excursions: z
    .array(
      z.object({
        name: z.string().max(255),
        description: z.string().optional(),
        price: priceSchema.optional(),
        duration: z.string().optional(),
      })
    )
    .optional(),
});

/**
 * Bulk itinerary update schema
 */
export const bulkItinerarySchema = z.object({
  cruiseId: z.number().int().positive(),

  stops: z
    .array(
      z.object({
        id: z.number().int().positive().optional(), // For updates
        date: z
          .string()
          .refine(val => !isNaN(Date.parse(val)), 'Invalid date format')
          .transform(val => new Date(val).toISOString()),
        day: z.number().int().positive().max(365),
        port_id: z.number().int().positive().optional(),
        portName: z.string().min(1).max(255).trim(),
        country: z.string().max(100).trim().optional(),
        arrivalTime: timeSchema.optional(),
        departureTime: timeSchema.optional(),
        allAboardTime: timeSchema.optional(),
        portImageUrl: urlSchema.optional().or(z.literal('')),
        description: z.string().max(5000).optional(),
        highlights: z.array(z.string().max(255)).max(10).optional(),
        segment: portSegmentEnum.optional().default('main'),
        orderIndex: z.number().int().min(0),
        isSeaDay: z.boolean().optional().default(false),
        isEmbarkation: z.boolean().optional().default(false),
        isDisembarkation: z.boolean().optional().default(false),
        excursions: z
          .array(
            z.object({
              name: z.string().max(255),
              description: z.string().optional(),
              price: priceSchema.optional(),
              duration: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .min(1, 'At least one stop is required')
    .max(100, 'Maximum 100 stops can be processed at once'),
});

// ============ CRUISE INFO SCHEMAS ============

/**
 * Create/update cruise info section schema
 */
export const cruiseInfoSectionSchema = z.object({
  cruiseId: z.number().int().positive(),

  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),

  content: z.string().max(10000, 'Content must be less than 10000 characters'),

  orderIndex: z
    .number()
    .int('Order index must be an integer')
    .min(0, 'Order index cannot be negative'),

  isVisible: z.boolean().optional().default(true),

  icon: z.string().max(50).optional(),

  metadata: z.record(z.any()).optional(),
});

// ============ EXPORT/IMPORT SCHEMAS ============

/**
 * Export format enum
 */
export const exportFormatEnum = z.enum(['json', 'csv', 'excel', 'pdf']);

/**
 * Export trip data schema
 */
export const exportTripSchema = z.object({
  format: exportFormatEnum.optional().default('json'),

  includeData: z
    .array(z.enum(['basic', 'itinerary', 'events', 'talent', 'media', 'pricing', 'bookings']))
    .optional()
    .default(['basic']),

  dateFormat: z.string().optional().default('ISO'),

  timezone: z.string().optional().default('UTC'),
});

/**
 * Import trip data schema
 */
export const importTripSchema = z.object({
  data: z.record(z.any()).or(z.string()), // JSON object or CSV/Excel string

  format: exportFormatEnum.optional(),

  options: z
    .object({
      overwrite: z.boolean().optional().default(false),
      mergeStrategy: z.enum(['replace', 'merge', 'append']).optional().default('merge'),
      validateReferences: z.boolean().optional().default(true),
      dryRun: z.boolean().optional().default(false),
    })
    .optional(),
});

export default {
  // Trip schemas
  createTripSchema,
  updateTripSchema,
  duplicateTripSchema,
  tripFilterSchema,
  tripStatusEnum,
  tripTypeEnum,

  // Event schemas
  createEventSchema,
  updateEventSchema,
  bulkEventsSchema,
  eventFilterSchema,
  eventTypeEnum,

  // Itinerary schemas
  createItineraryStopSchema,
  updateItineraryStopSchema,
  bulkItinerarySchema,
  portSegmentEnum,

  // Cruise info schemas
  cruiseInfoSectionSchema,

  // Export/Import schemas
  exportTripSchema,
  importTripSchema,
  exportFormatEnum,
};
