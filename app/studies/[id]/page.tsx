import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StudyViewer from "@/components/StudyViewer";
import { ministryPortals } from "@/lib/ministry-hub";

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) redirect(`/login?next=/studies/${id}`);

  const { data: study } = await s
    .from("bible_studies")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();
  if (!study) notFound();

  const graceWindow = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const { data: liveSessions } = await s
    .from("study_sessions")
    .select("scheduled_start,scheduled_end,status,google_meeting_uri")
    .eq("bible_study_id", id)
    .in("status", ["scheduled", "live"])
    .not("google_meeting_uri", "is", null)
    .gte("scheduled_start", graceWindow)
    .order("scheduled_start", { ascending: true })
    .limit(5);

  const liveSession = liveSessions?.[0] || null;
  const meetingUrl = liveSession?.google_meeting_uri || study.meeting_url;
  const ministry = ministryPortals.find((m) => m.slug === study.ministry_slug);
  const slides = Array.isArray(study.slides) ? study.slides : [];
  const devotionals = Array.isArray(study.devotional_cards) ? study.devotional_cards : [];

  return (
    <main className="lfp-page pb-24">
      <div className="lfp-shell py-8">
        <Link href="/studies" className="text-sm font-black text-indigo-700">← Bible Studies</Link>
        <div className="mt-6">
          <p className="lfp-eyebrow">{ministry?.title || "L&F Bible Study"}</p>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">{study.title}</h1>
          {study.subtitle && <p className="mt-2 text-xl font-bold text-slate-500">{study.subtitle}</p>}
          {study.description && <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-600">{study.description}</p>}
          {study.scripture_refs?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {study.scripture_refs.map((r: string) => (
                <span key={r} className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-black text-indigo-700">{r}</span>
              ))}
            </div>
          )}
          {liveSession && (
            <div className="mt-6 max-w-3xl rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-700">Upcoming live study</p>
              <p className="mt-1 font-bold text-slate-700">
                {new Date(liveSession.scheduled_start).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "America/New_York",
                })} ET
              </p>
              <p className="mt-1 text-sm text-slate-600">The Join Live Study button below opens the L&F Google Meet room.</p>
            </div>
          )}
        </div>
        <div className="mt-8">
          <StudyViewer slides={slides} meetingUrl={meetingUrl} downloadUrl={study.downloadable_url} />
        </div>
        {devotionals.length > 0 && (
          <section className="mt-12">
            <p className="lfp-eyebrow">Continue Through the Week</p>
            <h2 className="mt-2 text-3xl font-black">7-Day Devotional Cards</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {devotionals.map((d: any, i: number) => (
                <article key={i} className="lfp-card p-6">
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-700">Day {i + 1}</p>
                  <h3 className="mt-2 text-xl font-black">{d.title || `Day ${i + 1}`}</h3>
                  {d.scripture && <p className="mt-2 font-black text-indigo-700">{d.scripture}</p>}
                  {d.teaching && <p className="mt-3 leading-7 text-slate-600">{d.teaching}</p>}
                  {d.story && <p className="mt-3 text-sm leading-6 text-slate-500">{d.story}</p>}
                  {d.prompt && <p className="mt-4 border-t pt-4 font-bold">{d.prompt}</p>}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
