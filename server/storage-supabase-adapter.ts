import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type * as schema from '../shared/schema';

// Create Supabase client for REST API access
export function createSupabaseClient() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials in environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

// Drizzle-like adapter for Supabase REST API
export class SupabaseDrizzleAdapter {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createSupabaseClient();
  }

  // Main query builder interface that mimics Drizzle
  select(fields?: any) {
    return new SelectQueryBuilder(this.supabase);
  }

  insert(table: any) {
    const tableName = this.getTableName(table);
    return new InsertQueryBuilder(this.supabase, tableName);
  }

  update(table: any) {
    const tableName = this.getTableName(table);
    return new UpdateQueryBuilder(this.supabase, tableName);
  }

  delete(table: any) {
    const tableName = this.getTableName(table);
    return new DeleteQueryBuilder(this.supabase, tableName);
  }

  // Helper to extract table name from Drizzle table object
  private getTableName(table: any): string {
    // Handle different table object structures
    if (typeof table === 'string') return table;
    if (table._ && table._.name) return table._.name;
    if (table[Symbol.for('drizzle:Name')]) return table[Symbol.for('drizzle:Name')];

    // Fallback: try to match by checking schema exports
    const tableMap: Record<any, string> = {
      'profiles': 'profiles',
      'users': 'users',
      'cruises': 'cruises',
      'trips': 'cruises', // cruises table is aliased as trips
      'itinerary': 'itinerary',
      'events': 'events',
      'talent': 'talent',
      'media': 'media',
      'settings': 'settings',
      'cruise_talent': 'cruise_talent',
      'trip_info_sections': 'trip_info_sections',
      'ports': 'ports',
      'parties': 'parties',
      'event_talent': 'event_talent'
    };

    // Try to match by reference
    for (const [key, value] of Object.entries(tableMap)) {
      if (table === key || table.toString().includes(key)) {
        return value;
      }
    }

    console.warn('Could not determine table name, using fallback:', table);
    return 'unknown';
  }
}

// Select Query Builder
class SelectQueryBuilder {
  private supabase: SupabaseClient;
  private query: any;
  private tableName: string = '';
  private selectFields: string = '*';
  private joinClauses: Array<{ type: string; table: string; condition: any }> = [];
  private whereConditions: any[] = [];
  private orderByClause: string = '';
  private limitCount?: number;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  from(table: any) {
    // Extract table name
    if (typeof table === 'string') {
      this.tableName = table;
    } else if (table._ && table._.name) {
      this.tableName = table._.name;
    } else if (table[Symbol.for('drizzle:Name')]) {
      this.tableName = table[Symbol.for('drizzle:Name')];
    } else {
      // Fallback for common tables
      const tableStr = table.toString();
      if (tableStr.includes('profiles')) this.tableName = 'profiles';
      else if (tableStr.includes('cruises')) this.tableName = 'cruises';
      else if (tableStr.includes('itinerary')) this.tableName = 'itinerary';
      else if (tableStr.includes('events')) this.tableName = 'events';
      else if (tableStr.includes('talent')) this.tableName = 'talent';
      else if (tableStr.includes('cruise_talent')) this.tableName = 'cruise_talent';
      else if (tableStr.includes('ports')) this.tableName = 'ports';
      else if (tableStr.includes('parties')) this.tableName = 'parties';
      else if (tableStr.includes('event_talent')) this.tableName = 'event_talent';
      else if (tableStr.includes('media')) this.tableName = 'media';
      else if (tableStr.includes('settings')) this.tableName = 'settings';
      else if (tableStr.includes('trip_info_sections')) this.tableName = 'trip_info_sections';
      else if (tableStr.includes('users')) this.tableName = 'users';
    }

    this.query = this.supabase.from(this.tableName);
    return this;
  }

  where(condition: any) {
    this.whereConditions.push(condition);
    return this;
  }

  innerJoin(table: any, condition: any) {
    this.joinClauses.push({ type: 'inner', table: this.extractTableName(table), condition });
    return this;
  }

  leftJoin(table: any, condition: any) {
    this.joinClauses.push({ type: 'left', table: this.extractTableName(table), condition });
    return this;
  }

  orderBy(...args: any[]) {
    // Parse orderBy arguments (can be multiple columns with asc/desc)
    const orderClauses = args.map(arg => {
      if (typeof arg === 'string') return arg;

      // Handle Drizzle's asc/desc functions
      if (arg && typeof arg === 'object') {
        // Try to get the column info from the argument structure
        let columnName = '';
        let direction = 'asc';

        // Check for Drizzle desc/asc function structure
        if (arg.column && arg.column.name) {
          columnName = arg.column.name;
          direction = arg.direction || 'desc'; // desc() function typically means descending
        } else if (arg._ && arg._.name) {
          columnName = arg._.name;
        }

        // If we still don't have a column name, try to parse from the sql property
        if (!columnName && arg.sql) {
          const sql = arg.sql.toString();
          // Extract column name from SQL - handle patterns like "cruises"."start_date" DESC
          const columnMatch = sql.match(/"([^"]+)"\."([^"]+)"/);
          if (columnMatch) {
            columnName = columnMatch[2]; // get the column name (second part)
          } else {
            // Fallback: just try to extract any quoted field name
            const simpleMatch = sql.match(/"([^"]+)"/);
            if (simpleMatch) {
              columnName = simpleMatch[1];
            }
          }

          // Determine direction from SQL
          if (sql.toUpperCase().includes('DESC')) {
            direction = 'desc';
          } else if (sql.toUpperCase().includes('ASC')) {
            direction = 'asc';
          }
        }

        // Keep snake_case column names as they are in the database
        if (columnName) {
          return `${columnName}.${direction}()`;
        }
      }

      return 'id.asc()'; // fallback to id ascending
    });

    this.orderByClause = orderClauses.join(',');
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async then(resolve: Function, reject: Function) {
    try {
      let query = this.query.select(this.selectFields);

      // Apply where conditions
      for (const condition of this.whereConditions) {
        query = this.applyWhereCondition(query, condition);
      }

      // Apply order by
      if (this.orderByClause) {
        const orderParts = this.orderByClause.split(',');
        for (const part of orderParts) {
          if (part.includes('.desc()')) {
            const field = part.replace('.desc()', '').trim();
            query = query.order(field, { ascending: false });
          } else if (part.includes('.asc()')) {
            const field = part.replace('.asc()', '').trim();
            query = query.order(field, { ascending: true });
          } else {
            query = query.order(part.trim());
          }
        }
      }

      // Apply limit
      if (this.limitCount) {
        query = query.limit(this.limitCount);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        reject(error);
      } else {
        resolve(data || []);
      }
    } catch (error) {
      reject(error);
    }
  }

  private applyWhereCondition(query: any, condition: any): any {
    // Parse Drizzle's eq, and, or, etc.
    if (condition.sql) {
      const sql = condition.sql.toString();
      const values = condition.params || [];

      // Parse simple equality
      if (sql.includes('=')) {
        const [field, _] = sql.split('=').map(s => s.trim().replace(/"/g, ''));
        if (values.length > 0) {
          return query.eq(field, values[0]);
        }
      }

      // Parse LIKE/ILIKE
      if (sql.toLowerCase().includes('ilike')) {
        const match = sql.match(/"([^"]+)"\s+ilike\s+/i);
        if (match && values.length > 0) {
          const field = match[1];
          const value = values[0].toString().replace(/%/g, '*');
          return query.ilike(field, value);
        }
      }
    }

    return query;
  }

  private extractTableName(table: any): string {
    if (typeof table === 'string') return table;
    if (table._ && table._.name) return table._.name;
    if (table[Symbol.for('drizzle:Name')]) return table[Symbol.for('drizzle:Name')];
    return 'unknown';
  }

  returning() {
    // For select queries, just return the promise
    return this;
  }
}

// Insert Query Builder
class InsertQueryBuilder {
  private supabase: SupabaseClient;
  private tableName: string;
  private insertValues: any;

  constructor(supabase: SupabaseClient, tableName: string) {
    this.supabase = supabase;
    this.tableName = tableName;
  }

  values(values: any) {
    this.insertValues = values;
    return this;
  }

  returning() {
    return this;
  }

  async onConflictDoNothing() {
    // Supabase doesn't have direct onConflictDoNothing, we'll use upsert
    const { data, error } = await this.supabase
      .from(this.tableName)
      .upsert(this.insertValues, { onConflict: 'id', ignoreDuplicates: true })
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return data;
  }

  async then(resolve: Function, reject: Function) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(this.insertValues)
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        reject(error);
      } else {
        resolve(data || []);
      }
    } catch (error) {
      reject(error);
    }
  }
}

// Update Query Builder
class UpdateQueryBuilder {
  private supabase: SupabaseClient;
  private tableName: string;
  private updateValues: any;
  private whereConditions: any[] = [];

  constructor(supabase: SupabaseClient, tableName: string) {
    this.supabase = supabase;
    this.tableName = tableName;
  }

  set(values: any) {
    this.updateValues = values;
    return this;
  }

  where(condition: any) {
    this.whereConditions.push(condition);
    return this;
  }

  returning() {
    return this;
  }

  async then(resolve: Function, reject: Function) {
    try {
      let query = this.supabase.from(this.tableName).update(this.updateValues);

      // Apply where conditions
      for (const condition of this.whereConditions) {
        if (condition.sql) {
          const sql = condition.sql.toString();
          const values = condition.params || [];

          if (sql.includes('=')) {
            const [field, _] = sql.split('=').map(s => s.trim().replace(/"/g, ''));
            if (values.length > 0) {
              query = query.eq(field, values[0]);
            }
          }
        }
      }

      const { data, error } = await query.select();

      if (error) {
        console.error('Supabase update error:', error);
        reject(error);
      } else {
        resolve(data || []);
      }
    } catch (error) {
      reject(error);
    }
  }
}

// Delete Query Builder
class DeleteQueryBuilder {
  private supabase: SupabaseClient;
  private tableName: string;
  private whereConditions: any[] = [];

  constructor(supabase: SupabaseClient, tableName: string) {
    this.supabase = supabase;
    this.tableName = tableName;
  }

  where(condition: any) {
    this.whereConditions.push(condition);
    return this;
  }

  async then(resolve: Function, reject: Function) {
    try {
      let query = this.supabase.from(this.tableName).delete();

      // Apply where conditions
      for (const condition of this.whereConditions) {
        if (condition.sql) {
          const sql = condition.sql.toString();
          const values = condition.params || [];

          if (sql.includes('=')) {
            const [field, _] = sql.split('=').map(s => s.trim().replace(/"/g, ''));
            if (values.length > 0) {
              query = query.eq(field, values[0]);
            }
          }
        }
      }

      const { error } = await query;

      if (error) {
        console.error('Supabase delete error:', error);
        reject(error);
      } else {
        resolve(undefined);
      }
    } catch (error) {
      reject(error);
    }
  }
}