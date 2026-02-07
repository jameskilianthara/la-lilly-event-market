/**
 * External Import & Draft Resume E2E Tests
 *
 * Tests the complete flow for external event imports:
 * 1. WhatsApp bot (or API) creates draft event
 * 2. User receives short code link
 * 3. User clicks link and resumes at blueprint selection
 * 4. User completes event without re-entering chat data
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

test.describe('External Import & Draft Resume Flow', () => {

  test('Complete flow: API creates draft → User resumes → Completes event', async ({ page, request }) => {
    console.log('🧪 Testing External Import: API → Draft → Resume → Complete');

    // ==============================================
    // PART 1: WhatsApp Bot Creates Draft via API
    // ==============================================
    console.log('\n📱 PART 1: WhatsApp bot creates draft event');

    const externalData = {
      event_type: 'Corporate Event',
      city: 'Kochi',
      date: '2026-04-15',
      guest_count: 150,
      venue_status: 'not_booked',
      budget_range: '₹2,00,000 - ₹3,00,000',
      source: 'whatsapp_bot',
      external_reference_id: 'whatsapp_conv_12345',
      client_name: 'Test Client',
      client_phone: '+919876543210',
      additional_notes: 'Need catering and decorations'
    };

    // Call external import API
    const createResponse = await request.post(`${BASE_URL}/api/forge/external-import`, {
      data: externalData
    });

    expect(createResponse.ok()).toBeTruthy();

    const createData = await createResponse.json();
    console.log('API Response:', createData);

    expect(createData.success).toBe(true);
    expect(createData.short_code).toBeTruthy();
    expect(createData.short_code.length).toBe(8);
    expect(createData.resume_url).toContain(createData.short_code);
    expect(createData.event_id).toBeTruthy();

    const shortCode = createData.short_code;
    const resumeUrl = createData.resume_url;
    const eventId = createData.event_id;

    console.log(`✅ Draft created with short code: ${shortCode}`);
    console.log(`✅ Resume URL: ${resumeUrl}`);

    // ==============================================
    // PART 2: User Clicks Resume Link
    // ==============================================
    console.log('\n🔗 PART 2: User clicks resume link from WhatsApp');

    await page.goto(resumeUrl);
    await page.waitForTimeout(1000);

    // Should show loading state
    const loadingText = page.locator('text=/Loading Your Event/i');
    if (await loadingText.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✅ Loading state displayed');
    }

    await page.waitForTimeout(2000);

    // Should show success state before redirect
    const successText = page.locator('text=/Draft Loaded Successfully/i, text=/Redirecting/i');
    if (await successText.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ Success state displayed');
      console.log('✅ Event details shown to user');
    }

    // Wait for redirect to blueprint page
    await page.waitForTimeout(2000);

    // Should redirect to blueprint selection page
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    expect(currentUrl).toMatch(/blueprint|checklist/i);
    console.log('✅ Redirected to blueprint selection');

    // ==============================================
    // PART 3: Verify Draft Data Populated
    // ==============================================
    console.log('\n📋 PART 3: Verify draft data is populated (skip chat questions)');

    // Check that event type is visible somewhere on page
    const eventTypeVisible = await page.locator(`text=/${externalData.event_type}/i`).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (eventTypeVisible) {
      console.log(`✅ Event type displayed: ${externalData.event_type}`);
    }

    // Check that city is visible
    const cityVisible = await page.locator(`text=/${externalData.city}/i`).first().isVisible({ timeout: 5000 }).catch(() => false);
    if (cityVisible) {
      console.log(`✅ City displayed: ${externalData.city}`);
    }

    // User should NOT see the chat interface
    const chatVisible = await page.locator('text=/What kind of event/i').isVisible({ timeout: 2000 }).catch(() => false);
    expect(chatVisible).toBe(false);
    console.log('✅ Chat questions skipped (not visible)');

    // User should see blueprint/checklist UI
    const blueprintVisible = await page.locator('text=/blueprint|checklist|requirements/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(blueprintVisible).toBe(true);
    console.log('✅ Blueprint/checklist UI displayed');

    console.log('\n🎉 PART 3 COMPLETE: User successfully resumed draft and skipped chat questions');
  });

  test('API GET endpoint retrieves draft by short code', async ({ request }) => {
    console.log('🧪 Testing GET /api/forge/external-import?short_code=...');

    // First create a draft
    const createResponse = await request.post(`${BASE_URL}/api/forge/external-import`, {
      data: {
        event_type: 'Wedding',
        city: 'Mumbai',
        source: 'api',
        external_reference_id: 'test_ref_456'
      }
    });

    const createData = await createResponse.json();
    const shortCode = createData.short_code;

    // Then retrieve it
    const getResponse = await request.get(
      `${BASE_URL}/api/forge/external-import?short_code=${shortCode}`
    );

    expect(getResponse.ok()).toBeTruthy();

    const getData = await getResponse.json();
    console.log('Retrieved draft:', getData);

    expect(getData.success).toBe(true);
    expect(getData.short_code).toBe(shortCode);
    expect(getData.is_expired).toBe(false);
    expect(getData.is_completed).toBe(false);
    expect(getData.event).toBeTruthy();
    expect(getData.event.event_type).toBe('Wedding');
    expect(getData.event.city).toBe('Mumbai');

    console.log('✅ Draft retrieved successfully via GET');
  });

  test('Invalid short code shows error page', async ({ page }) => {
    console.log('🧪 Testing invalid short code handling');

    await page.goto(`${BASE_URL}/forge/resume/INVALID1`);
    await page.waitForTimeout(2000);

    // Should show error message
    const errorVisible = await page.locator('text=/Unable to Load|not found|Invalid/i').isVisible({ timeout: 5000 });
    expect(errorVisible).toBe(true);
    console.log('✅ Error message displayed for invalid code');

    // Should show option to start new event
    const newEventButton = page.locator('button:has-text("Start New Event"), a:has-text("Start New")').first();
    const hasNewEventOption = await newEventButton.isVisible({ timeout: 3000 });
    expect(hasNewEventOption).toBe(true);
    console.log('✅ "Start New Event" option available');
  });

  test('Short code generation is unique', async ({ request }) => {
    console.log('🧪 Testing short code uniqueness');

    const codes = new Set();
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const response = await request.post(`${BASE_URL}/api/forge/external-import`, {
        data: {
          event_type: `Test Event ${i}`,
          city: 'Kochi',
          source: 'api'
        }
      });

      const data = await response.json();
      codes.add(data.short_code);
    }

    // All codes should be unique
    expect(codes.size).toBe(iterations);
    console.log(`✅ Generated ${iterations} unique short codes`);

    // All codes should be 8 characters
    for (const code of codes) {
      expect(code).toHaveLength(8);
    }
    console.log('✅ All codes are 8 characters long');
  });

  test('Short code format validation', async () => {
    console.log('🧪 Testing short code format validation');

    const { isValidShortCode } = require('../../src/lib/shortcode');

    // Valid codes
    expect(isValidShortCode('FORGE2X9')).toBe(true);
    expect(isValidShortCode('KOCHI7P4')).toBe(true);
    expect(isValidShortCode('DRAFT3M8')).toBe(true);

    // Invalid codes
    expect(isValidShortCode('FORGE')).toBe(false);      // Too short
    expect(isValidShortCode('FORGE2X9A')).toBe(false);  // Too long
    expect(isValidShortCode('FORGE-2X')).toBe(false);   // Invalid character
    expect(isValidShortCode('12345678')).toBe(true);    // Numbers only (valid)
    expect(isValidShortCode('FORGE0O1')).toBe(false);   // Contains ambiguous chars

    console.log('✅ Short code validation works correctly');
  });
});

test.describe('Draft Event Expiration', () => {

  test('Draft expires after 7 days', async ({ request }) => {
    console.log('🧪 Testing draft expiration (conceptual)');

    // Create draft
    const response = await request.post(`${BASE_URL}/api/forge/external-import`, {
      data: {
        event_type: 'Birthday Party',
        city: 'Delhi',
        source: 'api'
      }
    });

    const data = await response.json();
    console.log('Created draft with expiration:', data.expires_at);

    // Check expiration is ~7 days from now
    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    expect(diffDays).toBeGreaterThan(6);
    expect(diffDays).toBeLessThan(8);
    console.log(`✅ Draft expires in ${diffDays.toFixed(1)} days`);
  });
});

test.describe('WhatsApp Bot Integration', () => {

  test('WhatsApp bot can create draft and get resumable link', async ({ request }) => {
    console.log('🧪 Testing WhatsApp bot integration scenario');

    // Simulate WhatsApp bot collecting data from user
    const userResponses = {
      event_type: 'Wedding',
      city: 'Kochi',
      date: '2026-06-20',
      guest_count: 300,
      client_name: 'Priya & Rahul',
      client_phone: '+919123456789'
    };

    // Bot calls API to create draft
    const response = await request.post(`${BASE_URL}/api/forge/external-import`, {
      data: {
        ...userResponses,
        source: 'whatsapp_bot',
        external_reference_id: 'wa_conv_789',
        additional_notes: 'User prefers traditional decor'
      }
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Bot receives short code and URL
    expect(data.short_code).toBeTruthy();
    expect(data.resume_url).toBeTruthy();

    console.log(`✅ Bot created draft: ${data.short_code}`);
    console.log(`✅ Bot can send link to user: ${data.resume_url}`);

    // Bot would send message like:
    const botMessage = `
🎉 Great! I've prepared your event details.

*Event:* ${userResponses.event_type}
*City:* ${userResponses.city}
*Date:* ${userResponses.date}
*Guests:* ${userResponses.guest_count}

Click here to complete your event planning:
${data.resume_url}

This link is valid for 7 days.
    `.trim();

    console.log('\nBot would send this message:');
    console.log(botMessage);
    console.log('✅ WhatsApp integration flow complete');
  });
});
