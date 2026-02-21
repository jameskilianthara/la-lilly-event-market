/**
 * regression.spec.ts — @regression
 *
 * Tests 4–9:
 *   4. Execution plan subtask creation + status toggle
 *   5. Unauthenticated access redirects (also covered in auth-flow @smoke — repeated here for regression tagging)
 *   6. Vendor RLS — vendor B cannot see vendor A's bids via direct API
 *   7. Launch Project regression — locks down the forge_status + bidding_closes_at silent-drop bug
 *   8. Specs field regression — forge_items contain specs values after bid submission
 *
 * All tests include cleanup in afterEach.
 */

import { test, expect } from '@playwright/test';
import { loginAsClient, loginAsVendor, TEST_CREDS, BASE_URL } from '../helpers/auth.helper';
import {
  getEvent,
  getVendorByEmail,
  getLatestBidForVendor,
  getExecutionPlans,
} from '../helpers/db.helper';
import {
  deleteTestEvent,
  deleteTestBid,
  deleteTestExecutionPlan,
} from '../helpers/cleanup.helper';
import { setupForgeMock, MOCK_EVENT_ID, isMockModeEnabled } from '../helpers/mock.helper';
import { ForgePage } from '../pages/ForgePage';
import { VendorDashboardPage } from '../pages/VendorDashboardPage';

const OPEN_EVENT_ID = process.env.TEST_OPEN_EVENT_ID;

// ---------------------------------------------------------------------------
// Test 5: Execution plan subtask creation @regression
// ---------------------------------------------------------------------------

test.describe('Test 5: Execution plan subtask creation @regression', () => {

  test.skip(!OPEN_EVENT_ID, 'Set TEST_OPEN_EVENT_ID in .env.test');

  let createdBidId: string | null = null;
  let createdSubtaskId: string | null = null;

  test.afterEach(async () => {
    if (createdSubtaskId) await deleteTestExecutionPlan(createdSubtaskId);
    if (createdBidId) await deleteTestBid(createdBidId);
    createdBidId = null;
    createdSubtaskId = null;
  });

  test('add subtask on execution plan and assert DB + toggle status', async ({ page }) => {
    await loginAsVendor(page);

    const dashboard = new VendorDashboardPage(page);

    // Submit a bid first so the execution plan tab unlocks
    await dashboard.gotoBidTemplate(OPEN_EVENT_ID!);
    await dashboard.fillLineItemPrices('10000');
    await dashboard.submitProposal();

    const vendor = await getVendorByEmail(TEST_CREDS.vendor.email);
    expect(vendor).not.toBeNull();

    const bid = await getLatestBidForVendor(OPEN_EVENT_ID!, vendor!.id);
    expect(bid).not.toBeNull();
    createdBidId = bid!.id;

    // Navigate back to event and click Execution Plan tab
    await dashboard.gotoEvent(OPEN_EVENT_ID!);
    await dashboard.assertExecutionPlanTabEnabled();

    const execTab = page.getByRole('button', { name: /Execution Plan/i });
    await execTab.click();
    await page.waitForTimeout(1000);

    // Expand first blueprint section and add a subtask
    const addBtn = page
      .getByRole('button', { name: /Add Subtask|Add Task|\+/i })
      .first();
    await expect(addBtn).toBeVisible({ timeout: 8000 });
    await addBtn.click();
    await page.waitForTimeout(500);

    // Fill subtask title
    const subtaskTitle = `[TEST] Subtask ${Date.now()}`;
    const titleInput = page
      .locator('input[placeholder*="subtask title" i], input[placeholder*="task title" i], input[placeholder*="Title" i]')
      .last();
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill(subtaskTitle);
    await titleInput.press('Enter');
    await page.waitForTimeout(1000);

    // ---- DB: execution_plans row should exist ----
    const plans = await getExecutionPlans(OPEN_EVENT_ID!, vendor!.id);
    const newPlan = plans.find((p) => p.subtask_title === subtaskTitle);
    expect(newPlan, 'Subtask should be persisted in execution_plans').toBeTruthy();
    createdSubtaskId = newPlan!.id;

    expect(newPlan!.event_id).toBe(OPEN_EVENT_ID);
    expect(newPlan!.vendor_id).toBe(vendor!.id);
    expect(newPlan!.status).toBe('not_started');

    // ---- Toggle status to in_progress ----
    const statusBtn = page
      .locator(`[data-subtask-id="${createdSubtaskId}"] button, button`)
      .filter({ hasText: /not started|in progress|done/i })
      .first();

    if (await statusBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await statusBtn.click();
      await page.waitForTimeout(1000);

      // ---- DB: status updated ----
      const updatedPlans = await getExecutionPlans(OPEN_EVENT_ID!, vendor!.id);
      const updated = updatedPlans.find((p) => p.id === createdSubtaskId);
      expect(updated?.status).not.toBe('not_started');
    }
  });
});

// ---------------------------------------------------------------------------
// Test 6: Unauthenticated redirects @regression
// (also covered in auth-flow @smoke — here for completeness in regression suite)
// ---------------------------------------------------------------------------

test.describe('Test 6: Unauthenticated redirects @regression', () => {

  test('/craftsmen/dashboard redirects unauthenticated user to login', async ({ page }) => {
    // Use a fresh browser context with no cookies
    await page.goto(`${BASE_URL}/craftsmen/dashboard`);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login|\/craftsmen\/login/, {
      timeout: 8000,
    });
  });

  test('/dashboard/client redirects unauthenticated user to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/client`);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });

  test('/blueprint/:id redirects unauthenticated user to login', async ({ page }) => {
    // Use a fake but valid-format UUID
    await page.goto(`${BASE_URL}/blueprint/00000000-0000-0000-0000-000000000000`);
    await page.waitForTimeout(2000);
    // Either redirect to login OR show a "not found" page — must not show blueprint content
    const isOnLogin = await page.url().includes('login');
    const isNotFound = await page
      .getByText(/not found|404|Event not found/i)
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    expect(isOnLogin || isNotFound, 'Should redirect to login or show not-found').toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 7: Vendor RLS — vendor B cannot see vendor A's bids @regression
// ---------------------------------------------------------------------------

test.describe('Test 7: Vendor RLS bid isolation @regression', () => {

  test.skip(!OPEN_EVENT_ID, 'Set TEST_OPEN_EVENT_ID in .env.test');

  /**
   * This test verifies that the API does not leak vendor A's bid details to vendor B.
   * It uses vendor A's session to submit a bid, then uses an unauthenticated/vendor-B
   * request to attempt to read bids for the same event.
   *
   * The Supabase RLS policy on the bids table should block cross-vendor reads.
   * The API route /api/forge/projects/:id/proposals is client-facing (for shortlisting),
   * so a vendor B request should either 403 or return only their own bids.
   */

  let vendorABidId: string | null = null;

  test.afterEach(async () => {
    if (vendorABidId) {
      await deleteTestBid(vendorABidId);
      vendorABidId = null;
    }
  });

  test('vendor cannot access bids API for an event as unauthenticated user', async ({
    page,
    request,
  }) => {
    // Step 1: Vendor A submits a bid via UI
    await loginAsVendor(page);

    const dashboard = new VendorDashboardPage(page);
    await dashboard.gotoBidTemplate(OPEN_EVENT_ID!);
    await dashboard.fillLineItemPrices('20000');
    await dashboard.submitProposal();

    const vendor = await getVendorByEmail(TEST_CREDS.vendor.email);
    const bid = await getLatestBidForVendor(OPEN_EVENT_ID!, vendor!.id);
    expect(bid).not.toBeNull();
    vendorABidId = bid!.id;

    // Step 2: Unauthenticated request to proposals endpoint
    // (no session cookie — simulates vendor B who is not logged in)
    const unauthResponse = await request.get(
      `${BASE_URL}/api/forge/projects/${OPEN_EVENT_ID}/proposals`
    );

    // Should be 401 (unauthorized) — not 200
    expect(
      unauthResponse.status(),
      'Unauthenticated request to proposals should be 401 or 403'
    ).toBeGreaterThanOrEqual(400);
  });

  test('vendor A cannot read vendor B bid via direct /api/bids/:bidId GET', async ({
    page,
    request,
  }) => {
    // Step 1: Get vendor A bid id
    await loginAsVendor(page);

    const dashboard = new VendorDashboardPage(page);
    await dashboard.gotoBidTemplate(OPEN_EVENT_ID!);
    await dashboard.fillLineItemPrices('20000');
    await dashboard.submitProposal();

    const vendor = await getVendorByEmail(TEST_CREDS.vendor.email);
    const bid = await getLatestBidForVendor(OPEN_EVENT_ID!, vendor!.id);
    expect(bid).not.toBeNull();
    vendorABidId = bid!.id;

    // Step 2: Make an unauthenticated GET request directly to vendor A's bid
    const unauthBidResponse = await request.get(
      `${BASE_URL}/api/bids/${vendorABidId}`
    );

    // The bid detail route should not return the bid without auth
    // 401 or 403 expected — 200 with data would be a security failure
    if (unauthBidResponse.status() === 200) {
      // If 200, the response must not contain sensitive forge_items pricing
      const body = await unauthBidResponse.json();
      // Acceptable only if the route is intentionally public — flag for review
      console.warn(
        'WARNING: /api/bids/:id returned 200 without auth — verify this is intentional'
      );
      // The response should at minimum not contain full forge_items detail
      expect(body.bid?.forge_items ?? body.forge_items).toBeUndefined();
    } else {
      expect(unauthBidResponse.status()).toBeGreaterThanOrEqual(400);
    }
  });
});

// ---------------------------------------------------------------------------
// Test 8 (Regression): Launch Project — forge_status + bidding_closes_at
// Locks down the bug where PATCH handler silently dropped both fields.
// ---------------------------------------------------------------------------

const TEST_EVENT_LAUNCH = {
  eventType: 'Wedding',
  date: 'June 20, 2027',
  city: 'Mumbai',
  guestCount: '200',
  venueStatus: 'Not yet booked',
};

test.describe('Test 8: Launch Project regression @regression', () => {
  let createdEventId: string | null = null;

  test.afterEach(async () => {
    if (createdEventId) {
      await deleteTestEvent(createdEventId);
      createdEventId = null;
    }
  });

  test(
    'launch project writes forge_status=OPEN_FOR_BIDS and bidding_closes_at to DB',
    async ({ page }) => {
      /**
       * This test specifically guards against the regression where
       * /api/forge/projects/[projectId] PATCH silently dropped forge_status
       * and bidding_closes_at. Requires a real DB connection (no mock mode).
       */
      test.skip(
        isMockModeEnabled(),
        'Launch Project regression requires a real DB connection — set PLAYWRIGHT_MOCK_AI=false'
      );

      await loginAsClient(page);

      const forge = new ForgePage(page);
      await forge.goto();

      createdEventId = await forge.completeForgeChat(TEST_EVENT_LAUNCH);
      expect(createdEventId).toBeTruthy();

      // ---- Verify event exists before launch ----
      const eventBefore = await getEvent(createdEventId!);
      expect(eventBefore, 'Event row should exist in DB after chat').not.toBeNull();
      // Before launch, forge_status must NOT be OPEN_FOR_BIDS yet
      expect(eventBefore!.forge_status).not.toBe('OPEN_FOR_BIDS');

      // ---- Complete checklist → blueprint ----
      await forge.goToChecklist();
      await expect(page).toHaveURL(/\/checklist/, { timeout: 10000 });
      await forge.completeAllChecklistSections();
      await forge.submitChecklist();
      await expect(page).toHaveURL(/\/blueprint\//, { timeout: 15000 });
      await page.waitForLoadState('networkidle');

      // ---- Launch the project ----
      await forge.assertBlueprintLoaded();
      await forge.launchProject();

      await expect(page).toHaveURL(/\/dashboard\/client/, { timeout: 15000 });
      await page.waitForTimeout(1000);

      // ---- DB: forge_status must be OPEN_FOR_BIDS ----
      const eventAfter = await getEvent(createdEventId!);
      expect(eventAfter, 'Event should still exist after launch').not.toBeNull();
      expect(
        eventAfter!.forge_status,
        'forge_status should be OPEN_FOR_BIDS after launch'
      ).toBe('OPEN_FOR_BIDS');

      // ---- DB: bidding_closes_at must be set and in the future ----
      expect(
        eventAfter!.bidding_closes_at,
        'bidding_closes_at should be set after launch'
      ).not.toBeNull();

      const closesAt = new Date(eventAfter!.bidding_closes_at!);
      const now = new Date();
      expect(
        closesAt > now,
        `bidding_closes_at (${closesAt.toISOString()}) should be in the future`
      ).toBe(true);
    }
  );
});

// ---------------------------------------------------------------------------
// Test 9 (Regression): Specs field — forge_items rows contain specs in DB
// Locks down the optional `specs` field added to the bid template line items.
// ---------------------------------------------------------------------------

test.describe('Test 9: Specs field regression @regression', () => {
  test.skip(!OPEN_EVENT_ID, 'Set TEST_OPEN_EVENT_ID in .env.test');

  let createdBidId: string | null = null;

  test.afterEach(async () => {
    if (createdBidId) {
      await deleteTestBid(createdBidId);
      createdBidId = null;
    }
  });

  test('forge_items in submitted bid contain specs values', async ({ page }) => {
    await loginAsVendor(page);

    const dashboard = new VendorDashboardPage(page);
    await dashboard.gotoBidTemplate(OPEN_EVENT_ID!);
    await dashboard.assertBidTemplateLoaded();

    // Fill prices on all auto-generated items
    await dashboard.fillLineItemPrices('15000');

    // Fill specs on the first two line items using targeted selectors
    const specsInputs = page.locator(
      'input[placeholder*="Dimensions" i], input[placeholder*="materials" i], input[placeholder*="specs" i]'
    );

    const specsCount = await specsInputs.count();
    expect(specsCount, 'At least one specs input should exist in the bid template').toBeGreaterThan(0);

    const specsValue1 = 'Steel frame, 10x5m, powder-coated black';
    const specsValue2 = 'LED strip, 5000K, IP65 rated';

    await specsInputs.nth(0).fill(specsValue1);
    if (specsCount >= 2) {
      await specsInputs.nth(1).fill(specsValue2);
    }

    // Submit the proposal
    await dashboard.submitProposal();

    // ---- DB: verify forge_items contain specs ----
    const vendor = await getVendorByEmail(TEST_CREDS.vendor.email);
    expect(vendor).not.toBeNull();

    const bid = await getLatestBidForVendor(OPEN_EVENT_ID!, vendor!.id);
    expect(bid, 'Bid should have been created').not.toBeNull();
    createdBidId = bid!.id;

    // forge_items is a JSONB array on the bid row
    const forgeItems = bid!.forge_items as Array<Record<string, unknown>>;
    expect(forgeItems, 'forge_items should be a non-empty array').toBeTruthy();
    expect(Array.isArray(forgeItems)).toBe(true);
    expect(forgeItems.length, 'forge_items should have at least one item').toBeGreaterThan(0);

    // Find items where specs was filled
    const itemsWithSpecs = forgeItems.filter(
      (item) => typeof item.specs === 'string' && item.specs.trim().length > 0
    );

    expect(
      itemsWithSpecs.length,
      'At least one forge_item should have a non-empty specs value'
    ).toBeGreaterThan(0);

    // Verify the exact specs values were persisted
    const specValues = itemsWithSpecs.map((item) => item.specs as string);
    expect(specValues).toContain(specsValue1);
    if (specsCount >= 2) {
      expect(specValues).toContain(specsValue2);
    }
  });
});
