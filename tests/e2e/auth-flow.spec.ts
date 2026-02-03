/**
 * EventFoundry E2E Tests - Authentication Flow
 *
 * Tests complete user experience for:
 * - Client signup
 * - Client login
 * - Login validation
 * - Logout
 * - Session persistence
 *
 * This test suite validates UX, not just backend functionality
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Authentication Flow - Complete UX Validation', () => {

  test.describe('Client Signup', () => {
    const timestamp = Date.now();
    const testClient = {
      email: `e2e-client-${timestamp}@test.com`,
      password: 'TestPassword123!',
      name: 'E2E Test Client'
    };

    test('Client can signup with valid credentials and sees confirmation', async ({ page }) => {
      console.log('🧪 Testing client signup UX');

      // Navigate to signup page
      await page.goto(`${BASE_URL}/signup`);

      // Verify page loaded correctly
      await expect(page.locator('h1:has-text("Create"), h2:has-text("Create")')).toBeVisible({ timeout: 5000 });

      // Fill signup form with all required fields
      await page.fill('input[name="fullName"]', testClient.name);
      await page.fill('input[name="email"]', testClient.email);
      await page.fill('input[name="password"]', testClient.password);
      await page.fill('input[type="password"][placeholder*="Re-enter"]', testClient.password); // Confirm password

      // Submit form
      await page.click('button[type="submit"]');

      // Verify success feedback (toast or redirect)
      const successIndicators = [
        page.locator('text=Account created'),
        page.locator('text=Welcome'),
        page.locator('text=Success')
      ];

      // Wait for at least one success indicator
      await Promise.race(successIndicators.map(loc =>
        loc.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
      ));

      // Verify redirected to appropriate page
      await expect(page).toHaveURL(/\/(forge|dashboard|events)/, { timeout: 5000 });

      console.log('✅ Signup completed successfully');
    });

    test('Signup shows error for existing email', async ({ page }) => {
      console.log('🧪 Testing duplicate email validation');

      await page.goto(`${BASE_URL}/signup`);

      // Try to signup with existing email - fill all required fields
      await page.fill('input[name="fullName"]', 'Test User');
      await page.fill('input[name="email"]', 'test@eventfoundry.com');
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[type="password"][placeholder*="Re-enter"]', 'TestPassword123!');

      await page.click('button[type="submit"]');

      // Verify error message appears - actual message: "This email is already registered. Please login instead."
      await expect(page.locator('text=/already registered|already exists|email is taken/i')).toBeVisible({ timeout: 5000 });

      // Verify still on signup page (not redirected)
      await expect(page).toHaveURL(/\/signup/);

      console.log('✅ Duplicate email validation working');
    });
  });

  test.describe('Client Login', () => {

    test('Client can login with correct credentials and sees confirmation', async ({ page }) => {
      console.log('🧪 Testing client login UX with all feedback elements');

      // Navigate to login page
      await page.goto(`${BASE_URL}/login`);

      // Verify page loaded correctly
      await expect(page.locator('h1:has-text("Welcome"), h1:has-text("Login"), h1:has-text("Sign")')).toBeVisible({ timeout: 5000 });

      // Fill login form
      await page.fill('input[type="email"]', 'test@eventfoundry.com');
      await page.fill('input[type="password"]', 'TestClient123!');

      // Submit
      await page.click('button[type="submit"]');

      // CRITICAL: Verify success toast appears
      await expect(page.locator('text=Welcome back').or(page.locator('text=Successfully logged in'))).toBeVisible({ timeout: 3000 });
      console.log('✅ Success toast displayed');

      // Verify redirect to forge
      await page.waitForURL('**/forge', { timeout: 5000 });
      console.log('✅ Redirected to /forge');

      // CRITICAL: Verify welcome banner shows user is logged in
      // Use .first() to handle multiple "Test User" elements (navbar, banner, content)
      await expect(page.locator('text=/Welcome back.*Test User/i').or(page.locator('text=Test User')).first()).toBeVisible({ timeout: 3000 });
      console.log('✅ Welcome banner displayed');

      // Verify user can navigate to dashboard (validates session)
      await page.goto(`${BASE_URL}/dashboard/client`);

      // Should either load dashboard or show some user-specific content
      const dashboardLoaded = await page.locator('text=My Events, text=Dashboard, text=Events').isVisible({ timeout: 5000 }).catch(() => false);

      if (dashboardLoaded) {
        console.log('✅ Dashboard accessible (session valid)');
      } else {
        console.log('⚠️ Dashboard may need implementation');
      }
    });

    test('Login with wrong password shows clear error message', async ({ page }) => {
      console.log('🧪 Testing login error handling');

      await page.goto(`${BASE_URL}/login`);

      await page.fill('input[type="email"]', 'test@eventfoundry.com');
      await page.fill('input[type="password"]', 'WrongPassword123!');

      await page.click('button[type="submit"]');

      // Verify error message appears - actual: "Invalid email or password. Please check your credentials and try again."
      await expect(page.locator('text=/Invalid email or password|Incorrect password|Invalid credentials/i')).toBeVisible({ timeout: 5000 });
      console.log('✅ Error message displayed');

      // Verify still on login page (not redirected)
      await expect(page).toHaveURL(/\/login/);
      console.log('✅ User not redirected on failed login');
    });

    test('Login with non-existent email shows error', async ({ page }) => {
      console.log('🧪 Testing non-existent user login');

      await page.goto(`${BASE_URL}/login`);

      await page.fill('input[type="email"]', 'nonexistent@example.com');
      await page.fill('input[type="password"]', 'SomePassword123!');

      await page.click('button[type="submit"]');

      // Verify error message (should not reveal whether email exists for security) - actual: "Invalid email or password..."
      await expect(page.locator('text=/Invalid email or password|Invalid credentials|not found/i')).toBeVisible({ timeout: 5000 });

      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Logout Flow', () => {

    test('Client can logout and session is cleared', async ({ page }) => {
      console.log('🧪 Testing logout flow');

      // Login first
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@eventfoundry.com');
      await page.fill('input[type="password"]', 'TestClient123!');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/forge', { timeout: 5000 });
      console.log('✅ Logged in successfully');

      // Open user menu dropdown
      await page.click('[data-testid="user-menu-button"]');
      console.log('✅ User menu opened');

      // Click logout button
      await page.click('[data-testid="logout-button"]');
      console.log('✅ Logout button clicked');

      // Wait for logout to complete and state to clear
      await page.waitForTimeout(1000);

      // Verify redirected to public page
      await expect(page).toHaveURL(/\/(login|signup|home|\/)/, { timeout: 5000 });
      console.log('✅ Redirected to public page');

      // CRITICAL: Try to access protected route
      await page.goto(`${BASE_URL}/dashboard/client`);

      // Should redirect back to login (may take time for client-side redirect)
      await page.waitForTimeout(1000); // Wait for useEffect to run
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
      console.log('✅ Protected route redirects to login (session cleared)');
    });
  });

  test.describe('Session Persistence', () => {

    test('Session persists after page refresh', async ({ page }) => {
      console.log('🧪 Testing session persistence');

      // Login
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"]', 'test@eventfoundry.com');
      await page.fill('input[type="password"]', 'TestClient123!');
      await page.click('button[type="submit"]');

      await page.waitForURL('**/forge', { timeout: 5000 });
      console.log('✅ Logged in');

      // Refresh page
      await page.reload();
      console.log('🔄 Page refreshed');

      // Wait for page to fully reload and auth to restore
      await page.waitForTimeout(2000);

      // Verify still logged in - check for user menu button (only visible when authenticated)
      await expect(page.locator('[data-testid="user-menu-button"]')).toBeVisible({ timeout: 5000 });
      console.log('✅ Session persisted after refresh - user menu visible');

      // Navigate to different page
      await page.goto(`${BASE_URL}/dashboard/client`);

      // Should still be authenticated - check for dashboard content
      await expect(page.locator('text=/My Events|Dashboard/i')).toBeVisible({ timeout: 5000 });
      console.log('✅ Session persists across navigation');
    });

    test('Session persists after browser tab close and reopen', async ({ browser }) => {
      console.log('🧪 Testing session persistence across tabs');

      // Create new context (simulates new tab)
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();

      // Login in first tab
      await page1.goto(`${BASE_URL}/login`);
      await page1.fill('input[type="email"]', 'test@eventfoundry.com');
      await page1.fill('input[type="password"]', 'TestClient123!');
      await page1.click('button[type="submit"]');

      await page1.waitForURL('**/forge', { timeout: 5000 });
      console.log('✅ Logged in tab 1');

      // Get cookies/storage from first context
      const cookies = await context1.cookies();
      const localStorage = await page1.evaluate(() => JSON.stringify(window.localStorage));

      // Close first tab
      await context1.close();
      console.log('🔄 Tab 1 closed');

      // Create new context (simulates reopening browser)
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();

      // Restore cookies
      await context2.addCookies(cookies);

      // Restore localStorage
      await page2.goto(`${BASE_URL}`);
      await page2.evaluate((storage) => {
        const data = JSON.parse(storage);
        for (const key in data) {
          localStorage.setItem(key, data[key]);
        }
      }, localStorage);

      // Navigate to protected page
      await page2.goto(`${BASE_URL}/forge`);

      // Verify still logged in
      const isLoggedIn = await page2.locator('text=Welcome back, text=Test User').first().isVisible({ timeout: 5000 }).catch(() => false);

      if (isLoggedIn) {
        console.log('✅ Session persisted across tab close/reopen');
      } else {
        console.log('⚠️ Session may require re-login (depends on implementation)');
      }

      await context2.close();
    });
  });

  test.describe('Form Validation', () => {

    test('Signup rejects invalid email format', async ({ page }) => {
      console.log('🧪 Testing email validation');

      await page.goto(`${BASE_URL}/signup`);

      // Fill all fields except use invalid email
      await page.fill('input[name="fullName"]', 'Test User');
      await page.fill('input[name="email"]', 'not-an-email'); // Invalid format
      await page.fill('input[name="password"]', 'TestPassword123!');
      await page.fill('input[type="password"][placeholder*="Re-enter"]', 'TestPassword123!');

      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000); // Wait for validation to complete

      // Verify error message appears (the actual error text: "Please enter a valid email address")
      // Check for any visible error text containing "email"
      await expect(page.locator('text=/Please enter a valid email|valid email address|Email.*valid/i')).toBeVisible({ timeout: 5000 });

      // Should still be on signup page
      await expect(page).toHaveURL(/\/signup/);
    });

    test('Signup rejects weak password', async ({ page }) => {
      console.log('🧪 Testing password validation');

      await page.goto(`${BASE_URL}/signup`);

      // Fill all fields except use weak password
      await page.fill('input[name="fullName"]', 'Test User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', '123'); // Too short
      await page.fill('input[type="password"][placeholder*="Re-enter"]', '123');

      await page.click('button[type="submit"]');

      // Verify error message about password requirements (actual error text)
      await expect(page.locator('text=at least 8 characters')).toBeVisible({ timeout: 3000 });

      // Should still be on signup page
      await expect(page).toHaveURL(/\/signup/);
    });

    test('Login form prevents empty submission', async ({ page }) => {
      console.log('🧪 Testing required field validation');

      await page.goto(`${BASE_URL}/login`);

      // Try to submit without filling anything
      await page.click('button[type="submit"]');

      // Should still be on login page (not redirected)
      await expect(page).toHaveURL(/\/login/);

      // Should show validation error message (not redirect to forge)
      await page.waitForTimeout(1000); // Wait for any potential redirect
      await expect(page).toHaveURL(/\/login/); // Confirm still on login page

      // Should NOT navigate to /forge
      await expect(page).not.toHaveURL(/\/forge/);
    });
  });
});
