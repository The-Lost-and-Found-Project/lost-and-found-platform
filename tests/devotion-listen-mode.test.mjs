import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("public devotions attach only ready audio for the exact content version", async () => {
  const page = await source("app/devotions/page.tsx");

  assert.match(page, /\.from\("devotion_audio"\)/);
  assert.match(page, /\.eq\("generation_status", "ready"\)/);
  assert.match(
    page,
    /audio\.content_version === getDevotionContentVersion\(day\)/
  );
  assert.match(page, /console\.error\("devotion audio load error:"/);
  assert.match(page, /<DevotionsClient weeks=\{weeksWithAudio\}/);
});

test("the Listen player preserves reading access and playback position", async () => {
  const player = await source("components/DevotionAudioPlayer.tsx");

  assert.match(player, /Audio for this devotion isn&rsquo;t available yet/);
  assert.match(player, /written devotion remains available below/);
  assert.match(player, /controls/);
  assert.match(player, /preload="metadata"/);
  assert.match(player, /localStorage\.setItem\(positionKey/);
  assert.match(player, /localStorage\.removeItem\(positionKey\)/);
  assert.match(player, /Restart\s*<\/button>/);
  assert.match(player, /Playback speed/);
  assert.match(player, /aria-label=\{`Audio devotion: \$\{devotionTitle\}`\}/);
});

test("admin audio writes are authorized, validated, and server-side", async () => {
  const route = await source("app/api/admin/devotions/audio/route.ts");

  assert.match(route, /callerProfile\?\.role !== "admin"/);
  assert.match(route, /MAX_AUDIO_BYTES = 50 \* 1024 \* 1024/);
  assert.match(route, /AUDIO_EXTENSIONS\[file\.type\]/);
  assert.match(route, /getDevotionContentVersion\(day\)/);
  assert.match(route, /\.storage\s*\.from\(AUDIO_BUCKET\)\s*\.upload/);
  assert.match(route, /upsert: false/);
  assert.match(route, /createAdminClient\(\)/);
  assert.doesNotMatch(route, /NEXT_PUBLIC_[A-Z_]*SERVICE/);
});

test("the migration provides versioned metadata, RLS, and a constrained bucket", async () => {
  const migration = await source(
    "supabase/migrations/20260730153407_devotion_listen_mode.sql"
  );

  for (const field of [
    "audio_url",
    "audio_duration_seconds",
    "voice",
    "content_version",
    "audio_version",
    "generated_at",
    "generation_status",
    "narration_text",
  ]) {
    assert.match(migration, new RegExp(`\\b${field}\\b`));
  }

  assert.match(migration, /alter table public\.devotion_audio enable row level security/);
  assert.match(migration, /to anon, authenticated/);
  assert.match(migration, /weeks\.status = 'published'/);
  assert.match(migration, /grant select on table public\.devotion_audio/);
  assert.match(migration, /'devotion-audio'/);
  assert.match(migration, /52428800/);
  assert.match(migration, /'audio\/mpeg'/);
  assert.doesNotMatch(migration, /grant (insert|update|delete).*devotion_audio.*anon/i);
});

test("narration text uses spoken transitions instead of raw field concatenation", async () => {
  const narration = await source("lib/devotion-narration.ts");

  assert.match(narration, /Today's Scripture is/);
  assert.match(narration, /Teaching point\./);
  assert.match(narration, /Questions for reflection\./);
  assert.match(narration, /Let us pray\./);
});
