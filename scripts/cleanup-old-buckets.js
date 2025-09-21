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

const OLD_BUCKETS = ['talent-images', 'event-images', 'cruise-images'];

async function deleteAllFilesInBucket(bucketName) {
  console.log(`\nDeleting all files in ${bucketName}...`);

  async function deleteFilesRecursive(path = '') {
    const { data, error } = await supabase.storage.from(bucketName).list(path, {
      limit: 1000
    });

    if (error) {
      console.error(`Error listing files: ${error.message}`);
      return;
    }

    for (const item of data) {
      const itemPath = path ? `${path}/${item.name}` : item.name;

      if (item.id) {
        // It's a file, delete it
        const { error: deleteError } = await supabase.storage
          .from(bucketName)
          .remove([itemPath]);

        if (deleteError) {
          console.error(`Error deleting ${itemPath}: ${deleteError.message}`);
        } else {
          console.log(`  ✓ Deleted: ${itemPath}`);
        }
      } else {
        // It's a folder, recurse into it
        await deleteFilesRecursive(itemPath);
      }
    }
  }

  await deleteFilesRecursive();
}

async function deleteBucket(bucketName) {
  console.log(`\n🗑️  Attempting to delete bucket: ${bucketName}`);

  // First delete all files
  await deleteAllFilesInBucket(bucketName);

  // Now delete the empty bucket
  const { error } = await supabase.storage.deleteBucket(bucketName);

  if (error) {
    console.error(`❌ Error deleting bucket ${bucketName}: ${error.message}`);
    return false;
  }

  console.log(`✅ Bucket ${bucketName} deleted successfully`);
  return true;
}

async function main() {
  console.log('🧹 Cleaning up old storage buckets');
  console.log('===================================\n');

  for (const bucket of OLD_BUCKETS) {
    await deleteBucket(bucket);
  }

  console.log('\n✅ Cleanup complete!');
}

main().catch(console.error);