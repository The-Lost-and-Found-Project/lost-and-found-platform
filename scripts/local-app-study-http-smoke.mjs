// Synthetic full-stack HTTP smoke: Next.js page + real local Supabase Auth/RLS.
// Strict localhost guards; never inspect or write to hosted ministry systems.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as pause } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const proc = spawnSync("supabase", ["status", "-o", "env"], {
  cwd: root, encoding: "utf8", timeout: 15_000,
});
if (proc.status !== 0) throw new Error("Disposable local Supabase must be running.");
const env = Object.fromEntries(proc.stdout.split(/\r?\n/).filter((s) => /^[A-Z_]+=/.test(s)).map((s) => {
  const i = s.indexOf("=");
  return [s.slice(0, i), s.slice(i + 1).replace(/^["']|["']$/g, "")];
}));
const api = new URL(env.API_URL || "");
const db = new URL(env.DB_URL || "");
if (api.protocol !== "http:" || !["localhost","127.0.0.1"].includes(api.hostname)
  || api.port !== "54321" || api.pathname !== "/"
  || !["postgres:","postgresql:"].includes(db.protocol)
  || !["localhost","127.0.0.1"].includes(db.hostname)
  || db.port !== "54322" || db.pathname !== "/postgres") {
  throw new Error("Refusing a non-disposable Supabase backend.");
}
assert.ok(env.ANON_KEY && env.SERVICE_ROLE_KEY, "Missing disposable Supabase credentials");
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(env.API_URL, env.SERVICE_ROLE_KEY, options);
const pass = "LocalHttp-" + randomUUID() + "!9";
const nonce = randomUUID().slice(0, 10);
const ownerEmail = "lfp-http-" + nonce + "-member@example.test";
const outsiderEmail = "lfp-http-" + nonce + "-outsider@example.test";
const ids = [], sessions = [], studies = [];
let server;
let logs = "";
let assertions = 0;
function check(value, msg) {
  assert.ok(value, msg);
  assertions++;
  console.log("PASS " + msg);
}
function execSql(sql) {
  const x = spawnSync("psql", ["-X","-q","-v","ON_ERROR_STOP=1","-d",env.DB_URL], {
    input: sql, encoding: "utf8", timeout: 15_000,
  });
  if (x.status !== 0) throw new Error("Local fixture SQL failed: " + (x.stderr || "").slice(-1000));
}
async function insertOne(table, payload) {
  const { data, error } = await service.from(table).insert(payload).select("id").single();
  if (error) throw new Error("Local " + table + " fixture failed: " + error.message);
  return data.id;
}
async function loginCookie(email) {
  const jar = new Map();
  const ssr = createServerClient(env.API_URL, env.ANON_KEY, {
    cookies: {
      getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
      setAll: (items) => items.forEach(({ name, value }) => jar.set(name, value)),
    },
  });
  const { error } = await ssr.auth.signInWithPassword({ email, password: pass });
  if (error) throw new Error("Local synthetic SSR login failed: " + error.message);
  check(jar.size > 0, "SSR authentication issued a local session cookie");
  return Array.from(jar, ([name, value]) =>
    encodeURIComponent(name) + "=" + encodeURIComponent(value)).join("; ");
}
const origin = "http://127.0.0.1:39877";
async function request(path, cookie = "") {
  const response = await fetch(origin + path, {
    redirect: "manual", headers: cookie ? { Cookie: cookie } : {},
    signal: AbortSignal.timeout(20_000),
  });
  return { status: response.status, location: response.headers.get("location") || "",
    text: await response.text() };
}
function redirectsTo(response, target) {
  const ordinary = [302, 303, 307, 308].includes(response.status)
    && response.location.includes(target);
  // Next.js can stream the initial HTML shell (200) before a Server Component
  // triggers redirect(). It then emits a refresh redirect in the HTML head.
  const streamed = response.status === 200
    && response.text.includes('id="__next-page-redirect"')
    && response.text.includes("url=" + target);
  return ordinary || streamed;
}
async function awaitServer() {
  for (let n = 0; n < 120; n++) {
    if (server.exitCode !== null) break;
    try {
      const r = await fetch(origin + "/", { redirect: "manual", signal: AbortSignal.timeout(2_000) });
      await r.body?.cancel();
      return;
    } catch { await pause(350); }
  }
  throw new Error("Local Next.js server did not start: " + logs.slice(-1600));
}
try {
  for (const email of [ownerEmail, outsiderEmail]) {
    const { data, error } = await service.auth.admin.createUser({
      email, password: pass, email_confirm: true,
    });
    if (error) throw new Error("Local synthetic Auth setup: " + error.message);
    ids.push(data.user.id);
  }
  execSql(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
    public.bible_studies, public.study_sessions, public.study_session_participants
    TO service_role;`);
  const studyId = await insertOne("bible_studies", {
    title: "Synthetic HTTP study", is_published: true,
    devotional_cards: [
      { day: 1, title: "Synthetic Day One", scripture: "John 1:1", teaching: "Synthetic first teaching" },
      { day: 2, title: "Synthetic Day Two", scripture: "John 1:2", teaching: "Synthetic second teaching" },
    ],
  });
  studies.push(studyId);
  const sessionId = await insertOne("study_sessions", {
    bible_study_id: studyId, ministry_slug: "hearth",
    scheduled_start: new Date().toISOString(),
    daily_path_released_at: new Date(Date.now() + 86_400_000).toISOString(),
  });
  sessions.push(sessionId);
  const { error: participantError } = await service.from("study_session_participants")
    .insert({ study_session_id: sessionId, user_id: ids[0] });
  if (participantError) throw new Error("Local participant fixture: " + participantError.message);
  const ownerCookie = await loginCookie(ownerEmail);
  const outsiderCookie = await loginCookie(outsiderEmail);
  // Refuse to attach to an unrelated process already using the test port.
  try {
    const existing = await fetch(origin + "/", { signal: AbortSignal.timeout(750) });
    await existing.body?.cancel();
    throw new Error("Local HTTP test port is already occupied");
  } catch (error) {
    if (error instanceof Error && error.message === "Local HTTP test port is already occupied") throw error;
  }
  server = spawn(process.execPath, [
    "node_modules/next/dist/bin/next", "dev", "-p", "39877", "-H", "127.0.0.1"
  ], {
    cwd: root, env: {
      ...process.env, VERCEL_ENV: "development",
      NEXT_PUBLIC_SUPABASE_URL: env.API_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: env.ANON_KEY,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env.ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: env.SERVICE_ROLE_KEY,
      RESEND_API_KEY: "", DAILY_API_KEY: "", DAILY_DOMAIN: "", ZEFFY_API_KEY: "",
      OPENAI_API_KEY: "", TURNSTILE_SECRET_KEY: "", VAPID_PRIVATE_KEY: "",
      CRON_SECRET: "", INTERNAL_API_SECRET: "",
    },
    stdio: ["ignore","pipe","pipe"],
  });
  for (const stream of [server.stdout,server.stderr]) {
    stream.setEncoding("utf8");
    stream.on("data", (s) => { logs = (logs + s).slice(-3000); });
  }
  await awaitServer();
  const path = "/study-path/" + sessionId;
  const anon = await request(path + "/1");
  check(redirectsTo(anon, "/login") && !anon.text.includes("Synthetic first teaching"),
    "unsigned visitor is redirected before accessing devotional content");
  const future = await request(path + "/1", ownerCookie);
  check(redirectsTo(future, "/dashboard") && !future.text.includes("Synthetic first teaching"),
    "assigned member cannot render Day 1 before future release timestamp");
  const { error: releaseError } = await service.from("study_sessions")
    .update({ daily_path_released_at: new Date(Date.now() - 3_600_000).toISOString() })
    .eq("id", sessionId);
  if (releaseError) throw new Error("Local release setup: " + releaseError.message);
  const day1 = await request(path + "/1", ownerCookie);
  check(day1.status === 200 && day1.text.includes("Synthetic first teaching"),
    "signed-in participant sees Day 1 after it is released");
  const denied = await request(path + "/1", outsiderCookie);
  check((denied.status === 404 ||
    (denied.status === 200 && denied.text.includes("NEXT_HTTP_ERROR_FALLBACK;404")
      && denied.text.includes("noindex")))
    && !denied.text.includes("Synthetic first teaching"),
    "unassigned member cannot view another group's devotional page");
  const futureDay2 = await request(path + "/2", ownerCookie);
  check(redirectsTo(futureDay2, path + "/1")
    && !futureDay2.text.includes("Synthetic second teaching"),
    "later devotional day stays hidden until its 24-hour unlock boundary");
  const { error: day2Error } = await service.from("study_sessions")
    .update({ daily_path_released_at: new Date(Date.now() - 90_000_000).toISOString() })
    .eq("id", sessionId);
  if (day2Error) throw new Error("Local Day 2 setup: " + day2Error.message);
  const day2 = await request(path + "/2", ownerCookie);
  check(day2.status === 200 && day2.text.includes("Synthetic second teaching"),
    "Day 2 becomes visible after the 24-hour release boundary");
  console.log("LOCAL APP STUDY HTTP PASS: " + assertions + "/" + assertions + " checks");
} finally {
  if (server) {
    server.kill("SIGTERM");
    await pause(400);
    if (server.exitCode === null) server.kill("SIGKILL");
  }
  for (const id of sessions.reverse()) {
    const { error } = await service.from("study_sessions").delete().eq("id", id);
    if (error) console.warn("Local session cleanup: " + error.message);
  }
  for (const id of studies) {
    const { error } = await service.from("bible_studies").delete().eq("id", id);
    if (error) console.warn("Local study cleanup: " + error.message);
  }
  for (const id of ids) {
    const { error } = await service.auth.admin.deleteUser(id);
    if (error) console.warn("Local user cleanup: " + error.message);
  }
}
