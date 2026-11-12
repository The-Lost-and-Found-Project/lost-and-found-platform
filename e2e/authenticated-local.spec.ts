import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

// Opt-in only: requires an isolated local Supabase instance and a locally built app.
test.describe('local authenticated member journeys', () => {
  test.skip(process.env.LOCAL_AUTH_E2E !== '1', 'Only run with isolated local Supabase');
  const localUrl = 'http://127.0.0.1:54321';
  let admin: ReturnType<typeof createClient>;
  let userId: string;
  let email: string;
  let password: string;

  test.beforeAll(async () => {
    const output = execFileSync('supabase', ['status', '-o', 'env'], { encoding: 'utf8' });
    const values = Object.fromEntries(output.split('\n').filter(line => line.includes('=')).map(line => {
      const pos = line.indexOf('=');
      return [line.slice(0, pos), line.slice(pos + 1).replace(/^"|"$/g, '')];
    }));
    if (!values.SERVICE_ROLE_KEY) throw new Error('Local Supabase service key unavailable');
    admin = createClient(localUrl, values.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    email = `lfp-e2e-${randomUUID()}@test.invalid`;
    password = `LocalOnly-${randomUUID()}-Aa9!`;
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) throw error ?? new Error('Synthetic user creation failed');
    userId = data.user.id;
  });

  test.afterAll(async () => {
    if (userId && admin) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
    }
  });

  test('member signs in and can access private prayer requests', async ({ page }) => {
    await page.goto('/login?next=%2Fprayer%2Fmy-requests');
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page).toHaveURL(/\/prayer\/my-requests$/);
    await expect(page.getByRole('heading', { name: 'My Prayer Requests' })).toBeVisible();
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Good to see you/i })).toBeVisible();
  });
});
