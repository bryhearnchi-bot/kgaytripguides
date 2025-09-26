import { db } from '../storage';
import * as schema from '../../shared/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { getSupabaseAdmin, handleSupabaseError, isSupabaseAdminAvailable } from '../supabase-admin';

export type TripInfoSection = InferSelectModel<typeof schema.tripInfoSections>;
export type NewTripInfoSection = InferInsertModel<typeof schema.tripInfoSections>;

export class TripInfoSectionStorage {
  /**
   * Transform snake_case DB fields to camelCase for frontend
   */
  private transformToFrontend(section: any): any {
    return {
      id: section.id,
      trip_id: section.trip_id || section.tripId,
      title: section.title,
      content: section.content,
      order_index: section.order_index || section.orderIndex,
      updated_by: section.updated_by || section.updatedBy,
      updated_at: section.updated_at || section.updatedAt,
      trip_name: section.trip_name || section.tripName || section.name // from JOIN
    };
  }

  /**
   * Transform camelCase frontend fields to snake_case for DB
   */
  private transformToDatabase(section: any): any {
    return {
      id: section.id,
      trip_id: section.trip_id || section.tripId,
      title: section.title,
      content: section.content,
      order_index: section.order_index || section.orderIndex,
      updated_by: section.updated_by || section.updatedBy,
      updated_at: section.updated_at || section.updatedAt || new Date()
    };
  }

  /**
   * Get all trip info sections with trip names
   */
  async getAll(): Promise<any[]> {
    try {
      if (!isSupabaseAdminAvailable()) {
        throw new Error('Supabase admin client not available');
      }

      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from('trip_info_sections')
        .select(`
          id,
          trip_id,
          title,
          content,
          order_index,
          updated_by,
          updated_at,
          trips:trip_id (
            name
          )
        `)
        .order('trip_id', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) {
        throw handleSupabaseError(error);
      }

      return (data || []).map(section => {
        const transformed = this.transformToFrontend(section);
        // Extract trip name from the join
        transformed.trip_name = section.trips?.name || `Trip #${section.trip_id}`;
        return transformed;
      });
    } catch (error) {
      console.error('Error fetching trip info sections:', error);
      throw new Error('Failed to fetch trip info sections');
    }
  }

  /**
   * Get trip info sections for a specific trip
   */
  async getByTripId(tripId: number): Promise<any[]> {
    try {
      if (!isSupabaseAdminAvailable()) {
        throw new Error('Supabase admin client not available');
      }

      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from('trip_info_sections')
        .select(`
          id,
          trip_id,
          title,
          content,
          order_index,
          updated_by,
          updated_at,
          trips:trip_id (
            name
          )
        `)
        .eq('trip_id', tripId)
        .order('order_index', { ascending: true });

      if (error) {
        throw handleSupabaseError(error);
      }

      return (data || []).map(section => {
        const transformed = this.transformToFrontend(section);
        transformed.trip_name = section.trips?.name || `Trip #${section.trip_id}`;
        return transformed;
      });
    } catch (error) {
      console.error('Error fetching trip info sections for trip:', tripId, error);
      throw new Error('Failed to fetch trip info sections');
    }
  }

  /**
   * Create a new trip info section
   */
  async create(sectionData: any): Promise<any> {
    try {
      if (!isSupabaseAdminAvailable()) {
        throw new Error('Supabase admin client not available');
      }

      const supabase = getSupabaseAdmin();
      const transformedData = this.transformToDatabase(sectionData);

      const { data, error } = await supabase
        .from('trip_info_sections')
        .insert(transformedData)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      return this.transformToFrontend(data);
    } catch (error) {
      console.error('Error creating trip info section:', error);
      throw new Error('Failed to create trip info section');
    }
  }

  /**
   * Update a trip info section
   */
  async update(id: number, sectionData: any): Promise<any> {
    try {
      if (!isSupabaseAdminAvailable()) {
        throw new Error('Supabase admin client not available');
      }

      const supabase = getSupabaseAdmin();
      const transformedData = this.transformToDatabase(sectionData);
      delete transformedData.id; // Don't update the ID

      const { data, error } = await supabase
        .from('trip_info_sections')
        .update(transformedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error);
      }

      return this.transformToFrontend(data);
    } catch (error) {
      console.error('Error updating trip info section:', error);
      throw new Error('Failed to update trip info section');
    }
  }

  /**
   * Delete a trip info section
   */
  async delete(id: number): Promise<void> {
    try {
      if (!isSupabaseAdminAvailable()) {
        throw new Error('Supabase admin client not available');
      }

      const supabase = getSupabaseAdmin();

      const { error } = await supabase
        .from('trip_info_sections')
        .delete()
        .eq('id', id);

      if (error) {
        throw handleSupabaseError(error);
      }
    } catch (error) {
      console.error('Error deleting trip info section:', error);
      throw new Error('Failed to delete trip info section');
    }
  }

  /**
   * Get a single trip info section by ID
   */
  async getById(id: number): Promise<any | null> {
    try {
      if (!isSupabaseAdminAvailable()) {
        throw new Error('Supabase admin client not available');
      }

      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from('trip_info_sections')
        .select(`
          id,
          trip_id,
          title,
          content,
          order_index,
          updated_by,
          updated_at,
          trips:trip_id (
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw handleSupabaseError(error);
      }

      const transformed = this.transformToFrontend(data);
      transformed.trip_name = data.trips?.name || `Trip #${data.trip_id}`;
      return transformed;
    } catch (error) {
      console.error('Error fetching trip info section:', error);
      throw new Error('Failed to fetch trip info section');
    }
  }
}

// Export singleton instance
export const tripInfoSectionStorage = new TripInfoSectionStorage();