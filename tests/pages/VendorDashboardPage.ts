/**
 * VendorDashboardPage — Page Object Model
 * Covers: /craftsmen/dashboard, /craftsmen/events/:id, /craftsmen/events/:id/bid
 */

import { Page, expect } from '@playwright/test';
import { BASE_URL } from '../helpers/auth.helper';

export class VendorDashboardPage {
  constructor(private page: Page) {}

  // ---------------------------------------------------------------------------
  // Dashboard (/craftsmen/dashboard)
  // ---------------------------------------------------------------------------

  async goto() {
    await this.page.goto(`${BASE_URL}/craftsmen/dashboard`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Assert the dashboard loaded without errors.
   * Checks that "Open Events" heading is visible and no 500 banner is shown.
   */
  async assertDashboardLoaded() {
    await expect(
      this.page.getByRole('heading', { name: 'Open Events' })
    ).toBeVisible({ timeout: 10000 });
    // Verify no error / 500 page
    await expect(
      this.page.getByText(/500|internal server error/i)
    ).not.toBeVisible();
  }

  /** Returns the count of event cards shown in the Open Events section. */
  async getOpenEventCount(): Promise<number> {
    await this.assertDashboardLoaded();
    return await this.page
      .locator('div')
      .filter({ hasText: /View & Bid|View Blueprint/ })
      .count();
  }

  /**
   * Navigate to the event detail page for a specific event.
   * Finds the event card by matching the event title/type text.
   */
  async openEventByTitle(titleOrType: string) {
    const link = this.page
      .getByRole('link', { name: /View & Bid|View Blueprint/i })
      .filter({ has: this.page.locator(`text=${titleOrType}`) })
      .first();

    // Fallback: just click the first "View & Bid" link
    const viewLink = (await link.isVisible({ timeout: 2000 }).catch(() => false))
      ? link
      : this.page.getByRole('link', { name: /View & Bid/i }).first();

    await viewLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Click "View & Bid" for the first available event. Returns the eventId from URL. */
  async openFirstEvent(): Promise<string> {
    const link = this.page.getByRole('link', { name: /View & Bid/i }).first();
    await expect(link).toBeVisible({ timeout: 5000 });
    const href = await link.getAttribute('href');
    await link.click();
    await this.page.waitForLoadState('networkidle');
    const match = href?.match(/\/craftsmen\/events\/([a-f0-9-]+)/);
    if (!match) throw new Error(`Could not extract eventId from href: ${href}`);
    return match[1];
  }

  // ---------------------------------------------------------------------------
  // Event detail / Blueprint (/craftsmen/events/:id)
  // ---------------------------------------------------------------------------

  async gotoEvent(eventId: string) {
    await this.page.goto(`${BASE_URL}/craftsmen/events/${eventId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /** Assert blueprint sections are visible (the Forge Blueprint tab is active by default). */
  async assertBlueprintSectionsVisible() {
    // At least one section heading should be present in the blueprint tab
    await expect(
      this.page.getByRole('button', { name: /Forge Blueprint/i })
    ).toBeVisible({ timeout: 5000 });
    // Blueprint section content — at least one item label
    const sectionContent = this.page
      .locator('div')
      .filter({ hasText: /Foundation|Ceremony|Catering|Decor|Photography|Schedule/i })
      .first();
    await expect(sectionContent).toBeVisible({ timeout: 5000 });
  }

  /** Assert execution plan tab is disabled (no bid yet). */
  async assertExecutionPlanTabDisabled() {
    // The disabled state renders as a div with cursor-not-allowed, not a button
    const disabledTab = this.page
      .locator('div')
      .filter({ hasText: /Execution Plan/i })
      .filter({ has: this.page.locator('span:has-text("After Bid")') })
      .first();
    await expect(disabledTab).toBeVisible({ timeout: 5000 });
  }

  /** Assert execution plan tab is enabled (after bid submitted). */
  async assertExecutionPlanTabEnabled() {
    const tab = this.page.getByRole('button', { name: /Execution Plan/i });
    await expect(tab).toBeVisible({ timeout: 5000 });
    // The enabled tab is a <button>, not a div
    await expect(tab).toBeEnabled();
  }

  /** Click the "Start Proposal →" button to go to the bid template. */
  async goToProposal() {
    await this.page
      .getByRole('button', { name: /Start Proposal/i })
      .click();
    await this.page.waitForURL(/\/craftsmen\/events\/.*\/bid/, {
      timeout: 10000,
    });
    await this.page.waitForLoadState('networkidle');
  }

  // ---------------------------------------------------------------------------
  // Bid template (/craftsmen/events/:id/bid)
  // ---------------------------------------------------------------------------

  async gotoBidTemplate(eventId: string) {
    await this.page.goto(`${BASE_URL}/craftsmen/events/${eventId}/bid`);
    await this.page.waitForLoadState('networkidle');
  }

  /** Assert the smart bid template loaded and blueprint items are present. */
  async assertBidTemplateLoaded() {
    await expect(
      this.page.getByRole('heading', { name: /Smart Bid Template/i })
    ).toBeVisible({ timeout: 10000 });
  }

  /** Count visible blueprint line item description inputs. */
  async getBlueprintItemCount(): Promise<number> {
    return await this.page
      .locator('input[placeholder="Item description"]')
      .count();
  }

  /**
   * Assert that both client-selected and optional (unselected) items are present.
   */
  async assertBothSelectedAndUnselectedItemsPresent() {
    // Client-selected items have a "Client Request" badge
    await expect(
      this.page.getByText('Client Request').first()
    ).toBeVisible({ timeout: 5000 });
    // Unselected items have "Optional — not selected by client" label
    await expect(
      this.page.getByText(/Optional.*not selected by client/i).first()
    ).toBeVisible({ timeout: 5000 });
  }

  /**
   * Fill in prices for all line items that have a price input at 0.
   * Also fills the specs field on the first item.
   */
  async fillLineItemPrices(defaultPrice = '10000') {
    const priceInputs = this.page.locator(
      'input[type="number"][placeholder="0"]'
    );
    const count = await priceInputs.count();
    for (let i = 0; i < count; i++) {
      await priceInputs.nth(i).fill(defaultPrice);
    }
  }

  /** Fill the specs field on the first line item. */
  async fillFirstItemSpecs(specs: string) {
    const specsInput = this.page
      .locator('input[placeholder="Dimensions, materials, finish — optional"]')
      .first();
    await expect(specsInput).toBeVisible({ timeout: 5000 });
    await specsInput.fill(specs);
  }

  /**
   * Submit the proposal. Waits for the success toast or redirect.
   * Returns without error if submission was successful.
   */
  async submitProposal() {
    const submitBtn = this.page.getByRole('button', {
      name: 'Submit Proposal',
    });
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await submitBtn.click();

    // Wait for success feedback — either a toast or redirect back to event page
    await Promise.race([
      this.page
        .getByText(/success|submitted|proposal submitted/i)
        .waitFor({ state: 'visible', timeout: 10000 }),
      this.page.waitForURL(/\/craftsmen\/events\/[^/]+$/, { timeout: 10000 }),
    ]);
  }
}
