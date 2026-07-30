import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminDevotionsClient from "@/components/AdminDevotionsClient";
import { getEffectiveRole } from "@/lib/effective-role";
import { getDevotionContentVersion } from "@/lib/devotion-content-version";
import type { DevotionAudio, DevotionDay } from "@/lib/devotion-types";

export default async function AdminDevotionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, preview_role")
    .eq("id", user.id)
    .single();

  const effectiveRole = getEffectiveRole(profile?.role, profile?.preview_role);

  // Same admin-only restriction as Bible Trivia management -- reviewing and
  // approving devotion content before it goes live is Chad's call.
  if (effectiveRole !== "admin") {
    redirect("/dashboard");
  }

  const { data: weeks } = await supabase
    .from("devotion_weeks")
    .select(
      "id, week_number, title, days, status, source, published_at, reviewed_at, created_at"
    )
    .order("week_number");

  const admin = createAdminClient();
  const { data: audio, error: audioError } = await admin
    .from("devotion_audio")
    .select(
      "id, devotion_week_id, day_number, audio_url, storage_path, audio_duration_seconds, voice, narration_text, content_version, audio_version, generated_at, generation_status, updated_at"
    );

  if (audioError) {
    console.error("admin devotion audio load error:", audioError);
  }

  const weeksWithAudio = (weeks ?? []).map((week) => ({
    ...week,
    content_versions: Object.fromEntries(
      (week.days as DevotionDay[]).map((day) => [
        day.day,
        getDevotionContentVersion(day),
      ])
    ),
    audio: ((audio ?? []) as DevotionAudio[]).filter(
      (item) => item.devotion_week_id === week.id
    ),
  }));

  return <AdminDevotionsClient weeks={weeksWithAudio} />;
}
