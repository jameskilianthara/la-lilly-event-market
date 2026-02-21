/**
 * cleanup.helper.ts
 * Functions to delete test data created during test runs.
 * Each test that creates data must call the appropriate cleanup function
 * in its afterEach/afterAll — regardless of pass/fail.
 *
 * All operations use service-role client to bypass RLS.
 */

import { getTestDb } from './db.helper';

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/**
 * Delete a test event and all child records (bids, execution_plans).
 * Cascades automatically via FK constraints, but we log each step.
 */
export async function deleteTestEvent(eventId: string): Promise<void> {
  if (!eventId) return;
  const db = getTestDb();

  // execution_plans cascade on event FK, but delete explicitly for clarity
  await db.from('execution_plans').delete().eq('event_id', eventId);
  await db.from('bids').delete().eq('event_id', eventId);
  await db.from('events').delete().eq('id', eventId);
}

// ---------------------------------------------------------------------------
// Bids
// ---------------------------------------------------------------------------

/** Delete a single test bid by ID. */
export async function deleteTestBid(bidId: string): Promise<void> {
  if (!bidId) return;
  const db = getTestDb();
  await db.from('bids').delete().eq('id', bidId);
}

/**
 * Reset a bid back to SUBMITTED status and clear winner_bid_id on the parent event.
 * Used after winner-selection tests so the event can be reused.
 */
export async function resetBidWinner(
  bidId: string,
  eventId: string
): Promise<void> {
  if (!bidId || !eventId) return;
  const db = getTestDb();

  await db
    .from('bids')
    .update({ status: 'SUBMITTED', updated_at: new Date().toISOString() })
    .eq('id', bidId);

  await db
    .from('events')
    .update({
      winner_bid_id: null,
      forge_status: 'OPEN_FOR_BIDS',
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId);
}

// ---------------------------------------------------------------------------
// Execution plans
// ---------------------------------------------------------------------------

/** Delete all execution plan rows for a given event+vendor. */
export async function deleteTestExecutionPlans(
  eventId: string,
  vendorId: string
): Promise<void> {
  if (!eventId || !vendorId) return;
  const db = getTestDb();
  await db
    .from('execution_plans')
    .delete()
    .eq('event_id', eventId)
    .eq('vendor_id', vendorId);
}

/** Delete a single execution plan row by ID. */
export async function deleteTestExecutionPlan(subtaskId: string): Promise<void> {
  if (!subtaskId) return;
  const db = getTestDb();
  await db.from('execution_plans').delete().eq('id', subtaskId);
}

// ---------------------------------------------------------------------------
// Events by owner (bulk cleanup after a test suite)
// ---------------------------------------------------------------------------

/**
 * Delete all events created by a user whose email contains a test marker.
 * Safe guard: only deletes events where title starts with '[TEST]'.
 * All test-created events must use this title prefix.
 */
export async function deleteAllTestEventsForUser(userId: string): Promise<void> {
  if (!userId) return;
  const db = getTestDb();

  const { data: events } = await db
    .from('events')
    .select('id')
    .eq('owner_user_id', userId)
    .like('title', '[TEST]%');

  for (const event of events || []) {
    await deleteTestEvent(event.id);
  }
}
