import { createClient } from "@/lib/supabase/server";
import DevotionsClient from "@/components/DevotionsClient";
import { getDevotionContentVersion } from "@/lib/devotion-content-version";
import type { DevotionAudio, DevotionWeek } from "@/lib/devotion-types";

export default async function DevotionsPage() {
  const supabase = await createClient();

  const { data: weeks } = await supabase
    .from("devotion_weeks")
    .select("id, week_number, title, days, published_at")
    .eq("status", "published")
    .order("week_number", { ascending: false });

  const publishedWeeks = (weeks ?? []) as DevotionWeek[];
  let audioRows: DevotionAudio[] = [];

  if (publishedWeeks.length > 0) {
    const { data: audio, error: audioError } = await supabase
      .from("devotion_audio")
      .select(
        "id, devotion_week_id, day_number, audio_url, storage_path, audio_duration_seconds, voice, narration_text, content_version, audio_version, generated_at, generation_status, updated_at"
      )
      .in(
        "devotion_week_id",
        publishedWeeks.map((week) => week.id)
      )
      .eq("generation_status", "ready");

    if (audioError) {
      console.error("devotion audio load error:", audioError);
    } else {
      audioRows = (audio ?? []) as DevotionAudio[];
    }
  }

  const weeksWithAudio = publishedWeeks.map((week) => ({
    ...week,
    audio: audioRows.filter((audio) => {
      if (audio.devotion_week_id !== week.id) return false;
      const day = week.days.find((item) => item.day === audio.day_number);
      return day ? audio.content_version === getDevotionContentVersion(day) : false;
    }),
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Daily Devotions</h1>
      <p className="mt-2 text-gray-600">
        Start your day rooted in God&rsquo;s Word, encouraged by truth, and
        reminded that you are never too far gone for God&rsquo;s grace. A new
        week publishes every week -- work through the current one below in
        any order, or revisit a past week further down.
      </p>

      <DevotionsClient weeks={weeksWithAudio} />
    </div>
  );
}
