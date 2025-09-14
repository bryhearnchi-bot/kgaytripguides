import { getTripBySlug, updateEvent } from './server/storage.js';

async function fixParties() {
  try {
    // Get the trip
    const trip = await getTripBySlug('caribbean-paradise');
    if (!trip) {
      console.log('Trip not found!');
      return;
    }

    // Check party events
    const parties = trip.events.filter(e => e.type === 'party' || e.type === 'after' || e.type === 'club');
    console.log('Found', parties.length, 'party events:');

    parties.forEach(p => {
      console.log('- ' + p.title + ': ' + (p.imageUrl ? 'HAS IMAGE' : 'NO IMAGE'));
      if (p.imageUrl) {
        console.log('  URL:', p.imageUrl);
      }
    });

    // Find Dog Tag and update with correct image
    const dogTag = parties.find(p => p.title.includes('Dog Tag'));
    if (dogTag) {
      console.log('\nUpdating Dog Tag T-Dance image...');
      await updateEvent(dogTag.id, {
        imageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/v1757804284/dogtag_gcui6m.jpg'
      });
      console.log('✓ Dog Tag updated with correct image');
    }

    // Check if Empires exists
    const empires = parties.find(p => p.title === 'Empires');
    if (!empires) {
      console.log('\nWARNING: Empires party not found in trip events!');
      console.log('Available party titles:', parties.map(p => p.title).join(', '));
    } else {
      console.log('\nEmpires found with ID:', empires.id);
      if (!empires.imageUrl || empires.imageUrl.includes('default')) {
        console.log('Updating Empires image...');
        await updateEvent(empires.id, {
          imageUrl: 'https://res.cloudinary.com/dfqoebbyj/image/upload/w_600,h_400,c_fill,g_center,q_auto,f_auto/v1757804647/empires_cpd6zo.jpg'
        });
        console.log('✓ Empires updated with correct image');
      }
    }

    console.log('\nDone! Refresh the page to see the changes.');

  } catch (error) {
    console.error('Error:', error);
  }
}

fixParties();