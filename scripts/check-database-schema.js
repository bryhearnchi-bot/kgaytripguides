#!/usr/bin/env node

// Load environment variables
import { config } from 'dotenv';
config();

import postgres from 'postgres';

async function checkDatabaseSchema() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const sql = postgres(DATABASE_URL);

  try {
    console.log('🔍 Checking database schema...');

    // Check all tables
    const tables = await sql`
      SELECT
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    console.log('\n📋 Existing tables:');
    tables.forEach(table => {
      console.log(`  • ${table.table_name} (${table.table_type})`);
    });

    // Check existing indexes
    const indexes = await sql`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;

    console.log(`\n🗂️ Existing indexes (${indexes.length} total):`);
    const indexByTable = {};
    indexes.forEach(idx => {
      if (!indexByTable[idx.tablename]) {
        indexByTable[idx.tablename] = [];
      }
      indexByTable[idx.tablename].push(idx.indexname);
    });

    Object.keys(indexByTable).sort().forEach(tableName => {
      console.log(`  ${tableName}:`);
      indexByTable[tableName].forEach(indexName => {
        console.log(`    • ${indexName}`);
      });
    });

    // Check foreign key constraints
    const foreignKeys = await sql`
      SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name;
    `;

    console.log(`\n🔗 Foreign key constraints (${foreignKeys.length} total):`);
    foreignKeys.forEach(fk => {
      console.log(`  • ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

    // Check check constraints
    const checkConstraints = await sql`
      SELECT
        tc.table_name,
        tc.constraint_name,
        cc.check_clause
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.constraint_type = 'CHECK'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name;
    `;

    console.log(`\n✅ Check constraints (${checkConstraints.length} total):`);
    checkConstraints.forEach(check => {
      console.log(`  • ${check.table_name}.${check.constraint_name}`);
      console.log(`    ${check.check_clause}`);
    });

  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkDatabaseSchema().catch(console.error);