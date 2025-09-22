/**
 * Supabase Admin Client Module
 *
 * Provides a centralized Supabase client with service role permissions
 * for performing admin operations that bypass Row Level Security (RLS).
 *
 * This module should be used for:
 * - Admin panel CRUD operations (ports, ships, parties, etc.)
 * - User management operations
 * - Any operations that require bypassing RLS
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client with Service Role key
let supabaseAdmin: SupabaseClient | null = null;

/**
 * Get the Supabase Admin client instance
 * Uses the service role key to bypass RLS
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Supabase Admin: Missing required environment variables');
      console.error('   Required: SUPABASE_URL or VITE_SUPABASE_URL');
      console.error('   Required: SUPABASE_SERVICE_ROLE_KEY');
      throw new Error('Supabase admin credentials not configured');
    }

    // Validate that we're using the service role key (it should be longer than anon key)
    if (supabaseServiceKey.length < 200) {
      console.warn('⚠️  Warning: Service role key seems too short. Make sure you are using the service role key, not the anon key.');
    }

    supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        },
        db: {
          schema: 'public'
        }
      }
    );

    console.log('✅ Supabase Admin client initialized with service role');
  }

  return supabaseAdmin;
}

/**
 * Check if the Supabase Admin client is available
 */
export function isSupabaseAdminAvailable(): boolean {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    return !!(supabaseUrl && supabaseServiceKey);
  } catch {
    return false;
  }
}

/**
 * Helper function to handle Supabase errors consistently
 */
export function handleSupabaseError(error: any, operation: string): never {
  console.error(`Supabase Admin Error during ${operation}:`, error);

  // Check for common Supabase error codes
  if (error?.code === '23505') {
    throw new Error(`Duplicate entry: ${error.message || 'A record with this value already exists'}`);
  }

  if (error?.code === '23503') {
    throw new Error(`Foreign key violation: ${error.message || 'Referenced record does not exist'}`);
  }

  if (error?.code === '23502') {
    throw new Error(`Missing required field: ${error.message || 'A required field was not provided'}`);
  }

  if (error?.code === '42501') {
    throw new Error(`Permission denied: ${error.message || 'Insufficient permissions for this operation'}`);
  }

  // Generic error
  throw new Error(`${operation} failed: ${error?.message || 'Unknown error occurred'}`);
}

/**
 * Test the admin connection and permissions
 */
export async function testAdminConnection(): Promise<boolean> {
  try {
    const admin = getSupabaseAdmin();

    // Try to count profiles (should bypass RLS with service role)
    const { count, error } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Admin connection test failed:', error);
      return false;
    }

    console.log(`✅ Admin connection test successful. Found ${count} profiles.`);
    return true;
  } catch (error) {
    console.error('Admin connection test error:', error);
    return false;
  }
}