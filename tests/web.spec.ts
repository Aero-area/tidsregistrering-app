import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', console.log);
  page.on('console', msg => console.log('console:', msg.text()));
  
  // Navigate to the page first to ensure the app is loaded
  await page.goto('/', { waitUntil: 'networkidle' });
  
  // Wait for resetDB to be available and call it
  await page.waitForFunction(() => {
    return typeof window !== 'undefined' && (window as any).resetDB;
  }, { timeout: 10000 });
  
  await page.evaluate(() => {
    (window as any).resetDB();
  });
});

test.setTimeout(90_000);

test('home renders and stamp is visible', async ({ page }) => {
  await page.screenshot({ path: 'test-results/screenshot.png' });
  await page.waitForSelector('[data-testid="ts-root"]', { timeout: 20000 });
  await page.waitForSelector('[data-testid="ts-home-stamp"]', { timeout: 40000 });
  await expect(page.getByTestId('ts-home-stamp')).toBeVisible();
});

test('entries add flow creates an entry', async ({ page }) => {
  await page.waitForSelector('[data-testid="ts-root"]', { timeout: 20000 });
  await page.getByRole('tab', { name: 'Tidsposter' }).click();

  await page.getByTestId('ts-entries-add').click();
  await page.getByTestId('ts-entries-date-confirm').click();
  await page.waitForSelector('[data-testid="ts-entries-time-save"]', { timeout: 20000, state: 'visible' });
  await page.getByTestId('ts-entries-time-save').click();

  await expect(page.locator('[data-testid^="ts-entries-row-"]').first()).toBeVisible();
});

test('settings buttons are visible', async ({ page }) => {
  await page.goto('/settings', { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('ts-settings-backup')).toBeVisible();
});
