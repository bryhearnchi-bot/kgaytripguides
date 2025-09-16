import { db } from '../storage';
import { parties } from '../../shared/schema';
import { eq, like, or, sql, desc } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type Party = InferSelectModel<typeof parties>;
export type NewParty = InferInsertModel<typeof parties>;

export class PartyStorage {
  /**
   * Get all parties
   */
  async getAll(): Promise<Party[]> {
    try {
      return await db.select()
        .from(parties)
        .orderBy(desc(parties.usage_count), parties.name);
    } catch (error) {
      console.error('Error fetching parties:', error);
      throw new Error('Failed to fetch parties');
    }
  }

  /**
   * Get a party by ID
   */
  async getById(id: number): Promise<Party | null> {
    try {
      const result = await db.select()
        .from(parties)
        .where(eq(parties.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching party by ID:', error);
      throw new Error('Failed to fetch party');
    }
  }

  /**
   * Get a party by name
   */
  async getByName(name: string): Promise<Party | null> {
    try {
      const result = await db.select()
        .from(parties)
        .where(eq(parties.name, name))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching party by name:', error);
      throw new Error('Failed to fetch party');
    }
  }

  /**
   * Search parties by name or theme
   */
  async search(query: string): Promise<Party[]> {
    try {
      const searchPattern = `%${query}%`;
      return await db.select()
        .from(parties)
        .where(
          or(
            like(parties.name, searchPattern),
            like(parties.theme, searchPattern)
          )
        )
        .orderBy(desc(parties.usage_count), parties.name);
    } catch (error) {
      console.error('Error searching parties:', error);
      throw new Error('Failed to search parties');
    }
  }

  /**
   * Get parties by venue type
   */
  async getByVenueType(venueType: 'pool' | 'club' | 'theater' | 'deck' | 'lounge'): Promise<Party[]> {
    try {
      return await db.select()
        .from(parties)
        .where(eq(parties.venue_type, venueType))
        .orderBy(desc(parties.usage_count), parties.name);
    } catch (error) {
      console.error('Error fetching parties by venue type:', error);
      throw new Error('Failed to fetch parties by venue type');
    }
  }

  /**
   * Get most used parties
   */
  async getMostUsed(limit: number = 5): Promise<Party[]> {
    try {
      return await db.select()
        .from(parties)
        .orderBy(desc(parties.usage_count))
        .limit(limit);
    } catch (error) {
      console.error('Error fetching most used parties:', error);
      throw new Error('Failed to fetch most used parties');
    }
  }

  /**
   * Create a new party
   */
  async create(data: NewParty): Promise<Party> {
    try {
      // Validate required fields
      if (!data.name) {
        throw new Error('Name is required');
      }

      const result = await db.insert(parties)
        .values({
          ...data,
          venue_type: data.venue_type || 'deck',
          usage_count: 0
        })
        .returning();

      return result[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Party with this name already exists');
      }
      console.error('Error creating party:', error);
      throw new Error('Failed to create party');
    }
  }

  /**
   * Update a party
   */
  async update(id: number, data: Partial<NewParty>): Promise<Party> {
    try {
      const result = await db.update(parties)
        .set(data)
        .where(eq(parties.id, id))
        .returning();

      if (!result[0]) {
        throw new Error('Party not found');
      }

      return result[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Party with this name already exists');
      }
      console.error('Error updating party:', error);
      throw new Error('Failed to update party');
    }
  }

  /**
   * Delete a party
   */
  async delete(id: number): Promise<boolean> {
    try {
      // Check if party is referenced in events
      const usage = await this.checkUsage(id);
      if (usage.eventCount > 0) {
        throw new Error(`Cannot delete party: used in ${usage.eventCount} events`);
      }

      const result = await db.delete(parties)
        .where(eq(parties.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting party:', error);
      throw error;
    }
  }

  /**
   * Duplicate a party (create a copy with new name)
   */
  async duplicate(id: number, newName: string): Promise<Party> {
    try {
      const original = await this.getById(id);
      if (!original) {
        throw new Error('Party not found');
      }

      const { id: _, created_at, updated_at, usage_count, ...partyData } = original;

      return await this.create({
        ...partyData,
        name: newName
      });
    } catch (error) {
      console.error('Error duplicating party:', error);
      throw new Error('Failed to duplicate party');
    }
  }

  /**
   * Increment usage count
   */
  async incrementUsage(id: number): Promise<void> {
    try {
      const party = await this.getById(id);
      if (party) {
        await db.update(parties)
          .set({ usage_count: (party.usage_count || 0) + 1 })
          .where(eq(parties.id, id));
      }
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      throw new Error('Failed to increment usage count');
    }
  }

  /**
   * Check party usage in events
   */
  async checkUsage(id: number): Promise<{ eventCount: number }> {
    try {
      // For now, return 0 since we need to check the actual events structure
      // This will be updated once we have proper foreign key relationships
      return {
        eventCount: 0
      };
    } catch (error) {
      console.error('Error checking party usage:', error);
      throw new Error('Failed to check party usage');
    }
  }

  /**
   * Get party statistics
   */
  async getStatistics(): Promise<{
    totalParties: number;
    byVenueType: Record<string, number>;
    averageCapacity: number;
    totalUsage: number;
  }> {
    try {
      // Get all parties and calculate statistics
      const allParties = await this.getAll();

      const byVenueType: Record<string, number> = {};
      let totalCapacity = 0;
      let capacityCount = 0;
      let totalUsage = 0;

      allParties.forEach(party => {
        // Count by venue type
        const venue = party.venue_type || 'deck';
        byVenueType[venue] = (byVenueType[venue] || 0) + 1;

        // Calculate average capacity
        if (party.capacity) {
          totalCapacity += party.capacity;
          capacityCount++;
        }

        // Sum usage
        totalUsage += party.usage_count || 0;
      });

      return {
        totalParties: allParties.length,
        byVenueType,
        averageCapacity: capacityCount > 0 ? totalCapacity / capacityCount : 0,
        totalUsage
      };
    } catch (error) {
      console.error('Error getting party statistics:', error);
      throw new Error('Failed to get party statistics');
    }
  }

  /**
   * Bulk create parties (for migration)
   */
  async bulkCreate(partiesData: NewParty[]): Promise<Party[]> {
    try {
      const result = await db.insert(parties)
        .values(partiesData.map(p => ({
          ...p,
          venue_type: p.venue_type || 'deck',
          usage_count: p.usage_count || 0
        })))
        .returning();

      return result;
    } catch (error) {
      console.error('Error bulk creating parties:', error);
      throw new Error('Failed to bulk create parties');
    }
  }
}

// Export singleton instance
export const partyStorage = new PartyStorage();