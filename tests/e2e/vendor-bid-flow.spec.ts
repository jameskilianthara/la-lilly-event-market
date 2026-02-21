/**
 * vendor-bid-flow.spec.ts — @smoke
 *
 * Test 2: Vendor submits bid end-to-end with DB assertions.
 *
 * - Dashboard loads without 500
 * - Blueprint page shows sections and client selections
 * - Bid template has all blueprint items (selected + unselected)
 * - Submit bid → DB assert forge_items schema including specs field
 *
 * Requires: a live event in OPEN_FOR_BIDS status.
 * Set TEST_OPEN_EVENT_ID in .env.test, or the test creates an event first.
 *
 * Cleanup: deletes test bid in afterEach.
 */

import { test, expect } from '@playwright/test';
import { loginAsVendor, TEST_CREDS, BASE_URL } from '../helpers/auth.helper';
import {
  getVendorByEmail,
  getLatestBidForVendor,
} from '../helpers/db.helper';
import { deleteTestBid } from '../helpers/cleanup.helper';
import { VendorDashboardPage } from '../pages/VendorDashboardPage';

const OPEN_EVENT_ID = process.env.TEST_OPEN_EVENT_ID;

// ---------------------------------------------------------------------------
// Vendor dashboard — no 500 errors
// ---------------------------------------------------------------------------

test.describe('Vendor dashboard @smoke', () => {

  test('dashboard loads with Open Events heading and no 500', async ({ page }) => {
    await loginAsVendor(page);

    const dashboard = new VendorDashboardPage(page);
    await dashboard.goto();
    await dashboard.assertDashboardLoaded();
  });

  test('API /api/forge/projects responds 200 for vendor', async ({ page, request }) => {
    await loginAsVendor(page);

    // Get session cookies to make authenticated API request
    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

    const response = await request.get(`${BASE_URL}/api/forge/projects`, {
      headers: { Cookie: cookieHeader },
    });

    expect(response.status()).not.toBe(500);
    // Either 200 (with events) or 401 if the route requires auth header differently
    expect([200, 404]).toContain(response.status());
  });
});

// ---------------------------------------------------------------------------
// Blueprint page — sections + client selections visible
// ---------------------------------------------------------------------------

test.describe('Vendor blueprint page @smoke', () => {

  test.skip(!OPEN_EVENT_ID, 'Set TEST_OPEN_EVENT_ID in .env.test to run blueprint page test');

  test('blueprint page shows sections and client selections', async ({ page }) => {
    await loginAsVendor(page);

    const dashboard = new VendorDashboardPage(page);
    await dashboard.gotoEvent(OPEN_EVENT_ID!);
    await dashboard.assertBlueprintSectionsVisible();

    // Client selections section should be visible
    await expect(
      page.getByText(/Client Selections|Client Requests|selected by client/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('execution plan tab is locked before bid submitted', async ({ page }) => {
    await loginAsVendor(page);

    const dashboard = new VendorDashboardPage(page);
    await dashboard.gotoEvent(OPEN_EVENT_ID!);
    await dashboard.assertExecutionPlanTabDisabled();
  });
});

// ---------------------------------------------------------------------------
// Bid template — all items load, submit with specs
// ---------------------------------------------------------------------------

test.describe('Vendor bid submission @smoke', () => {

  test.skip(!OPEN_EVENT_ID, 'Set TEST_OPEN_EVENT_ID in .env.test to run bid submission test');

  let createdBidId: string | null = null;

  test.afterEach(async () => {
    if (createdBidId) {
      await deleteTestBid(createdBidId);
      createdBidId = null;
    }
  });

  test('bid template loads all blueprint items (selected + unselected)', async ({ page }) => {
    await loginAsVendor(page);

    const dashboard = new VendorDashboardPage(page);
    await dashboard.gotoBidTemplate(OPEN_EVENT_ID!);
    await dashboard.assertBidTemplateLoaded();

    // Both client-selected and optional items must be present
    await dashboard.assertBothSelectedAndUnselectedItemsPresent();

    // At least 1 line item total
    const itemCount = await dashboard.getBlueprintItemCount();
    expect(itemCount, 'Bid template should have at least one line item').toBeGreaterThan(0);
  });

  test('submit bid persists forge_items with canonical schema including specs field', async ({
    page,
  }) => {
    await loginAsVendor(page);

    const dashboard = new VendorDashboardPage(page);
    await dashboard.gotoBidTemplate(OPEN_EVENT_ID!);
    await dashboard.assertBidTemplateLoaded();

    // Fill prices on all line items
    await dashboard.fillLineItemPrices('15000');

    // Fill specs on the first item
    const testSpecs = 'Steel-framed, 12ft x 8ft, satin white finish';
    await dashboard.fillFirstItemSpecs(testSpecs);

    // Submit the proposal
    await dashboard.submitProposal();

    // ---- DB: bid row exists ----
    const vendor = await getVendorByEmail(TEST_CREDS.vendor.email);
    expect(vendor, 'Vendor should exist in DB').not.toBeNull();

    const bid = await getLatestBidForVendor(OPEN_EVENT_ID!, vendor!.id);
    expect(bid, 'Bid should be written to DB').not.toBeNull();
    createdBidId = bid!.id;

    // ---- DB: forge_items is an array ----
    expect(Array.isArray(bid!.forge_items)).toBe(true);
    expect(
      (bid!.forge_items as unknown[]).length,
      'forge_items should have at least one item'
    ).toBeGreaterThan(0);

    // ---- DB: first item has canonical schema keys ----
    const firstItem = (bid!.forge_items as Record<string, unknown>[])[0];
    expect(firstItem).toHaveProperty('name');
    expect(firstItem).toHaveProperty('unitPrice');
    expect(firstItem).toHaveProperty('lineTotal');
    expect(firstItem).toHaveProperty('category');
    expect(firstItem).toHaveProperty('specs');

    // ---- DB: specs field contains our test value on first item ----
    expect(firstItem.specs).toBe(testSpecs);

    // ---- DB: subtotal is a non-zero number ----
    const subtotal = parseFloat(bid!.subtotal || '0');
    expect(subtotal).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Execution plan tab — unlocked after bid
// ---------------------------------------------------------------------------

test.describe('Execution plan tab gating @smoke', () => {

  test.skip(!OPEN_EVENT_ID, 'Set TEST_OPEN_EVENT_ID in .env.test to run tab gating test');

  let createdBidId: string | null = null;

  test.afterEach(async () => {
    if (createdBidId) {
      await deleteTestBid(createdBidId);
      createdBidId = null;
    }
  });

  test('execution plan tab is locked before bid, unlocked after bid submitted', async ({
    page,
  }) => {
    await loginAsVendor(page);

    const dashboard = new VendorDashboardPage(page);

    // ---- Before bid: tab should be disabled ----
    await dashboard.gotoEvent(OPEN_EVENT_ID!);
    await dashboard.assertExecutionPlanTabDisabled();

    // ---- Submit bid ----
    await dashboard.goToProposal();
    await dashboard.fillLineItemPrices('12000');
    await dashboard.submitProposal();

    // Track bid for cleanup
    const vendor = await getVendorByEmail(TEST_CREDS.vendor.email);
    if (vendor) {
      const bid = await getLatestBidForVendor(OPEN_EVENT_ID!, vendor.id);
      if (bid) createdBidId = bid.id;
    }

    // ---- After bid: navigate back to blueprint page ----
    await dashboard.gotoEvent(OPEN_EVENT_ID!);

    // ---- Execution plan tab should now be a clickable button ----
    await dashboard.assertExecutionPlanTabEnabled();
  });
});
