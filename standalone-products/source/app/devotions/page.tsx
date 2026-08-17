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

  const currentWeek = weeksWithAudio[0];
  const currentTitle = currentWeek?.title || "A fresh week in God's Word";
  const availableDays = currentWeek?.days.length ?? 0;

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(124,58,237,0.32),transparent_32rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Daily Devotions</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Begin with Scripture. Carry truth into the rest of your day.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Each seven-day journey combines Scripture, practical teaching, reflection, and prayer. Move through the current week in order or return to a previous devotion whenever you need it.</p>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            <DevotionStat label="Current journey" value={currentTitle} />
            <DevotionStat label="Days available" value={String(availableDays)} />
            <DevotionStat label="Published weeks" value={String(weeksWithAudio.length)} />
          </div>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section className="grid gap-5 md:grid-cols-3">
          <DevotionValue icon="📖" title="Read" text="Begin with the biblical text and let the teaching remain anchored to what Scripture actually says." />
          <DevotionValue icon="🧭" title="Reflect" text="Use the daily question and relatable teaching to connect truth with real life." />
          <DevotionValue icon="🙏" title="Respond" text="Close with prayer and one clear point of obedience, trust, or surrender." />
        </section>

        <section className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/92 p-5 shadow-2xl sm:p-8">
          <div className="mb-8 max-w-3xl">
            <p className="lfp-eyebrow">Devotional library</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Choose where to begin</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">The newest published week appears first. Audio remains available wherever a current narration has been generated.</p>
          </div>
          <DevotionsClient weeks={weeksWithAudio} />
        </section>
      </div>
    </main>
  );
}

function DevotionStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur"><p className="line-clamp-2 text-xl font-black">{value}</p><p className="mt-2 text-sm text-indigo-100/60">{label}</p></div>;
}

function DevotionValue({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <article className="lfp-card p-6"><span className="text-3xl" aria-hidden="true">{icon}</span><h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2><p className="mt-3 leading-7 text-slate-600">{text}</p></article>;
}
