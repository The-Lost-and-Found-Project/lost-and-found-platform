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

test('protected ministry pages redirect anonymous visitors to sign-in', async ({ page }) => {
  for (const path of ['/profile', '/settings', '/prayer/my-requests', '/study-companion', '/admin']) {
    await page.goto(path);
    const current = new URL(page.url());
    expect(current.pathname).toBe('/login');
    expect(current.searchParams.get('next')).toBe(path);
  }
});

test('protected route preserves safe return destination with query string', async ({ page }) => {
  await page.goto('/dashboard?section=prayer');
  const current = new URL(page.url());
  expect(current.pathname).toBe('/login');
  expect(current.searchParams.get('next')).toBe('/dashboard?section=prayer');
  await expect(page.getByRole('link', { name: 'Create one' })).toHaveAttribute('href', '/signup?next=%2Fdashboard%3Fsection%3Dprayer');
});

test('unsafe external redirect destination is not forwarded to signup', async ({ page }) => {
  await page.goto('/login?next=%2F%2Fevil.example');
  await expect(page.getByRole('link', { name: 'Create one' })).toHaveAttribute('href', '/signup');
  await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password');
});
