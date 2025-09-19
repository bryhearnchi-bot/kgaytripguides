import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

// Validation middleware factory
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = schema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }

      // Replace req.body with validated and transformed data
      req.body = validationResult.data;
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(500).json({ error: 'Internal validation error' });
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = schema.safeParse(req.query);

      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Query validation failed',
          details: validationResult.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }

      req.query = validationResult.data as any;
      next();
    } catch (error) {
      console.error('Query validation middleware error:', error);
      res.status(500).json({ error: 'Internal validation error' });
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = schema.safeParse(req.params);

      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Parameter validation failed',
          details: validationResult.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }

      req.params = validationResult.data as any;
      next();
    } catch (error) {
      console.error('Parameter validation middleware error:', error);
      res.status(500).json({ error: 'Internal validation error' });
    }
  };
}

// Common validation schemas
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number)
});

export const slugParamSchema = z.object({
  slug: z.string().min(1, 'Slug is required')
});

export const paginationSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  offset: z.string().optional().transform(val => val ? Number(val) : undefined)
});

export const searchSchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
});

// Trip/Cruise validation schemas
export const createTripSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().min(1, 'Slug is required').max(255),
  shipName: z.string().min(1, 'Ship name is required'),
  cruiseLine: z.string().optional(),
  shipId: z.number().int().positive().optional(),
  tripType: z.string().default('cruise'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  status: z.enum(['upcoming', 'ongoing', 'past']).optional().default('upcoming'),
  heroImageUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  includesInfo: z.record(z.any()).optional(),
  pricing: z.record(z.any()).optional()
});

export const updateTripSchema = createTripSchema.partial();

// Event validation schemas
export const createEventSchema = z.object({
  cruiseId: z.number().int().positive(),
  date: z.string().datetime('Invalid date format'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  title: z.string().min(1, 'Title is required').max(255),
  type: z.enum(['party', 'show', 'dining', 'lounge', 'fun', 'club', 'after']),
  venue: z.string().min(1, 'Venue is required').max(255),
  deck: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  themeDescription: z.string().optional(),
  dressCode: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  requiresReservation: z.boolean().optional().default(false),
  talentIds: z.array(z.number().int().positive()).optional(),
  party_id: z.number().int().positive().optional()
});

export const updateEventSchema = createEventSchema.partial().omit({ cruiseId: true });

export const bulkEventsSchema = z.object({
  events: z.array(createEventSchema).min(1, 'At least one event is required')
});

// Talent validation schemas
export const createTalentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: z.string().min(1, 'Category is required').max(100),
  bio: z.string().optional(),
  knownFor: z.string().optional(),
  profileImageUrl: z.string().url().optional().or(z.literal('')),
  socialLinks: z.record(z.string().url()).optional(),
  website: z.string().url().optional().or(z.literal(''))
});

export const updateTalentSchema = createTalentSchema.partial();

export const bulkTalentAssignSchema = z.object({
  assignments: z.array(z.object({
    cruiseId: z.number().int().positive(),
    talentId: z.number().int().positive(),
    role: z.string().optional()
  })).min(1, 'At least one assignment is required')
});

// Itinerary validation schemas
export const createItineraryStopSchema = z.object({
  cruiseId: z.number().int().positive(),
  date: z.string().datetime('Invalid date format'),
  day: z.number().int().positive(),
  portName: z.string().min(1, 'Port name is required').max(255),
  country: z.string().optional(),
  arrivalTime: z.string().optional(),
  departureTime: z.string().optional(),
  allAboardTime: z.string().optional(),
  portImageUrl: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  orderIndex: z.number().int(),
  segment: z.enum(['pre', 'main', 'post']).optional().default('main'),
  port_id: z.number().int().positive().optional()
});

export const updateItineraryStopSchema = createItineraryStopSchema.partial().omit({ cruiseId: true });

// Ship validation schemas
export const createShipSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  cruiseLine: z.string().min(1, 'Cruise line is required').max(255),
  shipCode: z.string().max(50).optional(),
  capacity: z.number().int().positive().optional(),
  crewSize: z.number().int().positive().optional(),
  grossTonnage: z.number().int().positive().optional(),
  lengthMeters: z.number().positive().optional(),
  beamMeters: z.number().positive().optional(),
  decks: z.number().int().positive().optional(),
  builtYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  refurbishedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  shipClass: z.string().max(100).optional(),
  flag: z.string().max(100).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  deckPlans: z.array(z.any()).optional(),
  amenities: z.record(z.any()).optional(),
  diningVenues: z.record(z.any()).optional(),
  entertainmentVenues: z.record(z.any()).optional(),
  stateroomCategories: z.record(z.any()).optional(),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional()
});

export const updateShipSchema = createShipSchema.partial();

// Port validation schemas
export const createPortSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  country: z.string().min(1, 'Country is required').max(100),
  region: z.string().max(100).optional(),
  port_type: z.enum(['port', 'sea_day', 'embark', 'disembark']).optional().default('port'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional(),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal(''))
});

export const updatePortSchema = createPortSchema.partial();

// Settings validation schemas
export const createSettingSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  key: z.string().min(1, 'Key is required'),
  label: z.string().min(1, 'Label is required'),
  value: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  orderIndex: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true)
});

export const updateSettingSchema = createSettingSchema.partial().omit({ category: true, key: true });

// Global search schema
export const globalSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  types: z.array(z.enum(['trips', 'events', 'talent', 'ports', 'ships'])).optional(),
  limit: z.number().int().positive().max(100).optional().default(20)
});

// Export/import schemas
export const exportTripSchema = z.object({
  format: z.enum(['json', 'csv', 'excel']).optional().default('json'),
  includeData: z.array(z.enum(['itinerary', 'events', 'talent', 'media'])).optional()
});

export const importTripSchema = z.object({
  data: z.record(z.any()),
  options: z.object({
    overwrite: z.boolean().optional().default(false),
    mergeStrategy: z.enum(['replace', 'merge', 'append']).optional().default('merge')
  }).optional()
});

// Admin dashboard stats schema
export const dashboardStatsSchema = z.object({
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional()
  }).optional(),
  metrics: z.array(z.enum(['trips', 'events', 'talent', 'users', 'revenue'])).optional()
});

// System health schema
export const systemHealthSchema = z.object({
  includeDetails: z.boolean().optional().default(false),
  checkServices: z.array(z.enum(['database', 'storage', 'cache', 'external'])).optional()
});