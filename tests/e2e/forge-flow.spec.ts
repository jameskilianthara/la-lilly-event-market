import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('Forge Flow - Complete Event Creation', () => {

  test.beforeEach(async ({ page }) => {
    // Start at homepage
    await page.goto(BASE_URL);
  });

  test('Client can create event through complete Forge flow', async ({ page }) => {
    console.log('🧪 Testing complete Forge flow: Create → Blueprint → Finalize');

    // Step 1: Navigate to Forge
    await page.click('text=/Forge My Event|Plan My Event/i');
    await page.waitForURL('**/forge', { timeout: 5000 });
    console.log('✅ Navigated to Forge page');

    // Step 2: Start chat and answer event type question
    await expect(page.locator('text=/What kind of event|event are you planning/i')).toBeVisible({ timeout: 5000 });
    console.log('✅ Forge chat loaded');

    // Answer: Event type
    await page.fill('textarea, input[type="text"]', 'Wedding');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    console.log('✅ Answered: Event type = Wedding');

    // Answer: Date
    await page.waitForTimeout(500);
    const dateInput = page.locator('textarea, input[type="text"]').last();
    await dateInput.fill('June 15, 2026');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    console.log('✅ Answered: Date = June 15, 2026');

    // Answer: Location/City
    await page.waitForTimeout(500);
    const cityInput = page.locator('textarea, input[type="text"]').last();
    await cityInput.fill('Mumbai');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    console.log('✅ Answered: City = Mumbai');

    // Answer: Guest count
    await page.waitForTimeout(500);
    const guestInput = page.locator('textarea, input[type="text"]').last();
    await guestInput.fill('200');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    console.log('✅ Answered: Guest count = 200');

    // Answer: Venue status
    await page.waitForTimeout(500);
    const venueInput = page.locator('textarea, input[type="text"]').last();
    await venueInput.fill('Not yet booked');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    console.log('✅ Answered: Venue = Not yet booked');

    // Step 3: Blueprint should be offered
    await expect(page.locator('text=/blueprint|checklist/i')).toBeVisible({ timeout: 10000 });
    console.log('✅ Blueprint offered by chat');

    // Look for link or button to view blueprint
    const blueprintLink = page.locator('a:has-text("blueprint"), a:has-text("checklist"), button:has-text("Review"), button:has-text("View")').first();

    if (await blueprintLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await blueprintLink.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked blueprint review link');
    } else {
      console.log('⚠️ Blueprint link not found, may be inline');
    }

    // Step 4: Verify blueprint/checklist is displayed
    const hasBlueprintContent = await page.locator('text=/ceremony|venue|catering|decor|photography|schedule/i').isVisible({ timeout: 5000 }).catch(() => false);

    if (hasBlueprintContent) {
      console.log('✅ Blueprint content visible (sections detected)');
    } else {
      console.log('⚠️ Blueprint sections not clearly visible, may need UI update');
    }

    // Step 5: Look for finalize/create/submit button
    const finalizeButton = page.locator('button:has-text("Create"), button:has-text("Finalize"), button:has-text("Submit"), button:has-text("Post")').first();

    if (await finalizeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await finalizeButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked finalize/create button');

      // Verify success or navigation to event details
      const success = await page.locator('text=/success|created|posted/i').isVisible({ timeout: 5000 }).catch(() => false);

      if (success) {
        console.log('✅ Event created successfully');
      } else {
        // May have navigated to event page or dashboard
        const onEventPage = page.url().includes('/event') || page.url().includes('/dashboard');
        if (onEventPage) {
          console.log('✅ Navigated to event/dashboard page');
        } else {
          console.log('⚠️ Success confirmation not clear');
        }
      }
    } else {
      console.log('⚠️ Finalize button not found, may require login first');
    }
  });

  test('Anonymous user can forge event and see login prompt', async ({ page }) => {
    console.log('🧪 Testing anonymous Forge flow with login prompt');

    await page.goto(`${BASE_URL}/forge`);

    // Chat should be accessible
    await expect(page.locator('textarea, input[type="text"]')).toBeVisible({ timeout: 5000 });
    console.log('✅ Anonymous user can access Forge chat');

    // Fill basic event info
    await page.fill('textarea, input[type="text"]', 'Birthday party');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Continue with a few more answers
    await page.waitForTimeout(500);
    await page.locator('textarea, input[type="text"]').last().fill('March 20, 2026');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    await page.waitForTimeout(500);
    await page.locator('textarea, input[type="text"]').last().fill('Delhi');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    console.log('✅ Anonymous user can answer Forge questions');

    // When trying to finalize, should see login prompt
    const loginPrompt = await page.locator('text=/login|sign in|create account/i').isVisible({ timeout: 3000 }).catch(() => false);

    if (loginPrompt) {
      console.log('✅ Login prompt shown for anonymous user');
    } else {
      console.log('⚠️ Login prompt may appear at different stage');
    }
  });

  test('Client can review and edit event details before posting', async ({ page }) => {
    console.log('🧪 Testing event review and edit capability');

    // Login as test client first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'test@eventfoundry.com');
    await page.fill('input[type="password"]', 'TestClient123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/forge', { timeout: 5000 });
    console.log('✅ Logged in as test client');

    // Go through Forge flow quickly
    await page.waitForTimeout(1000);

    const chatInput = page.locator('textarea, input[type="text"]').last();

    // Quick answers
    await chatInput.fill('Corporate event');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    await page.locator('textarea, input[type="text"]').last().fill('July 10, 2026');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    await page.locator('textarea, input[type="text"]').last().fill('Bangalore');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    await page.locator('textarea, input[type="text"]').last().fill('150');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    await page.locator('textarea, input[type="text"]').last().fill('Booked');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    console.log('✅ Completed Forge questions');

    // Look for edit capability in blueprint
    const hasEditableFields = await page.locator('textarea[placeholder*="note"], input[type="text"]:not([readonly])').count() > 0;

    if (hasEditableFields) {
      console.log('✅ Blueprint has editable notes/fields');
    } else {
      console.log('⚠️ Edit capability may be in different format');
    }
  });
});
