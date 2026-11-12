import { expect, test } from '@playwright/test';

test('sign-in fields are accessible and password entry is masked', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in to The Lost & Found Project' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  const password = page.getByLabel('Password', { exact: true });
  await expect(password).toHaveAttribute('type', 'password');
});

test('anonymous visitors are redirected away from the dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/i);
});

test('directory suggestion requires sign-in', async ({ page }) => {
  await page.goto('/directory/suggest');
  await expect(page).toHaveURL(/\/login\?next=/);
});
