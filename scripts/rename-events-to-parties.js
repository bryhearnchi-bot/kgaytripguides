#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://bxiiodeyqvqqcgzzqzvt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listFilesInFolder(bucketName, folder) {
  const { data, error } = await supabase.storage.from(bucketName).list(folder, {
    limit: 1000
  });

  if (error) {
    console.error(`Error listing files: ${error.message}`);
    return [];
  }

  return data.filter(item => item.id); // Only return files, not folders
}

async function moveFile(bucketName, sourcePath, targetPath) {
  try {
    // Download from source
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucketName)
      .download(sourcePath);

    if (downloadError) {
      console.error(`Error downloading ${sourcePath}: ${downloadError.message}`);
      return false;
    }

    // Upload to target
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(targetPath, fileData, {
        upsert: true,
        contentType: fileData.type
      });

    if (uploadError) {
      console.error(`Error uploading to ${targetPath}: ${uploadError.message}`);
      return false;
    }

    // Delete from source
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([sourcePath]);

    if (deleteError) {
      console.error(`Error deleting ${sourcePath}: ${deleteError.message}`);
    }

    console.log(`✓ Moved: ${sourcePath} → ${targetPath}`);
    return true;
  } catch (error) {
    console.error(`Error moving file: ${error.message}`);
    return false;
  }
}

async function updateDatabaseUrls() {
  console.log('\n📝 Updating database URLs...');

  // Update party_themes table
  const { data: parties, error: fetchError } = await supabase
    .from('party_themes')
    .select('id, hero_image_url')
    .not('hero_image_url', 'is', null);

  if (fetchError) {
    console.error('Error fetching party themes:', fetchError);
    return;
  }

  for (const party of parties) {
    if (party.hero_image_url && party.hero_image_url.includes('/events/')) {
      const newUrl = party.hero_image_url.replace('/events/', '/parties/');
      const { error } = await supabase
        .from('party_themes')
        .update({ hero_image_url: newUrl })
        .eq('id', party.id);

      if (error) {
        console.error(`Error updating party ${party.id}:`, error);
      } else {
        console.log(`✓ Updated URL for party ${party.id}`);
      }
    }
  }

  console.log('✅ Database URLs updated');
}

async function main() {
  console.log('🔄 Renaming events folder to parties in app-images bucket');
  console.log('=====================================================\n');

  const bucketName = 'app-images';

  // List files in events folder
  console.log('📂 Listing files in events folder...');
  const files = await listFilesInFolder(bucketName, 'events');
  console.log(`Found ${files.length} files to move\n`);

  if (files.length === 0) {
    console.log('No files to move');
    return;
  }

  // Move each file from events to parties folder
  let successCount = 0;
  for (const file of files) {
    const sourcePath = `events/${file.name}`;
    const targetPath = `parties/${file.name}`;

    const success = await moveFile(bucketName, sourcePath, targetPath);
    if (success) successCount++;
  }

  console.log(`\n📊 Move complete: ${successCount}/${files.length} files moved`);

  // Update database URLs
  await updateDatabaseUrls();

  console.log('\n✅ All done! Events folder renamed to parties');
}

main().catch(console.error);