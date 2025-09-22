import { db } from '../storage';
import { locations } from '../../shared/schema';
import { eq, like, or, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type Location = InferSelectModel<typeof locations>;
export type NewLocation = InferInsertModel<typeof locations>;

export class LocationStorage {
  /**
   * Get all locations
   */
  async getAll(): Promise<Location[]> {
    try {
      return await db.select().from(locations).orderBy(locations.name);
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
        .from(locations)
        .where(eq(locations.id, id))
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
        .from(locations)
        .where(eq(locations.name, name))
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
        .from(locations)
        .where(
          or(
            like(locations.name, searchPattern),
            like(locations.country, searchPattern)
          )
        );
    } catch (error) {
      console.error('Error searching locations:', error);
      throw new Error('Failed to search locations');
    }
  }

  /**
   * Get locations by country
   */
  async getByCountry(country: string): Promise<Location[]> {
    try {
      return await db.select()
        .from(locations)
        .where(eq(locations.country, country))
        .orderBy(locations.name);
    } catch (error) {
      console.error('Error fetching locations by country:', error);
      throw new Error('Failed to fetch locations');
    }
  }

  /**
   * Get unique countries
   */
  async getCountries(): Promise<string[]> {
    try {
      const result = await db.selectDistinct({
        country: locations.country
      }).from(locations)
        .where(sql`${locations.country} IS NOT NULL`)
        .orderBy(locations.country);

      return result.map(r => r.country).filter(Boolean) as string[];
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw new Error('Failed to fetch countries');
    }
  }
}

// Create singleton instance
export const locationStorage = new LocationStorage();