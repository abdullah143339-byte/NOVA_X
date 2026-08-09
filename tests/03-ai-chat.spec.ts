import { test, expect } from '@playwright/test';
import { ROUTES, registerAndLogin } from './helpers';

test.describe('7. Learning Platform', () => {
  test('learning platform page loads', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.learning, { waitUntil: 'domcontentloaded' });
    const heading = page.getByRole('heading', { name: 'Learning Hub' });
    await expect(heading).toBeVisible({ timeout: 20000 });
  });

  test('ai search tab is visible in learning nav', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.learning, { waitUntil: 'domcontentloaded' });
    const tab = page.getByRole('link', { name: 'AI Search' }).first();
    await expect(tab).toBeVisible({ timeout: 20000 });
  });

  test('ai search tab navigates to the search page', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.learning, { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: 'AI Search' }).first().click();
    await page.waitForURL('**/ai-search', { timeout: 20000 });
    const heading = page.getByRole('heading', { name: 'AI Search' }).first();
    await expect(heading).toBeVisible({ timeout: 20000 });
  });
});

test.describe('8. AI Search', () => {
  test('ai search page loads directly', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.aiSearch, { waitUntil: 'domcontentloaded' });
    const heading = page.getByRole('heading', { name: 'AI Search' }).first();
    await expect(heading).toBeVisible({ timeout: 20000 });
  });

  test('search input is visible', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.aiSearch, { waitUntil: 'domcontentloaded' });
    const input = page.getByPlaceholder(/Ask anything/i);
    await expect(input).toBeVisible({ timeout: 20000 });
  });

  test('search button is visible', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.aiSearch, { waitUntil: 'domcontentloaded' });
    const btn = page.locator('button:has-text("AI Search")').first();
    await expect(btn).toBeVisible({ timeout: 20000 });
  });

  test('explanation style buttons are visible', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.aiSearch, { waitUntil: 'domcontentloaded' });
    const sorting = page.locator('button:has-text("Sorting")').first();
    await expect(sorting).toBeVisible({ timeout: 20000 });
  });

  test('language selector is visible', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.aiSearch, { waitUntil: 'domcontentloaded' });
    const english = page.locator('button:has-text("English")').first();
    await expect(english).toBeVisible({ timeout: 20000 });
  });
});
