import { getSupabaseAdmin } from '../supabase-admin';
import { logger } from '../logging/logger';

export interface Location {
  id: number;
  name: string;
  country: string;
  coordinates?: any;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export type NewLocation = Omit<Location, 'id' | 'created_at' | 'updated_at'>;

export class LocationStorage {
  private supabaseAdmin = getSupabaseAdmin();

  /**
   * Get all locations
   */
  async getAll(): Promise<Location[]> {
    try {
      const { data, error } = await this.supabaseAdmin.from('locations').select('*').order('name');

      if (error) throw error;
      return data || [];
    } catch (error: unknown) {
      logger.error('Error fetching locations', error);
      throw new Error('Failed to fetch locations');
    }
  }

  /**
   * Get a location by ID
   */
  async getById(id: number): Promise<Location | null> {
    try {
      const { data, error } = await this.supabaseAdmin
        .from('locations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (error: unknown) {
      logger.error('Error fetching location by ID', error);
      throw new Error('Failed to fetch location');
    }
  }

  /**
   * Get a location by name
   */
  async getByName(name: string): Promise<Location | null> {
    try {
      const { data, error } = await this.supabaseAdmin
        .from('locations')
        .select('*')
        .eq('name', name)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (error: unknown) {
      logger.error('Error fetching location by name:', error);
      throw new Error('Failed to fetch location');
    }
  }

  /**
   * Search locations by name or country
   */
  async search(query: string): Promise<Location[]> {
    try {
      const { data, error } = await this.supabaseAdmin
        .from('locations')
        .select('*')
        .or(`name.ilike.%${query}%,country.ilike.%${query}%`)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error: unknown) {
      logger.error('Error searching locations:', error);
      throw new Error('Failed to search locations');
    }
  }

  /**
   * Create a new location
   */
  async create(data: NewLocation): Promise<Location> {
    try {
      // Validate required fields
      if (!data.name || !data.country) {
        throw new Error('Name and country are required');
      }

      const { data: result, error } = await this.supabaseAdmin
        .from('locations')
        .insert({
          name: data.name,
          country: data.country,
          coordinates: data.coordinates || null,
          description: data.description || null,
          image_url: data.image_url || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          throw new Error('Location with this name already exists');
        }
        throw error;
      }

      return result;
    } catch (error: any) {
      if (error.message?.includes('Location with this name already exists')) {
        throw error;
      }
      logger.error('Error creating location:', error);
      throw new Error('Failed to create location');
    }
  }

  /**
   * Update a location
   */
  async update(id: number, data: Partial<NewLocation>): Promise<Location> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Only include fields that are provided
      if (data.name !== undefined) updateData.name = data.name;
      if (data.country !== undefined) updateData.country = data.country;
      if (data.coordinates !== undefined) updateData.coordinates = data.coordinates || null;
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.image_url !== undefined) updateData.image_url = data.image_url || null;

      const { data: result, error } = await this.supabaseAdmin
        .from('locations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Location not found');
        }
        if (error.code === '23505') {
          throw new Error('Location with this name already exists');
        }
        throw error;
      }

      return result;
    } catch (error: any) {
      if (error.message?.includes('Location')) {
        throw error;
      }
      logger.error('Error updating location:', error);
      throw new Error('Failed to update location');
    }
  }

  /**
   * Delete a location
   */
  async delete(id: number): Promise<boolean> {
    try {
      // Check if location is referenced in itinerary
      const usage = await this.checkUsage(id);
      if (usage.itineraryCount > 0) {
        throw new Error(`Cannot delete location: used in ${usage.itineraryCount} itinerary items`);
      }

      const { error } = await this.supabaseAdmin.from('locations').delete().eq('id', id);

      if (error) throw error;

      return true;
    } catch (error: unknown) {
      logger.error('Error deleting location:', error);
      throw error;
    }
  }

  /**
   * Check location usage in itineraries
   */
  async checkUsage(id: number): Promise<{ itineraryCount: number }> {
    try {
      const { data, error } = await this.supabaseAdmin
        .from('itinerary')
        .select('id')
        .eq('location_id', id);

      if (error) throw error;

      return {
        itineraryCount: data?.length || 0,
      };
    } catch (error: unknown) {
      logger.error('Error checking location usage:', error);
      throw new Error('Failed to check location usage');
    }
  }

  /**
   * Get location statistics
   */
  async getStatistics(): Promise<{
    totalLocations: number;
    byCountry: Record<string, number>;
  }> {
    try {
      const { data: allLocations, error } = await this.supabaseAdmin
        .from('locations')
        .select('country');

      if (error) throw error;

      const byCountry: Record<string, number> = {};

      allLocations?.forEach(location => {
        if (location.country) {
          byCountry[location.country] = (byCountry[location.country] || 0) + 1;
        }
      });

      return {
        totalLocations: allLocations?.length || 0,
        byCountry,
      };
    } catch (error: unknown) {
      logger.error('Error getting location statistics:', error);
      throw new Error('Failed to get location statistics');
    }
  }

  /**
   * Bulk create locations (for migration)
   */
  async bulkCreate(locationsData: NewLocation[]): Promise<Location[]> {
    try {
      const { data, error } = await this.supabaseAdmin
        .from('locations')
        .insert(
          locationsData.map(loc => ({
            name: loc.name,
            country: loc.country,
            coordinates: loc.coordinates || null,
            description: loc.description || null,
            image_url: loc.image_url || null,
          }))
        )
        .select();

      if (error) throw error;

      return data || [];
    } catch (error: unknown) {
      logger.error('Error bulk creating locations:', error);
      throw new Error('Failed to bulk create locations');
    }
  }
}

// Export singleton instance (lazy-loaded to allow dotenv to load first)
let locationStorageInstance: LocationStorage | null = null;

export function getLocationStorage(): LocationStorage {
  if (!locationStorageInstance) {
    locationStorageInstance = new LocationStorage();
  }
  return locationStorageInstance;
}

// For backward compatibility, export the getter as locationStorage
// But consumers should access it via function call: getLocationStorage()
export const locationStorage = new Proxy({} as LocationStorage, {
  get(target, prop) {
    return (getLocationStorage() as any)[prop];
  },
});
