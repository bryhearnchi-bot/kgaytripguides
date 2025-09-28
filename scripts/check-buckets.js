import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBuckets() {
  console.log('🔍 Checking Supabase storage buckets...');

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('📦 Available buckets:');
  buckets.forEach(bucket => {
    console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
  });

  if (buckets.find(b => b.name === 'images')) {
    console.log('\n✅ Images bucket found!');

    // List folders in images bucket
    const { data: folders, error: foldersError } = await supabase.storage
      .from('images')
      .list('', { limit: 100 });

    if (foldersError) {
      console.error('❌ Error listing folders:', foldersError.message);
    } else {
      console.log('📁 Folders in images bucket:');
      folders.forEach(folder => {
        if (folder.name) {
          console.log(`  📂 ${folder.name}/`);
        }
      });
    }
  } else {
    console.log('\n❌ Images bucket not found!');
  }
}

checkBuckets();