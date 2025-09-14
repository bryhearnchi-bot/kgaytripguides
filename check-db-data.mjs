import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkData() {
  try {
    // Check cruises (not trips)
    const cruises = await sql`SELECT id, name, slug, "heroImageUrl" FROM cruises LIMIT 5`;
    console.log('\n=== CRUISES ===');
    console.log('Count:', cruises.length);
    cruises.forEach(t => console.log(`- ${t.slug}: heroImage=${t.heroImageUrl ? 'YES' : 'NO'}`));

    // Check talent
    const talent = await sql`SELECT id, name, "profileImageUrl" FROM talent LIMIT 5`;
    console.log('\n=== TALENT ===');
    console.log('Count:', talent.length);
    talent.forEach(t => console.log(`- ${t.name}: profileImage=${t.profileImageUrl ? 'YES' : 'NO'}`));

    // Check events (for parties)
    const events = await sql`SELECT id, title, "imageUrl" FROM events WHERE type = 'party' LIMIT 5`;
    console.log('\n=== PARTY EVENTS ===');
    console.log('Count:', events.length);
    events.forEach(p => console.log(`- ${p.title}: image=${p.imageUrl ? 'YES' : 'NO'}`));

    // Check itinerary
    const itinerary = await sql`SELECT id, port, "portImageUrl" FROM itinerary WHERE "portImageUrl" IS NOT NULL LIMIT 5`;
    console.log('\n=== ITINERARY WITH IMAGES ===');
    console.log('Count:', itinerary.length);
    itinerary.forEach(i => console.log(`- ${i.port}: portImage=${i.portImageUrl ? 'YES' : 'NO'}`));

  } catch (error) {
    console.error('Error checking data:', error);
  }
}

checkData();