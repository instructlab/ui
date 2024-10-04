import { test, expect, chromium } from '@playwright/test';
import path from 'path';

const pageURL = 'https://ui.instructlab.ai/login';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

test('has title', async ({ page }) => {
  await page.goto(pageURL);
  await expect(page).toHaveTitle(/InstructLab UI/);
});

test('corresponding anchor links', async ({ page }) => {
  await page.goto(pageURL);

  const loginButton = page.getByRole('button');
  await expect(loginButton).toContainText('Sign in with GitHub');
});

test('corresponding text content', async ({ page }) => {
  await page.goto(pageURL);

  const loginButton = page.getByRole('button');
  await expect(loginButton).toContainText('Sign in with GitHub');
});

test('all the call to actions links exists on the landing page', async ({ page }) => {
  await page.goto(pageURL);

  await expect(page.getByRole('link', { name: 'GitHub' })).toBeVisible();

  await expect(page.getByRole('link', { name: 'Collaborate' })).toBeVisible();

  await expect(page.getByRole('link', { name: 'Code Of Conduct' })).toBeVisible();

  await expect(page.getByRole('link', { name: 'Terms of use' })).toBeVisible();

  await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
});
