/**
 * db.helper.ts
 * Supabase service-role client for DB assertions and cleanup in tests.
 * Uses TEST_SUPABASE_SERVICE_KEY — bypasses RLS so tests can read/write any row.
 *
 * IMPORTANT: Never import this in app code — test-only.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

let _client: SupabaseClient | null = null;

/** Returns a singleton service-role Supabase client for test assertions. */
export function getTestDb(): SupabaseClient {
  if (!_client) {
    const url = process.env.TEST_SUPABASE_URL;
    const key = process.env.TEST_SUPABASE_SERVICE_KEY;
    if (!url || !key) {
      throw new Error(
        'TEST_SUPABASE_URL and TEST_SUPABASE_SERVICE_KEY must be set in .env.test'
      );
    }
    _client = createClient(url, key);
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Event assertions
// ---------------------------------------------------------------------------

export interface EventRow {
  id: string;
  owner_user_id: string;
  title: string | null;
  forge_status: string | null;
  bidding_closes_at: string | null;
  winner_bid_id: string | null;
  client_brief: Record<string, unknown> | null;
  forge_blueprint: Record<string, unknown> | null;
}

/** Fetch a single event by ID. Returns null if not found. */
export async function getEvent(eventId: string): Promise<EventRow | null> {
  const db = getTestDb();
  const { data, error } = await db
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();
  if (error) return null;
  return data as EventRow;
}

// ---------------------------------------------------------------------------
// Bid assertions
// ---------------------------------------------------------------------------

export interface BidRow {
  id: string;
  event_id: string;
  vendor_id: string;
  status: string;
  forge_items: unknown[] | null;
  subtotal: string | null;
  total_forge_cost: string | null;
}

/** Fetch the most recent bid for a given event+vendor combination. */
export async function getLatestBidForVendor(
  eventId: string,
  vendorId: string
): Promise<BidRow | null> {
  const db = getTestDb();
  const { data, error } = await db
    .from('bids')
    .select('*')
    .eq('event_id', eventId)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return data as BidRow;
}

/** Fetch a single bid by ID. */
export async function getBid(bidId: string): Promise<BidRow | null> {
  const db = getTestDb();
  const { data, error } = await db
    .from('bids')
    .select('*')
    .eq('id', bidId)
    .single();
  if (error) return null;
  return data as BidRow;
}

// ---------------------------------------------------------------------------
// Execution plan assertions
// ---------------------------------------------------------------------------

export interface ExecutionPlanRow {
  id: string;
  event_id: string;
  vendor_id: string;
  blueprint_item_id: string;
  subtask_title: string;
  status: string;
}

/** Fetch all execution plan rows for a given event+vendor. */
export async function getExecutionPlans(
  eventId: string,
  vendorId: string
): Promise<ExecutionPlanRow[]> {
  const db = getTestDb();
  const { data } = await db
    .from('execution_plans')
    .select('*')
    .eq('event_id', eventId)
    .eq('vendor_id', vendorId);
  return (data as ExecutionPlanRow[]) || [];
}

// ---------------------------------------------------------------------------
// User/vendor ID lookup
// ---------------------------------------------------------------------------

/** Get the internal vendor row for a user by their auth email. */
export async function getVendorByEmail(
  email: string
): Promise<{ id: string; user_id: string } | null> {
  const db = getTestDb();
  const { data: user } = await db
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  if (!user) return null;

  const { data: vendor } = await db
    .from('vendors')
    .select('id, user_id')
    .eq('user_id', user.id)
    .single();
  return vendor ?? null;
}

/** Get the user row for an email. */
export async function getUserByEmail(
  email: string
): Promise<{ id: string; email: string } | null> {
  const db = getTestDb();
  const { data } = await db
    .from('users')
    .select('id, email')
    .eq('email', email)
    .single();
  return data ?? null;
}
