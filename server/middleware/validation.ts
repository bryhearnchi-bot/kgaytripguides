import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * Format validation errors for better user experience
 */
function formatZodError(error: ZodError): any {
  const formattedErrors: Record<string, string[]> = {};

  error.errors.forEach(err => {
    const path = err.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = [];
    }

    // Create user-friendly error messages
    let message = err.message;

    // Enhance common error messages
    if (err.code === 'invalid_type') {
      const expected = (err as any).expected;
      const received = (err as any).received;
      message = `Expected ${expected}, but received ${received}`;
    } else if (err.code === 'too_small') {
      const min = (err as any).minimum;
      const type = (err as any).type;
      if (type === 'string') {
        message = `Must be at least ${min} character${min !== 1 ? 's' : ''} long`;
      } else if (type === 'array') {
        message = `Must contain at least ${min} item${min !== 1 ? 's' : ''}`;
      } else if (type === 'number') {
        message = `Must be at least ${min}`;
      }
    } else if (err.code === 'too_big') {
      const max = (err as any).maximum;
      const type = (err as any).type;
      if (type === 'string') {
        message = `Must be at most ${max} character${max !== 1 ? 's' : ''} long`;
      } else if (type === 'array') {
        message = `Must contain at most ${max} item${max !== 1 ? 's' : ''}`;
      } else if (type === 'number') {
        message = `Must be at most ${max}`;
      }
    }

    formattedErrors[path].push(message);
  });

  return {
    error: 'Validation failed',
    message: 'Please check the following fields and try again',
    errors: formattedErrors,
    errorCount: error.errors.length
  };
}

// Validation middleware factory
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = schema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json(formatZodError(validationResult.error));
      }

      // Replace req.body with validated and transformed data
      req.body = validationResult.data;
      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      res.status(500).json({
        error: 'Internal validation error',
        message: 'An unexpected error occurred during validation'
      });
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = schema.safeParse(req.query);

      if (!validationResult.success) {
        const formatted = formatZodError(validationResult.error);
        formatted.error = 'Query parameter validation failed';
        formatted.message = 'Invalid query parameters provided';
        return res.status(400).json(formatted);
      }

      req.query = validationResult.data as any;
      next();
    } catch (error) {
      console.error('Query validation middleware error:', error);
      res.status(500).json({
        error: 'Internal validation error',
        message: 'An unexpected error occurred during query validation'
      });
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validationResult = schema.safeParse(req.params);

      if (!validationResult.success) {
        const formatted = formatZodError(validationResult.error);
        formatted.error = 'URL parameter validation failed';
        formatted.message = 'Invalid URL parameters provided';
        return res.status(400).json(formatted);
      }

      req.params = validationResult.data as any;
      next();
    } catch (error) {
      console.error('Parameter validation middleware error:', error);
      res.status(500).json({
        error: 'Internal validation error',
        message: 'An unexpected error occurred during parameter validation'
      });
    }
  };
}

/**
 * Composite validation middleware for validating multiple parts of the request
 */
export function validateRequest<TBody = any, TQuery = any, TParams = any>({
  body,
  query,
  params
}: {
  body?: ZodSchema<TBody>;
  query?: ZodSchema<TQuery>;
  params?: ZodSchema<TParams>;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: Record<string, any> = {};
      let hasErrors = false;

      // Validate body if schema provided
      if (body) {
        const result = body.safeParse(req.body);
        if (!result.success) {
          errors.body = formatZodError(result.error).errors;
          hasErrors = true;
        } else {
          req.body = result.data;
        }
      }

      // Validate query if schema provided
      if (query) {
        const result = query.safeParse(req.query);
        if (!result.success) {
          errors.query = formatZodError(result.error).errors;
          hasErrors = true;
        } else {
          req.query = result.data as any;
        }
      }

      // Validate params if schema provided
      if (params) {
        const result = params.safeParse(req.params);
        if (!result.success) {
          errors.params = formatZodError(result.error).errors;
          hasErrors = true;
        } else {
          req.params = result.data as any;
        }
      }

      if (hasErrors) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'Multiple validation errors occurred',
          errors
        });
      }

      next();
    } catch (error) {
      console.error('Request validation middleware error:', error);
      res.status(500).json({
        error: 'Internal validation error',
        message: 'An unexpected error occurred during request validation'
      });
    }
  };
}

// Re-export schemas from the organized schema files for backward compatibility
export * from '../schemas/common';
export * from '../schemas/trips';
export * from '../schemas/media';
export * from '../schemas/users';
export * from '../schemas/locations';

// Additional schemas that don't fit in other categories
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