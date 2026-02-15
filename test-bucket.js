const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBucket() {
  const { data, error } = await supabase.storage.getBucket('documents');
  
  if (error) {
    console.error('❌ Bucket not found:', error.message);
  } else {
    console.log('✅ Bucket exists!', data.name);
  }
}

testBucket();
