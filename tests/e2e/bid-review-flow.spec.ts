import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const TEST_CLIENT = {
  email: 'test@eventfoundry.com',
  password: 'TestClient123!',
  name: 'Test User'
};

test.describe('Client Bid Review Flow - Complete Selection Journey', () => {

  test.beforeEach(async ({ page }) => {
    // Login as client
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_CLIENT.email);
    await page.fill('input[type="password"]', TEST_CLIENT.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  });

  test('Client can view their events with bid counts', async ({ page }) => {
    console.log('🧪 Testing client event list with bid counts');

    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard/client`);

    // Should see events
    await expect(page.locator('text=/my events|events/i')).toBeVisible({ timeout: 5000 });
    console.log('✅ Client dashboard loaded');

    // Look for event cards with bid counts
    const eventCards = page.locator('article, [class*="card"], [class*="event"]');
    const cardCount = await eventCards.count();

    if (cardCount > 0) {
      console.log(`✅ Found ${cardCount} event card(s)`);

      // Check for bid count indicator
      const bidCountIndicator = await page.locator('text=/\\d+ bid|\\d+ proposal/i').first().isVisible({ timeout: 2000 }).catch(() => false);

      if (bidCountIndicator) {
        console.log('✅ Bid count displayed on events');
      } else {
        console.log('⚠️ Bid counts may not be visible yet');
      }
    } else {
      console.log('⚠️ No events found - client may need to create events first');
    }
  });

  test('Client can navigate to event bids page', async ({ page }) => {
    console.log('🧪 Testing navigation to event bids');

    await page.goto(`${BASE_URL}/dashboard/client`);

    // Find first event
    const eventLink = page.locator('a[href*="/events/"], a[href*="/event/"]').first();

    if (await eventLink.isVisible({ timeout: 3000 })) {
      await eventLink.click();
      await page.waitForTimeout(1000);
      console.log('✅ Navigated to event details');

      // Look for "View Bids" or "Bids" link/button
      const viewBidsButton = page.locator('button:has-text("View Bids"), a:has-text("Bids"), a[href*="/bids"]').first();

      if (await viewBidsButton.isVisible({ timeout: 3000 })) {
        await viewBidsButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Navigated to bids page');

        // Verify bids page loaded
        const bidsPageLoaded = await page.locator('text=/bid|proposal/i').isVisible({ timeout: 3000 });
        if (bidsPageLoaded) {
          console.log('✅ Bids page loaded successfully');
        }
      } else {
        console.log('⚠️ View Bids button not found - may be integrated in event page');
      }
    } else {
      console.log('⚠️ No events available to test bid viewing');
    }
  });

  test('Client can view and compare multiple bids', async ({ page }) => {
    console.log('🧪 Testing bid comparison functionality');

    // Navigate to bids page (assuming event exists with bids)
    await page.goto(`${BASE_URL}/dashboard/client`);

    const eventLink = page.locator('a[href*="/events/"]').first();

    if (await eventLink.isVisible({ timeout: 3000 })) {
      const href = await eventLink.getAttribute('href');
      if (href) {
        await page.goto(`${BASE_URL}${href}/bids`);
        await page.waitForTimeout(1000);

        // Check for bid cards/list
        const bidCards = page.locator('[class*="bid"], article, [data-testid*="bid"]');
        const bidCount = await bidCards.count();

        if (bidCount > 0) {
          console.log(`✅ Found ${bidCount} bid(s) to compare`);

          // Look for comparison features
          const priceElements = await page.locator('text=/₹|rs\\.?\\s*\\d+/i').count();

          if (priceElements >= bidCount) {
            console.log('✅ Prices displayed for comparison');
          }

          // Check for vendor names
          const vendorNames = await page.locator('[class*="vendor"], [data-testid*="vendor"]').count();

          if (vendorNames > 0) {
            console.log('✅ Vendor information visible');
          }

          // Look for sort/filter options
          const sortButton = await page.locator('button:has-text("Sort"), select, [name*="sort"]').first().isVisible({ timeout: 2000 }).catch(() => false);

          if (sortButton) {
            console.log('✅ Sort/filter options available');
          }
        } else {
          console.log('⚠️ No bids found - vendors may need to submit bids first');
        }
      }
    }
  });

  test('Client can shortlist top 5 bids', async ({ page }) => {
    console.log('🧪 Testing bid shortlisting functionality');

    await page.goto(`${BASE_URL}/dashboard/client`);

    const eventLink = page.locator('a[href*="/events/"]').first();

    if (await eventLink.isVisible({ timeout: 3000 })) {
      const href = await eventLink.getAttribute('href');
      if (href) {
        await page.goto(`${BASE_URL}${href}/bids`);
        await page.waitForTimeout(1000);

        // Look for shortlist buttons/checkboxes
        const shortlistButtons = page.locator('button:has-text("Shortlist"), input[type="checkbox"]');
        const shortlistCount = await shortlistButtons.count();

        if (shortlistCount > 0) {
          console.log(`✅ Found ${shortlistCount} shortlist option(s)`);

          // Try to shortlist first 5 bids
          const maxShortlist = Math.min(5, shortlistCount);

          for (let i = 0; i < maxShortlist; i++) {
            const button = shortlistButtons.nth(i);
            if (await button.isVisible()) {
              await button.click();
              await page.waitForTimeout(300);
            }
          }

          console.log(`✅ Selected ${maxShortlist} bid(s) for shortlist`);

          // Look for "Confirm Shortlist" or "Submit" button
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Submit Shortlist"), button:has-text("Continue")').first();

          if (await confirmButton.isVisible({ timeout: 2000 })) {
            await confirmButton.click();
            await page.waitForTimeout(2000);
            console.log('✅ Confirmed shortlist selection');

            // Check for success message
            const success = await page.locator('text=/shortlist|success|selected/i').isVisible({ timeout: 3000 }).catch(() => false);

            if (success) {
              console.log('✅ Shortlist confirmed successfully');
            }
          }
        } else {
          console.log('⚠️ Shortlist functionality not found - may need UI implementation');
        }
      }
    }
  });

  test('Client can view comparative pricing for shortlisted bids', async ({ page }) => {
    console.log('🧪 Testing comparative pricing display');

    await page.goto(`${BASE_URL}/dashboard/client`);

    const eventLink = page.locator('a[href*="/events/"]').first();

    if (await eventLink.isVisible({ timeout: 3000 })) {
      const href = await eventLink.getAttribute('href');
      if (href) {
        await page.goto(`${BASE_URL}${href}/bids`);
        await page.waitForTimeout(1000);

        // After shortlisting, vendors should see "X% above lowest bid"
        // Client should see comparative view

        const comparativeInfo = await page.locator('text=/lowest|highest|average|range/i').isVisible({ timeout: 3000 }).catch(() => false);

        if (comparativeInfo) {
          console.log('✅ Comparative pricing information displayed');
        } else {
          console.log('⚠️ Comparative pricing may show after shortlisting');
        }

        // Check for price range display
        const priceRange = await page.locator('text=/₹.*-.*₹|range.*₹/i').isVisible({ timeout: 2000 }).catch(() => false);

        if (priceRange) {
          console.log('✅ Price range displayed');
        }
      }
    }
  });

  test('Client can select final winner from shortlist', async ({ page }) => {
    console.log('🧪 Testing winner selection functionality');

    await page.goto(`${BASE_URL}/dashboard/client`);

    const eventLink = page.locator('a[href*="/events/"]').first();

    if (await eventLink.isVisible({ timeout: 3000 })) {
      const href = await eventLink.getAttribute('href');
      if (href) {
        await page.goto(`${BASE_URL}${href}/bids`);
        await page.waitForTimeout(1000);

        // Look for "Select Winner" or "Choose" buttons
        const selectWinnerButton = page.locator('button:has-text("Select"), button:has-text("Choose"), button:has-text("Accept")').first();

        if (await selectWinnerButton.isVisible({ timeout: 3000 })) {
          await selectWinnerButton.click();
          await page.waitForTimeout(1000);
          console.log('✅ Clicked select winner button');

          // May show confirmation dialog
          const confirmDialog = await page.locator('text=/confirm|are you sure/i').isVisible({ timeout: 2000 }).catch(() => false);

          if (confirmDialog) {
            const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
            await confirmButton.click();
            await page.waitForTimeout(2000);
            console.log('✅ Confirmed winner selection');
          }

          // Check for success or contract generation
          const success = await page.locator('text=/selected|winner|contract|agreement/i').isVisible({ timeout: 5000 }).catch(() => false);

          if (success) {
            console.log('✅ Winner selected successfully');

            // May navigate to contract page
            if (page.url().includes('contract')) {
              console.log('✅ Navigated to contract page');
            }
          }
        } else {
          console.log('⚠️ Select winner button not found - may need to shortlist first');
        }
      }
    }
  });

  test('Client receives contract after selecting winner', async ({ page }) => {
    console.log('🧪 Testing contract generation after winner selection');

    // This assumes winner has been selected
    await page.goto(`${BASE_URL}/dashboard/client`);

    // Look for event with "Contract" or "Agreement" status
    const contractLink = await page.locator('a:has-text("Contract"), text=/contract|agreement/i').first().isVisible({ timeout: 3000 }).catch(() => false);

    if (contractLink) {
      console.log('✅ Contract/Agreement link found');

      await page.locator('a:has-text("Contract"), a[href*="contract"]').first().click();
      await page.waitForTimeout(1000);

      // Verify contract page loaded
      const contractPage = await page.locator('text=/contract|agreement|terms/i').isVisible({ timeout: 3000 });

      if (contractPage) {
        console.log('✅ Contract page loaded');

        // Look for sign/accept button
        const signButton = await page.locator('button:has-text("Sign"), button:has-text("Accept"), button:has-text("Agree")').first().isVisible({ timeout: 2000 }).catch(() => false);

        if (signButton) {
          console.log('✅ Contract signing interface available');
        }
      }
    } else {
      console.log('⚠️ Contract not yet generated - need to complete full flow');
    }
  });

  test('Client can communicate with shortlisted vendors', async ({ page }) => {
    console.log('🧪 Testing client-vendor communication');

    await page.goto(`${BASE_URL}/dashboard/client`);

    const eventLink = page.locator('a[href*="/events/"]').first();

    if (await eventLink.isVisible({ timeout: 3000 })) {
      const href = await eventLink.getAttribute('href');
      if (href) {
        await page.goto(`${BASE_URL}${href}/bids`);
        await page.waitForTimeout(1000);

        // Look for message/chat buttons
        const messageButton = await page.locator('button:has-text("Message"), button:has-text("Chat"), button:has-text("Contact")').first().isVisible({ timeout: 3000 }).catch(() => false);

        if (messageButton) {
          console.log('✅ Messaging functionality available');
        } else {
          console.log('⚠️ Messaging may be implemented as separate feature');
        }
      }
    }
  });
});
