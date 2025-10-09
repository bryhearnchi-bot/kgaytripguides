/**
 * Event Types Management Routes
 *
 * Provides read-only access to event types
 * Event types are managed through database migrations
 */

import type { Express, Response } from 'express';
import { requireTripAdmin, type AuthenticatedRequest } from '../../auth';
import { logger } from '../../logging/logger';
import { asyncHandler } from '../../middleware/errorHandler';
import { ApiError } from '../../utils/ApiError';
import { getSupabaseAdmin } from '../../supabase-admin';

// Transform snake_case to camelCase for API responses
function transformEventTypeData(eventType: any): any {
  if (!eventType) return null;

  return {
    id: eventType.id,
    name: eventType.name,
    description: eventType.description,
    icon: eventType.icon,
    color: eventType.color,
    displayOrder: eventType.display_order,
    isActive: eventType.is_active,
    createdAt: eventType.created_at,
    updatedAt: eventType.updated_at,
  };
}

export function registerEventTypeRoutes(app: Express) {
  // Get all event types
  app.get(
    '/api/admin/event-types',
    requireTripAdmin,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      try {
        const supabaseAdmin = await getSupabaseAdmin();

        const { data: eventTypes, error } = await supabaseAdmin
          .from('event_types')
          .select('*')
          .eq('is_active', true)
          .order('display_order')
          .order('name');

        if (error) {
          logger.error('Error fetching event types', { error });
          throw ApiError.internal('Failed to fetch event types');
        }

        const transformedEventTypes = eventTypes?.map(transformEventTypeData) || [];
        return res.json(transformedEventTypes);
      } catch (error: any) {
        if (error.status) throw error;
        logger.error('Error fetching event types', { error });
        throw ApiError.internal('Failed to fetch event types');
      }
    })
  );
}
