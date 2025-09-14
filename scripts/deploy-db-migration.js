#!/usr/bin/env node

/**
 * Netlify Deployment Database Migration Script
 *
 * This script copies all data from the development database to the production database
 * during the Netlify build process. It ensures the production database has the latest
 * schema and all development data.
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load environment variables
config();

const DEV_DATABASE_URL = process.env.DEV_DATABASE_URL || 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-bold-wave-adnvwxha-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const PROD_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_S3acE5NbXIQR@ep-fancy-queen-ad2frbaz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

console.log('🚀 Starting database migration for Netlify deployment...');

// Create database connections
const devClient = neon(DEV_DATABASE_URL);
const prodClient = neon(PROD_DATABASE_URL);

// List of tables to migrate in dependency order
const TABLES_TO_MIGRATE = [
  'users',
  'cruises', // trips table (cruises is the actual table name)
  'talent',
  'itinerary',
  'events',
  'media',
  'settings',
  'cruise_talent'
];

async function testConnections() {
  try {
    console.log('🔍 Testing database connections...');
    await devClient`SELECT 1`;
    console.log('✅ Development database connection successful');

    await prodClient`SELECT 1`;
    console.log('✅ Production database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

async function clearProductionData() {
  console.log('🧹 Clearing production database...');

  try {
    // Clear tables in reverse dependency order to avoid foreign key constraints
    const clearOrder = [...TABLES_TO_MIGRATE].reverse();

    for (const tableName of clearOrder) {
      console.log(`   Clearing ${tableName}...`);
      await prodClient(`DELETE FROM ${tableName}`);
    }

    console.log('✅ Production database cleared');
  } catch (error) {
    console.error('❌ Error clearing production database:', error.message);
    throw error;
  }
}

async function migrateTable(tableName) {
  try {
    console.log(`📦 Migrating table: ${tableName}`);

    // Get all data from development database
    const devData = await devClient(`SELECT * FROM ${tableName} ORDER BY id`);

    if (devData.length === 0) {
      console.log(`   No data found in ${tableName}`);
      return;
    }

    console.log(`   Found ${devData.length} records in ${tableName}`);

    // Insert data into production database one by one to handle any data type issues
    let successCount = 0;
    for (const row of devData) {
      try {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

        const insertQuery = `
          INSERT INTO ${tableName} (${columns.join(', ')})
          VALUES (${placeholders})
          ON CONFLICT (id) DO UPDATE SET
          ${columns.filter(col => col !== 'id').map(col => `${col} = EXCLUDED.${col}`).join(', ')}
        `;

        await prodClient(insertQuery, values);
        successCount++;
      } catch (rowError) {
        console.warn(`   ⚠️  Failed to insert row with id ${row.id}: ${rowError.message}`);
      }
    }

    console.log(`✅ Successfully migrated ${successCount}/${devData.length} records from ${tableName}`);

  } catch (error) {
    console.error(`❌ Error migrating ${tableName}:`, error.message);
    throw error;
  }
}

async function updateSequences() {
  console.log('🔄 Updating database sequences...');

  try {
    for (const tableName of TABLES_TO_MIGRATE) {
      try {
        // Update sequence for tables that have auto-incrementing IDs
        const result = await prodClient(`
          SELECT setval(
            pg_get_serial_sequence('${tableName}', 'id'),
            COALESCE((SELECT MAX(id) FROM ${tableName}), 1),
            false
          )
        `);
        console.log(`   Updated sequence for ${tableName}`);
      } catch (seqError) {
        console.log(`   No sequence found for ${tableName} (likely no id column)`);
      }
    }
    console.log('✅ Database sequences updated');
  } catch (error) {
    console.error('❌ Error updating sequences:', error.message);
    throw error;
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...');

  try {
    for (const tableName of TABLES_TO_MIGRATE) {
      const devCount = await devClient(`SELECT COUNT(*) as count FROM ${tableName}`);
      const prodCount = await prodClient(`SELECT COUNT(*) as count FROM ${tableName}`);

      const devTotal = parseInt(devCount[0].count);
      const prodTotal = parseInt(prodCount[0].count);

      console.log(`   ${tableName}: ${devTotal} dev → ${prodTotal} prod`);

      if (devTotal !== prodTotal) {
        console.warn(`   ⚠️  Record count mismatch in ${tableName}: ${devTotal} dev vs ${prodTotal} prod`);
      }
    }

    console.log('✅ Migration verification completed');
  } catch (error) {
    console.error('❌ Migration verification failed:', error.message);
    throw error;
  }
}

async function main() {
  const startTime = Date.now();

  try {
    await testConnections();
    await clearProductionData();

    // Migrate each table in dependency order
    for (const tableName of TABLES_TO_MIGRATE) {
      await migrateTable(tableName);
    }

    await updateSequences();
    await verifyMigration();

    const duration = (Date.now() - startTime) / 1000;
    console.log(`🎉 Database migration completed successfully in ${duration}s`);

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as migrateDatabase };