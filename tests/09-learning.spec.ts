import { test, expect } from '@playwright/test';
import { registerAndLogin } from './helpers';

test.describe('9. Learning Hub', () => {
  test('sidebar links to the Learning Platform', async ({ page }) => {
    await registerAndLogin(page);
    const sidebar = page.locator('aside');
    const link = sidebar.getByRole('link', { name: 'Learning Platform' });
    await expect(link).toBeVisible({ timeout: 20000 });
    await link.click();
    await page.waitForURL('**/dashboard/learning', { timeout: 30000 });
  });

  test('hub page renders header, nav tabs and sections', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/dashboard/learning', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Learning Hub' })).toBeVisible({ timeout: 30000 });

    for (const tab of ['Subjects', 'Notes', 'Lectures', 'Files', 'Tasks', 'Bookmarks', 'Trash']) {
      await expect(page.getByRole('link', { name: tab, exact: true })).toBeVisible();
    }
    await expect(page.getByText('Continue Learning', { exact: true })).toBeVisible();
    await expect(page.getByText('Recent Notes', { exact: true })).toBeVisible();
    await expect(page.getByText('Upcoming Tasks', { exact: true })).toBeVisible();
  });

  test('create a subject from the modal', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/dashboard/learning/subjects', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /new subject/i }).click();
    await page.getByPlaceholder('e.g. Artificial Intelligence').fill('Machine Learning');
    await page.getByRole('button', { name: /create subject/i }).click();

    await expect(page.getByText('Machine Learning', { exact: true })).toBeVisible({ timeout: 20000 });
  });

  test('create a note via the editor', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/dashboard/learning/notes/new', { waitUntil: 'domcontentloaded' });

    await page.getByPlaceholder('Note title').fill('Transformer basics');
    await page.getByLabel('Note content').fill('Attention is all you need.');

    await page.getByRole('button', { name: /create note/i }).click();
    await page.waitForURL(/dashboard\/learning\/notes\/edit\//, { timeout: 30000 });
    await expect(page.getByText(/auto-saved|saving/i).first()).toBeVisible({ timeout: 20000 });
  });

  test('add a task with deadline fields', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/dashboard/learning/tasks', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /new task/i }).click();
    await page.getByPlaceholder('e.g. Finish LoRA fine-tuning lecture').fill('Revise week 4 notes');
    await page.getByRole('button', { name: /add task/i }).click();

    await expect(page.getByText('Revise week 4 notes', { exact: true })).toBeVisible({ timeout: 20000 });
  });

  test('tabs render the seeded workspace', async ({ page }) => {
    await registerAndLogin(page);

    await page.goto('/dashboard/learning/lectures', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Fine-tuning LLMs with LoRA', { exact: true })).toBeVisible({ timeout: 30000 });

    await page.goto('/dashboard/learning/files', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('attention-is-all-you-need.pdf', { exact: true })).toBeVisible();

    await page.goto('/dashboard/learning/bookmarks', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'TypeScript Generics & Advanced Types' })).toBeVisible();

    await page.goto('/dashboard/learning/trash', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Trash is empty', { exact: true })).toBeVisible();
  });

  test('add lecture form supports YouTube and upload sources', async ({ page }) => {
    await registerAndLogin(page);
    await page.goto('/dashboard/learning/lectures/new', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Add Lecture' })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('button', { name: /youtube/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /upload/i })).toBeVisible();
  });
});
