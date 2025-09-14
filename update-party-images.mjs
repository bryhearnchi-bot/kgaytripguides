import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

// Party theme image mappings
const partyImages = {
  "UNITE": "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804284/unite_af3vyi.jpg",
  "Atlantis Empires": "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804647/empires_cpd6zo.jpg",
  "Greek Isles": "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804284/greek_proadv.jpg",
  "Here We Go Again": "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804284/greek_proadv.jpg",
  "Lost At Sea": "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804283/sea_dyhgwy.jpg",
  "Neon": "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804282/neon_cqdmz3.jpg",
  "Neon Playground": "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804282/neon_cqdmz3.jpg",
  "Think Pink": "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804284/pink_fotvpt.jpg",
  "Virgin White": "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804283/white_wcg2hw.jpg",
  "Revival": "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804283/sea_dyhgwy.jpg",
  "Atlantis Classics": "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804281/classics_thqbx2.jpg",
  "Off-White": "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804283/off-white_yvcnsq.jpg",
  "Last Dance": "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804283/sea_dyhgwy.jpg",
  "Welcome Party": "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757805129/welcome_lwr9md.jpg",
  "Sail-Away Party": "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757805135/sailaway_m3tnsb.jpg"
};

// Fallback images for different party types
const fallbackImages = {
  party: "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757789604/cruise-app/ships/virgin-resilient-lady.jpg",
  after: "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804283/off-white_yvcnsq.jpg",
  club: "https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757789604/cruise-app/ships/virgin-resilient-lady.jpg"
};

async function updatePartyImages() {
  try {
    console.log('Fetching party events from database...');

    // Get all party-type events
    const events = await sql`
      SELECT id, title, type
      FROM events
      WHERE type IN ('party', 'after', 'club')
      ORDER BY id
    `;

    console.log(`Found ${events.length} party events to update`);

    for (const event of events) {
      let imageUrl = null;

      // Check if we have a specific image for this party title
      for (const [partyName, url] of Object.entries(partyImages)) {
        if (event.title.includes(partyName)) {
          imageUrl = url;
          break;
        }
      }

      // If no specific match, use fallback based on type
      if (!imageUrl) {
        imageUrl = fallbackImages[event.type] || fallbackImages.party;
      }

      // Update the event with the image URL
      await sql`
        UPDATE events
        SET image_url = ${imageUrl},
            updated_at = NOW()
        WHERE id = ${event.id}
      `;

      console.log(`✓ Updated "${event.title}" (ID: ${event.id}) with image`);
    }

    console.log('\n✨ All party events updated successfully!');

  } catch (error) {
    console.error('Error updating party images:', error);
    process.exit(1);
  }
}

// Run the update
updatePartyImages();