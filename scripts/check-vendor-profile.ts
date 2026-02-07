#!/usr/bin/env tsx
/**
 * Check if vendor profile exists for the authenticated user
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ikfawcbcapmfpzwbqccr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Test with vendor1 email
const VENDOR_EMAIL = 'vendor1@eventfoundry.com';

async function checkVendorProfile() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔍 Checking vendor profile for:', VENDOR_EMAIL);
  console.log('');

  // Step 1: Get auth user
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error fetching auth users:', authError);
    return;
  }

  const authUser = authUsers.users.find(u => u.email === VENDOR_EMAIL);

  if (!authUser) {
    console.log('❌ Auth user not found for:', VENDOR_EMAIL);
    return;
  }

  console.log('✅ Auth user found:');
  console.log('   User ID:', authUser.id);
  console.log('   Email:', authUser.email);
  console.log('');

  // Step 2: Check users table
  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (userError) {
    console.error('❌ Error fetching user record:', userError);
    return;
  }

  console.log('✅ User record found:');
  console.log('   User type:', userRecord.user_type);
  console.log('   Full name:', userRecord.full_name);
  console.log('');

  // Step 3: Check vendors table
  const { data: vendorProfile, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', authUser.id)
    .single();

  if (vendorError) {
    console.error('❌ Vendor profile NOT found in vendors table');
    console.error('   Error:', vendorError.message);
    console.error('');
    console.error('🔧 THIS IS THE ISSUE: The user exists but has no vendor profile!');
    console.error('   The bid submission fails because bids.vendor_id expects a vendors.id');
    console.error('');
    console.error('💡 Solution: Create vendor profile in vendors table for this user');
    return;
  }

  console.log('✅ Vendor profile found:');
  console.log('   Vendor ID:', vendorProfile.id);
  console.log('   Company:', vendorProfile.company_name);
  console.log('   Verified:', vendorProfile.verified);
  console.log('');
  console.log('✅ All good! Vendor profile exists correctly.');
}

checkVendorProfile();
