import { test, expect } from '@playwright/test';
import { ROUTES, registerAndLogin, loginUser, registerUser } from './helpers';

const AUTH_USER = {
  firstName: 'Auth',
  lastName: 'Tester',
  username: `authtester_${Date.now()}`,
  email: `authtester_${Date.now()}@novaai.test`,
  password: 'AuthTest123!',
};

test.describe('2. Authentication — Signup', () => {
  test('signup page loads with all form fields', async ({ page }) => {
    await page.goto(ROUTES.signup, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 30000 });
    await expect(page.getByPlaceholder('John', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByPlaceholder('Doe', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('johndoe', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Create a strong password', { exact: true })).toBeVisible();
  });

  test('signup shows password validation rules', async ({ page }) => {
    await page.goto(ROUTES.signup, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 30000 });
    await expect(page.getByText('8+ characters')).toBeVisible();
    await expect(page.getByText('One uppercase letter')).toBeVisible();
    await expect(page.getByText('One number')).toBeVisible();
  });

  test('signup creates account and redirects to dashboard', async ({ page }) => {
    await registerAndLogin(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('signup with weak password shows error', async ({ page }) => {
    await page.goto(ROUTES.signup, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 30000 });
    await page.getByPlaceholder('John', { exact: true }).fill('Test');
    await page.getByPlaceholder('Doe', { exact: true }).fill('User');
    await page.getByPlaceholder('johndoe', { exact: true }).fill('weakuser' + Date.now());
    await page.getByPlaceholder('you@example.com', { exact: true }).fill('weak' + Date.now() + '@test.com');
    await page.getByPlaceholder('Create a strong password', { exact: true }).fill('weak');
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: /create account/i }).click();
    const error = page.locator('text=Password doesn\'t meet requirements');
    await expect(error).toBeVisible({ timeout: 10000 });
  });
});

test.describe('3. Authentication — Login', () => {
  test('login page loads with email and password fields', async ({ page }) => {
    await page.goto(ROUTES.login, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 30000 });
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
  });

  test('login page has sign in button', async ({ page }) => {
    await page.goto(ROUTES.login, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 30000 });
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await registerUser(page, AUTH_USER);
    await loginUser(page, AUTH_USER.email, AUTH_USER.password);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto(ROUTES.login, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 30000 });
    await page.getByPlaceholder('you@example.com').fill('nonexistent@test.com');
    await page.getByPlaceholder('Enter your password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    const error = page.locator('[class*="red"]').filter({ hasText: /invalid|error|incorrect|wrong/i });
    await expect(error.first()).toBeVisible({ timeout: 15000 });
  });

  test('password visibility toggle works', async ({ page }) => {
    await page.goto(ROUTES.login, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 30000 });
    const passwordInput = page.getByPlaceholder('Enter your password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    const toggleBtn = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('forgot password link is present', async ({ page }) => {
    await page.goto(ROUTES.login, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 30000 });
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
  });

  test('signup link is present on login page', async ({ page }) => {
    await page.goto(ROUTES.login, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 30000 });
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });
});

test.describe('4. Google OAuth Button', () => {
  test('Google button exists on login page', async ({ page }) => {
    await page.goto(ROUTES.login, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 30000 });
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });

  test('Google button redirects to Google OAuth', async ({ page }) => {
    await page.goto(ROUTES.login, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 30000 });
    const googleBtn = page.getByRole('button', { name: /google/i });
    await googleBtn.click();
    await page.waitForTimeout(5000);
    expect(page.url()).toContain('accounts.google.com');
  });

  test('Google button exists on signup page', async ({ page }) => {
    await page.goto(ROUTES.signup, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 30000 });
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });

  test('GitHub button exists on login page', async ({ page }) => {
    await page.goto(ROUTES.login, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('input', { timeout: 30000 });
    await expect(page.getByRole('button', { name: /github/i })).toBeVisible();
  });
});

test.describe('5. User Profile Creation', () => {
  test('profile page loads after login', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.profile, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const profileContent = page.getByText('Projects').or(page.getByText('Skills')).or(page.getByText('Edit Profile'));
    await expect(profileContent.first()).toBeVisible({ timeout: 20000 });
  });

  test('profile has Edit Profile button', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto(ROUTES.profile, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await expect(page.getByRole('button', { name: /edit profile/i })).toBeVisible({ timeout: 20000 });
  });
});

test.describe('6. Dashboard', () => {
  test('dashboard loads with feed', async ({ page }) => {
    await registerAndLogin(page);
    await page.waitForTimeout(2000);
    const composeBox = page.getByPlaceholder("What's on your mind");
    await expect(composeBox).toBeVisible({ timeout: 20000 });
  });

  test('dashboard has sidebar navigation', async ({ page }) => {
    await registerAndLogin(page);
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible({ timeout: 20000 });
    for (const item of ['Feed', 'Reels', 'Profile', 'Learning Platform']) {
      await expect(sidebar.getByRole('link', { name: item })).toBeVisible();
    }
  });

  test('compose box accepts text input', async ({ page }) => {
    await registerAndLogin(page);
    const composeBox = page.getByPlaceholder("What's on your mind");
    await expect(composeBox).toBeVisible({ timeout: 20000 });
    await composeBox.fill('Hello from Playwright test!');
    await expect(composeBox).toHaveValue('Hello from Playwright test!');
  });

  test('can navigate to different sections via sidebar', async ({ page }) => {
    await registerAndLogin(page);
    await page.getByRole('link', { name: 'Profile' }).click();
    await page.waitForURL('**/dashboard/profile', { timeout: 30000 });
  });
});
