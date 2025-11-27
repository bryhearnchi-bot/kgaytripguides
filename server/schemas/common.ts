/**
 * Common Validation Schemas
 *
 * Reusable validation schemas for common patterns across the API.
 * These schemas provide consistent validation for IDs, pagination,
 * search, filtering, and other common request patterns.
 */

import { z } from 'zod';

// ============ ID VALIDATION SCHEMAS ============

/**
 * Validates numeric ID parameters
 * Ensures ID is a positive integer
 */
export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID must be a valid number')
    .transform(Number)
    .refine(n => n > 0, 'ID must be a positive number'),
});

/**
 * Validates slug parameters
 * Ensures slug is URL-safe and properly formatted
 */
export const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255, 'Slug must be less than 255 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});

/**
 * Validates UUID parameters
 * For Supabase auth user IDs
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

// ============ PAGINATION SCHEMAS ============

/**
 * Standard pagination schema
 * Provides consistent pagination across all list endpoints
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .refine(n => n > 0, 'Page must be a positive number'),

  limit: z
    .string()
    .optional()
    .default('20')
    .transform(Number)
    .refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100'),

  offset: z
    .string()
    .optional()
    .transform(val => (val ? Number(val) : undefined))
    .refine(val => val === undefined || val >= 0, 'Offset must be non-negative'),
});

/**
 * Cursor-based pagination schema
 * For more efficient pagination of large datasets
 */
export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform(Number)
    .refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100'),
  direction: z.enum(['forward', 'backward']).optional().default('forward'),
});

// ============ SEARCH AND FILTER SCHEMAS ============

/**
 * Basic search schema
 * For simple text-based searches
 */
export const searchSchema = z.object({
  search: z
    .string()
    .optional()
    .transform(val => val?.trim())
    .refine(val => !val || val.length >= 2, 'Search term must be at least 2 characters'),

  searchFields: z.array(z.string()).optional(),
});

/**
 * Advanced search schema with operators
 */
export const advancedSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(500, 'Search query is too long'),

  operator: z.enum(['AND', 'OR', 'NOT']).optional().default('AND'),

  exact: z
    .string()
    .optional()
    .transform(val => val === 'true')
    .default('false'),
});

/**
 * Sorting schema
 * Provides consistent sorting options
 */
export const sortingSchema = z.object({
  sortBy: z
    .string()
    .optional()
    .refine(val => !val || /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(val), 'Invalid sort field'),

  sortOrder: z
    .enum(['asc', 'desc', 'ASC', 'DESC'])
    .optional()
    .transform(val => val?.toLowerCase() as 'asc' | 'desc')
    .default('asc'),
});

/**
 * Date range filter schema
 */
export const dateRangeSchema = z
  .object({
    startDate: z
      .string()
      .optional()
      .refine(val => !val || !isNaN(Date.parse(val)), 'Invalid start date format'),

    endDate: z
      .string()
      .optional()
      .refine(val => !val || !isNaN(Date.parse(val)), 'Invalid end date format'),
  })
  .refine(
    data => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    { message: 'Start date must be before or equal to end date' }
  );

/**
 * Status filter schema
 * Common status values across different entities
 */
export const statusFilterSchema = z.object({
  status: z.enum(['active', 'inactive', 'pending', 'archived', 'deleted']).optional(),

  includeArchived: z
    .string()
    .optional()
    .transform(val => val === 'true')
    .default('false'),

  includeDeleted: z
    .string()
    .optional()
    .transform(val => val === 'true')
    .default('false'),
});

// ============ DATA VALIDATION SCHEMAS ============

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .trim();

/**
 * Password validation schema
 * Enforces strong password requirements
 * Note: Uses generic error message to avoid revealing password policy to attackers
 */
const GENERIC_PASSWORD_ERROR = 'Password does not meet security requirements';
export const passwordSchema = z
  .string()
  .min(12, GENERIC_PASSWORD_ERROR)
  .max(128, GENERIC_PASSWORD_ERROR)
  .regex(/[A-Z]/, GENERIC_PASSWORD_ERROR)
  .regex(/[a-z]/, GENERIC_PASSWORD_ERROR)
  .regex(/[0-9]/, GENERIC_PASSWORD_ERROR)
  .regex(/[^A-Za-z0-9]/, GENERIC_PASSWORD_ERROR);

/**
 * URL validation schema
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL must be less than 2048 characters')
  .refine(
    val => val.startsWith('http://') || val.startsWith('https://'),
    'URL must start with http:// or https://'
  );

/**
 * Phone number validation schema
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format (E.164 format expected)');

/**
 * Coordinate validation schema
 */
export const coordinatesSchema = z.object({
  lat: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),

  lng: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
});

/**
 * Time validation schema (HH:MM format)
 */
export const timeSchema = z
  .string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format');

/**
 * Money/price validation schema
 */
export const priceSchema = z
  .number()
  .positive('Price must be positive')
  .multipleOf(0.01, 'Price must have at most 2 decimal places')
  .max(999999.99, 'Price must be less than 1,000,000');

/**
 * Percentage validation schema
 */
export const percentageSchema = z
  .number()
  .min(0, 'Percentage must be between 0 and 100')
  .max(100, 'Percentage must be between 0 and 100');

// ============ FILE VALIDATION SCHEMAS ============

/**
 * Image upload configuration schema
 */
export const imageUploadConfigSchema = z.object({
  type: z
    .enum(['cruise', 'talent', 'port', 'party', 'ship', 'general'])
    .optional()
    .default('general'),

  maxSize: z
    .number()
    .optional()
    .default(5 * 1024 * 1024), // 5MB default

  allowedTypes: z
    .array(z.string())
    .optional()
    .default(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
});

/**
 * Bulk operation schema
 */
export const bulkOperationSchema = z.object({
  ids: z
    .array(z.number().positive())
    .min(1, 'At least one ID is required')
    .max(100, 'Maximum 100 items can be processed at once'),

  operation: z.enum(['delete', 'archive', 'activate', 'deactivate']),
});

// ============ RESPONSE FORMAT SCHEMAS ============

/**
 * API response format preference
 */
export const responseFormatSchema = z.object({
  format: z.enum(['json', 'csv', 'xml']).optional().default('json'),

  fields: z.array(z.string()).optional(),

  includeMetadata: z.boolean().optional().default(false),
});

// ============ HELPER FUNCTIONS ============

/**
 * Creates a schema for enum values from an array
 */
export function createEnumSchema<T extends [string, ...string[]]>(
  values: T,
  errorMessage?: string
): z.ZodEnum<T> {
  return z.enum(values, {
    errorMap: () => ({ message: errorMessage || `Must be one of: ${values.join(', ')}` }),
  });
}

/**
 * Creates a nullable version of a schema
 */
export function nullable<T extends z.ZodTypeAny>(schema: T) {
  return schema.nullable().optional();
}

/**
 * Creates a schema for JSON fields
 */
export const jsonSchema = z.string().transform(val => {
  try {
    return JSON.parse(val);
  } catch {
    throw new Error('Invalid JSON format');
  }
});

/**
 * Creates a schema for comma-separated values
 */
export function csvSchema(itemSchema: z.ZodTypeAny) {
  return z
    .string()
    .transform(val =>
      val
        .split(',')
        .map(v => v.trim())
        .filter(Boolean)
    )
    .pipe(z.array(itemSchema));
}

// ============ COMPOSITE SCHEMAS ============

/**
 * Complete list request schema
 * Combines pagination, search, sorting, and filtering
 */
export const listRequestSchema = paginationSchema
  .merge(searchSchema)
  .merge(sortingSchema)
  .merge(statusFilterSchema)
  .extend({
    startDate: z
      .string()
      .optional()
      .refine(val => !val || !isNaN(Date.parse(val)), 'Invalid start date format'),
    endDate: z
      .string()
      .optional()
      .refine(val => !val || !isNaN(Date.parse(val)), 'Invalid end date format'),
  });

/**
 * Admin list request schema
 * Enhanced version with additional admin-specific filters
 */
export const adminListRequestSchema = listRequestSchema.extend({
  showInternal: z
    .string()
    .optional()
    .transform(val => val === 'true')
    .default('false'),

  createdBy: z.string().uuid().optional(),

  lastModifiedBy: z.string().uuid().optional(),
});

export default {
  // ID Schemas
  idParamSchema,
  slugParamSchema,
  uuidParamSchema,

  // Pagination
  paginationSchema,
  cursorPaginationSchema,

  // Search & Filter
  searchSchema,
  advancedSearchSchema,
  sortingSchema,
  dateRangeSchema,
  statusFilterSchema,

  // Data Validation
  emailSchema,
  passwordSchema,
  urlSchema,
  phoneSchema,
  coordinatesSchema,
  timeSchema,
  priceSchema,
  percentageSchema,

  // File Validation
  imageUploadConfigSchema,
  bulkOperationSchema,

  // Response Format
  responseFormatSchema,

  // Composite
  listRequestSchema,
  adminListRequestSchema,

  // Helpers
  createEnumSchema,
  nullable,
  jsonSchema,
  csvSchema,
};
