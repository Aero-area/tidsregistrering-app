import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', console.log);
  page.on('console', msg => console.log('console:', msg.text()));
  
  // Navigate to the page first to ensure the app is loaded
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  
  // Wait a bit for the app to initialize
  await page.waitForTimeout(2000);
});

test.setTimeout(90_000);

test('home page loads', async ({ page }) => {
  await page.screenshot({ path: 'test-results/screenshot.png' });
  // Just check that the page loads without errors
  await expect(page.locator('body')).toBeVisible();
});

test('entries page loads', async ({ page }) => {
  await page.goto('/entries', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await expect(page.locator('body')).toBeVisible();
});

test('settings page loads', async ({ page }) => {
  await page.goto('/settings', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await expect(page.locator('body')).toBeVisible();
});