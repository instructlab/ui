import { test as setup, chromium } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('should authenticate on ui.instructlab.ai', async () => {
  const browser = await chromium.launch({ headless: false }); // Set headless to true for headless testing
  const page = await browser.newPage();

  // Replace with your actual credentials
  const username = process.env.USERNAME!;
  const password = process.env.PASSWORD!;

  await page.goto('https://ui.instructlab.ai/login');

  // Locate the username and password input fields
  const usernameInput = page.locator('[name="login"]');
  const passwordInput = page.locator('[name="password"]');
  const loginButton = page.locator('[type="submit"]');

  // Enter the username and password
  await usernameInput.fill(username);
  await passwordInput.fill(password);

  // Submit the login form
  await loginButton.click();
  await page.getByLabel('user menu dropdown'); 
  await page.context().storageState({ path: authFile });

  await browser.close();
});