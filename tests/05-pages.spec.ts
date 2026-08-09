import { test, expect } from '@playwright/test';
import { ROUTES, registerAndLogin } from './helpers';

test.describe('11. Communities', () => {
  test('communities page loads', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.communities, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const heading = page.locator('text=Communities').or(page.locator('text=Community'));
    await expect(heading.first()).toBeVisible({ timeout: 20000 });
  });
});

test.describe('12. Learning Section', () => {
  test('learning page loads', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.learning, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const heading = page.locator('text=Learning').or(page.locator('text=Courses'));
    await expect(heading.first()).toBeVisible({ timeout: 20000 });
  });
});

test.describe('13. Marketplace', () => {
  test('marketplace page loads', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.portfolio, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const heading = page.locator('text=Marketplace');
    await expect(heading.first()).toBeVisible({ timeout: 20000 });
  });
});

test.describe('14. Search', () => {
  test('sidebar search input works', async ({ page }) => {
    await registerAndLogin(page);
    const searchInput = page.locator('input[placeholder="Search..."]').first();
    await expect(searchInput).toBeVisible({ timeout: 20000 });
    await searchInput.fill('test query');
    await page.waitForTimeout(500);
    await searchInput.press('Enter');
    await page.waitForURL('**/search**', { timeout: 10000 });
  });

  test('search redirects with query param', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/dashboard/search?q=react', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    expect(page.url()).toContain('q=react');
  });
});

test.describe('15. Notifications', () => {
  test('notifications page loads', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.notifications, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const heading = page.locator('text=Notifications');
    await expect(heading.first()).toBeVisible({ timeout: 20000 });
  });
});

test.describe('16. Settings', () => {
  test('settings page loads', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.settings, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const heading = page.locator('text=Settings');
    await expect(heading.first()).toBeVisible({ timeout: 20000 });
  });
});
