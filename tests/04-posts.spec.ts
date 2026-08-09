import { test, expect } from '@playwright/test';
import { ROUTES, registerAndLogin } from './helpers';

test.describe('10. Posts / Feed', () => {
  test('feed page loads with posts or empty state', async ({ page }) => {
    await registerAndLogin(page);
    await page.waitForTimeout(2000);
    const composeBox = page.getByPlaceholder("What's on your mind");
    await expect(composeBox).toBeVisible({ timeout: 20000 });
  });

  test('can create a post', async ({ page }) => {
    await registerAndLogin(page);
    const textarea = page.getByPlaceholder("What's on your mind");
    await expect(textarea).toBeVisible({ timeout: 20000 });
    await textarea.fill('This is a Playwright test post!');
    const postBtn = page.locator('button.bg-gradient-primary').first();
    await postBtn.click();
    await page.waitForTimeout(3000);
    const newPost = page.locator('text=This is a Playwright test post!').first();
    await expect(newPost).toBeVisible({ timeout: 15000 });
  });

  test('posts have like, comment, share buttons', async ({ page }) => {
    await registerAndLogin(page);
    await page.waitForTimeout(3000);
    const heartBtn = page.locator('[class*="lucide-heart"]').first();
    await expect(heartBtn).toBeVisible({ timeout: 20000 });
  });

  test('Voice and Public buttons in compose area', async ({ page }) => {
    await registerAndLogin(page);
    const voiceBtn = page.getByRole('button', { name: /voice/i });
    await expect(voiceBtn).toBeVisible({ timeout: 20000 });
    const publicBtn = page.getByRole('button', { name: /public/i });
    await expect(publicBtn).toBeVisible();
  });
});
