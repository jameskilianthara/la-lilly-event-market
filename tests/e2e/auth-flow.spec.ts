/**
 * auth-flow.spec.ts — Authentication Flow
 *
 * All assertions use expect() — no if (isVisible) console.log() soft checks.
 * Credentials read from .env.test via auth.helper.
 *
 * Tags:
 *   @smoke  — client login, vendor login, unauthenticated redirect
 *   @regression — full suite including signup edge cases, session, form validation
 */

import { test, expect, Browser } from '@playwright/test';
import { loginAsClient, loginAsVendor, TEST_CREDS, BASE_URL } from '../helpers/auth.helper';

// ---------------------------------------------------------------------------
// Client auth
// ---------------------------------------------------------------------------

test.describe('Client auth @smoke', () => {

  test('client login succeeds and redirects to /forge', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', TEST_CREDS.client.email);
    await page.fill('input[type="password"]', TEST_CREDS.client.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/forge', { timeout: 10000 });
    await expect(page).toHaveURL(/\/forge/);
  });

  test('client login shows success toast', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_CREDS.client.email);
    await page.fill('input[type="password"]', TEST_CREDS.client.password);
    await page.click('button[type="submit"]');

    await expect(
      page.getByText(/Welcome back|Successfully logged in/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('client login with wrong password shows error and stays on login', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_CREDS.client.email);
    await page.fill('input[type="password"]', 'WrongPassword999!');
    await page.click('button[type="submit"]');

    await expect(
      page.getByText(/Invalid email or password|Invalid credentials|Incorrect password/i)
    ).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('client login with non-existent email shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', 'nobody@nowhere-test.com');
    await page.fill('input[type="password"]', 'SomePassword123!');
    await page.click('button[type="submit"]');

    await expect(
      page.getByText(/Invalid email or password|Invalid credentials/i)
    ).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('empty login form stays on login page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.click('button[type="submit"]');
    // Give time for any redirect
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/login/);
  });

  test('session persists after page reload @regression', async ({ page }) => {
    await loginAsClient(page);
    await page.reload();
    await page.waitForTimeout(2000);
    // User menu button is only rendered when authenticated
    await expect(page.locator('[data-testid="user-menu-button"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test('logout clears session and protected route redirects to login @regression', async ({ page }) => {
    await loginAsClient(page);

    // Log out
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL(/\/(login|signup|\/)/, { timeout: 5000 });

    // Attempt to access protected route
    await page.goto(`${BASE_URL}/dashboard/client`);
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Vendor auth
// ---------------------------------------------------------------------------

test.describe('Vendor auth @smoke', () => {

  test('vendor login succeeds and redirects to craftsmen dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/craftsmen/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', TEST_CREDS.vendor.email);
    await page.fill('input[type="password"]', TEST_CREDS.vendor.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/craftsmen/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/\/craftsmen\/dashboard/);
  });

  test('vendor login with wrong password shows error', async ({ page }) => {
    await page.goto(`${BASE_URL}/craftsmen/login`);
    await page.fill('input[type="email"]', TEST_CREDS.vendor.email);
    await page.fill('input[type="password"]', 'WrongPassword999!');
    await page.click('button[type="submit"]');

    await expect(
      page.getByText(/Invalid email or password|Invalid credentials|Incorrect password/i)
    ).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/craftsmen\/login|\/login/);
  });
});

// ---------------------------------------------------------------------------
// Unauthenticated access redirects @smoke
// ---------------------------------------------------------------------------

test.describe('Unauthenticated redirects @smoke', () => {

  test('/craftsmen/dashboard redirects to login when not authenticated', async ({ page }) => {
    // Fresh page context — no session
    await page.goto(`${BASE_URL}/craftsmen/dashboard`);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login|\/craftsmen\/login/, {
      timeout: 8000,
    });
  });

  test('/dashboard/client redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/client`);
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Client signup @regression
// ---------------------------------------------------------------------------

test.describe('Client signup @regression', () => {

  test('signup with valid new email succeeds', async ({ page }) => {
    const uniqueEmail = `e2e-test-${Date.now()}@testfoundry.com`;

    await page.goto(`${BASE_URL}/signup`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="fullName"]', 'E2E Test User');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.locator('input[type="password"]').nth(1).fill('TestPassword123!');
    await page.click('button[type="submit"]');

    // Should redirect away from signup on success
    await expect(page).not.toHaveURL(/\/signup/, { timeout: 8000 });
  });

  test('signup with existing email shows error and stays on signup', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    await page.fill('input[name="fullName"]', 'Duplicate User');
    await page.fill('input[name="email"]', TEST_CREDS.client.email); // already exists
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.locator('input[type="password"]').nth(1).fill('TestPassword123!');
    await page.click('button[type="submit"]');

    await expect(
      page.getByText(/already registered|already exists|email is taken/i)
    ).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/signup/);
  });

  test('signup with invalid email format shows validation error', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="email"]', 'not-an-email');
    await page.fill('input[type="password"]', 'TestPassword123!');
    await page.locator('input[type="password"]').nth(1).fill('TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    await expect(
      page.getByText(/valid email|Please enter a valid email/i)
    ).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/signup/);
  });

  test('signup with short password shows validation error', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('input[name="email"]', 'validtest@test.com');
    await page.fill('input[type="password"]', '123');
    await page.locator('input[type="password"]').nth(1).fill('123');
    await page.click('button[type="submit"]');

    await expect(
      page.getByText(/at least 8 characters|too short|password.*8/i)
    ).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/signup/);
  });
});

// ---------------------------------------------------------------------------
// Session persistence @regression
// ---------------------------------------------------------------------------

test.describe('Session persistence @regression', () => {

  test('session persists across navigation to different pages', async ({ page }) => {
    await loginAsClient(page);

    // Navigate away and back
    await page.goto(`${BASE_URL}/dashboard/client`);
    await page.waitForLoadState('networkidle');

    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByRole('heading', { name: /My Forge Projects/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('session shared across tabs (cookie-based)', async ({ browser }: { browser: Browser }) => {
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    // Login in context1
    await page1.goto(`${BASE_URL}/login`);
    await page1.fill('input[type="email"]', TEST_CREDS.client.email);
    await page1.fill('input[type="password"]', TEST_CREDS.client.password);
    await page1.click('button[type="submit"]');
    await page1.waitForURL('**/forge', { timeout: 10000 });

    // Copy session cookies
    const cookies = await context1.cookies();

    // Create new context with same cookies (simulates new tab)
    const context2 = await browser.newContext();
    await context2.addCookies(cookies);
    const page2 = await context2.newPage();

    await page2.goto(`${BASE_URL}/dashboard/client`);
    await page2.waitForLoadState('networkidle');

    // Should be accessible (session cookie transferred)
    await expect(page2).not.toHaveURL(/\/login/, { timeout: 5000 });

    await context1.close();
    await context2.close();
  });
});
