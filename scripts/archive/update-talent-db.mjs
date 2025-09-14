import fs from 'fs';

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
  console.log('🔄 Starting database update...\n');

  for (const result of results) {
    if (!result.success) continue;

    const talentName = talentMapping[result.publicId];
    if (!talentName) {
      console.log(`⚠️  No mapping found for ${result.publicId}`);
      continue;
    }

    try {
      console.log(`⬆️  Updating ${talentName}...`);

      const response = await fetch('http://localhost:3000/api/talent/update-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: talentName,
          profileImageUrl: result.url
        })
      });

      if (response.ok) {
        console.log(`✅ Updated: ${talentName} -> ${result.url}`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Failed to update ${talentName}: ${response.status} ${errorText}`);
      }

    } catch (error) {
      console.error(`❌ Error updating ${talentName}:`, error.message);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n🎉 Database update complete!');
  console.log('🔄 Refresh your browser to see the new individual artist images!');
}

updateTalentDatabase();