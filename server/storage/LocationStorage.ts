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
        .from(schema.locations)
        .where(eq(schema.locations.country, country))
        .orderBy(schema.locations.name);
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
      }).from(schema.locations)
        .where(sql`${locations.country} IS NOT NULL`)
        .orderBy(schema.locations.country);

      return result.map(r => r.country).filter(Boolean) as string[];
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw new Error('Failed to fetch countries');
    }
  }
}

// Create singleton instance
export const locationStorage = new LocationStorage();