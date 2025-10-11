import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Location data with attractions and LGBT venues
const locationData = {
  // Athens (Piraeus), Greece - ID: 1
  1: {
    top_attractions: [
      'Marina Zeas (Zea Marina)',
      'Kastella Hill with Profitis Ilias Church',
      'Mikrolimano (Little Port)',
    ],
    top_lgbt_venues: ['Big Bar Athens', 'Rooster Café', 'Shamone Club'],
  },
  // Santorini, Greece - ID: 2
  2: {
    top_attractions: ['Oia', 'Fira (Capital)', 'Akrotiri Archaeological Site'],
    top_lgbt_venues: ['Theros Wave Bar', "Murphy's Bar", 'Crystal Cocktail Bar'],
  },
  // Mykonos, Greece - ID: 3
  3: {
    top_attractions: ['Little Venice (Alefkandra)', 'Panagia Paraportiani Church', 'Elia Beach'],
    top_lgbt_venues: ["Jackie O' Town Bar", 'Porta Bar', 'At54 Lounge & Club'],
  },
  // Istanbul, Turkey - ID: 4
  4: {
    top_attractions: ['Hagia Sophia', 'Blue Mosque (Sultan Ahmed Mosque)', 'Topkapi Palace'],
    top_lgbt_venues: ['Tek Yön Club', 'Mor Kedi Cafe & Bar', 'Pinokyo Bar'],
  },
  // Kuşadası, Turkey - ID: 5
  5: {
    top_attractions: [
      'Ephesus Ancient City',
      'House of the Virgin Mary',
      'Kusadasi Castle (Pigeon Island)',
    ],
    top_lgbt_venues: [
      'Club Love Sensation',
      'Fistik Bar',
      'Barlar Sokagi (Bar Street - various gay-friendly venues)',
    ],
  },
  // Cairo (Alexandria), Egypt - ID: 6
  6: {
    top_attractions: [
      'Citadel of Qaitbay',
      'Bibliotheca Alexandrina',
      'Catacombs of Kom El Shoqafa',
    ],
    top_lgbt_venues: [
      'Note: No openly LGBT venues due to safety concerns',
      'LGBTQ+ travelers should exercise extreme caution',
      'Consult LGBT travel organizations before visiting',
    ],
  },
  // Iraklion (Heraklion), Greece - ID: 7
  7: {
    top_attractions: [
      'Palace of Knossos',
      'Heraklion Archaeological Museum',
      'Koules Fortress (Venetian Fortress)',
    ],
    top_lgbt_venues: ['La Brasserie', 'Take Five Bar & Cafe', 'Y.O.L.O Bar (nearby Hersonissos)'],
  },
};

async function updateLocationData() {
  const client = await pool.connect();
  try {
    console.log('Updating location data with attractions and LGBT venues...\n');

    for (const [locationId, data] of Object.entries(locationData)) {
      await client.query(
        `UPDATE locations
         SET top_attractions = $1,
             top_lgbt_venues = $2
         WHERE id = $3`,
        [JSON.stringify(data.top_attractions), JSON.stringify(data.top_lgbt_venues), locationId]
      );

      console.log(`✅ Updated location ID ${locationId}`);
    }

    console.log('\n✅ All locations updated successfully!');
  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateLocationData();
