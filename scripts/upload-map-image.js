#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Check for required environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function uploadMapImage() {
  try {
    // Read the image file
    const imagePath = '/tmp/hong-kong-cruise-map.png';
    const imageBuffer = fs.readFileSync(imagePath);

    // Create the maps folder path if needed and upload the image
    const fileName = 'hong-kong-cruise-2025.png';
    const filePath = `maps/${fileName}`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('app-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading image:', error);
      process.exit(1);
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('app-images').getPublicUrl(filePath);

    console.log('Image uploaded successfully!');
    console.log('Public URL:', publicUrl);

    // Find the Hong Kong trip and update it with the map URL
    const { data: trips, error: tripError } = await supabase
      .from('trips')
      .select('id, name')
      .ilike('name', '%hong kong%')
      .limit(1)
      .single();

    if (tripError) {
      console.error('Error finding Hong Kong trip:', tripError);
      process.exit(1);
    }

    // Update the trip with the map URL
    const { error: updateError } = await supabase
      .from('trips')
      .update({ map_url: publicUrl })
      .eq('id', trips.id);

    if (updateError) {
      console.error('Error updating trip:', updateError);
      process.exit(1);
    }

    console.log(`Updated trip "${trips.name}" with map URL`);
    console.log('Map URL:', publicUrl);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

uploadMapImage();
