// Synthetic Auth + Data API regression for verified donor-account ownership.
// Runs ONLY against disposable local Supabase. Never query a hosted project.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const status = spawnSync("supabase", ["status", "-o", "env"], {
  cwd: root, encoding: "utf8", timeout: 15_000,
});
if (status.status !== 0) throw new Error("Disposable local Supabase must be running.");
const env = Object.fromEntries(
  status.stdout.split(/\r?\n/).filter((s) => /^[A-Z_]+=/.test(s)).map((s) => {
    const pos = s.indexOf("=");
    return [s.slice(0, pos), s.slice(pos + 1).replace(/^["']|["']$/g, "")];
  })
);
const apiUrl = new URL(env.API_URL || "");
const dbUrl = new URL(env.DB_URL || "");
if (apiUrl.protocol !== "http:" ||
    !["localhost", "127.0.0.1"].includes(apiUrl.hostname) ||
    apiUrl.port !== "54321" || apiUrl.pathname !== "/" ||
    !["postgresql:", "postgres:"].includes(dbUrl.protocol) ||
    !["localhost", "127.0.0.1"].includes(dbUrl.hostname) ||
    dbUrl.port !== "54322" || dbUrl.pathname !== "/postgres") {
  throw new Error("Refusing any non-disposable Supabase origin.");
}
assert.ok(env.ANON_KEY && env.SERVICE_ROLE_KEY, "Local test keys unavailable.");

function execSql(sql, opts = {}) {
  const result = spawnSync("psql", [
    "-X", "-q", "-v", "ON_ERROR_STOP=1", "-d", env.DB_URL,
    ...(opts.file ? ["-f", opts.file] : []),
  ], { input: opts.file ? undefined : sql, encoding: "utf8", timeout: 20_000 });
  if (result.status !== 0) {
    throw new Error("Disposable DB fixture SQL failed: " + (result.stderr || result.stdout).slice(-1000));
  }
}
function sqlValue(v) {
  assert.match(v, /^[a-zA-Z0-9@._-]+$/, "Synthetic SQL parameter must be simple");
  return "'" + v + "'";
}
const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(env.API_URL, env.SERVICE_ROLE_KEY, clientOptions);
const newClient = () => createClient(env.API_URL, env.ANON_KEY, clientOptions);
const nonce = randomUUID().slice(0, 12);
const password = "LocalDonor-" + randomUUID() + "!9";
const emails = [0, 1, 2].map((n) => "lfp-" + nonce + "-donor-" + n + "@example.test");
const userIds = [];
let fixtureCreated = false;
let checks = 0;
const check = (condition, description) => {
  assert.ok(condition, description);
  checks++;
  console.log("PASS " + description);
};
async function signIn(email) {
  const c = newClient();
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error("Synthetic donor sign-in failed: " + error.message);
  return c;
}
async function visibleIds(c) {
  const { data, error } = await c.from("giving_transactions").select("id");
  if (error) throw new Error("Donor Data API read: " + error.message);
  return new Set((data || []).map((r) => r.id));
}
try {
  // Historical hosted donor tables are intentionally absent from the fresh
  // repository baseline. Create a minimum synthetic mirror, not a data copy.
  // Fail rather than modify any table that already exists in this local stack.
  execSql(`
    DO $fixture$
    BEGIN
      IF to_regclass('public.giving_transactions') IS NOT NULL THEN
        RAISE EXCEPTION 'Refusing to overwrite a preexisting giving table';
      END IF;
    END $fixture$;
    CREATE TABLE public.giving_transactions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id),
      contact_email text,
      amount numeric NOT NULL,
      donated_at timestamptz NOT NULL DEFAULT now(),
      status text NOT NULL DEFAULT 'completed'
    );
    ALTER TABLE public.giving_transactions ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON public.giving_transactions FROM public, anon, authenticated;
    GRANT SELECT ON public.giving_transactions TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.giving_transactions TO service_role;
  `);
  fixtureCreated = true;
  // Re-apply the EXACT reviewed donor-identity migration against the mirror.
  // It normally skips only because hosted Giving tables do not exist locally.
  execSql("", { file: join(root, "supabase/migrations/20261105173628_verify_donor_email_before_history_access.sql") });
  execSql("NOTIFY pgrst, 'reload schema';");

  for (const email of emails) {
    const { data, error } = await service.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (error) throw new Error("Local synthetic donor creation: " + error.message);
    userIds.push(data.user.id);
  }
  const [aId] = userIds;
  const [a, b, outsider] = await Promise.all(emails.map((email) => signIn(email)));
  // Wait for PostgREST schema cache to notice this disposable fixture.
  let ready = false;
  for (let i = 0; i < 30; i++) {
    const { error } = await service.from("giving_transactions").select("id").limit(1);
    if (!error) { ready = true; break; }
    if (!["PGRST205", "PGRST204"].includes(error.code)) {
      throw new Error("Unexpected synthetic giving fixture error: " + error.message);
    }
    await delay(250);
  }
  assert.ok(ready, "Disposable PostgREST did not load giving fixture");
  const rows = [
    { user_id: null, contact_email: "  " + emails[0].toUpperCase() + "  ", amount: 12.34 },
    { user_id: aId, contact_email: "different-account@example.test", amount: 23.45 },
    { user_id: null, contact_email: emails[1], amount: 34.56 },
    { user_id: null, contact_email: "unrelated@example.test", amount: 45.67 },
  ];
  const inserted = await service.from("giving_transactions").insert(rows).select("id");
  if (inserted.error) throw new Error("Local synthetic giving setup: " + inserted.error.message);
  assert.equal(inserted.data?.length, 4);
  const [emailClaim, ownerClaim, bClaim, unrelated] = inserted.data.map((r) => r.id);
  const aRows = await visibleIds(a);
  check(aRows.size === 2 && aRows.has(emailClaim) && aRows.has(ownerClaim),
    "verified donor sees matching normalized email and owned transactions");
  const bRows = await visibleIds(b);
  check(bRows.size === 1 && bRows.has(bClaim),
    "other verified donor sees only their own matching record");
  check((await visibleIds(outsider)).size === 0,
    "verified unrelated account cannot read another donor history");
  const anon = await newClient().from("giving_transactions").select("id");
  check(Boolean(anon.error) || anon.data?.length === 0,
    "anonymous account cannot read donor history");
  check(!aRows.has(bClaim) && !aRows.has(unrelated),
    "verified donor cannot claim another contact's donations");

  const updateAttempt = await a.from("giving_transactions")
    .update({ amount: 999 }).eq("id", bClaim).select("id");
  check(Boolean(updateAttempt.error) || updateAttempt.data.length === 0,
    "member cannot modify another donor transaction");

  // Keep the existing signed-in JWT: the policies must consult current auth
  // verification state, not trust stale JWT email or editable user_metadata.
  execSql("UPDATE auth.users SET email_confirmed_at = NULL WHERE id = " + sqlValue(aId) + ";");
  check((await visibleIds(a)).size === 0,
    "unconfirmed existing session loses both email and user-id giving claims");
  execSql("UPDATE auth.users SET email_confirmed_at = now(), email_change = " +
    sqlValue("pending-change@example.test") + " WHERE id = " + sqlValue(aId) + ";");
  check((await visibleIds(a)).size === 0,
    "pending email change prevents donation history account takeover");
  execSql("UPDATE auth.users SET email_change = '', is_anonymous = true WHERE id = " + sqlValue(aId) + ";");
  check((await visibleIds(a)).size === 0,
    "anonymous identity flag prevents claims even with previously verified email");
  execSql("UPDATE auth.users SET is_anonymous = false WHERE id = " + sqlValue(aId) + ";");
  check((await visibleIds(a)).size === 2,
    "verified identity regains only its own giving history");
  console.log("LOCAL GIVING AUTH SMOKE PASS: " + checks + "/" + checks + " checks");
} finally {
  if (fixtureCreated) {
    // Only a table created in this disposable stack can be removed.
    try { execSql("DROP TABLE IF EXISTS public.giving_transactions; NOTIFY pgrst, 'reload schema';"); }
    catch (error) { console.warn("Synthetic giving cleanup: " + error.message); }
  }
  for (const id of userIds) {
    const { error } = await service.auth.admin.deleteUser(id);
    if (error) console.warn("Synthetic donor user cleanup: " + error.message);
  }
}
