import { db } from '../storage';
import * as schema from '../../shared/schema';
import { eq, like, or, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type Location = InferSelectModel<typeof schema.locations>;
export type NewLocation = InferInsertModel<typeof schema.locations>;

export class LocationStorage {
  /**
   * Get all locations
   */
  async getAll(): Promise<Location[]> {
    try {
      return await db.select().from(schema.locations).orderBy(schema.locations.name);
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw new Error('Failed to fetch locations');
    }
  }

  /**
   * Get a location by ID
   */
  async getById(id: number): Promise<Location | null> {
    try {
      const result = await db.select()
        .from(schema.locations)
        .where(eq(schema.locations.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching location by ID:', error);
      throw new Error('Failed to fetch location');
    }
  }

  /**
   * Get a location by name
   */
  async getByName(name: string): Promise<Location | null> {
    try {
      const result = await db.select()
        .from(schema.locations)
        .where(eq(schema.locations.name, name))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching location by name:', error);
      throw new Error('Failed to fetch location');
    }
  }

  /**
   * Search locations by name or country
   */
  async search(query: string): Promise<Location[]> {
    try {
      const searchPattern = `%${query}%`;
      return await db.select()
        .from(schema.locations)
        .where(
          or(
            like(schema.locations.name, searchPattern),
            like(schema.locations.country, searchPattern)
          )
        )
        .orderBy(schema.locations.name);
    } catch (error) {
      console.error('Error searching locations:', error);
      throw new Error('Failed to search locations');
    }
  }

  /**
   * Get locations by type (removed - use location_types table instead)
   * @deprecated Location types are now managed through the location_types table
   */

  /**
   * Create a new location
   */
  async create(data: NewLocation): Promise<Location> {
    try {
      // Validate required fields
      if (!data.name || !data.country) {
        throw new Error('Name and country are required');
      }

      const result = await db.insert(schema.locations)
        .values(data)
        .returning();

      return result[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Location with this name already exists');
      }
      console.error('Error creating location:', error);
      throw new Error('Failed to create location');
    }
  }

  /**
   * Update a location
   */
  async update(id: number, data: Partial<NewLocation>): Promise<Location> {
    try {
      const result = await db.update(schema.locations)
        .set(data)
        .where(eq(schema.locations.id, id))
        .returning();

      if (!result[0]) {
        throw new Error('Location not found');
      }

      return result[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Location with this name already exists');
      }
      console.error('Error updating location:', error);
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

      const result = await db.delete(schema.locations)
        .where(eq(schema.locations.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  /**
   * Check location usage in itineraries
   */
  async checkUsage(id: number): Promise<{ itineraryCount: number }> {
    try {
      // Check actual usage in itinerary table
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(schema.itinerary)
        .where(eq(schema.itinerary.locationId, id));

      return {
        itineraryCount: Number(result[0]?.count || 0)
      };
    } catch (error) {
      console.error('Error checking location usage:', error);
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
      // Get all locations and calculate statistics
      const allLocations = await this.getAll();

      const byCountry: Record<string, number> = {};

      allLocations.forEach(location => {
        // Count by country
        if (location.country) {
          byCountry[location.country] = (byCountry[location.country] || 0) + 1;
        }
      });

      return {
        totalLocations: allLocations.length,
        byCountry
      };
    } catch (error) {
      console.error('Error getting location statistics:', error);
      throw new Error('Failed to get location statistics');
    }
  }

  /**
   * Bulk create locations (for migration)
   */
  async bulkCreate(locationsData: NewLocation[]): Promise<Location[]> {
    try {
      const result = await db.insert(schema.locations)
        .values(locationsData)
        .returning();

      return result;
    } catch (error) {
      console.error('Error bulk creating locations:', error);
      throw new Error('Failed to bulk create locations');
    }
  }
}

// Export singleton instance
export const locationStorage = new LocationStorage();