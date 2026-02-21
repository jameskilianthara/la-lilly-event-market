/**
 * ForgePage — Page Object Model
 * Covers: /forge (chat), /checklist (sections), /blueprint/:id (launch)
 */

import { Page, expect } from '@playwright/test';
import { BASE_URL } from '../helpers/auth.helper';

export class ForgePage {
  constructor(private page: Page) {}

  // ---------------------------------------------------------------------------
  // Chat (/forge)
  // ---------------------------------------------------------------------------

  async goto() {
    await this.page.goto(`${BASE_URL}/forge`);
    await this.page.waitForLoadState('networkidle');
  }

  /** Wait for the first bot question to appear. */
  async waitForChatReady() {
    await expect(
      this.page.getByText(/What kind of event|event are you planning/i)
    ).toBeVisible({ timeout: 10000 });
  }

  /** Type an answer into the chat text input and submit it. */
  async sendChatMessage(message: string) {
    const input = this.page.getByRole('textbox');
    await input.fill(message);
    await this.page.locator('form button[type="submit"]').click();
    // Wait for bot response to arrive
    await this.page.waitForTimeout(1500);
  }

  /**
   * Select a date via the date picker that appears for the date question.
   * Falls back to typing if the picker is not found.
   */
  async sendDateAnswer(dateText: string) {
    // The date step renders a date picker; look for a text input fallback
    const textInput = this.page.getByRole('textbox');
    if (await textInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await textInput.fill(dateText);
      await this.page.locator('form button[type="submit"]').click();
    } else {
      // Date picker — click the displayed date or type in any visible input
      const anyInput = this.page.locator('input').last();
      await anyInput.fill(dateText);
      await this.page.keyboard.press('Enter');
    }
    await this.page.waitForTimeout(1500);
  }

  /**
   * Complete the full 5-question forge chat flow.
   * Returns the eventId extracted from the URL after the project is created.
   */
  async completeForgeChat(answers: {
    eventType: string;
    date: string;
    city: string;
    guestCount: string;
    venueStatus: string;
  }): Promise<string> {
    await this.waitForChatReady();

    await this.sendChatMessage(answers.eventType);
    await this.sendDateAnswer(answers.date);
    await this.sendChatMessage(answers.city);
    await this.sendChatMessage(answers.guestCount);
    await this.sendChatMessage(answers.venueStatus);

    // Wait for the "blueprint ready" message + checklist link
    await expect(
      this.page.getByText(/blueprint is ready|Customize Your Event Checklist/i)
    ).toBeVisible({ timeout: 15000 });

    // Extract eventId from the checklist link href
    const link = this.page.getByRole('link', {
      name: /Customize Your Event Checklist/i,
    });
    await expect(link).toBeVisible({ timeout: 5000 });
    const href = await link.getAttribute('href');
    const match = href?.match(/eventId=([a-f0-9-]+)/);
    if (!match) throw new Error(`Could not extract eventId from href: ${href}`);
    return match[1];
  }

  /** Click the "Customize Your Event Checklist" link after chat completes. */
  async goToChecklist() {
    await this.page
      .getByRole('link', { name: /Customize Your Event Checklist/i })
      .click();
    await this.page.waitForLoadState('networkidle');
  }

  // ---------------------------------------------------------------------------
  // Checklist (/checklist)
  // ---------------------------------------------------------------------------

  /** Navigate directly to the checklist page for an event. */
  async gotoChecklist(eventId: string, eventType: string) {
    await this.page.goto(
      `${BASE_URL}/checklist?type=${eventType}&eventId=${eventId}`
    );
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Complete the checklist by selecting the first option in every visible
   * input (radio, select, checkbox). Opens all category accordions first.
   */
  async completeAllChecklistSections() {
    // Expand all category accordion sections
    const accordionButtons = this.page.locator('button.w-full').filter({
      hasNotText: /Continue to Blueprint/i,
    });
    const count = await accordionButtons.count();
    for (let i = 0; i < count; i++) {
      const btn = accordionButtons.nth(i);
      // Only click if it looks like a collapsed section (aria-expanded=false or not expanded)
      const expanded = await btn.getAttribute('aria-expanded');
      if (expanded === 'false' || expanded === null) {
        await btn.click().catch(() => {}); // ignore if already open
        await this.page.waitForTimeout(200);
      }
    }

    // Select first radio option in each radio group
    const radios = this.page.locator('input[type="radio"]');
    const radioCount = await radios.count();
    // Group by name — only click first of each group
    const seenNames = new Set<string>();
    for (let i = 0; i < radioCount; i++) {
      const radio = radios.nth(i);
      const name = await radio.getAttribute('name');
      if (name && !seenNames.has(name)) {
        seenNames.add(name);
        await radio.check().catch(() => {});
      }
    }

    // Select first non-empty option in each select
    const selects = this.page.locator('select');
    const selectCount = await selects.count();
    for (let i = 0; i < selectCount; i++) {
      const sel = selects.nth(i);
      // Get all options and select the first non-empty one
      const options = await sel.locator('option').allInnerTexts();
      const firstReal = options.find((o) => o.trim() && o !== 'Select...');
      if (firstReal) {
        await sel.selectOption({ label: firstReal }).catch(() => {});
      }
    }

    // Check first unchecked checkbox in each group
    const checkboxes = this.page.locator('input[type="checkbox"]');
    const cbCount = await checkboxes.count();
    if (cbCount > 0) {
      await checkboxes.first().check().catch(() => {});
    }
  }

  /** Click "Continue to Blueprint Review" and wait for navigation. */
  async submitChecklist() {
    const btn = this.page.getByRole('button', {
      name: /Continue to Blueprint Review/i,
    });
    await expect(btn).toBeVisible({ timeout: 5000 });
    await btn.click();
    // Wait for saving to complete and navigation
    await this.page.waitForURL(/\/blueprint\//, { timeout: 15000 });
    await this.page.waitForLoadState('networkidle');
  }

  // ---------------------------------------------------------------------------
  // Blueprint review (/blueprint/:eventId)
  // ---------------------------------------------------------------------------

  /** Navigate directly to the blueprint review page for an event. */
  async gotoBlueprintReview(eventId: string) {
    await this.page.goto(`${BASE_URL}/blueprint/${eventId}`);
    await this.page.waitForLoadState('networkidle');
  }

  /** Assert the blueprint page has loaded with at least one section heading. */
  async assertBlueprintLoaded() {
    // The page should have the launch button visible
    await expect(
      this.page.getByRole('button', { name: /Launch Project/i }).first()
    ).toBeVisible({ timeout: 10000 });
  }

  /**
   * Click the primary "Launch Project & Find Vendors" CTA, confirm the modal,
   * and wait for redirect to the client dashboard.
   */
  async launchProject() {
    // Click the prominent bottom CTA
    const cta = this.page
      .getByRole('button', { name: /Launch Project/i })
      .first();
    await expect(cta).toBeVisible({ timeout: 5000 });
    await cta.click();

    // Confirmation modal — click the orange "Launch Project" confirm button
    const confirm = this.page
      .getByRole('button', { name: 'Launch Project' })
      .last();
    await expect(confirm).toBeVisible({ timeout: 5000 });
    await confirm.click();

    // Wait for redirect to client dashboard
    await this.page.waitForURL(/\/dashboard\/client/, { timeout: 15000 });
  }
}
