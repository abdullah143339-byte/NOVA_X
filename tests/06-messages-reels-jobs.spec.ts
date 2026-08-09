import { test, expect } from '@playwright/test';
import { ROUTES, registerAndLogin } from './helpers';

test.describe('Messages Page', () => {
  test('messages page loads', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.messages, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const heading = page.locator('text=Messages').or(page.locator('text=Chat'));
    await expect(heading.first()).toBeVisible({ timeout: 20000 });
  });
});

test.describe('Reels Page', () => {
  test('reels page loads', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.reels, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const heading = page.locator('text=Reels').or(page.locator('text=Video'));
    await expect(heading.first()).toBeVisible({ timeout: 20000 });
  });
});

test.describe('Jobs Page', () => {
  test('jobs page loads', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.jobs, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const heading = page.locator('text=Jobs').or(page.locator('text=Collaboration'));
    await expect(heading.first()).toBeVisible({ timeout: 20000 });
  });
});

test.describe('Marketplace Page', () => {
  test('marketplace page loads', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.portfolio, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const content = page.getByText('Marketplace');
    await expect(content.first()).toBeVisible({ timeout: 20000 });
  });
});

test.describe('Knowledge Graph Page', () => {
  test('knowledge graph page loads', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.knowledge, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const content = page.getByText('Knowledge').or(page.getByText('Graph')).or(page.locator('main'));
    await expect(content.first()).toBeVisible({ timeout: 20000 });
  });
});
