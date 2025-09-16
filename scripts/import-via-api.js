import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const supabaseUrl = 'https://bxiiodeyqvqqcgzzqzvt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aWlvZGV5cXZxcWNnenpxenZ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk2NzAyOSwiZXhwIjoyMDczNTQzMDI5fQ.q-doRMuntNVc7aigqBsdxQXMwuCWABDRnJnsSQV0oK0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse SQL INSERT statements to JSON
function parseInsertToJson(sqlStatement) {
  // Extract table name
  const tableMatch = sqlStatement.match(/INSERT INTO (\w+)/);
  if (!tableMatch) return null;
  const tableName = tableMatch[1];

  // Extract columns
  const columnsMatch = sqlStatement.match(/\(([^)]+)\) VALUES/);
  if (!columnsMatch) return null;
  const columns = columnsMatch[1].split(',').map(c => c.trim());

  // Extract values - handle complex nested structures
  const valuesMatch = sqlStatement.match(/VALUES \((.*)\);?$/s);
  if (!valuesMatch) return null;

  // Parse values more carefully
  const valuesStr = valuesMatch[1];
  const values = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      current += char;
      continue;
    }

    if (char === "'" && !escapeNext) {
      inString = !inString;
      current += char;
    } else if (!inString) {
      if (char === '(' || char === '{' || char === '[') {
        depth++;
        current += char;
      } else if (char === ')' || char === '}' || char === ']') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    values.push(current.trim());
  }

  // Convert to object
  const obj = {};
  columns.forEach((col, i) => {
    let val = values[i];
    if (val === 'NULL') {
      obj[col] = null;
    } else if (val.startsWith("'") && val.endsWith("'")) {
      // String value - remove quotes and handle escapes
      val = val.slice(1, -1).replace(/''/g, "'").replace(/\\\\/g, "\\");
      obj[col] = val;
    } else if (val.startsWith('{') || val.startsWith('[')) {
      // JSON value
      try {
        obj[col] = JSON.parse(val);
      } catch {
        obj[col] = val;
      }
    } else if (val === 'true' || val === 'false') {
      obj[col] = val === 'true';
    } else if (!isNaN(val)) {
      obj[col] = val.includes('.') ? parseFloat(val) : parseInt(val);
    } else {
      obj[col] = val;
    }
  });

  return { tableName, data: obj };
}

async function importData() {
  console.log('🚀 Starting Supabase API Import\n');

  try {
    // Read the data file
    const dataSQL = fs.readFileSync('database-export/data.sql', 'utf-8');

    // Parse SQL statements
    const statements = dataSQL
      .split('\n')
      .filter(line => line.trim().startsWith('INSERT INTO'))
      .filter(line => line.trim().length > 0);

    console.log(`📊 Found ${statements.length} records to import\n`);

    // Group by table
    const tableData = {};

    for (const statement of statements) {
      const parsed = parseInsertToJson(statement);
      if (parsed) {
        if (!tableData[parsed.tableName]) {
          tableData[parsed.tableName] = [];
        }
        tableData[parsed.tableName].push(parsed.data);
      }
    }

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    const tables = ['cruise_talent', 'trip_info_sections', 'event_talent', 'events', 'itinerary', 'parties', 'ports', 'talent', 'cruises'];

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().neq('id', 0);
      if (error && error.code !== 'PGRST116') {
        console.log(`  ⚠️  ${table}: ${error.message}`);
      }
    }

    // Import data table by table
    console.log('\n📥 Importing data...');

    const importOrder = ['cruises', 'talent', 'ports', 'parties', 'itinerary', 'events', 'event_talent', 'trip_info_sections', 'cruise_talent'];

    for (const table of importOrder) {
      if (tableData[table] && tableData[table].length > 0) {
        console.log(`  📦 ${table}: ${tableData[table].length} rows...`);

        // Insert in batches of 50
        const batchSize = 50;
        for (let i = 0; i < tableData[table].length; i += batchSize) {
          const batch = tableData[table].slice(i, i + batchSize);

          const { data, error } = await supabase
            .from(table)
            .insert(batch);

          if (error) {
            console.log(`    ❌ Error: ${error.message}`);
            console.log(`    Details: ${JSON.stringify(error.details)}`);
          } else {
            process.stdout.write('.');
          }
        }
        console.log(' ✅');
      }
    }

    // Verify counts
    console.log('\n📋 Verifying import...');

    for (const table of importOrder) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`  ❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(`  ✅ ${table}: ${count} rows`);
      }
    }

    console.log('\n🎉 Import complete!');

  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

// Run import
importData().catch(console.error);