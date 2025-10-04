import { z } from 'zod';

// Validation schemas for Trip Wizard

// Schedule entry for resort trips
export const scheduleEntrySchema = z.object({
  dayNumber: z.number(),
  date: z.string(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
});

// Itinerary entry for cruise trips
export const itineraryEntrySchema = z.object({
  dayNumber: z.number(),
  date: z.string(),
  locationId: z.number().optional(),
  locationName: z.string().optional(),
  arrivalTime: z.string().optional(),
  departureTime: z.string().optional(),
  allAboardTime: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  locationTypeId: z.number().optional(),
});

// Resort data
export const resortDataSchema = z.object({
  name: z.string().min(1, 'Resort name is required'),
  locationId: z.number(),
  capacity: z.number().positive().optional(),
  numberOfRooms: z.number().positive().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  propertyMapUrl: z.string().optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
});

// Ship data
export const shipDataSchema = z.object({
  name: z.string().min(1, 'Ship name is required'),
  cruiseLine: z.string().optional(),
  capacity: z.number().positive().optional(),
  decks: z.number().positive().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  deckPlansUrl: z.string().optional(),
});

// Complete trip wizard data
export const tripWizardSchema = z
  .object({
    // Basic trip data
    name: z.string().min(3, 'Trip name must be at least 3 characters'),
    slug: z.string().min(1, 'Slug is required'),
    charterCompanyId: z.number().positive('Charter company is required'),
    tripTypeId: z.number().positive('Trip type is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    heroImageUrl: z.string().optional(),
    description: z.string().optional(),
    highlights: z.string().optional(),

    // Resort or ship linking (can link to existing or provide data for new)
    resortId: z.number().positive().optional(),
    shipId: z.number().positive().optional(),
    resortData: resortDataSchema.optional(),
    shipData: shipDataSchema.optional(),

    // Venues and amenities
    venueIds: z.array(z.number()).default([]),
    amenityIds: z.array(z.number()).default([]),

    // Schedule or itinerary
    scheduleEntries: z.array(scheduleEntrySchema).optional(),
    itineraryEntries: z.array(itineraryEntrySchema).optional(),
  })
  .refine(
    data => {
      // Must have either resort ID/data or ship ID/data, but not both
      const hasResort = !!data.resortId || !!data.resortData;
      const hasShip = !!data.shipId || !!data.shipData;
      return (hasResort && !hasShip) || (!hasResort && hasShip);
    },
    {
      message: 'Trip must have either resort or ship information, but not both',
    }
  );

// Draft save schema (allows partial data)
export const tripDraftSchema = z.object({
  // Draft ID for updates (optional - if provided, UPDATE; if not, INSERT)
  draftId: z.number().positive().optional(),

  // Wizard state
  currentPage: z.number(),
  tripType: z.enum(['resort', 'cruise']).nullable(),
  buildMethod: z.enum(['url', 'pdf', 'manual']).nullable(),

  // All form data (all optional for drafts)
  tripData: z.object({
    name: z.string().optional().nullable(),
    slug: z.string().optional().nullable(),
    charterCompanyId: z.number().optional().nullable(),
    tripTypeId: z.number().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    heroImageUrl: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    highlights: z.string().optional().nullable(),
  }),

  // Resort or ship linking (optional for drafts)
  resortId: z.number().positive().optional().nullable(),
  shipId: z.number().positive().optional().nullable(),
  resortData: z
    .object({
      name: z.string().optional().nullable(),
      locationId: z.number().optional().nullable(),
      capacity: z.number().positive().optional().nullable(),
      numberOfRooms: z.number().positive().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      propertyMapUrl: z.string().optional().nullable(),
      checkInTime: z.string().optional().nullable(),
      checkOutTime: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  shipData: z
    .object({
      name: z.string().optional().nullable(),
      cruiseLine: z.string().optional().nullable(),
      capacity: z.number().positive().optional().nullable(),
      decks: z.number().positive().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      deckPlansUrl: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  venueIds: z.array(z.number()).default([]),
  amenityIds: z.array(z.number()).default([]),
  scheduleEntries: z.array(scheduleEntrySchema).default([]),
  itineraryEntries: z.array(itineraryEntrySchema).default([]),
  tempFiles: z.array(z.string()).default([]).optional(),
});

export type TripWizardData = z.infer<typeof tripWizardSchema>;
export type TripDraftData = z.infer<typeof tripDraftSchema>;
export type ScheduleEntry = z.infer<typeof scheduleEntrySchema>;
export type ItineraryEntry = z.infer<typeof itineraryEntrySchema>;
export type ResortData = z.infer<typeof resortDataSchema>;
export type ShipData = z.infer<typeof shipDataSchema>;
