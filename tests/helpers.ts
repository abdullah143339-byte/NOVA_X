import { Page, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8080/api/v1';

export const ROUTES = {
  landing: '/',
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  dashboard: '/dashboard',
  profile: '/dashboard/profile',
  assistant: '/dashboard/learning/ai-search',
  aiSearch: '/dashboard/learning/ai-search',
  messages: '/dashboard/messages',
  communities: '/dashboard/communities',
  learning: '/dashboard/learning',
  portfolio: '/dashboard/portfolio',
  reels: '/dashboard/reels',
  jobs: '/dashboard/jobs',
  marketplace: '/dashboard/marketplace',
  knowledge: '/dashboard/knowledge',
  notifications: '/dashboard/notifications',
  settings: '/dashboard/settings',
  search: '/dashboard/search',
};

export async function registerUser(page: Page, user: { firstName: string; lastName: string; username: string; email: string; password: string }) {
  await page.goto(ROUTES.signup, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input', { timeout: 30000 });

  await page.getByPlaceholder('John', { exact: true }).fill(user.firstName);
  await page.getByPlaceholder('Doe', { exact: true }).fill(user.lastName);
  await page.getByPlaceholder('johndoe', { exact: true }).fill(user.username);
  await page.getByPlaceholder('you@example.com', { exact: true }).fill(user.email);
  await page.getByPlaceholder('Create a strong password', { exact: true }).fill(user.password);

  const checkbox = page.locator('input[type="checkbox"]').first();
  await checkbox.check();

  await page.getByRole('button', { name: /create account/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await page.waitForTimeout(2000);
}

export async function loginUser(page: Page, email: string, password: string) {
  await page.goto(ROUTES.login, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input', { timeout: 30000 });

  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);

  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  await page.waitForTimeout(2000);
}

export async function registerAndLogin(page: Page) {
  const uniqueId = Date.now();
  const user = {
    firstName: 'Test',
    lastName: 'User',
    username: `testuser_${uniqueId}`,
    email: `testuser_${uniqueId}@novaai.test`,
    password: 'TestPass123!',
  };
  await registerUser(page, user);
}
