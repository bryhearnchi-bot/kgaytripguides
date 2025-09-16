import pg from 'pg';
import fs from 'fs';
import path from 'path';

const railwayConfig = {
  connectionString: "postgresql://postgres:ZMxXTsAbduhdjAQmOtdLiMgUuHTMHDMB@trolley.proxy.rlwy.net:16776/railway"
};

const client = new pg.Client(railwayConfig);

async function exportDatabase() {
  console.log('🚀 Exporting Railway Database\n');

  try {
    await client.connect();
    console.log('✅ Connected to Railway database\n');

    const outputDir = path.join(process.cwd(), 'database-export');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Define table export order (respecting foreign key dependencies)
    const tables = [
      'cruises',
      'talent',
      'ports',
      'parties',
      'itinerary',
      'events',
      'event_talent',
      'trip_info_sections',
      'cruise_talent'
    ];

    let schemaSQL = '-- Railway Database Export\n';
    schemaSQL += '-- Generated: ' + new Date().toISOString() + '\n\n';
    schemaSQL += '-- Drop existing tables\n';

    // Add drop statements in reverse order
    for (const table of [...tables].reverse()) {
      schemaSQL += `DROP TABLE IF EXISTS ${table} CASCADE;\n`;
    }
    schemaSQL += '\n';

    // Export schema for each table
    console.log('📋 Exporting schema...');

    for (const table of tables) {
      console.log(`  📦 Exporting ${table} schema...`);

      // Get CREATE TABLE statement (compatible with newer PostgreSQL)
      const schemaQuery = `
        SELECT
          'CREATE TABLE ' || c.relname || ' (' || E'\\n' ||
          array_to_string(
            array_agg(
              '  ' || a.attname || ' ' ||
              pg_catalog.format_type(a.atttypid, a.atttypmod) ||
              CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END ||
              CASE
                WHEN pg_get_expr(d.adbin, d.adrelid) IS NOT NULL
                THEN ' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid)
                ELSE ''
              END
              ORDER BY a.attnum
            ), E',\\n'
          ) || E'\\n);' as create_statement
        FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        LEFT JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
        LEFT JOIN pg_catalog.pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
        WHERE c.relname = $1 AND n.nspname = 'public'
        GROUP BY c.relname;
      `;

      const result = await client.query(schemaQuery, [table]);
      if (result.rows[0]) {
        schemaSQL += `-- Table: ${table}\n`;
        schemaSQL += result.rows[0].create_statement + '\n\n';
      }
    }

    // Export constraints
    console.log('  🔗 Exporting constraints...');

    const constraintsQuery = `
      SELECT
        'ALTER TABLE ' || tc.table_name ||
        ' ADD CONSTRAINT ' || tc.constraint_name ||
        CASE
          WHEN tc.constraint_type = 'PRIMARY KEY' THEN ' PRIMARY KEY (' || string_agg(kcu.column_name, ', ') || ')'
          WHEN tc.constraint_type = 'FOREIGN KEY' THEN
            ' FOREIGN KEY (' || string_agg(DISTINCT kcu.column_name, ', ') || ')' ||
            ' REFERENCES ' || ccu.table_name || '(' || string_agg(DISTINCT ccu.column_name, ', ') || ')'
          WHEN tc.constraint_type = 'UNIQUE' THEN ' UNIQUE (' || string_agg(kcu.column_name, ', ') || ')'
        END || ';' as constraint_sql
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_catalog = kcu.constraint_catalog
        AND tc.constraint_schema = kcu.constraint_schema
        AND tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_catalog = ccu.constraint_catalog
        AND tc.constraint_schema = ccu.constraint_schema
        AND tc.constraint_name = ccu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = ANY($1::text[])
        AND tc.constraint_type IN ('PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE')
      GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type, ccu.table_name
    `;

    const constraints = await client.query(constraintsQuery, [tables]);

    schemaSQL += '-- Constraints\n';
    for (const row of constraints.rows) {
      schemaSQL += row.constraint_sql + '\n';
    }
    schemaSQL += '\n';

    // Export indexes
    console.log('  📑 Exporting indexes...');

    const indexesQuery = `
      SELECT
        'CREATE INDEX ' || i.relname || ' ON ' || t.relname ||
        ' (' || pg_catalog.pg_get_indexdef(i.oid, 0, true) || ');' as index_sql
      FROM pg_catalog.pg_class t
      JOIN pg_catalog.pg_index idx ON t.oid = idx.indrelid
      JOIN pg_catalog.pg_class i ON i.oid = idx.indexrelid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = ANY($1::text[])
        AND NOT idx.indisprimary
        AND NOT idx.indisunique
    `;

    const indexes = await client.query(indexesQuery, [tables]);

    if (indexes.rows.length > 0) {
      schemaSQL += '-- Indexes\n';
      for (const row of indexes.rows) {
        schemaSQL += row.index_sql + '\n';
      }
      schemaSQL += '\n';
    }

    // Save schema
    fs.writeFileSync(path.join(outputDir, 'schema.sql'), schemaSQL);
    console.log('✅ Schema exported to database-export/schema.sql\n');

    // Export data for each table
    console.log('📊 Exporting data...');
    let dataSQL = '-- Data Export\n\n';
    let totalRows = 0;

    for (const table of tables) {
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      const rowCount = parseInt(countResult.rows[0].count);

      if (rowCount > 0) {
        console.log(`  📦 Exporting ${table} (${rowCount} rows)...`);

        // Check if table has id column
        const columnCheck = await client.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'id'
        `, [table]);

        const orderBy = columnCheck.rows.length > 0 ? 'ORDER BY id' : '';
        const dataResult = await client.query(`SELECT * FROM ${table} ${orderBy}`);

        if (dataResult.rows.length > 0) {
          dataSQL += `-- Data for ${table}\n`;

          for (const row of dataResult.rows) {
            const columns = Object.keys(row);
            const values = columns.map(col => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (val instanceof Date) return `'${val.toISOString()}'`;
              if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
              return val;
            });

            dataSQL += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          }

          dataSQL += '\n';
          totalRows += rowCount;
        }
      } else {
        console.log(`  ⏭️  ${table} (empty)`);
      }
    }

    // Save data
    fs.writeFileSync(path.join(outputDir, 'data.sql'), dataSQL);
    console.log(`✅ Data exported to database-export/data.sql (${totalRows} total rows)\n`);

    // Create combined export
    const combinedSQL = schemaSQL + '\n' + dataSQL;
    fs.writeFileSync(path.join(outputDir, 'railway-export.sql'), combinedSQL);
    console.log('✅ Combined export saved to database-export/railway-export.sql\n');

    // Create Supabase migration file
    const supabaseMigration = `-- Supabase Migration Script
-- This script prepares the Railway database for import into Supabase

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

${combinedSQL}

-- Enable Row Level Security on all tables
${tables.map(table => `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`).join('\n')}

-- Create basic RLS policies (adjust as needed)
${tables.map(table => `
-- Policy for ${table}
CREATE POLICY "Enable read access for all users" ON ${table}
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON ${table}
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON ${table}
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON ${table}
  FOR DELETE USING (auth.role() = 'authenticated');
`).join('\n')}
`;

    fs.writeFileSync(path.join(outputDir, 'supabase-import.sql'), supabaseMigration);
    console.log('✅ Supabase import script saved to database-export/supabase-import.sql\n');

    // Generate statistics
    console.log('═══════════════════════════════════════');
    console.log('Export Summary');
    console.log('═══════════════════════════════════════\n');

    for (const table of tables) {
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`  ${table}: ${countResult.rows[0].count} rows`);
    }

    console.log(`\nTotal: ${totalRows} rows exported`);
    console.log('\n✅ Export complete!\n');

    console.log('Next steps:');
    console.log('1. Create a Supabase project at https://app.supabase.com');
    console.log('2. Go to SQL Editor in Supabase dashboard');
    console.log('3. Run the content of database-export/supabase-import.sql');
    console.log('4. Update your .env file with the Supabase connection string');
    console.log('5. Test the application with the new database\n');

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run export
exportDatabase().catch(console.error);