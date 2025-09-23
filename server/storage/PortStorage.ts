import { db } from '../storage';
import * as schema from '../../shared/schema';
import { eq, like, or, sql } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type Port = InferSelectModel<typeof schema.ports>;
export type NewPort = InferInsertModel<typeof schema.ports>;

export class PortStorage {
  /**
   * Get all ports
   */
  async getAll(): Promise<Port[]> {
    try {
      return await db.select().from(schema.ports).orderBy(schema.ports.name);
    } catch (error) {
      console.error('Error fetching ports:', error);
      throw new Error('Failed to fetch ports');
    }
  }

  /**
   * Get a port by ID
   */
  async getById(id: number): Promise<Port | null> {
    try {
      const result = await db.select()
        .from(schema.ports)
        .where(eq(schema.ports.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching port by ID:', error);
      throw new Error('Failed to fetch port');
    }
  }

  /**
   * Get a port by name
   */
  async getByName(name: string): Promise<Port | null> {
    try {
      const result = await db.select()
        .from(schema.ports)
        .where(eq(schema.ports.name, name))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching port by name:', error);
      throw new Error('Failed to fetch port');
    }
  }

  /**
   * Search ports by name or country
   */
  async search(query: string): Promise<Port[]> {
    try {
      const searchPattern = `%${query}%`;
      return await db.select()
        .from(schema.ports)
        .where(
          or(
            like(schema.ports.name, searchPattern),
            like(schema.ports.country, searchPattern),
            like(schema.ports.region, searchPattern)
          )
        )
        .orderBy(schema.ports.name);
    } catch (error) {
      console.error('Error searching ports:', error);
      throw new Error('Failed to search ports');
    }
  }

  /**
   * Get ports by type
   */
  async getByType(portType: 'port' | 'sea_day' | 'embark' | 'disembark'): Promise<Port[]> {
    try {
      return await db.select()
        .from(schema.ports)
        .where(eq(schema.ports.port_type, portType))
        .orderBy(schema.ports.name);
    } catch (error) {
      console.error('Error fetching ports by type:', error);
      throw new Error('Failed to fetch ports by type');
    }
  }

  /**
   * Create a new port
   */
  async create(data: NewPort): Promise<Port> {
    try {
      // Validate required fields
      if (!data.name || !data.country) {
        throw new Error('Name and country are required');
      }

      const result = await db.insert(schema.ports)
        .values({
          ...data,
          port_type: data.port_type || 'port'
        })
        .returning();

      return result[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Port with this name already exists');
      }
      console.error('Error creating port:', error);
      throw new Error('Failed to create port');
    }
  }

  /**
   * Update a port
   */
  async update(id: number, data: Partial<NewPort>): Promise<Port> {
    try {
      const result = await db.update(schema.ports)
        .set(data)
        .where(eq(schema.ports.id, id))
        .returning();

      if (!result[0]) {
        throw new Error('Port not found');
      }

      return result[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Port with this name already exists');
      }
      console.error('Error updating port:', error);
      throw new Error('Failed to update port');
    }
  }

  /**
   * Delete a port
   */
  async delete(id: number): Promise<boolean> {
    try {
      // Check if port is referenced in itinerary
      const usage = await this.checkUsage(id);
      if (usage.itineraryCount > 0) {
        throw new Error(`Cannot delete port: used in ${usage.itineraryCount} itinerary items`);
      }

      const result = await db.delete(schema.ports)
        .where(eq(schema.ports.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting port:', error);
      throw error;
    }
  }

  /**
   * Check port usage in itineraries
   */
  async checkUsage(id: number): Promise<{ itineraryCount: number }> {
    try {
      // For now, return 0 since we need to check the actual itinerary structure
      // This will be updated once we have proper foreign key relationships
      return {
        itineraryCount: 0
      };
    } catch (error) {
      console.error('Error checking port usage:', error);
      throw new Error('Failed to check port usage');
    }
  }

  /**
   * Get port statistics
   */
  async getStatistics(): Promise<{
    totalPorts: number;
    byType: Record<string, number>;
    byCountry: Record<string, number>;
  }> {
    try {
      // Get all ports and calculate statistics
      const allPorts = await this.getAll();

      const byType: Record<string, number> = {};
      const byCountry: Record<string, number> = {};

      allPorts.forEach(port => {
        // Count by type
        const type = port.port_type || 'port';
        byType[type] = (byType[type] || 0) + 1;

        // Count by country
        if (port.country) {
          byCountry[port.country] = (byCountry[port.country] || 0) + 1;
        }
      });

      return {
        totalPorts: allPorts.length,
        byType,
        byCountry
      };
    } catch (error) {
      console.error('Error getting port statistics:', error);
      throw new Error('Failed to get port statistics');
    }
  }

  /**
   * Bulk create ports (for migration)
   */
  async bulkCreate(portsData: NewPort[]): Promise<Port[]> {
    try {
      const result = await db.insert(ports)
        .values(portsData.map(p => ({
          ...p,
          port_type: p.port_type || 'port'
        })))
        .returning();

      return result;
    } catch (error) {
      console.error('Error bulk creating ports:', error);
      throw new Error('Failed to bulk create ports');
    }
  }
}

// Export singleton instance
export const portStorage = new PortStorage();