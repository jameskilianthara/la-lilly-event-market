#!/usr/bin/env tsx

/**
 * E2E Test Data Seeding Script
 * Creates vendor accounts, events, and bids for E2E testing
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test data configuration
const TEST_CLIENT = {
  email: 'test@eventfoundry.com',
  password: 'TestClient123!',
  name: 'Test Client User'
};

const TEST_VENDORS = [
  {
    email: 'vendor1@eventfoundry.com',
    password: 'VendorTest123!',
    name: 'Premium Events Co.',
    company: 'Premium Events',
    services: ['Wedding Planning', 'Corporate Events', 'Catering']
  },
  {
    email: 'vendor2@eventfoundry.com',
    password: 'VendorTest123!',
    name: 'Elite Decorators',
    company: 'Elite Decor Studio',
    services: ['Decoration', 'Floral Design', 'Lighting']
  },
  {
    email: 'vendor3@eventfoundry.com',
    password: 'VendorTest123!',
    name: 'Perfect Photography',
    company: 'Perfect Shots Studio',
    services: ['Photography', 'Videography', 'Drone Coverage']
  },
  {
    email: 'vendor4@eventfoundry.com',
    password: 'VendorTest123!',
    name: 'Gourmet Catering',
    company: 'Gourmet Caterers Ltd',
    services: ['Catering', 'Bartending', 'Chef Services']
  },
  {
    email: 'vendor5@eventfoundry.com',
    password: 'VendorTest123!',
    name: 'Sound & Stage Masters',
    company: 'Sound Masters',
    services: ['Sound System', 'Stage Setup', 'DJ Services']
  }
];

const TEST_EVENTS = [
  {
    title: 'Mumbai Wedding - June 2026',
    event_type: 'wedding',
    date: '2026-06-15',
    location: 'Mumbai',
    guest_count: 200,
    budget: 500000,
    status: 'open',
    description: 'Traditional wedding with 200 guests in Mumbai'
  },
  {
    title: 'Corporate Conference - Bangalore',
    event_type: 'corporate',
    date: '2026-07-10',
    location: 'Bangalore',
    guest_count: 150,
    budget: 300000,
    status: 'open',
    description: 'Tech conference for 150 attendees'
  },
  {
    title: 'Birthday Celebration - Delhi',
    event_type: 'birthday',
    date: '2026-03-20',
    location: 'Delhi',
    guest_count: 80,
    budget: 150000,
    status: 'open',
    description: '50th birthday party celebration'
  }
];

async function createVendorAccount(vendor: typeof TEST_VENDORS[0]) {
  console.log(`📝 Creating vendor: ${vendor.email}...`);

  // Check if auth user exists
  const { data: existingAuth } = await supabase.auth.admin.listUsers();
  const authUser = existingAuth?.users?.find(u => u.email === vendor.email);

  let userId: string;

  if (authUser) {
    console.log(`   ℹ️  Auth user already exists: ${authUser.id}`);
    userId = authUser.id;
  } else {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: vendor.email,
      password: vendor.password,
      email_confirm: true,
      user_metadata: {
        name: vendor.name,
        userType: 'vendor'
      }
    });

    if (authError) {
      console.error(`   ❌ Failed to create auth user: ${authError.message}`);
      return;
    }

    console.log(`   ✅ Auth user created: ${authData.user.id}`);
    userId = authData.user.id;
  }

  // Check if public.users record exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (!existingUser) {
    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: vendor.email,
        full_name: vendor.name,
        user_type: 'vendor',
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error(`   ❌ Failed to create profile: ${profileError.message}`);
      return;
    }
    console.log(`   ✅ User profile created`);
  } else {
    console.log(`   ℹ️  User profile already exists`);
  }

  // Check if vendor profile exists
  const { data: existingVendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!existingVendor) {
    // Create vendor profile
    const { error: vendorError } = await supabase
      .from('vendors')
      .insert({
        user_id: userId,
        company_name: vendor.company,
        specialties: vendor.services, // Schema uses 'specialties' not 'services'
        rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
        total_projects: Math.floor(Math.random() * 50) + 10, // Schema uses 'total_projects' not 'reviews_count'
        created_at: new Date().toISOString()
      });

    if (vendorError) {
      console.error(`   ❌ Failed to create vendor profile: ${vendorError.message}`);
      return;
    }
    console.log(`   ✅ Vendor profile created`);
  } else {
    console.log(`   ℹ️  Vendor profile already exists`);
  }
}

async function getClientUserId(): Promise<string | null> {
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('email', TEST_CLIENT.email)
    .single();

  return users?.id || null;
}

async function getVendorIds(): Promise<string[]> {
  // First get user IDs for the vendor emails
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .in('email', TEST_VENDORS.map(v => v.email))
    .eq('user_type', 'vendor');

  if (!users || users.length === 0) {
    console.log('   ⚠️  No vendor users found');
    return [];
  }

  const userIds = users.map(u => u.id);
  console.log(`   Found ${userIds.length} vendor users`);

  // Now get vendor table IDs using user_id
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id')
    .in('user_id', userIds);

  console.log(`   Found ${vendors?.length || 0} vendor profiles`);
  return vendors?.map(v => v.id) || [];
}

async function createEvent(event: typeof TEST_EVENTS[0], clientId: string) {
  console.log(`📅 Creating event: ${event.title}...`);

  const { data, error} = await supabase
    .from('events')
    .insert({
      owner_user_id: clientId,
      title: event.title,
      event_type: event.event_type,
      date: event.date,
      city: event.location,
      guest_count: event.guest_count,
      budget_range: `₹${event.budget}`,
      forge_status: 'OPEN_FOR_BIDS',
      client_brief: {
        event_type: event.event_type,
        date: event.date,
        city: event.location,
        guest_count: event.guest_count,
        description: event.description
      },
      forge_blueprint: {
        sections: []
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error(`   ❌ Failed to create event: ${error.message}`);
    return null;
  }

  console.log(`   ✅ Event created: ${data.id}`);
  return data.id;
}

async function createBid(eventId: string, vendorId: string, index: number) {
  const basePrice = 100000;
  const variation = (index * 15000) + (Math.random() * 20000);
  const subtotal = basePrice + variation;
  const taxes = subtotal * 0.18; // 18% GST
  const totalPrice = subtotal + taxes;

  const { error } = await supabase
    .from('bids')
    .insert({
      event_id: eventId,
      vendor_id: vendorId,
      craft_specialties: ['Event Management', 'Catering', 'Decoration'],
      forge_items: {
        items: [
          {
            name: 'Complete Event Management',
            quantity: 1,
            price: subtotal
          }
        ]
      },
      subtotal: subtotal,
      taxes: taxes,
      total_forge_cost: totalPrice,
      craft_attachments: [],
      vendor_notes: `Professional event services with ${Math.floor(Math.random() * 10) + 5} years of experience. We provide comprehensive coverage for all your event needs.`,
      estimated_forge_time: '14 days',
      status: 'SUBMITTED'
      // Note: created_at and updated_at are auto-generated by database
      // Note: bid_round field doesn't exist in schema (removed)
    });

  if (error) {
    console.error(`   ❌ Failed to create bid: ${error.message}`);
    return false;
  }

  return true;
}

async function seedTestData() {
  console.log('\n🌱 Starting E2E Test Data Seeding...\n');

  try {
    // Step 1: Create vendor accounts
    console.log('📋 Step 1: Creating vendor accounts...');
    for (const vendor of TEST_VENDORS) {
      await createVendorAccount(vendor);
    }
    console.log('✅ Vendor accounts created\n');

    // Step 2: Get client user ID
    console.log('📋 Step 2: Getting client user ID...');
    const clientId = await getClientUserId();
    if (!clientId) {
      console.error('❌ Client user not found. Please ensure test@eventfoundry.com exists.');
      console.log('   Run: npm run create-test-user');
      process.exit(1);
    }
    console.log(`✅ Client user ID: ${clientId}\n`);

    // Step 3: Create events
    console.log('📋 Step 3: Creating test events...');
    const eventIds: string[] = [];
    for (const event of TEST_EVENTS) {
      const eventId = await createEvent(event, clientId);
      if (eventId) {
        eventIds.push(eventId);
      }
    }
    console.log(`✅ Created ${eventIds.length} events\n`);

    // Step 4: Get vendor IDs
    console.log('📋 Step 4: Getting vendor IDs...');
    const vendorIds = await getVendorIds();
    console.log(`✅ Found ${vendorIds.length} vendors\n`);

    // Step 5: Create bids for each event
    console.log('📋 Step 5: Creating bids for events...');
    let totalBids = 0;
    for (const eventId of eventIds) {
      console.log(`   Creating bids for event ${eventId}...`);

      // Create 5-7 bids per event
      const bidCount = 5 + Math.floor(Math.random() * 3);
      for (let i = 0; i < Math.min(bidCount, vendorIds.length); i++) {
        const success = await createBid(eventId, vendorIds[i], i);
        if (success) totalBids++;
      }

      console.log(`   ✅ Created ${bidCount} bids for this event`);
    }
    console.log(`✅ Created ${totalBids} total bids\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 E2E Test Data Seeding Complete!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Vendors created: ${TEST_VENDORS.length}`);
    console.log(`✅ Events created: ${eventIds.length}`);
    console.log(`✅ Bids created: ${totalBids}`);
    console.log('\n📝 Test Credentials:');
    console.log('   Client: test@eventfoundry.com / TestClient123!');
    console.log('   Vendor: vendor1@eventfoundry.com / VendorTest123!');
    console.log('\n🧪 Ready to run E2E tests!');
    console.log('   npm run test:e2e\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seedTestData();
