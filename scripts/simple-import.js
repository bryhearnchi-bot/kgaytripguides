// Simple import script that creates individual INSERT statements
import fs from 'fs';

// Read the data file
const dataSQL = fs.readFileSync('database-export/data.sql', 'utf-8');

// Split into individual INSERT statements
const statements = dataSQL
  .split('\n')
  .filter(line => line.trim().startsWith('INSERT INTO'))
  .filter(line => line.trim().length > 0);

console.log(`Found ${statements.length} INSERT statements\n`);

// Group by table
const tables = {};
statements.forEach(stmt => {
  const match = stmt.match(/INSERT INTO (\w+)/);
  if (match) {
    const table = match[1];
    if (!tables[table]) tables[table] = [];
    tables[table].push(stmt);
  }
});

// Output statistics and create batch files
console.log('Table breakdown:');
Object.entries(tables).forEach(([table, stmts]) => {
  console.log(`  ${table}: ${stmts.length} rows`);

  // Write each table's data to a separate file
  fs.writeFileSync(`/tmp/import_${table}.sql`, stmts.join('\n'));
});

console.log('\nCreated import files in /tmp/');
console.log('\nTo import via MCP, run each table individually:');
console.log('1. First import talent: /tmp/import_talent.sql');
console.log('2. Then ports: /tmp/import_ports.sql');
console.log('3. Then parties: /tmp/import_parties.sql');
console.log('4. Then itinerary: /tmp/import_itinerary.sql');
console.log('5. Then events: /tmp/import_events.sql');
console.log('6. Finally junction tables: event_talent, cruise_talent, trip_info_sections');