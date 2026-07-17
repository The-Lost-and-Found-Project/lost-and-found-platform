import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service role key. This bypasses Row
// Level Security, so it must NEVER be imported into any client component or
// exposed to the browser. Only use it inside server-only routes (like the
// weekly digest cron job) that need to read across all users' data.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
