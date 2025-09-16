/**
 * Database Migration Runner
 * Executes all migration scripts in order with proper error handling
 */

import { db } from '../server/storage';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface MigrationFile {
  number: number;
  name: string;
  path: string;
  sql: string;
}

class MigrationRunner {
  private migrations: MigrationFile[] = [];
  private executedMigrations: string[] = [];

  constructor() {
    this.loadMigrations();
  }

  private loadMigrations() {
    const migrationsDir = path.join(process.cwd(), 'migrations');

    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    this.migrations = files.map(file => {
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (!match) {
        throw new Error(`Invalid migration filename: ${file}`);
      }

      return {
        number: parseInt(match[1]),
        name: match[2],
        path: path.join(migrationsDir, file),
        sql: fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      };
    });

    console.log(chalk.blue(`Found ${this.migrations.length} migration files`));
  }

  async checkMigrationTable() {
    // Create migrations tracking table if it doesn't exist
    await db.raw(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        number INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time_ms INTEGER,
        success BOOLEAN DEFAULT true,
        error TEXT,
        UNIQUE(number)
      )
    `);

    // Get already executed migrations
    const result = await db.raw(`
      SELECT number, name FROM _migrations WHERE success = true ORDER BY number
    `);

    this.executedMigrations = result.rows.map((r: any) => `${r.number}_${r.name}`);

    if (this.executedMigrations.length > 0) {
      console.log(chalk.yellow(`Already executed ${this.executedMigrations.length} migrations`));
    }
  }

  async runMigration(migration: MigrationFile): Promise<boolean> {
    const migrationKey = `${migration.number}_${migration.name}`;

    // Check if already executed
    if (this.executedMigrations.includes(migrationKey)) {
      console.log(chalk.gray(`  Skipping: ${migrationKey} (already executed)`));
      return true;
    }

    console.log(chalk.yellow(`  Running: ${migrationKey}...`));
    const startTime = Date.now();

    try {
      // Execute the migration
      await db.raw(migration.sql);

      const executionTime = Date.now() - startTime;

      // Record successful migration
      await db.raw(`
        INSERT INTO _migrations (number, name, execution_time_ms, success)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (number) DO UPDATE
        SET executed_at = CURRENT_TIMESTAMP,
            execution_time_ms = $3,
            success = true,
            error = NULL
      `, [migration.number, migration.name, executionTime]);

      console.log(chalk.green(`  ✓ Completed in ${executionTime}ms`));
      return true;

    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      // Record failed migration
      await db.raw(`
        INSERT INTO _migrations (number, name, execution_time_ms, success, error)
        VALUES ($1, $2, $3, false, $4)
        ON CONFLICT (number) DO UPDATE
        SET executed_at = CURRENT_TIMESTAMP,
            execution_time_ms = $3,
            success = false,
            error = $4
      `, [migration.number, migration.name, executionTime, error.message]);

      console.log(chalk.red(`  ✗ Failed after ${executionTime}ms`));
      console.log(chalk.red(`    Error: ${error.message}`));
      return false;
    }
  }

  async run(options: { dryRun?: boolean; force?: boolean } = {}) {
    console.log(chalk.blue.bold('\n=== Database Migration Starting ===\n'));

    if (options.dryRun) {
      console.log(chalk.yellow('DRY RUN MODE - No changes will be made\n'));
    }

    try {
      // Check migration tracking table
      await this.checkMigrationTable();

      // Count pending migrations
      const pendingMigrations = this.migrations.filter(m =>
        !this.executedMigrations.includes(`${m.number}_${m.name}`)
      );

      if (pendingMigrations.length === 0) {
        console.log(chalk.green('All migrations are already up to date!'));
        return true;
      }

      console.log(chalk.blue(`\nExecuting ${pendingMigrations.length} pending migrations:\n`));

      // Run each migration
      let successCount = 0;
      let failCount = 0;

      for (const migration of this.migrations) {
        if (options.dryRun) {
          console.log(chalk.gray(`  Would run: ${migration.number}_${migration.name}`));
          successCount++;
        } else {
          const success = await this.runMigration(migration);
          if (success) {
            successCount++;
          } else {
            failCount++;
            if (!options.force) {
              console.log(chalk.red('\nMigration failed. Stopping execution.'));
              break;
            }
          }
        }
      }

      // Summary
      console.log(chalk.blue.bold('\n=== Migration Summary ===\n'));
      console.log(chalk.green(`  Successful: ${successCount}`));
      if (failCount > 0) {
        console.log(chalk.red(`  Failed: ${failCount}`));
      }

      // Run verification if all succeeded
      if (failCount === 0 && !options.dryRun) {
        console.log(chalk.blue('\nRunning post-migration verification...\n'));

        // Check if verification script exists
        const verifyScriptPath = path.join(process.cwd(), 'scripts/verify-migration.ts');
        if (fs.existsSync(verifyScriptPath)) {
          const { MigrationVerifier } = await import('./verify-migration');
          const verifier = new MigrationVerifier();
          const verificationPassed = await verifier.verify();

          if (!verificationPassed) {
            console.log(chalk.yellow('\n⚠️  Some verification checks failed. Please review.'));
            return false;
          }
        }
      }

      return failCount === 0;

    } catch (error: any) {
      console.error(chalk.red('Migration runner failed:'), error);
      return false;
    }
  }

  async rollback(toMigration?: number) {
    console.log(chalk.blue.bold('\n=== Database Rollback Starting ===\n'));

    // This would implement rollback functionality
    // For now, we'll just warn that manual rollback is needed
    console.log(chalk.yellow('Automatic rollback not yet implemented.'));
    console.log(chalk.yellow('To rollback, restore from backup using:'));
    console.log(chalk.gray('  ./scripts/restore-database.sh --latest'));
  }

  async status() {
    await this.checkMigrationTable();

    console.log(chalk.blue.bold('\n=== Migration Status ===\n'));

    for (const migration of this.migrations) {
      const migrationKey = `${migration.number}_${migration.name}`;
      const isExecuted = this.executedMigrations.includes(migrationKey);

      if (isExecuted) {
        console.log(chalk.green(`  ✓ ${migrationKey}`));
      } else {
        console.log(chalk.gray(`  ○ ${migrationKey} (pending)`));
      }
    }

    const pendingCount = this.migrations.length - this.executedMigrations.length;
    console.log(chalk.blue(`\nTotal: ${this.migrations.length} migrations`));
    console.log(chalk.green(`Executed: ${this.executedMigrations.length}`));
    console.log(chalk.yellow(`Pending: ${pendingCount}`));
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'run';

  const runner = new MigrationRunner();

  try {
    switch (command) {
      case 'run':
        const success = await runner.run({
          dryRun: args.includes('--dry-run'),
          force: args.includes('--force')
        });
        process.exit(success ? 0 : 1);
        break;

      case 'status':
        await runner.status();
        process.exit(0);
        break;

      case 'rollback':
        const toMigration = args[1] ? parseInt(args[1]) : undefined;
        await runner.rollback(toMigration);
        process.exit(0);
        break;

      case 'help':
      default:
        console.log('Usage: npx tsx scripts/run-migration.ts [command] [options]');
        console.log('\nCommands:');
        console.log('  run       Run pending migrations (default)');
        console.log('  status    Show migration status');
        console.log('  rollback  Rollback to a specific migration');
        console.log('  help      Show this help message');
        console.log('\nOptions:');
        console.log('  --dry-run  Show what would be executed without making changes');
        console.log('  --force    Continue even if a migration fails');
        process.exit(0);
    }
  } catch (error) {
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MigrationRunner };