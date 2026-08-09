import { test, expect } from '@playwright/test';
import { ROUTES } from './helpers';

test.describe('1. Landing Page', () => {
  test('loads successfully and has NOVA AI branding', async ({ page }) => {
    await page.goto(ROUTES.landing, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=NOVA AI').first()).toBeVisible({ timeout: 30000 });
  });

  test('displays hero section with tagline', async ({ page }) => {
    await page.goto(ROUTES.landing, { waitUntil: 'domcontentloaded' });
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 30000 });
  });

  test('navigation links are present', async ({ page }) => {
    await page.goto(ROUTES.landing, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const loginLink = page.getByRole('link', { name: /log in/i }).first();
    const getStartedLink = page.getByRole('link', { name: /get started/i }).first();
    const featureLink = page.getByRole('link', { name: /features/i }).first();
    const loginVisible = await loginLink.isVisible().catch(() => false);
    const getStartedVisible = await getStartedLink.isVisible().catch(() => false);
    const featureVisible = await featureLink.isVisible().catch(() => false);
    expect(loginVisible || getStartedVisible || featureVisible).toBeTruthy();
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(ROUTES.landing, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('404') && !e.includes('socket.io') && !e.includes('WebSocket')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
