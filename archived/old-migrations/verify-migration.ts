/**
 * Migration Verification Script
 * Validates data integrity after migration
 */

import { db } from '../server/storage';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

interface VerificationResult {
  passed: boolean;
  message: string;
  details?: any;
}

class MigrationVerifier {
  private results: VerificationResult[] = [];
  private preMigrationChecksums: Record<string, string> = {};

  constructor() {
    // Load pre-migration checksums if they exist
    const checksumFile = path.join(process.cwd(), 'migration-data/pre-migration-checksums.json');
    if (fs.existsSync(checksumFile)) {
      this.preMigrationChecksums = JSON.parse(fs.readFileSync(checksumFile, 'utf-8'));
    }
  }

  async verify(): Promise<boolean> {
    console.log(chalk.blue.bold('\n=== Migration Verification Starting ===\n'));

    // Run all verification checks
    await this.verifyDatabaseStructure();
    await this.verifyDataIntegrity();
    await this.verifyRelationships();
    await this.verifyPerformance();
    await this.verifyDataMigration();

    // Print results
    this.printResults();

    // Return overall status
    const allPassed = this.results.every(r => r.passed);
    return allPassed;
  }

  private async verifyDatabaseStructure() {
    console.log(chalk.yellow('Verifying Database Structure...'));

    // Check for new tables
    const tables = ['ports', 'parties', 'event_talent'];

    for (const table of tables) {
      try {
        const result = await db.raw(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = ?
          )
        `, [table]);

        const exists = result.rows[0].exists;
        this.results.push({
          passed: exists,
          message: `Table '${table}' ${exists ? 'exists' : 'does not exist'}`,
        });
      } catch (error) {
        this.results.push({
          passed: false,
          message: `Failed to check table '${table}'`,
          details: error
        });
      }
    }

    // Check for new columns
    const columnChecks = [
      { table: 'itinerary', column: 'port_id' },
      { table: 'events', column: 'party_id' }
    ];

    for (const check of columnChecks) {
      try {
        const result = await db.raw(`
          SELECT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = ? AND column_name = ?
          )
        `, [check.table, check.column]);

        const exists = result.rows[0].exists;
        this.results.push({
          passed: exists,
          message: `Column '${check.table}.${check.column}' ${exists ? 'exists' : 'does not exist'}`,
        });
      } catch (error) {
        this.results.push({
          passed: false,
          message: `Failed to check column '${check.table}.${check.column}'`,
          details: error
        });
      }
    }

    // Check indexes
    const indexes = [
      'itinerary_port_id_idx',
      'events_party_id_idx',
      'event_talent_event_id_idx',
      'event_talent_talent_id_idx'
    ];

    for (const indexName of indexes) {
      try {
        const result = await db.raw(`
          SELECT EXISTS (
            SELECT FROM pg_indexes
            WHERE indexname = ?
          )
        `, [indexName]);

        const exists = result.rows[0].exists;
        this.results.push({
          passed: exists,
          message: `Index '${indexName}' ${exists ? 'exists' : 'does not exist'}`,
        });
      } catch (error) {
        this.results.push({
          passed: false,
          message: `Failed to check index '${indexName}'`,
          details: error
        });
      }
    }
  }

  private async verifyDataIntegrity() {
    console.log(chalk.yellow('Verifying Data Integrity...'));

    // Check record counts
    const tables = ['trips', 'itinerary', 'events', 'talent'];

    for (const table of tables) {
      try {
        const result = await db.raw(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(result.rows[0].count);

        // Compare with baseline (from our earlier analysis)
        const expectedCounts: Record<string, number> = {
          trips: 2,
          itinerary: 17,
          events: 66,
          talent: 31
        };

        const expected = expectedCounts[table];
        const passed = count === expected;

        this.results.push({
          passed,
          message: `Table '${table}' has ${count} records (expected: ${expected})`,
          details: { actual: count, expected }
        });
      } catch (error) {
        this.results.push({
          passed: false,
          message: `Failed to count records in '${table}'`,
          details: error
        });
      }
    }

    // Check for data loss
    try {
      // Check if all talent still have images
      const talentWithImages = await db.raw(`
        SELECT COUNT(*) as count
        FROM talent
        WHERE profile_image_url IS NOT NULL AND profile_image_url != ''
      `);

      const imageCount = parseInt(talentWithImages.rows[0].count);
      this.results.push({
        passed: imageCount === 31,
        message: `Talent with images: ${imageCount}/31`,
        details: { imageCount }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Failed to verify talent images',
        details: error
      });
    }
  }

  private async verifyRelationships() {
    console.log(chalk.yellow('Verifying Relationships...'));

    // Check foreign key integrity
    try {
      // Check itinerary -> ports relationship
      const orphanedItineraries = await db.raw(`
        SELECT COUNT(*) as count
        FROM itinerary i
        WHERE i.port_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM ports p WHERE p.id = i.port_id
          )
      `);

      const orphanCount = parseInt(orphanedItineraries.rows[0].count);
      this.results.push({
        passed: orphanCount === 0,
        message: `Orphaned itinerary items: ${orphanCount}`,
        details: { orphanCount }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Failed to check itinerary relationships',
        details: error
      });
    }

    try {
      // Check events -> parties relationship
      const orphanedEvents = await db.raw(`
        SELECT COUNT(*) as count
        FROM events e
        WHERE e.party_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM parties p WHERE p.id = e.party_id
          )
      `);

      const orphanCount = parseInt(orphanedEvents.rows[0].count);
      this.results.push({
        passed: orphanCount === 0,
        message: `Orphaned events: ${orphanCount}`,
        details: { orphanCount }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Failed to check event relationships',
        details: error
      });
    }

    // Check event_talent relationships
    try {
      const eventTalentCount = await db.raw(`
        SELECT COUNT(*) as count FROM event_talent
      `);

      const count = parseInt(eventTalentCount.rows[0].count);
      const expected = 31; // From cruise_talent

      this.results.push({
        passed: count >= expected,
        message: `Event-talent relationships: ${count} (expected minimum: ${expected})`,
        details: { actual: count, expected }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Failed to check event-talent relationships',
        details: error
      });
    }
  }

  private async verifyPerformance() {
    console.log(chalk.yellow('Verifying Performance...'));

    const performanceTests = [
      {
        name: 'Simple port lookup',
        query: `SELECT * FROM ports WHERE name = 'Athens'`,
        threshold: 10 // milliseconds
      },
      {
        name: 'Join query performance',
        query: `
          SELECT i.*, p.name as port_name
          FROM itinerary i
          JOIN ports p ON i.port_id = p.id
          WHERE i.trip_id = 1
        `,
        threshold: 50
      },
      {
        name: 'Complex aggregation',
        query: `
          SELECT p.*, COUNT(i.id) as usage_count
          FROM ports p
          LEFT JOIN itinerary i ON i.port_id = p.id
          GROUP BY p.id
        `,
        threshold: 100
      }
    ];

    for (const test of performanceTests) {
      try {
        const start = Date.now();
        await db.raw(test.query);
        const duration = Date.now() - start;

        this.results.push({
          passed: duration <= test.threshold,
          message: `${test.name}: ${duration}ms (threshold: ${test.threshold}ms)`,
          details: { duration, threshold: test.threshold }
        });
      } catch (error) {
        this.results.push({
          passed: false,
          message: `Performance test '${test.name}' failed`,
          details: error
        });
      }
    }
  }

  private async verifyDataMigration() {
    console.log(chalk.yellow('Verifying Data Migration...'));

    // Check if ports were created
    try {
      const ports = await db.raw(`SELECT COUNT(*) as count FROM ports`);
      const portCount = parseInt(ports.rows[0].count);

      this.results.push({
        passed: portCount > 0,
        message: `Ports table has ${portCount} records`,
        details: { portCount }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Failed to verify ports migration',
        details: error
      });
    }

    // Check if parties were created
    try {
      const parties = await db.raw(`SELECT COUNT(*) as count FROM parties`);
      const partyCount = parseInt(parties.rows[0].count);

      this.results.push({
        passed: partyCount > 0,
        message: `Parties table has ${partyCount} records`,
        details: { partyCount }
      });
    } catch (error) {
      this.results.push({
        passed: false,
        message: 'Failed to verify parties migration',
        details: error
      });
    }

    // Verify checksum if available
    if (Object.keys(this.preMigrationChecksums).length > 0) {
      console.log(chalk.yellow('Verifying data checksums...'));

      for (const [table, expectedChecksum] of Object.entries(this.preMigrationChecksums)) {
        if (table === 'cruise_talent') continue; // This table was replaced

        try {
          const result = await db.raw(`
            SELECT MD5(CAST((
              SELECT array_to_json(array_agg(row_to_json(t)))
              FROM (SELECT * FROM ${table} ORDER BY id) t
            ) AS text)) as checksum
          `);

          const actualChecksum = result.rows[0]?.checksum;
          const passed = actualChecksum === expectedChecksum;

          this.results.push({
            passed,
            message: `Checksum for '${table}': ${passed ? 'matches' : 'mismatch'}`,
            details: { expected: expectedChecksum, actual: actualChecksum }
          });
        } catch (error) {
          this.results.push({
            passed: false,
            message: `Failed to verify checksum for '${table}'`,
            details: error
          });
        }
      }
    }
  }

  private printResults() {
    console.log(chalk.blue.bold('\n=== Verification Results ===\n'));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    // Group results by status
    const passedResults = this.results.filter(r => r.passed);
    const failedResults = this.results.filter(r => !r.passed);

    // Print passed checks
    if (passedResults.length > 0) {
      console.log(chalk.green.bold('✅ Passed Checks:'));
      passedResults.forEach(r => {
        console.log(chalk.green(`   ✓ ${r.message}`));
      });
      console.log();
    }

    // Print failed checks
    if (failedResults.length > 0) {
      console.log(chalk.red.bold('❌ Failed Checks:'));
      failedResults.forEach(r => {
        console.log(chalk.red(`   ✗ ${r.message}`));
        if (r.details && process.env.VERBOSE) {
          console.log(chalk.gray(`      Details: ${JSON.stringify(r.details, null, 2)}`));
        }
      });
      console.log();
    }

    // Summary
    console.log(chalk.blue.bold('Summary:'));
    console.log(`   Total Checks: ${total}`);
    console.log(chalk.green(`   Passed: ${passed}`));
    console.log(chalk.red(`   Failed: ${failed}`));
    console.log(`   Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    // Overall status
    console.log();
    if (failed === 0) {
      console.log(chalk.green.bold('✅ MIGRATION VERIFICATION PASSED'));
    } else {
      console.log(chalk.red.bold('❌ MIGRATION VERIFICATION FAILED'));
      console.log(chalk.yellow('\nPlease review failed checks and fix issues before proceeding.'));
    }

    // Save results to file
    const resultsFile = path.join(process.cwd(), 'migration-data/verification-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      passed,
      failed,
      total,
      successRate: (passed / total) * 100,
      results: this.results
    }, null, 2));

    console.log(chalk.gray(`\nDetailed results saved to: ${resultsFile}`));
  }
}

// Run verification
async function main() {
  try {
    const verifier = new MigrationVerifier();
    const success = await verifier.verify();

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error(chalk.red('Verification failed with error:'), error);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  main();
}

export { MigrationVerifier };