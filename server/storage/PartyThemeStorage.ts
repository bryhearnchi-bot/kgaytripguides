import { db } from '../storage';
import { partyThemes, events } from '../../shared/schema';
import { eq, like, or, sql, desc, and } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export type PartyTheme = InferSelectModel<typeof partyThemes>;
export type NewPartyTheme = InferInsertModel<typeof partyThemes>;

export class PartyThemeStorage {
  /**
   * Get all party themes
   */
  async getAll(): Promise<PartyTheme[]> {
    try {
      return await db.select()
        .from(partyThemes)
        .orderBy(partyThemes.name);
    } catch (error) {
      console.error('Error fetching party themes:', error);
      throw new Error('Failed to fetch party themes');
    }
  }

  /**
   * Get a party theme by ID
   */
  async getById(id: number): Promise<PartyTheme | null> {
    try {
      const result = await db.select()
        .from(partyThemes)
        .where(eq(partyThemes.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching party theme by ID:', error);
      throw new Error('Failed to fetch party theme');
    }
  }

  /**
   * Get a party theme by name
   */
  async getByName(name: string): Promise<PartyTheme | null> {
    try {
      const result = await db.select()
        .from(partyThemes)
        .where(eq(partyThemes.name, name))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching party theme by name:', error);
      throw new Error('Failed to fetch party theme');
    }
  }

  /**
   * Search party themes by name or description
   */
  async search(query: string): Promise<PartyTheme[]> {
    try {
      const searchPattern = `%${query}%`;
      return await db.select()
        .from(partyThemes)
        .where(
          or(
            like(partyThemes.name, searchPattern),
            like(partyThemes.longDescription, searchPattern),
            like(partyThemes.shortDescription, searchPattern),
            like(partyThemes.costumeIdeas, searchPattern)
          )
        )
        .orderBy(partyThemes.name);
    } catch (error) {
      console.error('Error searching party themes:', error);
      throw new Error('Failed to search party themes');
    }
  }

  /**
   * Get party themes with costume ideas
   */
  async getWithCostumeIdeas(): Promise<PartyTheme[]> {
    try {
      return await db.select()
        .from(partyThemes)
        .where(sql`${partyThemes.costumeIdeas} IS NOT NULL`)
        .orderBy(partyThemes.name);
    } catch (error) {
      console.error('Error fetching party themes with costume ideas:', error);
      throw new Error('Failed to fetch party themes with costume ideas');
    }
  }

  /**
   * Create a new party theme
   */
  async create(data: NewPartyTheme): Promise<PartyTheme> {
    try {
      // Validate required fields
      if (!data.name) {
        throw new Error('Name is required');
      }

      const result = await db.insert(partyThemes)
        .values(data)
        .returning();

      return result[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Party theme with this name already exists');
      }
      console.error('Error creating party theme:', error);
      throw new Error('Failed to create party theme');
    }
  }

  /**
   * Update a party theme
   */
  async update(id: number, data: Partial<NewPartyTheme>): Promise<PartyTheme> {
    try {
      const result = await db.update(partyThemes)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(partyThemes.id, id))
        .returning();

      if (!result[0]) {
        throw new Error('Party theme not found');
      }

      return result[0];
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error('Party theme with this name already exists');
      }
      console.error('Error updating party theme:', error);
      throw new Error('Failed to update party theme');
    }
  }

  /**
   * Delete a party theme
   */
  async delete(id: number): Promise<boolean> {
    try {
      // Check if theme is referenced in events
      const usage = await this.checkUsage(id);
      if (usage.eventCount > 0) {
        throw new Error(`Cannot delete party theme: used in ${usage.eventCount} events`);
      }

      const result = await db.delete(partyThemes)
        .where(eq(partyThemes.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error deleting party theme:', error);
      throw error;
    }
  }

  /**
   * Duplicate a party theme (create a copy with new name)
   */
  async duplicate(id: number, newName: string): Promise<PartyTheme> {
    try {
      const original = await this.getById(id);
      if (!original) {
        throw new Error('Party theme not found');
      }

      const { id: _, createdAt, updatedAt, ...themeData } = original;

      return await this.create({
        ...themeData,
        name: newName
      });
    } catch (error) {
      console.error('Error duplicating party theme:', error);
      throw new Error('Failed to duplicate party theme');
    }
  }

  /**
   * Check party theme usage in events
   */
  async checkUsage(id: number): Promise<{ eventCount: number; events: any[] }> {
    try {
      const result = await db.select({
        id: events.id,
        title: events.title,
        tripId: events.tripId,
        date: events.date
      })
      .from(events)
      .where(eq(events.partyThemeId, id));

      return {
        eventCount: result.length,
        events: result
      };
    } catch (error) {
      console.error('Error checking party theme usage:', error);
      throw new Error('Failed to check party theme usage');
    }
  }

  /**
   * Get events using a specific party theme
   */
  async getEvents(themeId: number): Promise<any[]> {
    try {
      return await db.select()
        .from(events)
        .where(eq(events.partyThemeId, themeId))
        .orderBy(events.date);
    } catch (error) {
      console.error('Error fetching events for party theme:', error);
      throw new Error('Failed to fetch events');
    }
  }

  /**
   * Get party theme statistics
   */
  async getStatistics(): Promise<{
    totalThemes: number;
    themesWithCostumes: number;
    themesWithShoppingLists: number;
    mostUsedThemes: Array<{ themeId: number; name: string; usageCount: number }>;
  }> {
    try {
      // Get all themes
      const allThemes = await this.getAll();

      // Count themes with various attributes
      const themesWithCostumes = allThemes.filter(t => t.costumeIdeas).length;
      const themesWithShoppingLists = allThemes.filter(t => t.amazonShoppingListUrl).length;

      // Get usage counts
      const usageCounts = await db.select({
        themeId: events.partyThemeId,
        count: sql<number>`COUNT(*)::int`
      })
      .from(events)
      .where(sql`${events.partyThemeId} IS NOT NULL`)
      .groupBy(events.partyThemeId);

      // Map theme names to usage counts
      const mostUsedThemes = await Promise.all(
        usageCounts
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map(async (usage) => {
            const theme = await this.getById(usage.themeId!);
            return {
              themeId: usage.themeId!,
              name: theme?.name || 'Unknown',
              usageCount: usage.count
            };
          })
      );

      return {
        totalThemes: allThemes.length,
        themesWithCostumes,
        themesWithShoppingLists,
        mostUsedThemes
      };
    } catch (error) {
      console.error('Error getting party theme statistics:', error);
      throw new Error('Failed to get party theme statistics');
    }
  }

  /**
   * Bulk create party themes (for migration)
   */
  async bulkCreate(themesData: NewPartyTheme[]): Promise<PartyTheme[]> {
    try {
      const result = await db.insert(partyThemes)
        .values(themesData)
        .returning();

      return result;
    } catch (error) {
      console.error('Error bulk creating party themes:', error);
      throw new Error('Failed to bulk create party themes');
    }
  }
}

// Export singleton instance
export const partyThemeStorage = new PartyThemeStorage();