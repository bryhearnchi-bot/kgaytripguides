import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import from the server
const { talentStorage } = await import(resolve(__dirname, 'server/storage.ts'));

// Wait for import to complete
await new Promise(resolve => setTimeout(resolve, 100));

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
  'the-diva-bingo': 'The Diva (Bingo)',
  'abel': 'Abel',
  'dan-slater': 'Dan Slater',
  'dj-suri': 'DJ Suri',
  'gsp': 'GSP',
  'william-tn-hall': 'William TN Hall',
  'brian-nash': 'Brian Nash',
  'brandon-james-gwinn': 'Brandon James Gwinn'
};

async function updateTalentDatabase() {
  console.log('🔄 Starting direct database update...\n');

  // Get all talent to find their IDs
  const allTalent = await talentStorage.getAllTalent();
  const talentIdMap = new Map();

  allTalent.forEach(t => {
    talentIdMap.set(t.name, t.id);
  });

  console.log(`Found ${allTalent.length} talent records in database\n`);

  let updateCount = 0;
  let errorCount = 0;

  for (const result of results) {
    if (!result.success) continue;

    const talentName = talentMapping[result.publicId];
    if (!talentName) {
      console.log(`⚠️  No mapping found for ${result.publicId}`);
      continue;
    }

    const talentId = talentIdMap.get(talentName);
    if (!talentId) {
      console.log(`⚠️  No talent ID found for ${talentName}`);
      continue;
    }

    try {
      console.log(`⬆️  Updating ${talentName} (ID: ${talentId})...`);

      await talentStorage.updateTalent(talentId, {
        profileImageUrl: result.url
      });

      console.log(`✅ Updated: ${talentName} -> ${result.url}`);
      updateCount++;

    } catch (error) {
      console.error(`❌ Error updating ${talentName}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n🎉 Database update complete!');
  console.log(`✅ Successfully updated: ${updateCount} artists`);
  if (errorCount > 0) {
    console.log(`❌ Errors: ${errorCount} artists`);
  }
  console.log('\n🔄 Refresh your browser to see the individual artist images!');
}

updateTalentDatabase().catch(console.error);