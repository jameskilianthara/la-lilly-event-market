#!/usr/bin/env tsx

/**
 * Check Vendor Data Script
 * Verifies vendor users and profiles exist in the database
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_VENDOR_EMAILS = [
  'vendor1@eventfoundry.com',
  'vendor2@eventfoundry.com',
  'vendor3@eventfoundry.com',
  'vendor4@eventfoundry.com',
  'vendor5@eventfoundry.com'
];

async function checkVendorData() {
  console.log('\n🔍 Checking Vendor Data...\n');

  // Check auth users
  console.log('📋 Step 1: Checking auth.users...');
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const vendorAuthUsers = authUsers?.users?.filter(u =>
    TEST_VENDOR_EMAILS.includes(u.email || '')
  );
  console.log(`   Found ${vendorAuthUsers?.length || 0} vendor auth users`);
  vendorAuthUsers?.forEach(u => {
    console.log(`   - ${u.email} (${u.id})`);
  });

  // Check public.users table
  console.log('\n📋 Step 2: Checking public.users table...');
  const { data: publicUsers } = await supabase
    .from('users')
    .select('*')
    .in('email', TEST_VENDOR_EMAILS);
  console.log(`   Found ${publicUsers?.length || 0} vendor user records`);
  publicUsers?.forEach(u => {
    console.log(`   - ${u.email} (${u.id}) - user_type: ${u.user_type}`);
  });

  // Check vendors table
  console.log('\n📋 Step 3: Checking vendors table...');
  if (publicUsers && publicUsers.length > 0) {
    const userIds = publicUsers.map(u => u.id);
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('*')
      .in('user_id', userIds);

    if (error) {
      console.error(`   ❌ Error querying vendors: ${error.message}`);
    } else {
      console.log(`   Found ${vendors?.length || 0} vendor profiles`);
      vendors?.forEach(v => {
        console.log(`   - ${v.company_name} (ID: ${v.id}, user_id: ${v.user_id})`);
        console.log(`     Specialties: ${JSON.stringify(v.specialties)}`);
      });
    }
  }

  console.log('\n✅ Check complete!\n');
}

checkVendorData();
