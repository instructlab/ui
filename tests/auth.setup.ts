import { test as setup, chromium, Page, Browser } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('should authenticate on ui.instructlab.ai', async () => {
  const browser: Browser = await chromium.launch({ headless: false }); // Set headless to true for headless testing
  const context = await browser.newContext();
  const page: Page = await browser.newPage();

  await page.goto('https://ui.instructlab.ai/login');

  await page.getByRole('button', { name: 'Sign in with GitHub' }).click();
  // Locate the username and password input fields
  const loginButton = page.locator('[type="submit"]');

  // Enter the username and password
  await page.getByLabel('Username or email address').fill(process.env.USERNAME!);
  await page.getByLabel('Password').fill(process.env.PASSWORD!);

  // Submit the login form
  await loginButton.click();
  await page.context().storageState({ path: authFile });
});