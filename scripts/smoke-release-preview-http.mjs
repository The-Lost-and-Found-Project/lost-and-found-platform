import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as pause } from "node:timers/promises";

// After `next build`, exercise real Next.js routing with synthetic env only.
// The release Preview must return 503 before any auth or API handler runs.
const port = 39876;
const origin = "http://127.0.0.1:" + port;
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
  env: {
    ...process.env,
    VERCEL_ENV: "preview",
    LFP_RELEASE_PREVIEW_ISOLATED: "false",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "ci-public-placeholder",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "ci-public-placeholder",
    SUPABASE_SERVICE_ROLE_KEY: "ci-server-placeholder",
    RESEND_API_KEY: "",
    DAILY_API_KEY: "",
    ZEFFY_API_KEY: "",
    VAPID_PRIVATE_KEY: "",
    INTERNAL_API_SECRET: "",
    CRON_SECRET: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
for (const stream of [child.stdout, child.stderr]) {
  stream.setEncoding("utf8");
  stream.on("data", (data) => { output = (output + data).slice(-3000); });
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(origin + "/", { redirect: "manual", signal: AbortSignal.timeout(1500) });
      await response.body?.cancel();
      ready = true;
      break;
    } catch {
      await pause(250);
    }
  }
  assert.ok(ready, "local Next.js server did not start: " + output);
  for (const path of ["/", "/login", "/account", "/admin", "/api/cron/push-delivery", "/api/integrations/zeffy/webhook"]) {
    const response = await fetch(origin + path, { redirect: "manual", signal: AbortSignal.timeout(3000) });
    assert.equal(response.status, 503, path + " must be blocked before any page or API handler runs");
    assert.match(await response.text(), /Release preview disabled until isolated staging is verified/);
    assert.match(response.headers.get("cache-control") || "", /no-store/);
    assert.equal(response.headers.get("x-robots-tag"), "noindex");
  }
  console.log("PASS: release Preview blocks six real HTTP page/API routes (503, no-store, noindex)");
} finally {
  child.kill("SIGTERM");
  await pause(400);
  if (child.exitCode === null) child.kill("SIGKILL");
}
