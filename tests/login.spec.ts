import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('https://ui.instructlab.ai/');
});

test('has title', async ({ page }) => {
  await expect(page).toHaveTitle(/InstructLab UI/);
});

test('corresponding anchor links', async ({ page }) => {
  const loginButton = page.getByRole('button');
  await expect(loginButton).toContainText('Sign in with GitHub');
});

test('corresponding text content', async ({ page }) => {
  const loginButton = page.getByRole('button');
  await expect(loginButton).toContainText('Sign in with GitHub');
});

test('all the call to actions links exists on the landing page', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'GitHub' })).toBeVisible();

  await expect(page.getByRole('link', { name: 'Collaborate' })).toBeVisible();

  await expect(page.getByRole('link', { name: 'Code Of Conduct' })).toBeVisible();

  await expect(page.getByRole('link', { name: 'Terms of use' })).toBeVisible();

  await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
});
