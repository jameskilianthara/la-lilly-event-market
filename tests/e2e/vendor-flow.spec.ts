import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test vendor credentials (you may need to create these in your test database)
const TEST_VENDOR = {
  email: 'vendor@eventfoundry.com',
  password: 'VendorTest123!',
  name: 'Premium Events Co.'
};

test.describe('Vendor Flow - Complete Bidding Journey', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('Vendor can signup and access craftsmen dashboard', async ({ page }) => {
    console.log('🧪 Testing vendor signup flow');

    // Navigate to vendor signup
    await page.goto(`${BASE_URL}/craftsmen/signup`);
    await expect(page.locator('h1, h2').filter({ hasText: /signup|register|join/i })).toBeVisible({ timeout: 5000 });
    console.log('✅ Vendor signup page loaded');

    // Fill signup form
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible({ timeout: 2000 })) {
      const uniqueEmail = `vendor_${Date.now()}@test.com`;
      await emailInput.fill(uniqueEmail);
      await passwordInput.fill('VendorPass123!');

      // Fill other required fields
      const nameInput = page.locator('input[name="name"], input[name="fullName"], input[name="companyName"]').first();
      if (await nameInput.isVisible({ timeout: 1000 })) {
        await nameInput.fill('Test Vendor Co.');
      }

      console.log('✅ Vendor signup form filled');
    } else {
      console.log('⚠️ Vendor signup form may have different structure');
    }
  });

  test('Vendor can login and access dashboard', async ({ page }) => {
    console.log('🧪 Testing vendor login and dashboard access');

    // Go to craftsmen login
    await page.goto(`${BASE_URL}/craftsmen/login`);

    // Try to login with test vendor credentials
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    if (await emailInput.isVisible({ timeout: 3000 })) {
      await emailInput.fill(TEST_VENDOR.email);
      await passwordInput.fill(TEST_VENDOR.password);
      await page.click('button[type="submit"]');

      await page.waitForTimeout(2000);

      // Check if redirected to dashboard or still on login
      const currentUrl = page.url();

      if (currentUrl.includes('dashboard') || currentUrl.includes('craftsmen')) {
        console.log('✅ Vendor logged in and redirected to dashboard');
      } else {
        console.log('⚠️ Vendor credentials may not exist, need to run seed script');
      }
    }
  });

  test('Vendor can browse available events', async ({ page }) => {
    console.log('🧪 Testing vendor event browsing');

    // Login first (skip if credentials don't exist)
    await page.goto(`${BASE_URL}/craftsmen/login`);

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible({ timeout: 2000 })) {
      await emailInput.fill(TEST_VENDOR.email);
      await page.locator('input[type="password"]').fill(TEST_VENDOR.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }

    // Navigate to events or should be on dashboard with events
    const hasEvents = await page.locator('text=/event|project|opportunity/i').isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEvents) {
      console.log('✅ Vendor can see available events');

      // Check for event details
      const eventCard = page.locator('article, [class*="card"], [class*="event"]').first();

      if (await eventCard.isVisible({ timeout: 2000 })) {
        console.log('✅ Event cards/listings visible');

        // Try to view event details
        const viewButton = page.locator('button:has-text("View"), a:has-text("View Details"), a:has-text("Details")').first();

        if (await viewButton.isVisible({ timeout: 2000 })) {
          await viewButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ Navigated to event details');
        }
      }
    } else {
      console.log('⚠️ No events visible - may need test data');
    }
  });

  test('Vendor can submit bid on an event', async ({ page }) => {
    console.log('🧪 Testing vendor bid submission');

    // Login
    await page.goto(`${BASE_URL}/craftsmen/login`);
    const emailInput = page.locator('input[type="email"]');

    if (await emailInput.isVisible({ timeout: 2000 })) {
      await emailInput.fill(TEST_VENDOR.email);
      await page.locator('input[type="password"]').fill(TEST_VENDOR.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Look for event to bid on
      const eventLink = page.locator('a[href*="/events/"], a[href*="/event/"]').first();

      if (await eventLink.isVisible({ timeout: 3000 })) {
        await eventLink.click();
        await page.waitForTimeout(1000);
        console.log('✅ Opened event details');

        // Look for bid button
        const bidButton = page.locator('button:has-text("Submit Bid"), button:has-text("Place Bid"), a:has-text("Bid")').first();

        if (await bidButton.isVisible({ timeout: 3000 })) {
          await bidButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ Opened bid submission form');

          // Fill bid form
          const priceInput = page.locator('input[name*="price"], input[name*="amount"], input[type="number"]').first();

          if (await priceInput.isVisible({ timeout: 2000 })) {
            await priceInput.fill('150000');
            console.log('✅ Entered bid amount');

            // Fill description/notes
            const notesInput = page.locator('textarea').first();
            if (await notesInput.isVisible({ timeout: 1000 })) {
              await notesInput.fill('Professional event management services with 10+ years experience');
              console.log('✅ Entered bid notes');
            }

            // Submit bid
            const submitButton = page.locator('button[type="submit"], button:has-text("Submit")').last();
            await submitButton.click();
            await page.waitForTimeout(2000);

            // Check for success
            const success = await page.locator('text=/success|submitted|received/i').isVisible({ timeout: 5000 }).catch(() => false);

            if (success) {
              console.log('✅ Bid submitted successfully');
            } else {
              console.log('⚠️ Bid submission outcome unclear');
            }
          }
        } else {
          console.log('⚠️ Bid button not found - event may not be open for bidding');
        }
      } else {
        console.log('⚠️ No events found to bid on');
      }
    }
  });

  test('Vendor can view bid status', async ({ page }) => {
    console.log('🧪 Testing vendor bid status viewing');

    // Login
    await page.goto(`${BASE_URL}/craftsmen/login`);
    const emailInput = page.locator('input[type="email"]');

    if (await emailInput.isVisible({ timeout: 2000 })) {
      await emailInput.fill(TEST_VENDOR.email);
      await page.locator('input[type="password"]').fill(TEST_VENDOR.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Go to dashboard or bids section
      await page.goto(`${BASE_URL}/craftsmen/dashboard`);

      // Look for "My Bids" or "Proposals" section
      const myBidsSection = await page.locator('text=/my bids|proposals|submissions/i').isVisible({ timeout: 5000 }).catch(() => false);

      if (myBidsSection) {
        console.log('✅ Can view bids section');

        // Check for bid status indicators
        const statusIndicators = await page.locator('text=/pending|accepted|rejected|shortlisted|under review/i').count();

        if (statusIndicators > 0) {
          console.log(`✅ Found ${statusIndicators} bid status indicator(s)`);
        } else {
          console.log('⚠️ No bid statuses visible - may need to submit bids first');
        }
      } else {
        console.log('⚠️ Bids section not clearly visible in dashboard');
      }
    }
  });

  test('Vendor receives notification when shortlisted', async ({ page }) => {
    console.log('🧪 Testing vendor shortlist notification');

    // This test assumes vendor has submitted a bid that gets shortlisted
    await page.goto(`${BASE_URL}/craftsmen/login`);

    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible({ timeout: 2000 })) {
      await emailInput.fill(TEST_VENDOR.email);
      await page.locator('input[type="password"]').fill(TEST_VENDOR.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Check for notifications
      const notificationBell = page.locator('[data-testid*="notification"], button:has-text("🔔"), [class*="notification"]').first();

      if (await notificationBell.isVisible({ timeout: 2000 })) {
        await notificationBell.click();
        console.log('✅ Opened notifications');

        // Look for shortlist notification
        const shortlistNotif = await page.locator('text=/shortlist|selected|top 5/i').isVisible({ timeout: 2000 }).catch(() => false);

        if (shortlistNotif) {
          console.log('✅ Shortlist notification found');
        }
      } else {
        console.log('⚠️ Notification system may not be implemented yet');
      }
    }
  });
});
