import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function executeMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log(`${colors.blue}=== Connecting to Railway Database ===${colors.reset}\n`);
    await client.connect();

    // Create migrations tracking table
    console.log(`${colors.yellow}Creating migrations tracking table...${colors.reset}`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        number INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN DEFAULT true,
        UNIQUE(number)
      )
    `);

    // Get list of migrations (skip Drizzle migrations starting with 0000)
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && !f.startsWith('0000'))
      .sort();

    console.log(`${colors.blue}Found ${migrationFiles.length} migration files${colors.reset}\n`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    // Execute each migration
    for (const file of migrationFiles) {
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (!match) continue;

      const number = parseInt(match[1]);
      const name = match[2];

      // Check if already executed
      const result = await client.query(
        'SELECT 1 FROM _migrations WHERE number = $1',
        [number]
      );

      if (result.rows.length > 0) {
        console.log(`${colors.yellow}  Skipping: ${number}_${name} (already executed)${colors.reset}`);
        skipCount++;
        continue;
      }

      console.log(`${colors.blue}  Running: ${number}_${name}...${colors.reset}`);

      try {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

        // Remove BEGIN/COMMIT from SQL as we'll handle transactions here
        const cleanSql = sql
          .replace(/^BEGIN;?\s*/gmi, '')
          .replace(/COMMIT;?\s*$/gmi, '');

        // Start transaction
        await client.query('BEGIN');

        // Execute migration
        await client.query(cleanSql);

        // Record success
        await client.query(
          'INSERT INTO _migrations (number, name, success) VALUES ($1, $2, true)',
          [number, name]
        );

        // Commit transaction
        await client.query('COMMIT');

        console.log(`${colors.green}  ✓ Completed${colors.reset}`);
        successCount++;
      } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');

        console.log(`${colors.red}  ✗ Failed: ${error.message}${colors.reset}`);

        // Record failure
        await client.query(
          'INSERT INTO _migrations (number, name, success) VALUES ($1, $2, false) ON CONFLICT (number) DO UPDATE SET success = false',
          [number, name]
        );

        failCount++;

        // Stop on first failure
        if (process.argv[2] !== '--force') {
          break;
        }
      }
    }

    // Summary
    console.log(`\n${colors.blue}=== Migration Summary ===${colors.reset}`);
    console.log(`${colors.green}  Successful: ${successCount}${colors.reset}`);
    console.log(`${colors.yellow}  Skipped: ${skipCount}${colors.reset}`);
    if (failCount > 0) {
      console.log(`${colors.red}  Failed: ${failCount}${colors.reset}`);
    }

    // Quick verification
    if (failCount === 0) {
      console.log(`\n${colors.blue}Running quick verification...${colors.reset}`);

      const tables = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('ports', 'parties', 'event_talent')
        ORDER BY table_name
      `);

      console.log(`  New tables created: ${tables.rows.map(r => r.table_name).join(', ')}`);

      const portCount = await client.query('SELECT COUNT(*) FROM ports');
      const partyCount = await client.query('SELECT COUNT(*) FROM parties');

      console.log(`  Ports migrated: ${portCount.rows[0].count}`);
      console.log(`  Parties migrated: ${partyCount.rows[0].count}`);
    }

    if (failCount === 0) {
      console.log(`\n${colors.green}✅ All migrations completed successfully!${colors.reset}`);
      process.exit(0);
    } else {
      process.exit(1);
    }

  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migrations
executeMigrations();