/**
 * Media & Talent Validation Schemas
 *
 * Comprehensive validation schemas for media management, talent profiles,
 * image uploads, and content management endpoints.
 */

import { z } from 'zod';
import { idParamSchema, paginationSchema, searchSchema, sortingSchema, urlSchema, emailSchema } from './common';

// ============ TALENT SCHEMAS ============

/**
 * Talent category enum
 */
export const talentCategoryEnum = z.enum([
  'entertainer',
  'comedian',
  'singer',
  'dancer',
  'drag_queen',
  'musician',
  'host',
  'dj',
  'performer',
  'special_guest',
  'speaker',
  'instructor'
]);

/**
 * Create talent schema
 */
export const createTalentSchema = z.object({
  name: z.string()
    .min(1, 'Talent name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim(),

  category: talentCategoryEnum,

  bio: z.string()
    .max(5000, 'Bio must be less than 5000 characters')
    .optional(),

  shortBio: z.string()
    .max(500, 'Short bio must be less than 500 characters')
    .optional(),

  knownFor: z.string()
    .max(500, 'Known for must be less than 500 characters')
    .optional(),

  profileImageUrl: urlSchema.optional().or(z.literal('')),

  coverImageUrl: urlSchema.optional().or(z.literal('')),

  // Contact information
  email: emailSchema.optional(),

  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),

  agentName: z.string()
    .max(255, 'Agent name must be less than 255 characters')
    .optional(),

  agentEmail: emailSchema.optional(),

  agentPhone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
    .optional(),

  // Social media links
  socialLinks: z.object({
    website: urlSchema.optional().or(z.literal('')),
    instagram: z.string().max(255).optional(),
    facebook: z.string().max(255).optional(),
    twitter: z.string().max(255).optional(),
    tiktok: z.string().max(255).optional(),
    youtube: z.string().max(255).optional(),
    spotify: z.string().max(255).optional()
  }).optional(),

  // Performance details
  performanceTypes: z.array(
    z.enum(['comedy', 'singing', 'dancing', 'drag', 'hosting', 'djing', 'magic', 'variety'])
  ).optional(),

  languages: z.array(z.string().length(2))
    .max(10, 'Maximum 10 languages')
    .optional(),

  // Availability
  isAvailable: z.boolean().optional().default(true),

  availabilityNotes: z.string()
    .max(1000, 'Availability notes must be less than 1000 characters')
    .optional(),

  // Pricing (private field for admins)
  baseFee: z.number()
    .positive('Base fee must be positive')
    .optional(),

  currency: z.string()
    .length(3, 'Currency must be 3-letter code')
    .optional()
    .default('USD'),

  // Status
  isFeatured: z.boolean().optional().default(false),

  isVerified: z.boolean().optional().default(false),

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

  // Metadata
  metadata: z.record(z.any()).optional()
});

/**
 * Update talent schema
 */
export const updateTalentSchema = createTalentSchema.partial();

/**
 * Talent assignment schema (for cruise/event assignments)
 */
export const talentAssignmentSchema = z.object({
  talentId: z.number()
    .int('Talent ID must be an integer')
    .positive('Talent ID must be positive'),

  cruiseId: z.number()
    .int('Cruise ID must be an integer')
    .positive('Cruise ID must be positive')
    .optional(),

  eventId: z.number()
    .int('Event ID must be an integer')
    .positive('Event ID must be positive')
    .optional(),

  role: z.string()
    .max(255, 'Role must be less than 255 characters')
    .optional(),

  performanceDate: z.string()
    .datetime()
    .optional(),

  performanceTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
    .optional(),

  duration: z.number()
    .int('Duration must be in minutes')
    .positive('Duration must be positive')
    .max(480, 'Duration seems unrealistic (max 8 hours)')
    .optional(),

  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()

}).refine(
  data => data.cruiseId || data.eventId,
  { message: 'Either cruise ID or event ID must be provided' }
);

/**
 * Bulk talent assignment schema
 */
export const bulkTalentAssignSchema = z.object({
  assignments: z.array(talentAssignmentSchema)
    .min(1, 'At least one assignment is required')
    .max(50, 'Maximum 50 assignments can be processed at once')
});

/**
 * Talent filter/search schema
 */
export const talentFilterSchema = z.object({})
  .merge(paginationSchema)
  .merge(searchSchema)
  .merge(sortingSchema)
  .extend({
    category: talentCategoryEnum.optional(),

    isAvailable: z.string()
      .transform(val => val === 'true')
      .optional(),

    isFeatured: z.string()
      .transform(val => val === 'true')
      .optional(),

    isVerified: z.string()
      .transform(val => val === 'true')
      .optional(),

    cruiseId: z.string()
      .transform(Number)
      .optional(),

    performanceType: z.string().optional(),

    language: z.string().length(2).optional(),

    tags: z.string()
      .transform(val => val.split(',').map(t => t.trim()))
      .optional()
  });

// ============ IMAGE/MEDIA SCHEMAS ============

/**
 * Image type enum
 */
export const imageTypeEnum = z.enum([
  'cruise',
  'talent',
  'port',
  'party',
  'ship',
  'event',
  'venue',
  'general'
]);

/**
 * Image upload schema
 */
export const imageUploadSchema = z.object({
  type: imageTypeEnum.optional().default('general'),

  entityId: z.number()
    .int('Entity ID must be an integer')
    .positive('Entity ID must be positive')
    .optional(),

  title: z.string()
    .max(255, 'Title must be less than 255 characters')
    .optional(),

  altText: z.string()
    .max(500, 'Alt text must be less than 500 characters')
    .optional(),

  caption: z.string()
    .max(1000, 'Caption must be less than 1000 characters')
    .optional(),

  isHero: z.boolean().optional().default(false),

  orderIndex: z.number()
    .int('Order index must be an integer')
    .min(0, 'Order index cannot be negative')
    .optional(),

  tags: z.array(z.string().max(50))
    .max(10, 'Maximum 10 tags allowed')
    .optional()
});

/**
 * Image from URL schema
 */
export const imageFromUrlSchema = z.object({
  url: urlSchema,

  type: imageTypeEnum.optional().default('general'),

  entityId: z.number()
    .int('Entity ID must be an integer')
    .positive('Entity ID must be positive')
    .optional(),

  autoOptimize: z.boolean().optional().default(true),

  generateThumbnails: z.boolean().optional().default(true)
});

/**
 * Image processing schema
 */
export const imageProcessingSchema = z.object({
  imageId: z.number()
    .int('Image ID must be an integer')
    .positive('Image ID must be positive'),

  operations: z.array(z.object({
    type: z.enum(['resize', 'crop', 'rotate', 'flip', 'filter', 'watermark']),

    params: z.object({
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
      x: z.number().optional(),
      y: z.number().optional(),
      angle: z.number().min(-360).max(360).optional(),
      direction: z.enum(['horizontal', 'vertical']).optional(),
      filter: z.enum(['grayscale', 'sepia', 'blur', 'sharpen']).optional(),
      watermarkText: z.string().max(100).optional(),
      watermarkPosition: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']).optional()
    })
  })).min(1, 'At least one operation is required')
});

/**
 * Media gallery schema
 */
export const mediaGallerySchema = z.object({
  title: z.string()
    .min(1, 'Gallery title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),

  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),

  type: z.enum(['cruise', 'event', 'talent', 'general']),

  entityId: z.number()
    .int('Entity ID must be an integer')
    .positive('Entity ID must be positive')
    .optional(),

  images: z.array(z.object({
    id: z.number().int().positive().optional(), // For existing images
    url: urlSchema.optional(), // For new images
    title: z.string().max(255).optional(),
    caption: z.string().max(1000).optional(),
    orderIndex: z.number().int().min(0)
  })).min(1, 'At least one image is required')
     .max(100, 'Maximum 100 images per gallery'),

  isPublic: z.boolean().optional().default(true),

  tags: z.array(z.string().max(50))
    .max(10, 'Maximum 10 tags allowed')
    .optional()
});

// ============ PARTY TEMPLATE SCHEMAS ============

/**
 * Party template schema
 */
export const partyTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Party name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim(),

  theme: z.string()
    .min(1, 'Theme is required')
    .max(255, 'Theme must be less than 255 characters')
    .trim(),

  description: z.string()
    .max(5000, 'Description must be less than 5000 characters'),

  shortDescription: z.string()
    .max(500, 'Short description must be less than 500 characters')
    .optional(),

  heroImageUrl: urlSchema.optional().or(z.literal('')),

  thumbnailUrl: urlSchema.optional().or(z.literal('')),

  dressCode: z.string()
    .max(255, 'Dress code must be less than 255 characters')
    .optional(),

  musicGenre: z.array(z.string().max(50))
    .max(5, 'Maximum 5 music genres')
    .optional(),

  defaultDuration: z.number()
    .int('Duration must be in minutes')
    .positive('Duration must be positive')
    .max(480, 'Duration seems unrealistic (max 8 hours)')
    .optional()
    .default(180), // 3 hours default

  suggestedVenue: z.string()
    .max(255, 'Venue must be less than 255 characters')
    .optional(),

  maxCapacity: z.number()
    .int('Capacity must be an integer')
    .positive('Capacity must be positive')
    .optional(),

  requirements: z.array(z.string().max(255))
    .max(20, 'Maximum 20 requirements')
    .optional(),

  tags: z.array(z.string().max(50))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),

  isActive: z.boolean().optional().default(true),

  isPremium: z.boolean().optional().default(false),

  metadata: z.record(z.any()).optional()
});

/**
 * Party template filter schema
 */
export const partyTemplateFilterSchema = z.object({})
  .merge(paginationSchema)
  .merge(searchSchema)
  .merge(sortingSchema)
  .extend({
    theme: z.string().optional(),

    isActive: z.string()
      .transform(val => val === 'true')
      .optional(),

    isPremium: z.string()
      .transform(val => val === 'true')
      .optional(),

    musicGenre: z.string().optional(),

    tags: z.string()
      .transform(val => val.split(',').map(t => t.trim()))
      .optional()
  });

// ============ MEDIA FILTER SCHEMAS ============

/**
 * Media search/filter schema
 */
export const mediaFilterSchema = z.object({})
  .merge(paginationSchema)
  .merge(searchSchema)
  .merge(sortingSchema)
  .extend({
    type: imageTypeEnum.optional(),

    entityId: z.string()
      .transform(Number)
      .optional(),

    isHero: z.string()
      .transform(val => val === 'true')
      .optional(),

    hasCaption: z.string()
      .transform(val => val === 'true')
      .optional(),

    uploadedAfter: z.string()
      .datetime()
      .optional(),

    uploadedBefore: z.string()
      .datetime()
      .optional(),

    minSize: z.string()
      .transform(Number)
      .optional(),

    maxSize: z.string()
      .transform(Number)
      .optional(),

    tags: z.string()
      .transform(val => val.split(',').map(t => t.trim()))
      .optional()
  });

// ============ BULK OPERATIONS ============

/**
 * Bulk media operations schema
 */
export const bulkMediaOperationSchema = z.object({
  mediaIds: z.array(z.number().int().positive())
    .min(1, 'At least one media ID is required')
    .max(100, 'Maximum 100 items can be processed at once'),

  operation: z.enum([
    'delete',
    'move',
    'tag',
    'untag',
    'optimize',
    'regenerate_thumbnails'
  ]),

  params: z.object({
    targetGalleryId: z.number().int().positive().optional(),
    tags: z.array(z.string().max(50)).optional(),
    quality: z.number().min(1).max(100).optional()
  }).optional()
});

export default {
  // Talent schemas
  createTalentSchema,
  updateTalentSchema,
  talentAssignmentSchema,
  bulkTalentAssignSchema,
  talentFilterSchema,
  talentCategoryEnum,

  // Image/Media schemas
  imageUploadSchema,
  imageFromUrlSchema,
  imageProcessingSchema,
  mediaGallerySchema,
  imageTypeEnum,

  // Party template schemas
  partyTemplateSchema,
  partyTemplateFilterSchema,

  // Filter schemas
  mediaFilterSchema,

  // Bulk operations
  bulkMediaOperationSchema
};