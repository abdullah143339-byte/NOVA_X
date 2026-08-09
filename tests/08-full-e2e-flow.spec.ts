import { test, expect } from '@playwright/test';
import { ROUTES } from './helpers';

const E2E_USER = {
  firstName: 'E2E',
  lastName: 'Flow',
  username: `e2eflow_${Date.now()}`,
  email: `e2eflow_${Date.now()}@novaai.test`,
  password: 'E2EFlowTest123!',
};

test.describe('Full E2E: Signup → Dashboard → AI → Post → Profile → Logout', () => {
  test('full user journey', async ({ page }) => {
    test.setTimeout(120000);
    // 1. Signup
    await page.goto(ROUTES.signup, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 30000 });
    await page.getByPlaceholder('John', { exact: true }).fill(E2E_USER.firstName);
    await page.getByPlaceholder('Doe', { exact: true }).fill(E2E_USER.lastName);
    await page.getByPlaceholder('johndoe', { exact: true }).fill(E2E_USER.username);
    await page.getByPlaceholder('you@example.com', { exact: true }).fill(E2E_USER.email);
    await page.getByPlaceholder('Create a strong password', { exact: true }).fill(E2E_USER.password);
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 60000 });
    await page.waitForTimeout(3000);

    // 2. Dashboard — check feed
    const composeBox = page.getByPlaceholder("What's happening today?");
    await expect(composeBox).toBeVisible({ timeout: 20000 });

    // 3. Create a post
    await composeBox.fill('Hello world from E2E test!');
    await page.locator('button.bg-gradient-primary').first().click();
    await page.waitForTimeout(3000);

    // 4. Navigate to Learning Platform
    await page.getByRole('link', { name: 'Learning Platform', exact: true }).click();
    await page.waitForURL('**/learning', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // 5. Open AI Search
    await page.getByRole('link', { name: 'AI Search' }).last().click();
    await page.waitForURL('**/ai-search', { timeout: 30000 });
    await page.waitForTimeout(1000);
    const aiTextarea = page.getByPlaceholder(/Ask anything/i);
    await expect(aiTextarea).toBeVisible({ timeout: 20000 });
    await aiTextarea.fill('What is React?');
    await page.getByRole('button', { name: /^ai search$/i }).click();
    await page.waitForTimeout(5000);

    // 6. Navigate to profile
    await page.getByRole('link', { name: 'Profile' }).click();
    await page.waitForURL('**/profile', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // 7. Navigate to notifications
    await page.getByRole('link', { name: 'Notifications' }).click();
    await page.waitForURL('**/notifications', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // 8. Navigate to settings
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.waitForURL('**/settings', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // 9. Logout
    const logoutBtn = page.getByRole('button', { name: /log out/i });
    await logoutBtn.click({ force: true });
    await page.waitForURL('**/login', { timeout: 30000 });
  });
});
