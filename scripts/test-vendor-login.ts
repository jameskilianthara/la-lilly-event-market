#!/usr/bin/env tsx
/**
 * Test Vendor Login Script
 * Tests if vendor credentials work with Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'present' : 'missing');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'present' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testVendorLogin() {
  console.log('🔐 Testing vendor login...\n');

  const testCredentials = {
    email: 'vendor1@eventfoundry.com',
    password: 'VendorTest123!'
  };

  console.log('Attempting login with:');
  console.log('  Email:', testCredentials.email);
  console.log('  Password:', '***************');
  console.log('');

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testCredentials.email,
      password: testCredentials.password,
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
      console.error('Error code:', error.status);
      console.error('Full error:', error);
      return false;
    }

    if (!data.user) {
      console.error('❌ Login succeeded but no user returned');
      return false;
    }

    console.log('✅ Login successful!');
    console.log('');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    console.log('Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No');
    console.log('User metadata:', JSON.stringify(data.user.user_metadata, null, 2));
    console.log('');

    // Fetch user profile
    console.log('Fetching user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('user_type, full_name')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError.message);
      console.error('This might be an RLS policy issue');
      return false;
    }

    console.log('✅ Profile fetched successfully');
    console.log('User type:', profile.user_type);
    console.log('Full name:', profile.full_name || '(not set)');
    console.log('');

    // Sign out to clean up
    await supabase.auth.signOut();
    console.log('🔓 Signed out successfully');

    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

testVendorLogin().then(success => {
  if (success) {
    console.log('\n✅ Vendor login test PASSED');
    process.exit(0);
  } else {
    console.log('\n❌ Vendor login test FAILED');
    process.exit(1);
  }
});
