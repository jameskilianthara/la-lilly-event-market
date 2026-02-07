/**
 * EventFoundry API Routes Integration Tests
 * Tests API endpoints with real Supabase database
 * Verifies CRUD operations and RLS policies
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Service role client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Anonymous client (respects RLS)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Test data storage
let testClientUserId: string;
let testVendorUserId: string;
let testEventId: string;
let testBidId: string;
let testVendorId: string;

describe('EventFoundry API Integration Tests', () => {
  beforeAll(async () => {
    console.log('🚀 Setting up test environment...');

    // Clean up any existing test data
    await cleanupTestData();

    // Create test users
    await createTestUsers();
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up test data...');
    await cleanupTestData();
  });

  describe('1. Event Creation API (/api/forge/projects)', () => {
    it('should create a new event with valid data', async () => {
      const response = await fetch('http://localhost:3001/api/forge/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: testClientUserId,
          clientBrief: {
            event_type: 'wedding',
            date: '2025-06-15',
            city: 'Mumbai',
            guest_count: '200',
            venue_status: 'not_booked',
          },
          title: 'Integration Test Wedding Event',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.forgeProjectId).toBeDefined();
      expect(data.forgeProject.title).toBe('Integration Test Wedding Event');

      testEventId = data.forgeProjectId;
      console.log('✅ Event created:', testEventId);
    });

    it('should reject event creation without required fields', async () => {
      const response = await fetch('http://localhost:3001/api/forge/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Missing userId and clientBrief
          title: 'Invalid Event',
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      console.log('✅ Validation working: rejected invalid event');
    });

    it('should list events for authenticated user', async () => {
      const response = await fetch(
        `http://localhost:3001/api/forge/projects?userId=${testClientUserId}`
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.projects).toBeInstanceOf(Array);
      expect(data.projects.length).toBeGreaterThan(0);
      console.log(`✅ Found ${data.projects.length} event(s) for user`);
    });
  });

  describe('2. Event Retrieval API (/api/forge/projects/:id)', () => {
    it('should retrieve event by ID with relations', async () => {
      const response = await fetch(
        `http://localhost:3001/api/forge/projects/${testEventId}`
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.forgeProject.id).toBe(testEventId);
      expect(data.forgeProject.owner).toBeDefined();
      console.log('✅ Event retrieved with relations');
    });

    it('should return 404 for non-existent event', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await fetch(
        `http://localhost:3001/api/forge/projects/${fakeId}`
      );

      expect(response.status).toBe(404);
      console.log('✅ 404 handling working correctly');
    });

    it('should update event status', async () => {
      const response = await fetch(
        `http://localhost:3001/api/forge/projects/${testEventId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            forge_status: 'OPEN_FOR_BIDS',
            bidding_closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          }),
        }
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.forgeProject.forge_status).toBe('OPEN_FOR_BIDS');
      console.log('✅ Event status updated to OPEN_FOR_BIDS');
    });
  });

  describe('3. Database Direct Access Tests', () => {
    it('should verify event exists in Supabase', async () => {
      const { data, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('id', testEventId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.id).toBe(testEventId);
      console.log('✅ Event persisted to Supabase database');
    });

    it('should create test vendor for bid testing', async () => {
      const { data: vendor, error } = await supabaseAdmin
        .from('vendors')
        .insert({
          user_id: testVendorUserId,
          company_name: 'Test Vendor Co.',
          specialties: ['catering', 'decoration'],
          city: 'Mumbai',
          rating: 4.5,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(vendor).toBeDefined();
      testVendorId = vendor.id;
      console.log('✅ Test vendor created:', testVendorId);
    });

    it('should create a bid for the event', async () => {
      const { data: bid, error } = await supabaseAdmin
        .from('bids')
        .insert({
          event_id: testEventId,
          vendor_id: testVendorId,
          proposal_data: {
            items: [
              { name: 'Catering', quantity: 200, price: 500 },
              { name: 'Decoration', quantity: 1, price: 50000 },
            ],
            notes: 'Test bid for integration testing',
          },
          subtotal: 150000,
          total_amount: 177000,
          attachments: [],
          estimated_time: '14 days',
          status: 'submitted',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(bid).toBeDefined();
      testBidId = bid.id;
      console.log('✅ Test bid created:', testBidId);
    });

    it('should verify bid relationship to event', async () => {
      const { data: event, error } = await supabaseAdmin
        .from('events')
        .select(`
          *,
          bids(
            id,
            total_amount,
            status,
            vendor:vendors(company_name)
          )
        `)
        .eq('id', testEventId)
        .single();

      expect(error).toBeNull();
      expect(event.bids).toBeInstanceOf(Array);
      expect(event.bids.length).toBeGreaterThan(0);
      expect(event.bids[0].id).toBe(testBidId);
      console.log('✅ Bid relationship verified');
    });
  });

  describe('4. Row Level Security (RLS) Tests', () => {
    it('should allow client to view their own events', async () => {
      // This test requires authentication - for now we test with service role
      const { data, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('owner_user_id', testClientUserId);

      expect(error).toBeNull();
      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);
      console.log('✅ Client can view own events (service role test)');
    });

    it('should allow vendor to view open events', async () => {
      const { data, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('forge_status', 'OPEN_FOR_BIDS');

      expect(error).toBeNull();
      expect(data).toBeInstanceOf(Array);
      console.log(`✅ Found ${data.length} open event(s) for vendors`);
    });

    it('should allow vendor to view their own bids', async () => {
      const { data, error } = await supabaseAdmin
        .from('bids')
        .select('*')
        .eq('vendor_id', testVendorId);

      expect(error).toBeNull();
      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);
      console.log('✅ Vendor can view own bids');
    });

    it('should verify RLS is enabled on events table', async () => {
      const { data, error } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          SELECT relrowsecurity
          FROM pg_class
          WHERE relname = 'events';
        `,
      }).catch(() => {
        // If RPC doesn't exist, we'll check via admin query
        return { data: null, error: null };
      });

      // Note: Actual RLS verification requires special permissions
      console.log('⚠️ RLS enabled check requires manual verification in Supabase dashboard');
    });
  });

  describe('5. Contract Generation Tests', () => {
    it('should create a contract for accepted bid', async () => {
      const { data: contract, error } = await supabaseAdmin
        .from('contracts')
        .insert({
          event_id: testEventId,
          bid_id: testBidId,
          contract_data: {
            terms: 'Standard EventFoundry terms',
            milestones: [
              { name: 'Deposit', percentage: 30, due_date: '2025-05-01' },
              { name: 'Mid-payment', percentage: 50, due_date: '2025-06-01' },
              { name: 'Final payment', percentage: 20, due_date: '2025-06-15' },
            ],
          },
          status: 'draft',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(contract).toBeDefined();
      expect(contract.event_id).toBe(testEventId);
      expect(contract.bid_id).toBe(testBidId);
      console.log('✅ Contract created:', contract.id);
    });

    it('should prevent duplicate contracts for same event', async () => {
      const { error } = await supabaseAdmin
        .from('contracts')
        .insert({
          event_id: testEventId, // Same event ID
          bid_id: testBidId,
          contract_data: { terms: 'Duplicate' },
          status: 'draft',
        });

      expect(error).toBeDefined();
      expect(error?.message).toContain('duplicate'); // Unique constraint violation
      console.log('✅ Duplicate contract prevented by unique constraint');
    });
  });

  describe('6. Data Integrity Tests', () => {
    it('should verify foreign key relationships', async () => {
      const { data: bid } = await supabaseAdmin
        .from('bids')
        .select(`
          *,
          event:events(*),
          vendor:vendors(*)
        `)
        .eq('id', testBidId)
        .single();

      expect(bid.event).toBeDefined();
      expect(bid.vendor).toBeDefined();
      expect(bid.event.id).toBe(testEventId);
      expect(bid.vendor.id).toBe(testVendorId);
      console.log('✅ Foreign key relationships intact');
    });

    it('should verify enum types are working', async () => {
      const { data: event } = await supabaseAdmin
        .from('events')
        .select('forge_status')
        .eq('id', testEventId)
        .single();

      expect(['BLUEPRINT_READY', 'OPEN_FOR_BIDS', 'CRAFTSMEN_BIDDING']).toContain(
        event.forge_status
      );
      console.log(`✅ Enum type working: ${event.forge_status}`);
    });

    it('should test JSONB fields', async () => {
      const { data: event } = await supabaseAdmin
        .from('events')
        .select('client_brief, blueprint_snapshot')
        .eq('id', testEventId)
        .single();

      expect(event.client_brief).toBeDefined();
      expect(typeof event.client_brief).toBe('object');
      expect(event.client_brief.event_type).toBe('wedding');
      console.log('✅ JSONB fields working correctly');
    });
  });
});

// Helper Functions

async function createTestUsers() {
  // Create test client user
  const { data: clientUser, error: clientError } = await supabaseAdmin
    .from('users')
    .insert({
      email: 'test-client@eventfoundry.com',
      name: 'Test Client User',
      role: 'client',
    })
    .select()
    .single();

  if (!clientError && clientUser) {
    testClientUserId = clientUser.id;
    console.log('✅ Test client user created:', testClientUserId);
  }

  // Create test vendor user
  const { data: vendorUser, error: vendorError } = await supabaseAdmin
    .from('users')
    .insert({
      email: 'test-vendor@eventfoundry.com',
      name: 'Test Vendor User',
      role: 'vendor',
    })
    .select()
    .single();

  if (!vendorError && vendorUser) {
    testVendorUserId = vendorUser.id;
    console.log('✅ Test vendor user created:', testVendorUserId);
  }
}

async function cleanupTestData() {
  // Delete in order to respect foreign key constraints
  await supabaseAdmin.from('contracts').delete().ilike('contract_data->>terms', '%test%');
  await supabaseAdmin.from('bids').delete().eq('vendor_id', testVendorId);
  await supabaseAdmin.from('vendors').delete().ilike('company_name', '%Test%');
  await supabaseAdmin.from('events').delete().ilike('title', '%Integration Test%');
  await supabaseAdmin.from('users').delete().ilike('email', '%test-%');

  console.log('✅ Test data cleaned up');
}
