/**
 * mock.helper.ts
 *
 * Playwright network-level mock for the forge chat flow.
 *
 * WHY:
 *   The forge chat has a 0.8–2 second simulated "AI typing" delay per step
 *   and calls POST /api/forge/projects at the end. In CI this creates two
 *   problems:
 *     1. The total wait time per run is 5–15 seconds of artificial delay.
 *     2. The API call requires a live DB — flaky if the test project is not
 *        seeded or the network is slow.
 *
 *   When PLAYWRIGHT_MOCK_AI=true (the default in .env.test), this helper:
 *     - Intercepts POST /api/forge/projects and returns a deterministic
 *       synthetic event with a known ID.
 *     - Does NOT touch the chat UI at all — the app still goes through
 *       its full scripted question/answer flow; only the final API call
 *       is mocked.
 *
 * USAGE:
 *   import { setupForgeMock, MOCK_EVENT_ID } from '../helpers/mock.helper';
 *
 *   test('...', async ({ page }) => {
 *     const isMocked = await setupForgeMock(page);
 *     // proceed with chat flow ...
 *     if (isMocked) {
 *       // DB assertions must be skipped — no real row was created
 *     } else {
 *       // DB assertions work normally
 *     }
 *   });
 */

import { Page } from '@playwright/test';

/** Fixed synthetic event ID returned in mock mode. */
export const MOCK_EVENT_ID = '00000000-mock-0000-0000-000000000001';

/** Fixed synthetic checklist type returned in mock mode. */
export const MOCK_CHECKLIST_TYPE = 'wedding_forge';

/**
 * Returns true if PLAYWRIGHT_MOCK_AI is set to 'true'.
 * Reads from the process env (which playwright.config.ts loads from .env.test).
 */
export function isMockModeEnabled(): boolean {
  return process.env.PLAYWRIGHT_MOCK_AI === 'true';
}

/**
 * Installs Playwright route intercepts for the forge API when mock mode is enabled.
 *
 * Intercepted routes:
 *   POST /api/forge/projects  → returns synthetic forgeProject with MOCK_EVENT_ID
 *   GET  /api/forge/projects/:id  → returns the same synthetic project
 *
 * Safe to call unconditionally — does nothing when mock mode is disabled.
 *
 * @returns true if mock was installed, false if running in live mode
 */
export async function setupForgeMock(page: Page): Promise<boolean> {
  if (!isMockModeEnabled()) return false;

  const syntheticProject = {
    id: MOCK_EVENT_ID,
    owner_user_id: 'mock-user-id',
    title: '[TEST] Mock Wedding - Mumbai - June 20, 2027',
    event_type: 'Wedding',
    city: 'Mumbai',
    date: '2027-06-20',
    guest_count: 200,
    venue_status: 'not_booked',
    forge_status: 'BLUEPRINT_READY',
    bidding_closes_at: null,
    winner_bid_id: null,
    client_brief: {
      event_type: 'Wedding',
      date: 'June 20, 2027',
      city: 'Mumbai',
      guest_count: '200',
      venue_status: 'Not yet booked',
    },
    forge_blueprint: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Intercept event creation
  await page.route('**/api/forge/projects', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          forgeProject: syntheticProject,
          event: syntheticProject,
        }),
      });
    } else {
      // GET /api/forge/projects — pass through
      await route.continue();
    }
  });

  // Intercept fetch of the specific project (used by checklist page on load)
  await page.route(`**/api/forge/projects/${MOCK_EVENT_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        forgeProject: syntheticProject,
        event: syntheticProject,
      }),
    });
  });

  // Intercept the checklist PATCH so it doesn't fail on a missing row
  await page.route(`**/api/forge/projects/${MOCK_EVENT_ID}`, async (route) => {
    if (route.request().method() === 'PATCH') {
      const body = await route.request().postDataJSON().catch(() => ({}));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          forgeProject: {
            ...syntheticProject,
            ...body,
            forge_blueprint: body.forge_blueprint ?? syntheticProject.forge_blueprint,
            client_brief: body.client_brief ?? syntheticProject.client_brief,
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          forgeProject: syntheticProject,
          event: syntheticProject,
        }),
      });
    }
  });

  return true;
}
