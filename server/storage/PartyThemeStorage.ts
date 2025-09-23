import { db } from '../storage';
import * as schema from '../../shared/schema';
import { eq, like, or, sql, desc, and } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { getSupabaseAdmin, handleSupabaseError, isSupabaseAdminAvailable } from '../supabase-admin';

export type PartyTheme = InferSelectModel<typeof schema.partyThemes>;
export type NewPartyTheme = InferInsertModel<typeof schema.partyThemes>;

export class PartyThemeStorage {
  /**
   * Transform snake_case DB fields to camelCase for frontend
   */
  private transformToFrontend(theme: any): any {
    return {
      id: theme.id,
      name: theme.name,
      longDescription: theme.long_description || theme.longDescription,
      shortDescription: theme.short_description || theme.shortDescription,
      costumeIdeas: theme.costume_ideas || theme.costumeIdeas,
      imageUrl: theme.image_url || theme.imageUrl,
      amazonShoppingListUrl: theme.amazon_shopping_list_url || theme.amazonShoppingListUrl,
      createdAt: theme.created_at || theme.createdAt,
      updatedAt: theme.updated_at || theme.updatedAt
    };
  }

  /**
   * Transform camelCase frontend fields to snake_case for DB
   */
  private transformToDatabase(data: any): any {
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.longDescription !== undefined || data.long_description !== undefined) {
      dbData.long_description = data.longDescription || data.long_description;
    }
    if (data.shortDescription !== undefined || data.short_description !== undefined) {
      dbData.short_description = data.shortDescription || data.short_description;
    }
    if (data.costumeIdeas !== undefined || data.costume_ideas !== undefined) {
      dbData.costume_ideas = data.costumeIdeas || data.costume_ideas;
    }
    if (data.imageUrl !== undefined || data.image_url !== undefined) {
      dbData.image_url = data.imageUrl || data.image_url;
    }
    if (data.amazonShoppingListUrl !== undefined || data.amazon_shopping_list_url !== undefined) {
      dbData.amazon_shopping_list_url = data.amazonShoppingListUrl || data.amazon_shopping_list_url;
    }
    return dbData;
  }

  /**
   * Get all party themes
   */
  async getAll(): Promise<PartyTheme[]> {
    try {
      const themes = await db.select()
        .from(schema.partyThemes)
        .orderBy(schema.partyThemes.name);
      return themes.map((theme: PartyTheme) => this.transformToFrontend(theme));
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
        .from(schema.partyThemes)
        .where(eq(schema.partyThemes.id, id))
        .limit(1);

      return result[0] ? this.transformToFrontend(result[0]) : null;
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
        .from(schema.partyThemes)
        .where(eq(schema.partyThemes.name, name))
        .limit(1);

      return result[0] ? this.transformToFrontend(result[0]) : null;
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
      const themes = await db.select()
        .from(schema.partyThemes)
        .where(
          or(
            like(schema.partyThemes.name, searchPattern),
            like(schema.partyThemes.longDescription, searchPattern),
            like(schema.partyThemes.shortDescription, searchPattern),
            like(schema.partyThemes.costumeIdeas, searchPattern)
          )
        )
        .orderBy(schema.partyThemes.name);
      return themes.map((theme: PartyTheme) => this.transformToFrontend(theme));
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
      const themes = await db.select()
        .from(schema.partyThemes)
        .where(sql`${schema.partyThemes.costumeIdeas} IS NOT NULL`)
        .orderBy(schema.partyThemes.name);
      return themes.map((theme: PartyTheme) => this.transformToFrontend(theme));
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

      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        throw new Error('Admin service not configured. Please configure SUPABASE_SERVICE_ROLE_KEY environment variable');
      }

      // Transform to database format
      const dbData = this.transformToDatabase(data);

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { data: theme, error } = await supabaseAdmin
        .from('party_themes')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Party theme with this name already exists');
        }
        handleSupabaseError(error, 'create party theme');
      }

      if (!theme) {
        throw new Error('Failed to create party theme');
      }

      return this.transformToFrontend(theme);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        throw error;
      }
      console.error('Error creating party theme:', error);
      throw error;
    }
  }

  /**
   * Update a party theme
   */
  async update(id: number, data: Partial<NewPartyTheme>): Promise<PartyTheme> {
    try {
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        throw new Error('Admin service not configured. Please configure SUPABASE_SERVICE_ROLE_KEY environment variable');
      }

      // Transform to database format
      const dbData = this.transformToDatabase(data);
      dbData.updated_at = new Date().toISOString();

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { data: theme, error } = await supabaseAdmin
        .from('party_themes')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Party theme not found');
        }
        if (error.code === '23505') {
          throw new Error('Party theme with this name already exists');
        }
        handleSupabaseError(error, 'update party theme');
      }

      if (!theme) {
        throw new Error('Party theme not found');
      }

      return this.transformToFrontend(theme);
    } catch (error: any) {
      if (error.message?.includes('not found') || error.message?.includes('already exists')) {
        throw error;
      }
      console.error('Error updating party theme:', error);
      throw error;
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

      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        throw new Error('Admin service not configured. Please configure SUPABASE_SERVICE_ROLE_KEY environment variable');
      }

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin
        .from('party_themes')
        .delete()
        .eq('id', id);

      if (error) {
        handleSupabaseError(error, 'delete party theme');
      }

      return true;
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

      // Note: themeData is already in frontend format from getById
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
        id: schema.events.id,
        title: schema.events.title,
        tripId: schema.events.tripId,
        date: schema.events.date
      })
      .from(schema.events)
      .where(eq(schema.events.partyThemeId, id));

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
        .from(schema.events)
        .where(eq(schema.events.partyThemeId, themeId))
        .orderBy(schema.events.date);
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
        themeId: schema.events.partyThemeId,
        count: sql<number>`COUNT(*)::int`
      })
      .from(schema.events)
      .where(sql`${schema.events.partyThemeId} IS NOT NULL`)
      .groupBy(schema.events.partyThemeId);

      // Map theme names to usage counts
      const mostUsedThemes = await Promise.all(
        usageCounts
          .sort((a: {themeId: number | null, count: number}, b: {themeId: number | null, count: number}) => b.count - a.count)
          .slice(0, 5)
          .map(async (usage: {themeId: number | null, count: number}) => {
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
      // Check if Supabase admin is available
      if (!isSupabaseAdminAvailable()) {
        throw new Error('Admin service not configured. Please configure SUPABASE_SERVICE_ROLE_KEY environment variable');
      }

      // Transform all data to database format
      const dbData = themesData.map(theme => this.transformToDatabase(theme));

      // Use Supabase Admin client to bypass RLS
      const supabaseAdmin = getSupabaseAdmin();
      const { data: themes, error } = await supabaseAdmin
        .from('party_themes')
        .insert(dbData)
        .select();

      if (error) {
        handleSupabaseError(error, 'bulk create party themes');
      }

      if (!themes) {
        throw new Error('Failed to bulk create party themes');
      }

      return themes.map((theme: PartyTheme) => this.transformToFrontend(theme));
    } catch (error) {
      console.error('Error bulk creating party themes:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const partyThemeStorage = new PartyThemeStorage();