#!/usr/bin/env node
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function validateMigration() {
  console.log('🔍 Starting Migration Validation...\n');

  try {
    await client.connect();

    const validationResults = [];
    let allPassed = true;

    // Test 1: Check ports table exists and has data
    console.log('1️⃣  Validating ports table...');
    const portsResult = await client.query('SELECT COUNT(*) as count FROM ports');
    const portsCount = parseInt(portsResult.rows[0].count);
    if (portsCount > 0) {
      console.log(`   ✅ Ports table has ${portsCount} records`);
      validationResults.push({ test: 'Ports table', status: 'PASS', count: portsCount });
    } else {
      console.log('   ❌ Ports table is empty');
      validationResults.push({ test: 'Ports table', status: 'FAIL', count: 0 });
      allPassed = false;
    }

    // Test 2: Check parties table exists and has data
    console.log('2️⃣  Validating parties table...');
    const partiesResult = await client.query('SELECT COUNT(*) as count FROM parties');
    const partiesCount = parseInt(partiesResult.rows[0].count);
    if (partiesCount > 0) {
      console.log(`   ✅ Parties table has ${partiesCount} records`);
      validationResults.push({ test: 'Parties table', status: 'PASS', count: partiesCount });
    } else {
      console.log('   ❌ Parties table is empty');
      validationResults.push({ test: 'Parties table', status: 'FAIL', count: 0 });
      allPassed = false;
    }

    // Test 3: Check event_talent table exists
    console.log('3️⃣  Validating event_talent junction table...');
    const eventTalentResult = await client.query('SELECT COUNT(*) as count FROM event_talent');
    const eventTalentCount = parseInt(eventTalentResult.rows[0].count);
    console.log(`   ✅ Event_talent table has ${eventTalentCount} relationships`);
    validationResults.push({ test: 'Event_talent table', status: 'PASS', count: eventTalentCount });

    // Test 4: Check itinerary port_id foreign keys
    console.log('4️⃣  Validating itinerary port links...');
    const itineraryResult = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(port_id) as with_port_id,
        COUNT(CASE WHEN port_id IS NULL THEN 1 END) as without_port_id
      FROM itinerary
    `);
    const itineraryStats = itineraryResult.rows[0];
    const linkPercentage = (itineraryStats.with_port_id / itineraryStats.total * 100).toFixed(1);
    if (itineraryStats.with_port_id > 0) {
      console.log(`   ✅ ${itineraryStats.with_port_id}/${itineraryStats.total} itinerary items linked to ports (${linkPercentage}%)`);
      validationResults.push({ test: 'Itinerary port links', status: 'PASS', percentage: linkPercentage });
    } else {
      console.log(`   ❌ No itinerary items linked to ports`);
      validationResults.push({ test: 'Itinerary port links', status: 'FAIL', percentage: 0 });
      allPassed = false;
    }

    // Test 5: Check events party_id foreign keys
    console.log('5️⃣  Validating event party links...');
    const eventsResult = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(party_id) as with_party_id
      FROM events
    `);
    const eventsStats = eventsResult.rows[0];
    const partyPercentage = (eventsStats.with_party_id / eventsStats.total * 100).toFixed(1);
    console.log(`   ✅ ${eventsStats.with_party_id}/${eventsStats.total} events linked to parties (${partyPercentage}%)`);
    validationResults.push({ test: 'Event party links', status: 'PASS', percentage: partyPercentage });

    // Test 6: Check referential integrity
    console.log('6️⃣  Validating referential integrity...');

    // Check for orphaned port_ids
    const orphanedPorts = await client.query(`
      SELECT COUNT(*) as count
      FROM itinerary
      WHERE port_id IS NOT NULL
        AND port_id NOT IN (SELECT id FROM ports)
    `);
    const orphanedPortsCount = parseInt(orphanedPorts.rows[0].count);

    // Check for orphaned party_ids
    const orphanedParties = await client.query(`
      SELECT COUNT(*) as count
      FROM events
      WHERE party_id IS NOT NULL
        AND party_id NOT IN (SELECT id FROM parties)
    `);
    const orphanedPartiesCount = parseInt(orphanedParties.rows[0].count);

    if (orphanedPortsCount === 0 && orphanedPartiesCount === 0) {
      console.log(`   ✅ No orphaned foreign keys found`);
      validationResults.push({ test: 'Referential integrity', status: 'PASS' });
    } else {
      console.log(`   ❌ Found orphaned foreign keys (${orphanedPortsCount} ports, ${orphanedPartiesCount} parties)`);
      validationResults.push({ test: 'Referential integrity', status: 'FAIL' });
      allPassed = false;
    }

    // Test 7: Performance check - Simple query
    console.log('7️⃣  Checking query performance...');
    const perfStart = Date.now();
    await client.query(`
      SELECT i.*, p.name as port_name, p.country
      FROM itinerary i
      LEFT JOIN ports p ON i.port_id = p.id
      WHERE i.cruise_id = 7
      ORDER BY i.order_index
    `);
    const queryTime = Date.now() - perfStart;
    if (queryTime < 100) {
      console.log(`   ✅ Query executed in ${queryTime}ms (threshold: 100ms)`);
      validationResults.push({ test: 'Query performance', status: 'PASS', time: queryTime });
    } else {
      console.log(`   ⚠️  Query took ${queryTime}ms (threshold: 100ms)`);
      validationResults.push({ test: 'Query performance', status: 'WARNING', time: queryTime });
    }

    // Test 8: Check indexes exist
    console.log('8️⃣  Validating indexes...');
    const indexesResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename IN ('itinerary', 'events', 'ports', 'parties', 'event_talent')
        AND indexname LIKE '%idx%'
    `);
    const indexCount = indexesResult.rows.length;
    if (indexCount > 0) {
      console.log(`   ✅ Found ${indexCount} custom indexes`);
      validationResults.push({ test: 'Indexes', status: 'PASS', count: indexCount });
    } else {
      console.log(`   ⚠️  No custom indexes found`);
      validationResults.push({ test: 'Indexes', status: 'WARNING', count: 0 });
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(50));

    validationResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${icon} ${result.test}: ${result.status}`);
    });

    console.log('\n' + '='.repeat(50));
    if (allPassed) {
      console.log('🎉 All critical validations PASSED!');
      console.log('✅ Migration is valid and ready for cutover');
    } else {
      console.log('⚠️  Some validations failed');
      console.log('❌ Please fix issues before cutover');
    }
    console.log('='.repeat(50));

    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('❌ Validation error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

validateMigration();