import fs from 'fs';
import Database from 'better-sqlite3';

// Read the upload results
const results = JSON.parse(fs.readFileSync('talent-upload-results.json', 'utf8'));

// Mapping from publicId to talent name in database
const talentMapping = {
  'audra-mcdonald': 'Audra McDonald',
  'monet-x-change': 'Monét X Change',
  'alexis-michelle': 'Alexis Michelle',
  'leona-winter': 'Leona Winter',
  'sherry-vine': 'Sherry Vine',
  'reuben-kaye': 'Reuben Kaye',
  'rob-houchen': 'Rob Houchen',
  'alyssa-wray': 'Alyssa Wray',
  'brad-loekle': 'Brad Loekle',
  'rachel-scanlon': 'Rachel Scanlon',
  'daniel-webb': 'Daniel Webb',
  'airotic': 'AirOtic',
  'another-rose': 'Another Rose',
  'persephone': 'Persephone',
  'the-diva-bingo': 'The Diva Bingo',
  'abel': 'Abel',
  'dan-slater': 'Dan Slater',
  'dj-suri': 'DJ Suri',
  'gsp': 'GSP',
  'william-tn-hall': 'William TN Hall',
  'brian-nash': 'Brian Nash',
  'brandon-james-gwinn': 'Brandon James Gwinn'
};

async function updateTalentDatabase() {
  console.log('🔄 Starting direct SQL database update...\n');

  // Open the database
  const db = new Database('cruise-guide.db');

  // Check if table exists and see current data
  const talentCount = db.prepare('SELECT COUNT(*) as count FROM talent').get();
  console.log(`Found ${talentCount.count} talent records in database\n`);

  let updateCount = 0;
  let errorCount = 0;

  // Prepare the update statement
  const updateStmt = db.prepare('UPDATE talent SET profileImageUrl = ?, updatedAt = datetime("now") WHERE name = ?');

  for (const result of results) {
    if (!result.success) continue;

    const talentName = talentMapping[result.publicId];
    if (!talentName) {
      console.log(`⚠️  No mapping found for ${result.publicId}`);
      continue;
    }

    try {
      console.log(`⬆️  Updating ${talentName}...`);

      const updateResult = updateStmt.run(result.url, talentName);

      if (updateResult.changes > 0) {
        console.log(`✅ Updated: ${talentName} -> ${result.url}`);
        updateCount++;
      } else {
        console.log(`⚠️  No rows updated for ${talentName} - name might not match exactly`);
      }

    } catch (error) {
      console.error(`❌ Error updating ${talentName}:`, error.message);
      errorCount++;
    }
  }

  // Close database
  db.close();

  console.log('\n🎉 Database update complete!');
  console.log(`✅ Successfully updated: ${updateCount} artists`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} artists`);
  }
  console.log('\n🔄 Refresh your browser to see the individual artist images!');
}

updateTalentDatabase().catch(console.error);