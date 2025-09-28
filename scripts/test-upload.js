import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUpload() {
  console.log('🧪 Testing direct upload to Supabase...');

  try {
    // Create a simple test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU7HkQAAAABJRU5ErkJggg==',
      'base64'
    );

    // Test upload to profiles folder
    console.log('📤 Uploading to profiles folder...');
    const { data, error } = await supabase.storage
      .from('images')
      .upload('profiles/test-profile-image.png', testImageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      console.error('❌ Upload failed:', error.message);
      return;
    }

    console.log('✅ Upload successful!');
    console.log('📍 Path:', data.path);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(data.path);

    console.log('🔗 Public URL:', publicUrl);

    // Clean up test file
    console.log('🧹 Cleaning up test file...');
    await supabase.storage
      .from('images')
      .remove([data.path]);

    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUpload();