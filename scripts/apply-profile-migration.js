#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  const { config } = await import('dotenv');
  config({ path: join(__dirname, '..', '.env') });
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL);

async function applyProfileMigration() {
  try {
    console.log('🚀 Applying profile fields migration...');

    // Read migration SQL
    const migrationSQL = readFileSync(
      join(__dirname, 'add-profile-fields-migration.sql'),
      'utf-8'
    );

    // Execute migration
    await client.unsafe(migrationSQL);

    console.log('✅ Profile fields migration completed successfully');

    // Verify the new columns exist
    const result = await client`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'profiles'
      AND column_name IN (
        'phone_number', 'bio', 'location', 'communication_preferences',
        'cruise_updates_opt_in', 'marketing_emails', 'last_sign_in_at'
      )
      ORDER BY column_name;
    `;

    console.log('📋 New profile columns:');
    result.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });

    await client.end();
    console.log('🎉 Migration verification complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    await client.end();
    process.exit(1);
  }
}

applyProfileMigration();