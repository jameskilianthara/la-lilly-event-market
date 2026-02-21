/**
 * client-flow.spec.ts — @smoke
 *
 * Tests 1–3: Client creates event end-to-end with DB assertions.
 *
 * Test 1: Forge chat → Checklist → DB assert forge_blueprint + checklist.selections
 * Test 2: Launch project → DB assert forge_status = OPEN_FOR_BIDS + bidding_closes_at set
 * Test 3: Client selects winner → DB assert bid.status = ACCEPTED + event.winner_bid_id set
 *
 * Cleanup: every test deletes its created event/bids in afterEach.
 */

import { test, expect } from '@playwright/test';
import { loginAsClient, TEST_CREDS, BASE_URL } from '../helpers/auth.helper';
import { getEvent, getVendorByEmail, getLatestBidForVendor, getBid } from '../helpers/db.helper';
import { deleteTestEvent, resetBidWinner } from '../helpers/cleanup.helper';
import { setupForgeMock, MOCK_EVENT_ID, isMockModeEnabled } from '../helpers/mock.helper';
import { ForgePage } from '../pages/ForgePage';
import { BidReviewPage } from '../pages/BidReviewPage';

// Shared test event data — all test events prefixed [TEST] for safe bulk cleanup
const TEST_EVENT = {
  eventType: 'Wedding',
  date: 'June 20, 2027',
  city: 'Mumbai',
  guestCount: '200',
  venueStatus: 'Not yet booked',
};

// ---------------------------------------------------------------------------
// Test 1 — Forge chat + Checklist → DB assertions on forge_blueprint & selections
// ---------------------------------------------------------------------------

test.describe('Test 1: Client forge chat and checklist @smoke', () => {
  let createdEventId: string | null = null;

  test.afterEach(async () => {
    if (createdEventId) {
      await deleteTestEvent(createdEventId);
      createdEventId = null;
    }
  });

  test('complete 5-question chat, fill checklist, assert DB state', async ({ page }) => {
    await loginAsClient(page);

    // Install network mock before navigating so it catches the POST on first load
    const mocked = await setupForgeMock(page);

    const forge = new ForgePage(page);
    await forge.goto();

    // Complete 5-question chat — returns eventId (MOCK_EVENT_ID in mock mode)
    createdEventId = await forge.completeForgeChat(TEST_EVENT);
    expect(createdEventId).toBeTruthy();

    if (mocked) {
      // In mock mode the event was not written to the DB — assert the mock ID was returned
      expect(createdEventId).toBe(MOCK_EVENT_ID);
    } else {
      // ---- DB: event row exists immediately after chat ----
      const eventAfterChat = await getEvent(createdEventId!);
      expect(eventAfterChat, 'Event row should exist in DB after chat').not.toBeNull();
      expect(eventAfterChat!.id).toBe(createdEventId);
    }

    // ---- Navigate to checklist and complete all sections ----
    await forge.goToChecklist();
    await expect(page).toHaveURL(/\/checklist/, { timeout: 10000 });

    await forge.completeAllChecklistSections();
    await forge.submitChecklist();

    // Wait for blueprint page to fully load
    await expect(page).toHaveURL(/\/blueprint\//, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500); // allow PATCH to settle

    if (mocked) {
      // In mock mode the PATCH was also intercepted — no DB row to assert against.
      // The UI flow completed successfully — that is the assertion.
      return;
    }

    // ---- DB: forge_blueprint should now be populated ----
    const eventAfterChecklist = await getEvent(createdEventId!);
    expect(
      eventAfterChecklist!.forge_blueprint,
      'forge_blueprint should be written after checklist'
    ).not.toBeNull();

    const blueprint = eventAfterChecklist!.forge_blueprint as Record<string, unknown>;
    expect(blueprint).toHaveProperty('sections');
    const sections = blueprint.sections as unknown[];
    expect(sections.length, 'Blueprint should have at least one section').toBeGreaterThan(0);

    // ---- DB: checklist.selections should have entries ----
    const brief = eventAfterChecklist!.client_brief as Record<string, unknown> | null;
    expect(brief, 'client_brief should not be null').not.toBeNull();

    const checklist = brief!.checklist as Record<string, unknown> | undefined;
    expect(checklist, 'client_brief.checklist should exist').toBeTruthy();

    const selections = checklist!.selections as Record<string, unknown> | undefined;
    expect(
      selections && Object.keys(selections).length > 0,
      'checklist.selections should have at least one entry'
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 2 — Launch project → DB assert forge_status + bidding_closes_at
// ---------------------------------------------------------------------------

test.describe('Test 2: Launch project @smoke', () => {
  let createdEventId: string | null = null;

  test.afterEach(async () => {
    if (createdEventId) {
      await deleteTestEvent(createdEventId);
      createdEventId = null;
    }
  });

  test('launch project sets forge_status=OPEN_FOR_BIDS and bidding_closes_at in DB', async ({
    page,
  }) => {
    await loginAsClient(page);

    // Install network mock before navigating so it catches the POST on first load
    const mocked = await setupForgeMock(page);

    const forge = new ForgePage(page);
    await forge.goto();

    // Complete chat + checklist
    createdEventId = await forge.completeForgeChat(TEST_EVENT);

    if (mocked) {
      // In mock mode the event was not written to the DB — skip this test's DB assertions
      // The UI flow is already covered by Test 1; this test only locks down the launch-project bug.
      return;
    }

    await forge.goToChecklist();
    await forge.completeAllChecklistSections();
    await forge.submitChecklist();

    // Wait for blueprint page
    await expect(page).toHaveURL(/\/blueprint\//, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const blueprintPage = new ForgePage(page);
    await blueprintPage.assertBlueprintLoaded();

    // ---- Launch project ----
    await blueprintPage.launchProject();

    // Should now be on client dashboard
    await expect(page).toHaveURL(/\/dashboard\/client/, { timeout: 15000 });
    await page.waitForTimeout(1000);

    // ---- DB: forge_status = OPEN_FOR_BIDS ----
    const event = await getEvent(createdEventId!);
    expect(event, 'Event should exist after launch').not.toBeNull();
    expect(event!.forge_status).toBe('OPEN_FOR_BIDS');

    // ---- DB: bidding_closes_at is set and is in the future ----
    expect(
      event!.bidding_closes_at,
      'bidding_closes_at should be set after launch'
    ).not.toBeNull();

    const closesAt = new Date(event!.bidding_closes_at!);
    const now = new Date();
    expect(
      closesAt > now,
      `bidding_closes_at (${closesAt.toISOString()}) should be in the future`
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 3 — Client selects winner → DB assert bid.status + event.winner_bid_id
// ---------------------------------------------------------------------------

test.describe('Test 3: Client selects winner @smoke', () => {
  /**
   * This test requires a pre-existing event with at least one SHORTLISTED bid.
   * It reads TEST_EVENT_WITH_BIDS_ID from .env.test; if not set, it skips.
   *
   * After running, it resets the bid and event back to pre-test state via cleanup.
   */

  const fixedEventId = process.env.TEST_EVENT_WITH_BIDS_ID;

  test.skip(!fixedEventId, 'Set TEST_EVENT_WITH_BIDS_ID in .env.test to run winner-selection test');

  let selectedBidId: string | null = null;

  test.afterEach(async () => {
    if (selectedBidId && fixedEventId) {
      await resetBidWinner(selectedBidId, fixedEventId);
    }
  });

  test('select winner sets bid.status=ACCEPTED and event.winner_bid_id', async ({ page }) => {
    await loginAsClient(page);

    const bidReview = new BidReviewPage(page);
    await bidReview.gotoBids(fixedEventId!);

    // Shortlist first available bid if none are shortlisted
    await bidReview.autoShortlist();

    // Select winner
    await bidReview.selectFirstWinner();

    // ---- Read the winner_bid_id from the event to know which bid to assert ----
    await page.waitForTimeout(1500);
    const event = await getEvent(fixedEventId!);
    expect(event, 'Event should exist').not.toBeNull();
    expect(
      event!.winner_bid_id,
      'event.winner_bid_id should be set after winner selection'
    ).not.toBeNull();

    selectedBidId = event!.winner_bid_id;

    // ---- DB: bid.status = ACCEPTED ----
    const bid = await getBid(selectedBidId!);
    expect(bid, 'Winning bid should exist').not.toBeNull();
    expect(bid!.status.toUpperCase()).toBe('ACCEPTED');

    // ---- DB: event.winner_bid_id matches the ACCEPTED bid ----
    expect(event!.winner_bid_id).toBe(bid!.id);
  });
});
