/**
 * Trip Service Layer
 *
 * Provides business logic for trip operations separated from route handlers.
 * Handles complex operations like duplication, export/import, statistics, and status management.
 *
 * Features:
 * - Trip duplication with related data
 * - Export/import functionality (JSON and CSV)
 * - Admin statistics and analytics
 * - Status management workflow
 * - Proper error handling and logging
 */

import { logger } from '../logging/logger';
import { ApiError } from '../utils/ApiError';
import {
  executeDbOperation,
  validateRequiredFields,
  validateId,
  ensureResourceExists,
  getPaginationParams,
  buildPaginatedResponse,
  type PaginationParams,
  type PaginatedResponse
} from '../utils/errorUtils';
import {
  tripStorage,
  itineraryStorage,
  eventStorage,
  tripInfoStorage
} from '../storage';
import { getSupabaseAdmin } from '../supabase-admin';
import type { Trip, Itinerary, Event } from '../../shared/supabase-types';

/**
 * Interface for trip export data
 */
export interface TripExportData {
  trip: Trip;
  itinerary?: Itinerary[];
  events?: Event[];
  tripInfoSections?: any[];
}

/**
 * Interface for trip import data
 */
export interface TripImportData {
  trip: Partial<Trip>;
  itinerary?: Partial<Itinerary>[];
  events?: Partial<Event>[];
  tripInfoSections?: any[];
}

/**
 * Interface for trip statistics
 */
export interface TripStatistics {
  total: number;
  published: number;
  draft: number;
  archived: number;
  upcoming: number;
  ongoing: number;
  past: number;
  totalCapacity: number;
  totalBookings: number;
  avgOccupancy: number;
}

/**
 * Interface for admin trip filters
 */
export interface AdminTripFilters {
  search?: string;
  status?: 'draft' | 'published' | 'archived';
  startDate?: string;
  endDate?: string;
  tripType?: string;
}

/**
 * Trip Service Class
 * Encapsulates all business logic for trip operations
 */
export class TripService {
  private logger = logger.child({ service: 'TripService' });

  /**
   * Duplicate a trip with all related data
   *
   * @param tripId - The ID of the trip to duplicate
   * @param newName - The name for the duplicated trip
   * @param newSlug - The slug for the duplicated trip
   * @param userId - The ID of the user performing the duplication
   * @returns The duplicated trip
   */
  async duplicateTrip(
    tripId: number,
    newName: string,
    newSlug: string,
    userId?: string
  ): Promise<Trip> {
    this.logger.info('Duplicating trip', { tripId, newName, newSlug, userId });

    try {
      // Validate input
      validateRequiredFields({ newName, newSlug }, ['newName', 'newSlug']);

      // Get the original trip
      const originalTrip = await executeDbOperation(
        () => tripStorage.getTripById(tripId),
        'Failed to retrieve trip for duplication'
      );

      ensureResourceExists(originalTrip, 'Trip');

      // Check if slug is already taken
      const existingTrip = await executeDbOperation(
        () => tripStorage.getTripBySlug(newSlug),
        'Failed to check for existing slug'
      );

      if (existingTrip) {
        throw ApiError.conflict(`Trip with slug '${newSlug}' already exists`);
      }

      // originalTrip is guaranteed to be non-null here due to ensureResourceExists
      // Create a copy of the trip
      const newTrip = {
        ...originalTrip!,
        id: undefined,
        name: newName,
        slug: newSlug,
        status: 'draft', // Always start as draft
        created_at: new Date(),
        updated_at: new Date(),
        created_by: userId
      };

      // Save the new trip
      const duplicatedTrip = await executeDbOperation(
        () => tripStorage.createTrip(newTrip as any),
        'Failed to create duplicated trip'
      );

      // Copy related data in parallel
      await Promise.all([
        this.duplicateItinerary(tripId, duplicatedTrip.id),
        this.duplicateEvents(tripId, duplicatedTrip.id),
        this.duplicateTripInfoSections(tripId, duplicatedTrip.id)
      ]);

      this.logger.info('Trip duplicated successfully', {
        originalTripId: tripId,
        newTripId: duplicatedTrip.id,
        newSlug
      });

      // Audit log
      this.logger.audit('TRIP_DUPLICATED', {
        originalTripId: tripId,
        newTripId: duplicatedTrip.id,
        newName,
        newSlug,
        userId
      });

      return duplicatedTrip;

    } catch (error) {
      this.logger.error('Failed to duplicate trip', error as Error, { tripId, newName, newSlug });
      throw error;
    }
  }

  /**
   * Duplicate itinerary for a trip
   */
  private async duplicateItinerary(originalTripId: number, newTripId: number): Promise<void> {
    try {
      const itinerary = await executeDbOperation(
        () => itineraryStorage.getItineraryByTrip(originalTripId),
        'Failed to retrieve itinerary for duplication'
      );

      if (itinerary.length > 0) {
        const itineraryToCopy = itinerary.map((item: any) => ({
          ...item,
          id: undefined,
          trip_id: newTripId,
          created_at: new Date(),
          updated_at: new Date()
        }));

        await executeDbOperation(
          () => itineraryStorage.bulkCreateItineraryStops(itineraryToCopy),
          'Failed to duplicate itinerary'
        );

        this.logger.debug('Itinerary duplicated', {
          originalTripId,
          newTripId,
          itemCount: itinerary.length
        });
      }
    } catch (error) {
      this.logger.error('Failed to duplicate itinerary', error as Error, { originalTripId, newTripId });
      // Don't throw - allow trip duplication to succeed even if itinerary fails
    }
  }

  /**
   * Duplicate events for a trip
   */
  private async duplicateEvents(originalTripId: number, newTripId: number): Promise<void> {
    try {
      const events = await executeDbOperation(
        () => eventStorage.getEventsByTrip(originalTripId),
        'Failed to retrieve events for duplication'
      );

      if (events.length > 0) {
        const eventsToCopy = events.map((event: any) => ({
          ...event,
          id: undefined,
          trip_id: newTripId,
          created_at: new Date(),
          updated_at: new Date()
        }));

        await executeDbOperation(
          () => eventStorage.bulkCreateEvents(eventsToCopy),
          'Failed to duplicate events'
        );

        this.logger.debug('Events duplicated', {
          originalTripId,
          newTripId,
          eventCount: events.length
        });
      }
    } catch (error) {
      this.logger.error('Failed to duplicate events', error as Error, { originalTripId, newTripId });
      // Don't throw - allow trip duplication to succeed even if events fail
    }
  }

  /**
   * Duplicate trip info sections
   */
  private async duplicateTripInfoSections(originalTripId: number, newTripId: number): Promise<void> {
    try {
      const sections = await executeDbOperation(
        () => tripInfoStorage.getTripSections(originalTripId),
        'Failed to retrieve trip sections for duplication'
      );

      if (sections.length > 0) {
        // Create assignments for the new trip
        for (const section of sections) {
          await executeDbOperation(
            () => tripInfoStorage.assignSectionToTrip(
              newTripId,
              section.id,
              section.assignment.orderIndex
            ),
            'Failed to assign section to duplicated trip'
          );
        }

        this.logger.debug('Trip info sections duplicated', {
          originalTripId,
          newTripId,
          sectionCount: sections.length
        });
      }
    } catch (error) {
      this.logger.error('Failed to duplicate trip info sections', error as Error, { originalTripId, newTripId });
      // Don't throw - allow trip duplication to succeed even if sections fail
    }
  }

  /**
   * Export trip data in specified format
   *
   * @param tripId - The ID of the trip to export
   * @param format - The export format (json or csv)
   * @param includeRelated - Whether to include related data
   * @returns The exported trip data
   */
  async exportTrip(
    tripId: number,
    format: 'json' | 'csv' = 'json',
    includeRelated = true
  ): Promise<TripExportData | string> {
    this.logger.info('Exporting trip', { tripId, format, includeRelated });

    try {
      // Get trip data
      const trip = await executeDbOperation(
        () => tripStorage.getTripById(tripId),
        'Failed to retrieve trip for export'
      );

      ensureResourceExists(trip, 'Trip');

      // trip is guaranteed to be non-null here due to ensureResourceExists
      const exportData: TripExportData = { trip: trip! };

      // Include related data if requested
      if (includeRelated) {
        const [itinerary, events, tripInfoSections] = await Promise.all([
          executeDbOperation(
            () => itineraryStorage.getItineraryByTrip(tripId),
            'Failed to retrieve itinerary for export'
          ),
          executeDbOperation(
            () => eventStorage.getEventsByTrip(tripId),
            'Failed to retrieve events for export'
          ),
          executeDbOperation(
            () => tripInfoStorage.getTripSections(tripId),
            'Failed to retrieve trip info sections for export'
          )
        ]);

        exportData.itinerary = itinerary;
        exportData.events = events;
        exportData.tripInfoSections = tripInfoSections;
      }

      // Convert to CSV if requested
      if (format === 'csv') {
        return this.convertToCSV(exportData);
      }

      this.logger.info('Trip exported successfully', { tripId, format });

      return exportData;

    } catch (error) {
      this.logger.error('Failed to export trip', error as Error, { tripId, format });
      throw error;
    }
  }

  /**
   * Convert trip data to CSV format
   */
  private convertToCSV(data: TripExportData): string {
    // For now, return a simple implementation
    // In production, you'd use a proper CSV library like csv-stringify
    const lines: string[] = [];

    // Trip headers and data
    lines.push('Trip Information');
    lines.push('ID,Name,Slug,Status,Start Date,End Date,Ship Name,Cruise Line');
    const trip = data.trip;
    lines.push(`${trip.id},"${trip.name}","${trip.slug}","${trip.status}","${trip.start_date}","${trip.end_date}","${trip.ship_name || ''}","${trip.cruise_line || ''}"`);
    lines.push('');

    // Itinerary data
    if (data.itinerary && data.itinerary.length > 0) {
      lines.push('Itinerary');
      lines.push('Day,Date,Location,Arrival,Departure');
      data.itinerary.forEach(item => {
        lines.push(`${item.day},"${item.date || ''}","${item.location_name || ''}","${item.arrival_time || ''}","${item.departure_time || ''}"`);
      });
      lines.push('');
    }

    // Events data
    if (data.events && data.events.length > 0) {
      lines.push('Events');
      lines.push('Date,Time,Title,Type,Venue');
      data.events.forEach(event => {
        lines.push(`"${event.date || ''}","${event.time || ''}","${event.title}","${event.type || ''}","${event.venue || ''}"`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Import trip data from specified format
   *
   * @param data - The trip data to import
   * @param format - The import format (json or csv)
   * @param overwrite - Whether to overwrite existing trip with same slug
   * @param userId - The ID of the user performing the import
   * @returns The imported trip
   */
  async importTrip(
    data: TripImportData,
    format: 'json' | 'csv' = 'json',
    overwrite = false,
    userId?: string
  ): Promise<Trip> {
    this.logger.info('Importing trip', { format, overwrite, userId });

    try {
      // Currently only support JSON
      if (format !== 'json') {
        throw ApiError.badRequest('Only JSON format is currently supported for import');
      }

      const { trip: tripData, itinerary, events, tripInfoSections } = data;

      if (!tripData || !tripData.slug) {
        throw ApiError.validationError('Trip data with slug is required');
      }

      // Check if trip with same slug exists
      const existingTrip = await executeDbOperation(
        () => tripStorage.getTripBySlug(tripData.slug!),
        'Failed to check for existing trip'
      );

      if (existingTrip && !overwrite) {
        throw ApiError.conflict(`Trip with slug '${tripData.slug}' already exists`);
      }

      let importedTrip: Trip;

      // Import or update the trip
      if (existingTrip && overwrite) {
        // Update existing trip
        importedTrip = await executeDbOperation(
          () => tripStorage.updateTrip(existingTrip.id, {
            ...tripData,
            updated_at: new Date(),
            updated_by: userId
          }),
          'Failed to update existing trip'
        );

        // Clear existing related data before importing new
        await this.clearTripRelatedData(existingTrip.id);

        this.logger.info('Existing trip updated for import', {
          tripId: existingTrip.id,
          slug: tripData.slug
        });
      } else {
        // Create new trip
        importedTrip = await executeDbOperation(
          () => tripStorage.createTrip({
            ...tripData,
            created_at: new Date(),
            updated_at: new Date(),
            created_by: userId
          }),
          'Failed to create imported trip'
        );

        this.logger.info('New trip created from import', {
          tripId: importedTrip.id,
          slug: tripData.slug
        });
      }

      // Import related data
      await this.importRelatedData(importedTrip.id, { itinerary, events, tripInfoSections });

      // Audit log
      this.logger.audit('TRIP_IMPORTED', {
        tripId: importedTrip.id,
        slug: tripData.slug,
        overwrite,
        userId
      });

      return importedTrip;

    } catch (error) {
      this.logger.error('Failed to import trip', error as Error, { format, overwrite });
      throw error;
    }
  }

  /**
   * Clear existing related data for a trip
   */
  private async clearTripRelatedData(tripId: number): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin();

    try {
      await Promise.all([
        // Clear itinerary
        supabaseAdmin
          .from('itinerary')
          .delete()
          .eq('trip_id', tripId),

        // Clear events
        supabaseAdmin
          .from('events')
          .delete()
          .eq('trip_id', tripId),

        // Clear trip section assignments
        supabaseAdmin
          .from('trip_section_assignments')
          .delete()
          .eq('trip_id', tripId)
      ]);

      this.logger.debug('Cleared related data for trip', { tripId });
    } catch (error) {
      this.logger.error('Failed to clear trip related data', error as Error, { tripId });
      throw ApiError.databaseError('Failed to clear existing trip data');
    }
  }

  /**
   * Import related data for a trip
   */
  private async importRelatedData(
    tripId: number,
    data: Pick<TripImportData, 'itinerary' | 'events' | 'tripInfoSections'>
  ): Promise<void> {
    const { itinerary, events, tripInfoSections } = data;

    // Import itinerary
    if (itinerary && itinerary.length > 0) {
      const itineraryToImport = itinerary.map((item: any) => ({
        ...item,
        id: undefined,
        trip_id: tripId,
        created_at: new Date(),
        updated_at: new Date()
      }));

      await executeDbOperation(
        () => itineraryStorage.bulkCreateItineraryStops(itineraryToImport),
        'Failed to import itinerary'
      );

      this.logger.debug('Itinerary imported', { tripId, itemCount: itinerary.length });
    }

    // Import events
    if (events && events.length > 0) {
      const eventsToImport = events.map((event: any) => ({
        ...event,
        id: undefined,
        trip_id: tripId,
        created_at: new Date(),
        updated_at: new Date()
      }));

      await executeDbOperation(
        () => eventStorage.bulkCreateEvents(eventsToImport),
        'Failed to import events'
      );

      this.logger.debug('Events imported', { tripId, eventCount: events.length });
    }

    // Note: Trip info sections would need special handling as they're shared
    // For now, we skip them in import
    if (tripInfoSections && tripInfoSections.length > 0) {
      this.logger.warn('Trip info sections import not yet implemented', {
        tripId,
        sectionCount: tripInfoSections.length
      });
    }
  }

  /**
   * Get trip statistics for admin dashboard
   *
   * @returns Trip statistics
   */
  async getTripStats(): Promise<TripStatistics> {
    this.logger.info('Fetching trip statistics');

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: trips, error } = await supabaseAdmin
        .from('trips')
        .select('status, start_date, end_date, max_capacity, current_bookings');

      if (error) {
        throw ApiError.databaseError('Failed to fetch trip statistics', error);
      }

      const now = new Date();
      const stats: TripStatistics = {
        total: trips?.length || 0,
        published: 0,
        draft: 0,
        archived: 0,
        upcoming: 0,
        ongoing: 0,
        past: 0,
        totalCapacity: 0,
        totalBookings: 0,
        avgOccupancy: 0
      };

      if (!trips || trips.length === 0) {
        return stats;
      }

      // Calculate statistics
      let occupancySum = 0;
      let tripsWithCapacity = 0;

      trips.forEach(trip => {
        // Status counts
        if (trip.status === 'published') stats.published++;
        else if (trip.status === 'draft') stats.draft++;
        else if (trip.status === 'archived') stats.archived++;

        // Date-based counts (only for published trips)
        if (trip.status === 'published') {
          const startDate = new Date(trip.start_date);
          const endDate = new Date(trip.end_date);

          if (startDate > now) {
            stats.upcoming++;
          } else if (startDate <= now && endDate >= now) {
            stats.ongoing++;
          } else if (endDate < now) {
            stats.past++;
          }
        }

        // Capacity and bookings
        const capacity = trip.max_capacity || 0;
        const bookings = trip.current_bookings || 0;

        stats.totalCapacity += capacity;
        stats.totalBookings += bookings;

        if (capacity > 0) {
          occupancySum += (bookings / capacity * 100);
          tripsWithCapacity++;
        }
      });

      // Calculate average occupancy
      if (tripsWithCapacity > 0) {
        stats.avgOccupancy = Math.round(occupancySum / tripsWithCapacity * 100) / 100;
      }

      this.logger.info('Trip statistics fetched', stats);

      return stats;

    } catch (error) {
      this.logger.error('Failed to fetch trip statistics', error as Error);
      throw error;
    }
  }

  /**
   * Get paginated trips for admin with filters
   *
   * @param filters - Filter criteria
   * @param pagination - Pagination parameters
   * @returns Paginated trip results
   */
  async getAdminTrips(
    filters: AdminTripFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Trip>> {
    this.logger.info('Fetching admin trips', { filters, pagination });

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { offset, limit } = pagination;

      // Build query
      let query = supabaseAdmin
        .from('trips')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.startDate) {
        query = query.gte('start_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('end_date', filters.endDate);
      }

      if (filters.tripType) {
        query = query.eq('trip_type', filters.tripType);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: results, error, count } = await query;

      if (error) {
        throw ApiError.databaseError('Failed to fetch admin trips', error);
      }

      // Transform results
      const trips = (results || []).map(trip => tripStorage.transformTripData(trip));

      const response = buildPaginatedResponse(trips, count || 0, pagination);

      this.logger.info('Admin trips fetched', {
        total: count,
        page: pagination.page,
        limit: pagination.limit
      });

      return response;

    } catch (error) {
      this.logger.error('Failed to fetch admin trips', error as Error, { filters, pagination });
      throw error;
    }
  }

  /**
   * Update trip status with workflow validation
   *
   * @param tripId - The ID of the trip to update
   * @param status - The new status
   * @param userId - The ID of the user making the change
   * @returns The updated trip
   */
  async updateTripStatus(
    tripId: number,
    status: 'draft' | 'published' | 'archived',
    userId?: string
  ): Promise<Trip> {
    this.logger.info('Updating trip status', { tripId, status, userId });

    try {
      // Validate status value
      const validStatuses = ['draft', 'published', 'archived'];
      if (!validStatuses.includes(status)) {
        throw ApiError.validationError('Invalid status value', {
          validStatuses,
          providedStatus: status
        });
      }

      // Get current trip
      const currentTrip = await executeDbOperation(
        () => tripStorage.getTripById(tripId),
        'Failed to retrieve trip'
      );

      ensureResourceExists(currentTrip, 'Trip');

      // currentTrip is guaranteed to be non-null here due to ensureResourceExists
      const currentStatus = currentTrip!.status || 'draft';

      // Validate status transition
      this.validateStatusTransition(currentStatus, status);

      // Additional validation for publishing
      if (status === 'published') {
        await this.validateTripForPublishing(tripId);
      }

      // Update the status
      const updatedTrip = await executeDbOperation(
        () => tripStorage.updateTrip(tripId, {
          status,
          updated_at: new Date(),
          updated_by: userId
        }),
        'Failed to update trip status'
      );

      // Audit log
      this.logger.audit('TRIP_STATUS_UPDATED', {
        tripId,
        oldStatus: currentStatus,
        newStatus: status,
        userId
      });

      this.logger.info('Trip status updated', {
        tripId,
        oldStatus: currentStatus,
        newStatus: status
      });

      return updatedTrip;

    } catch (error) {
      this.logger.error('Failed to update trip status', error as Error, { tripId, status });
      throw error;
    }
  }

  /**
   * Validate status transition rules
   */
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    // Define allowed transitions
    const allowedTransitions: Record<string, string[]> = {
      'draft': ['published', 'archived'],
      'published': ['draft', 'archived'],
      'archived': ['draft']
    };

    const allowed = allowedTransitions[currentStatus] || [];

    if (currentStatus === newStatus) {
      throw ApiError.badRequest('Trip is already in this status');
    }

    if (!allowed.includes(newStatus)) {
      throw ApiError.businessRuleViolation(
        `Cannot transition from '${currentStatus}' to '${newStatus}'`,
        { currentStatus, newStatus, allowedTransitions: allowed }
      );
    }
  }

  /**
   * Validate trip is ready for publishing
   */
  private async validateTripForPublishing(tripId: number): Promise<void> {
    const errors: string[] = [];

    // Check required fields
    const trip = await tripStorage.getTripById(tripId);
    if (!trip) {
      errors.push('Trip not found');
    } else {
      if (!trip.name) errors.push('Trip name is required');
      if (!trip.slug) errors.push('Trip slug is required');
      if (!trip.start_date) errors.push('Start date is required');
      if (!trip.end_date) errors.push('End date is required');
      if (!trip.description) errors.push('Description is required');
    }

    // Check for itinerary
    const itinerary = await itineraryStorage.getItineraryByTrip(tripId);
    if (!itinerary || itinerary.length === 0) {
      errors.push('At least one itinerary item is required');
    }

    if (errors.length > 0) {
      throw ApiError.validationError('Trip is not ready for publishing', { errors });
    }
  }

  /**
   * Business rule violation error helper
   */
  private businessRuleViolation(message: string, details?: any): ApiError {
    return new ApiError(422, message, {
      code: 'BUSINESS_RULE_VIOLATION' as any,
      details
    });
  }
}

// Export singleton instance
export const tripService = new TripService();