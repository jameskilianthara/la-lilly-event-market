/**
 * BidReviewPage — Page Object Model
 * Covers: /dashboard/client, /dashboard/client/events/:id/bids, winner selection
 */

import { Page, expect } from '@playwright/test';
import { BASE_URL } from '../helpers/auth.helper';

export class BidReviewPage {
  constructor(private page: Page) {}

  // ---------------------------------------------------------------------------
  // Client dashboard (/dashboard/client)
  // ---------------------------------------------------------------------------

  async goto() {
    await this.page.goto(`${BASE_URL}/dashboard/client`);
    await this.page.waitForLoadState('networkidle');
  }

  async assertDashboardLoaded() {
    await expect(
      this.page.getByRole('heading', { name: /My Forge Projects/i })
    ).toBeVisible({ timeout: 10000 });
  }

  /** Return the count of event cards on the client dashboard. */
  async getEventCount(): Promise<number> {
    await this.assertDashboardLoaded();
    return await this.page
      .getByRole('button', { name: /View Event|View.*Bid/i })
      .count();
  }

  /**
   * Click the action button on the event card matching the given eventId.
   * Falls back to first event if title match is not found.
   */
  async openEvent(eventId: string) {
    // The event card shows a code element with the eventId
    const card = this.page
      .locator('code')
      .filter({ hasText: eventId.slice(0, 8) })
      .locator('../..')
      .first();

    if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
      await card.getByRole('button').click();
    } else {
      // Fallback: first event button
      await this.page.getByRole('button', { name: /View/i }).first().click();
    }
    await this.page.waitForLoadState('networkidle');
  }

  // ---------------------------------------------------------------------------
  // Bids list (/dashboard/client/events/:id/bids)
  // ---------------------------------------------------------------------------

  async gotoBids(eventId: string) {
    await this.page.goto(
      `${BASE_URL}/dashboard/client/events/${eventId}/bids`
    );
    await this.page.waitForLoadState('networkidle');
  }

  async assertBidsPageLoaded() {
    // Page should not 500
    await expect(
      this.page.getByText(/500|internal server error/i)
    ).not.toBeVisible();
    // Either bids are present or an empty state is shown
    const hasBids = await this.page
      .getByText(/₹|bid|proposal/i)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    return hasBids;
  }

  /** Returns the number of bid cards visible. */
  async getBidCount(): Promise<number> {
    return await this.page
      .getByRole('button', { name: /Shortlist|View Full Proposal|Select/i })
      .count();
  }

  /**
   * Shortlist the first available bid by clicking its "Shortlist" button.
   * Returns the bid card element for further assertions.
   */
  async shortlistFirstBid() {
    const shortlistBtn = this.page
      .getByRole('button', { name: 'Shortlist' })
      .first();
    await expect(shortlistBtn).toBeVisible({ timeout: 5000 });
    await shortlistBtn.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click "Auto-Select Top 5" to shortlist bids automatically,
   * then confirm the shortlist.
   */
  async autoShortlist() {
    const autoBtn = this.page.getByRole('button', {
      name: 'Auto-Select Top 5',
    });
    if (await autoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await autoBtn.click();
      await this.page.waitForTimeout(500);
    }

    const confirmBtn = this.page
      .getByRole('button', { name: /Shortlist.*Selected|Confirm Shortlist/i })
      .first();
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Select the first shortlisted bid as winner.
   * Clicks "Select", then confirms in the modal.
   * Returns the bidId selected (extracted from a data attribute or URL).
   */
  async selectFirstWinner(): Promise<void> {
    // Filter to only shortlisted tab first
    const shortlistedTab = this.page.getByRole('button', {
      name: 'Shortlisted',
    });
    if (
      await shortlistedTab.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await shortlistedTab.click();
      await this.page.waitForTimeout(500);
    }

    // Click "Select" on the first shortlisted bid
    const selectBtn = this.page
      .getByRole('button', { name: 'Select' })
      .first();
    await expect(selectBtn).toBeVisible({ timeout: 5000 });
    await selectBtn.click();

    // Confirm in the modal
    const confirmBtn = this.page.getByRole('button', { name: 'Confirm' });
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    // Wait for UI update
    await this.page.waitForTimeout(2000);
  }

  // ---------------------------------------------------------------------------
  // Select winner page (/dashboard/client/events/:id/select-winner)
  // ---------------------------------------------------------------------------

  async gotoSelectWinner(eventId: string) {
    await this.page.goto(
      `${BASE_URL}/dashboard/client/events/${eventId}/select-winner`
    );
    await this.page.waitForLoadState('networkidle');
  }

  /** Click the "Confirm & Commission Winner" button. Handles the browser confirm dialog. */
  async confirmAndCommissionWinner() {
    // Handle native confirm() dialog
    this.page.once('dialog', (dialog) => dialog.accept());

    const btn = this.page.getByRole('button', {
      name: /Confirm.*Commission Winner/i,
    });
    await expect(btn).toBeVisible({ timeout: 5000 });
    await btn.click();
    await this.page.waitForTimeout(2000);
  }
}
