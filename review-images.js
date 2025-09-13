import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

const db = neon(process.env.DATABASE_URL);

async function reviewAllImages() {
  console.log('🔍 Reviewing all images in the database...\n');

  try {
    // Check cruise hero images
    console.log('1️⃣ CRUISE HERO IMAGES:');
    const cruises = await db`SELECT id, name, hero_image_url FROM cruises ORDER BY id`;

    cruises.forEach((cruise, i) => {
      const isCloudinary = cruise.hero_image_url?.includes('cloudinary.com') || cruise.hero_image_url?.includes('res.cloudinary.com');
      const status = isCloudinary ? '✅' : '❌';
      console.log(`  ${i+1}. ${cruise.name}`);
      console.log(`     ${status} ${cruise.hero_image_url || 'No image'}`);
    });

    // Check itinerary port images
    console.log('\n2️⃣ ITINERARY PORT IMAGES:');
    const itinerary = await db`SELECT id, cruise_id, port_name, port_image_url FROM itinerary WHERE port_image_url IS NOT NULL ORDER BY cruise_id, order_index`;

    const groupedItinerary = {};
    itinerary.forEach(stop => {
      if (!groupedItinerary[stop.cruise_id]) groupedItinerary[stop.cruise_id] = [];
      groupedItinerary[stop.cruise_id].push(stop);
    });

    for (const [cruiseId, stops] of Object.entries(groupedItinerary)) {
      const cruise = cruises.find(c => c.id == cruiseId);
      console.log(`\n   📍 ${cruise?.name || `Cruise ${cruiseId}`}:`);

      stops.forEach((stop, i) => {
        const isCloudinary = stop.port_image_url?.includes('cloudinary.com') || stop.port_image_url?.includes('res.cloudinary.com');
        const status = isCloudinary ? '✅' : '❌';
        console.log(`     ${i+1}. ${stop.port_name}`);
        console.log(`        ${status} ${stop.port_image_url}`);
      });
    }

    // Check event images
    console.log('\n3️⃣ EVENT IMAGES:');
    const events = await db`SELECT id, cruise_id, title, image_url FROM events WHERE image_url IS NOT NULL ORDER BY cruise_id, date, time`;

    const groupedEvents = {};
    events.forEach(event => {
      if (!groupedEvents[event.cruise_id]) groupedEvents[event.cruise_id] = [];
      groupedEvents[event.cruise_id].push(event);
    });

    for (const [cruiseId, eventList] of Object.entries(groupedEvents)) {
      const cruise = cruises.find(c => c.id == cruiseId);
      console.log(`\n   🎪 ${cruise?.name || `Cruise ${cruiseId}`} (${eventList.length} events with images):`);

      eventList.slice(0, 5).forEach((event, i) => { // Show first 5 events
        const isCloudinary = event.image_url?.includes('cloudinary.com') || event.image_url?.includes('res.cloudinary.com');
        const status = isCloudinary ? '✅' : '❌';
        console.log(`     ${i+1}. ${event.title}`);
        console.log(`        ${status} ${event.image_url}`);
      });

      if (eventList.length > 5) {
        console.log(`     ... and ${eventList.length - 5} more events`);
      }
    }

    // Check talent profile images
    console.log('\n4️⃣ TALENT PROFILE IMAGES:');
    const talent = await db`SELECT id, name, profile_image_url FROM talent WHERE profile_image_url IS NOT NULL ORDER BY name`;

    talent.forEach((person, i) => {
      const isCloudinary = person.profile_image_url?.includes('cloudinary.com') || person.profile_image_url?.includes('res.cloudinary.com');
      const status = isCloudinary ? '✅' : '❌';
      console.log(`  ${i+1}. ${person.name}`);
      console.log(`     ${status} ${person.profile_image_url}`);
    });

    // Check media table
    console.log('\n5️⃣ MEDIA TABLE:');
    const media = await db`SELECT id, url, thumbnail_url, type, associated_type FROM media ORDER BY type, id`;

    if (media.length > 0) {
      media.forEach((item, i) => {
        const isCloudinary = item.url?.includes('cloudinary.com') || item.url?.includes('res.cloudinary.com');
        const status = isCloudinary ? '✅' : '❌';
        console.log(`  ${i+1}. ${item.type} (${item.associated_type})`);
        console.log(`     ${status} ${item.url}`);
        if (item.thumbnail_url) {
          const thumbCloudinary = item.thumbnail_url?.includes('cloudinary.com') || item.thumbnail_url?.includes('res.cloudinary.com');
          const thumbStatus = thumbCloudinary ? '✅' : '❌';
          console.log(`     ${thumbStatus} Thumbnail: ${item.thumbnail_url}`);
        }
      });
    } else {
      console.log('  No media items found');
    }

    // Summary
    console.log('\n📊 SUMMARY:');

    const allImageUrls = [
      ...cruises.map(c => c.hero_image_url).filter(Boolean),
      ...itinerary.map(i => i.port_image_url).filter(Boolean),
      ...events.map(e => e.image_url).filter(Boolean),
      ...talent.map(t => t.profile_image_url).filter(Boolean),
      ...media.map(m => m.url).filter(Boolean),
      ...media.map(m => m.thumbnail_url).filter(Boolean)
    ];

    const cloudinaryUrls = allImageUrls.filter(url =>
      url?.includes('cloudinary.com') || url?.includes('res.cloudinary.com')
    );

    const nonCloudinaryUrls = allImageUrls.filter(url =>
      !(url?.includes('cloudinary.com') || url?.includes('res.cloudinary.com'))
    );

    console.log(`✅ Cloudinary URLs: ${cloudinaryUrls.length}`);
    console.log(`❌ Non-Cloudinary URLs: ${nonCloudinaryUrls.length}`);
    console.log(`📊 Total Images: ${allImageUrls.length}`);

    if (nonCloudinaryUrls.length > 0) {
      console.log('\n🔧 NON-CLOUDINARY URLS FOUND:');
      nonCloudinaryUrls.forEach((url, i) => {
        console.log(`  ${i+1}. ${url}`);
      });
    } else {
      console.log('\n🎉 ALL IMAGES ARE USING CLOUDINARY! ✅');
    }

  } catch (error) {
    console.error('❌ Review failed:', error);
  }
}

reviewAllImages();