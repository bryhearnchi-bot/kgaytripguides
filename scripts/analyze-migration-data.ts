/**
 * Data Analysis Script for Pre-Migration Preparation
 * Analyzes existing data to prepare mappings for migration
 */

import { db } from '../server/storage';
import * as fs from 'fs';
import * as path from 'path';

async function analyzeData() {
  console.log('=== Pre-Migration Data Analysis ===\n');

  // 1. Analyze Itinerary Locations
  console.log('1. Analyzing Itinerary Locations:');
  console.log('   ------------------------------');

  const itineraries = await db.select().from(itinerary);
  console.log(`   Total itinerary records: ${itineraries.length}`);

  // Check location field
  const locationAnalysis = itineraries.reduce((acc, item) => {
    const loc = item.location || 'EMPTY';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('   Location distribution:');
  Object.entries(locationAnalysis).forEach(([location, count]) => {
    console.log(`     "${location}": ${count} occurrences`);
  });

  // Check if location data is in other fields
  console.log('\n   Sample itinerary records:');
  itineraries.slice(0, 5).forEach((item, index) => {
    console.log(`     [${index + 1}] Day ${item.day}: location="${item.location}", title="${item.title}"`);
  });

  // 2. Analyze Events
  console.log('\n2. Analyzing Events:');
  console.log('   ----------------');

  const events = await db.select().from(eventsTable);
  console.log(`   Total event records: ${events.length}`);

  // Get unique event titles (party types)
  const partyTypes = events.reduce((acc, event) => {
    const title = event.title || 'UNKNOWN';
    acc[title] = (acc[title] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`   Unique party types: ${Object.keys(partyTypes).length}`);
  console.log('   Top 10 party types:');
  Object.entries(partyTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([party, count]) => {
      console.log(`     "${party}": ${count} occurrences`);
    });

  // 3. Analyze Talent Relationships
  console.log('\n3. Analyzing Talent Relationships:');
  console.log('   ------------------------------');

  const cruiseTalentRel = await db.select().from(cruiseTalent);
  console.log(`   Total cruise_talent relationships: ${cruiseTalentRel.length}`);

  const talentData = await db.select().from(talentTable);
  console.log(`   Total talent records: ${talentData.length}`);

  // Check for orphaned relationships
  const talentIds = new Set(talentData.map(t => t.id));
  const orphaned = cruiseTalentRel.filter(rel => !talentIds.has(rel.talentId));
  console.log(`   Orphaned relationships: ${orphaned.length}`);

  // 4. Check for data quality issues
  console.log('\n4. Data Quality Issues:');
  console.log('   --------------------');

  const issues: string[] = [];

  // Check for empty/null values
  const emptyLocations = itineraries.filter(i => !i.location || i.location.trim() === '').length;
  if (emptyLocations > 0) {
    issues.push(`   ⚠️  ${emptyLocations} itinerary items have empty locations`);
  }

  const emptyEventTitles = events.filter(e => !e.title || e.title.trim() === '').length;
  if (emptyEventTitles > 0) {
    issues.push(`   ⚠️  ${emptyEventTitles} events have empty titles`);
  }

  // Check for special characters
  const specialCharPattern = /[<>'"&]/;
  const problematicEvents = events.filter(e => e.title && specialCharPattern.test(e.title));
  if (problematicEvents.length > 0) {
    issues.push(`   ⚠️  ${problematicEvents.length} events have special characters in titles`);
  }

  if (issues.length === 0) {
    console.log('   ✅ No critical data quality issues found');
  } else {
    issues.forEach(issue => console.log(issue));
  }

  // 5. Generate Port Mappings
  console.log('\n5. Generating Port Mappings:');
  console.log('   ------------------------');

  // Since location field seems empty, let's check the title field for actual port names
  const portMapping: Array<{
    original: string;
    name: string;
    country: string;
    region: string;
    port_type: string;
  }> = [];

  // Common Mediterranean ports for cruise itineraries
  const knownPorts = {
    'Athens': { country: 'Greece', region: 'Mediterranean' },
    'Santorini': { country: 'Greece', region: 'Mediterranean' },
    'Mykonos': { country: 'Greece', region: 'Mediterranean' },
    'Istanbul': { country: 'Turkey', region: 'Mediterranean' },
    'Kuşadası': { country: 'Turkey', region: 'Mediterranean' },
    'Kusadasi': { country: 'Turkey', region: 'Mediterranean' }, // Alternative spelling
    'Alexandria': { country: 'Egypt', region: 'Mediterranean' },
    'Iraklion': { country: 'Greece', region: 'Mediterranean' },
    'Heraklion': { country: 'Greece', region: 'Mediterranean' }, // Alternative spelling
    'At Sea': { country: 'N/A', region: 'N/A', port_type: 'sea_day' },
    'Sea Day': { country: 'N/A', region: 'N/A', port_type: 'sea_day' }
  };

  // Extract port names from itinerary titles
  const uniqueTitles = new Set(itineraries.map(i => i.title).filter(Boolean));
  uniqueTitles.forEach(title => {
    // Try to match known ports
    for (const [portName, portInfo] of Object.entries(knownPorts)) {
      if (title && title.toLowerCase().includes(portName.toLowerCase())) {
        portMapping.push({
          original: title,
          name: portName,
          country: portInfo.country,
          region: portInfo.region,
          port_type: portInfo.port_type || 'port'
        });
        break;
      }
    }
  });

  console.log(`   Generated ${portMapping.length} port mappings`);

  // 6. Generate Party Template Mappings
  console.log('\n6. Generating Party Template Mappings:');
  console.log('   -----------------------------------');

  const partyMapping = Object.keys(partyTypes).map(title => {
    // Determine venue type based on title
    let venue_type = 'deck'; // default
    if (title.toLowerCase().includes('pool')) venue_type = 'pool';
    else if (title.toLowerCase().includes('club') || title.toLowerCase().includes('dance')) venue_type = 'club';
    else if (title.toLowerCase().includes('theater') || title.toLowerCase().includes('show')) venue_type = 'theater';

    return {
      original: title,
      name: title,
      theme: title,
      venue_type,
      capacity: venue_type === 'pool' ? 500 : venue_type === 'club' ? 300 : 400
    };
  });

  console.log(`   Generated ${partyMapping.length} party template mappings`);

  // Save mappings to files
  const outputDir = path.join(process.cwd(), 'migration-data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  fs.writeFileSync(
    path.join(outputDir, 'port-mappings.json'),
    JSON.stringify(portMapping, null, 2)
  );

  fs.writeFileSync(
    path.join(outputDir, 'party-mappings.json'),
    JSON.stringify(partyMapping, null, 2)
  );

  console.log('\n7. Mapping Files Created:');
  console.log('   ---------------------');
  console.log('   ✅ migration-data/port-mappings.json');
  console.log('   ✅ migration-data/party-mappings.json');

  // Generate data checksums
  console.log('\n8. Generating Data Checksums:');
  console.log('   --------------------------');

  const checksums: Record<string, string> = {};

  // Generate checksums for each table
  const tables = ['trips', 'itinerary', 'events', 'talent', 'cruise_talent'];

  for (const table of tables) {
    const result = await db.raw(`
      SELECT MD5(CAST((
        SELECT array_to_json(array_agg(row_to_json(t)))
        FROM (SELECT * FROM ${table} ORDER BY id) t
      ) AS text)) as checksum
    `);

    checksums[table] = result.rows[0]?.checksum || 'ERROR';
    console.log(`   ${table}: ${checksums[table]}`);
  }

  fs.writeFileSync(
    path.join(outputDir, 'pre-migration-checksums.json'),
    JSON.stringify(checksums, null, 2)
  );

  console.log('   ✅ migration-data/pre-migration-checksums.json');

  // Summary
  console.log('\n=== Analysis Summary ===');
  console.log(`✅ Analyzed ${itineraries.length} itinerary items`);
  console.log(`✅ Analyzed ${events.length} events`);
  console.log(`✅ Found ${Object.keys(partyTypes).length} unique party types`);
  console.log(`⚠️  Location field issue: Most itineraries have empty location field`);
  console.log(`📝 Recommendation: Use itinerary title field to extract port information`);
  console.log(`📁 All mapping files saved to: ${outputDir}`);

  process.exit(0);
}

// Import statements need adjustment for the actual schema
import { itinerary, events as eventsTable, talent as talentTable, cruiseTalent } from '../server/storage';

analyzeData().catch(console.error);