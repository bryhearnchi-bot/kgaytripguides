/**
 * Database Sequence Fix Utility
 *
 * This utility fixes PostgreSQL sequence issues where the sequence value
 * gets out of sync with the actual data, causing duplicate key violations.
 *
 * Common causes:
 * - Manual data insertion with explicit IDs
 * - Data migration from another database
 * - Restored backups where sequences weren't properly restored
 */

import { getSupabaseAdmin } from '../supabase-admin';

interface SequenceInfo {
  tableName: string;
  sequenceName: string;
  idColumn?: string;
}

// Define all tables with auto-incrementing IDs that use sequences
const TABLES_WITH_SEQUENCES: SequenceInfo[] = [
  { tableName: 'talent', sequenceName: 'talent_id_seq' },
  { tableName: 'trips', sequenceName: 'trips_id_seq' },
  { tableName: 'locations', sequenceName: 'locations_id_seq' },
  { tableName: 'events', sequenceName: 'events_id_seq' },
  { tableName: 'ships', sequenceName: 'ships_id_seq' },
  { tableName: 'itinerary', sequenceName: 'itinerary_id_seq' },
  { tableName: 'profiles', sequenceName: 'profiles_id_seq' },
  { tableName: 'talent_categories', sequenceName: 'talent_categories_id_seq' },
  { tableName: 'resorts', sequenceName: 'resorts_id_seq' },
  { tableName: 'venues', sequenceName: 'venues_id_seq' },
  { tableName: 'amenities', sequenceName: 'amenities_id_seq' },
  { tableName: 'trip_info_sections', sequenceName: 'trip_info_sections_id_seq' }
];

export interface SequenceFixResult {
  tableName: string;
  sequenceName: string;
  previousValue?: number;
  currentMaxId: number;
  newSequenceValue: number;
  fixed: boolean;
  error?: string;
}

/**
 * Fix a single table's sequence
 */
export async function fixTableSequence(tableInfo: SequenceInfo): Promise<SequenceFixResult> {
  const { tableName, sequenceName, idColumn = 'id' } = tableInfo;

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Step 1: Get the current maximum ID in the table
    const { data: maxIdData, error: maxIdError } = await supabaseAdmin
      .from(tableName)
      .select(idColumn)
      .order(idColumn, { ascending: false })
      .limit(1);

    if (maxIdError) {
      console.error(`Error getting max ID from ${tableName}:`, maxIdError);
      return {
        tableName,
        sequenceName,
        currentMaxId: 0,
        newSequenceValue: 0,
        fixed: false,
        error: `Failed to get max ID: ${maxIdError.message}`
      };
    }

    const currentMaxId = maxIdData && maxIdData.length > 0 ? maxIdData[0][idColumn] : 0;
    const newSequenceValue = currentMaxId + 1;

    console.log(`[${tableName}] Current max ID: ${currentMaxId}, Setting sequence to: ${newSequenceValue}`);

    // Step 2: Try to reset the sequence using Supabase RPC
    // Note: This requires a custom function to be created in Supabase
    // If the RPC doesn't exist, we'll provide SQL commands for manual execution

    try {
      // Try to execute the sequence reset
      const { data: resetData, error: resetError } = await supabaseAdmin
        .rpc('reset_sequence', {
          sequence_name: sequenceName,
          new_value: newSequenceValue
        });

      if (resetError) {
        // If RPC fails, it might not exist, so provide manual SQL
        console.warn(`RPC approach failed for ${tableName}, manual fix required`);
        return {
          tableName,
          sequenceName,
          previousValue: undefined,
          currentMaxId,
          newSequenceValue,
          fixed: false,
          error: `Manual fix required. Run in SQL editor: SELECT setval('${sequenceName}', ${newSequenceValue}, false);`
        };
      }

      return {
        tableName,
        sequenceName,
        previousValue: undefined,
        currentMaxId,
        newSequenceValue,
        fixed: true
      };
    } catch (rpcError) {
      // RPC function doesn't exist, provide manual commands
      return {
        tableName,
        sequenceName,
        previousValue: undefined,
        currentMaxId,
        newSequenceValue,
        fixed: false,
        error: `Manual fix required. Run in SQL editor: SELECT setval('${sequenceName}', ${newSequenceValue}, false);`
      };
    }
  } catch (error) {
    console.error(`Error fixing sequence for ${tableName}:`, error);
    return {
      tableName,
      sequenceName,
      currentMaxId: 0,
      newSequenceValue: 0,
      fixed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fix sequences for all tables
 */
export async function fixAllSequences(): Promise<SequenceFixResult[]> {
  console.log('Starting sequence fix for all tables...');
  const results: SequenceFixResult[] = [];

  for (const tableInfo of TABLES_WITH_SEQUENCES) {
    const result = await fixTableSequence(tableInfo);
    results.push(result);
  }

  return results;
}

/**
 * Fix sequence for a specific table by name
 */
export async function fixSequenceByTableName(tableName: string): Promise<SequenceFixResult> {
  const tableInfo = TABLES_WITH_SEQUENCES.find(t => t.tableName === tableName);

  if (!tableInfo) {
    return {
      tableName,
      sequenceName: `${tableName}_id_seq`,
      currentMaxId: 0,
      newSequenceValue: 0,
      fixed: false,
      error: `Table ${tableName} not found in configuration`
    };
  }

  return fixTableSequence(tableInfo);
}

/**
 * Generate SQL commands for manual sequence fixing
 * This can be used if the automatic fix doesn't work
 */
export function generateSequenceFixSQL(tableName: string, sequenceName: string, newValue: number): string {
  return `
-- Fix sequence for ${tableName}
-- Check current sequence value
SELECT currval('${sequenceName}');

-- Check max ID in table
SELECT MAX(id) FROM ${tableName};

-- Reset sequence to correct value
SELECT setval('${sequenceName}', ${newValue}, false);

-- Verify the fix
SELECT currval('${sequenceName}');
`.trim();
}

/**
 * Generate a complete SQL script to fix all sequences at once
 */
export async function generateCompleteSequenceFixSQL(): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();
  let sqlScript = `-- Complete Sequence Fix Script
-- Generated on ${new Date().toISOString()}
-- Run this script in your Supabase SQL editor

BEGIN;

`;

  for (const tableInfo of TABLES_WITH_SEQUENCES) {
    const { tableName, sequenceName, idColumn = 'id' } = tableInfo;

    try {
      // Get max ID for each table
      const { data: maxIdData } = await supabaseAdmin
        .from(tableName)
        .select(idColumn)
        .order(idColumn, { ascending: false })
        .limit(1);

      const currentMaxId = maxIdData && maxIdData.length > 0 ? maxIdData[0][idColumn] : 0;
      const newSequenceValue = currentMaxId + 1;

      sqlScript += `-- Fix ${tableName} sequence
SELECT setval('${sequenceName}', GREATEST(${newSequenceValue}, (SELECT COALESCE(MAX(${idColumn}), 0) + 1 FROM ${tableName})), false);

`;
    } catch (error) {
      sqlScript += `-- Error getting max ID for ${tableName}, using dynamic approach
SELECT setval('${sequenceName}', (SELECT COALESCE(MAX(${idColumn}), 0) + 1 FROM ${tableName}), false);

`;
    }
  }

  sqlScript += `COMMIT;

-- Verify all sequences
`;

  for (const tableInfo of TABLES_WITH_SEQUENCES) {
    const { tableName, sequenceName } = tableInfo;
    sqlScript += `SELECT '${tableName}' as table_name, currval('${sequenceName}') as sequence_value, MAX(id) as max_id FROM ${tableName} GROUP BY currval('${sequenceName}');
`;
  }

  return sqlScript;
}

/**
 * Create a stored procedure in the database for fixing sequences
 * This only needs to be run once to set up the database
 */
export function getCreateStoredProcedureSQL(): string {
  return `
-- Create a stored procedure for resetting sequences
-- Run this once in your Supabase SQL editor

CREATE OR REPLACE FUNCTION reset_sequence(sequence_name text, new_value integer)
RETURNS bigint AS $$
DECLARE
  result bigint;
BEGIN
  -- Reset the sequence
  EXECUTE format('SELECT setval(%L, %s, false)', sequence_name, new_value) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_sequence TO authenticated;

-- Create a more comprehensive sequence fix function
CREATE OR REPLACE FUNCTION fix_table_sequence(table_name text, sequence_name text DEFAULT NULL, id_column text DEFAULT 'id')
RETURNS json AS $$
DECLARE
  seq_name text;
  max_id bigint;
  new_value bigint;
  current_value bigint;
BEGIN
  -- If sequence name not provided, assume standard naming convention
  IF sequence_name IS NULL THEN
    seq_name := table_name || '_id_seq';
  ELSE
    seq_name := sequence_name;
  END IF;

  -- Get current max ID
  EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', id_column, table_name) INTO max_id;

  -- Calculate new sequence value
  new_value := max_id + 1;

  -- Get current sequence value
  BEGIN
    EXECUTE format('SELECT currval(%L)', seq_name) INTO current_value;
  EXCEPTION
    WHEN others THEN
      current_value := 0;
  END;

  -- Reset sequence
  EXECUTE format('SELECT setval(%L, %s, false)', seq_name, new_value);

  -- Return result as JSON
  RETURN json_build_object(
    'table_name', table_name,
    'sequence_name', seq_name,
    'previous_value', current_value,
    'max_id', max_id,
    'new_value', new_value,
    'fixed', true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION fix_table_sequence TO authenticated;

-- Example usage:
-- SELECT fix_table_sequence('talent');
-- SELECT fix_table_sequence('trips');
`.trim();
}