/**
 * auth.helper.ts
 * Reusable login functions for Playwright tests.
 * Reads credentials from .env.test — never hardcode credentials in test files.
 */

import { Page } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.test relative to project root
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

export const TEST_CREDS = {
  client: {
    email: process.env.TEST_CLIENT_EMAIL!,
    password: process.env.TEST_CLIENT_PASSWORD!,
  },
  vendor: {
    email: process.env.TEST_VENDOR_EMAIL!,
    password: process.env.TEST_VENDOR_PASSWORD!,
  },
} as const;

export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

/**
 * Log in as a client user via the /login page.
 * Waits for the redirect to /forge to confirm successful login.
 */
export async function loginAsClient(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', TEST_CREDS.client.email);
  await page.fill('input[type="password"]', TEST_CREDS.client.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/forge', { timeout: 10000 });
}

/**
 * Log in as a vendor user via the /craftsmen/login page.
 * Waits for redirect to the craftsmen dashboard.
 */
export async function loginAsVendor(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/craftsmen/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', TEST_CREDS.vendor.email);
  await page.fill('input[type="password"]', TEST_CREDS.vendor.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/craftsmen/dashboard', { timeout: 10000 });
}

/**
 * Log out the current user by clicking the user menu then logout button.
 * Waits for redirect to a public page.
 */
export async function logout(page: Page): Promise<void> {
  await page.click('[data-testid="user-menu-button"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL(/\/(login|signup|\/)/, { timeout: 5000 });
}
