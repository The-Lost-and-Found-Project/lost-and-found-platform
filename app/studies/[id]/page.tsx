import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StudyViewer from "@/components/StudyViewer";
import { ministryPortals } from "@/lib/ministry-hub";

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await createClient();
  const { data: { user } } = await s.auth.getUser();
  if (!user) redirect(`/login?next=/studies/${id}`);

  const [{ data: study }, { data: assignments }] = await Promise.all([
    s.from("bible_studies").select("*").eq("id", id).eq("is_published", true).maybeSingle(),
    s.from("study_session_participants")
      .select("study_session_id,study_sessions(id,bible_study_id,scheduled_start,scheduled_end,status,daily_path_released_at,ministry_slug)")
      .eq("user_id", user.id),
  ]);
  if (!study) notFound();

  const graceFloor = Date.now() - 4 * 60 * 60 * 1000;
  const assignedSessions = (assignments ?? [])
    .map((row: any) => Array.isArray(row.study_sessions) ? row.study_sessions[0] : row.study_sessions)
    .filter((session: any) =>
      session &&
      session.bible_study_id === id &&
      ["scheduled", "live"].includes(session.status) &&
      new Date(session.scheduled_start).getTime() >= graceFloor
    )
    .sort((a: any, b: any) => +new Date(a.scheduled_start) - +new Date(b.scheduled_start));
  const liveSession = assignedSessions[0] || null;

  const ministry = ministryPortals.find((m) => m.slug === study.ministry_slug);
  const slides = Array.isArray(study.slides)
    ? study.slides.map((slide: any) => ({
        title: slide?.title,
        body: slide?.body,
        scripture: slide?.scripture,
        discussion: slide?.discussion,
        journal: slide?.journal,
      }))
    : [];
  const hasDailyPath = Boolean(liveSession?.daily_path_released_at);

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
            <div className="mt-6 max-w-3xl rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-700">{liveSession.status === "live" ? "Live now" : "Your assigned gathering"}</p>
              <p className="mt-1 font-bold text-slate-700">
                {new Date(liveSession.scheduled_start).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "America/New_York",
                })} ET
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Live access belongs to your assigned session, not to the reusable study itself.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/live/${liveSession.id}`} className="lfp-button bg-indigo-700 text-white">{liveSession.status === "live" ? "Join L&F Live" : "Open Gathering"}</Link>
                <Link href="/events" className="lfp-button border bg-white text-slate-950">RSVP & details</Link>
                {hasDailyPath && <Link href={`/study-path/${liveSession.id}/1`} className="lfp-button border border-violet-200 bg-violet-50 text-violet-800">Open Daily Path</Link>}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          <StudyViewer slides={slides} downloadUrl={study.downloadable_url} />
        </div>

        {Array.isArray(study.devotional_cards) && study.devotional_cards.length > 0 && (
          <section className="mt-12 rounded-[1.8rem] border border-violet-100 bg-violet-50/60 p-6 sm:p-8">
            <p className="lfp-eyebrow">Daily Path</p>
            <h2 className="mt-2 text-3xl font-black">The follow-up journey is released from your gathering.</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">These devotional days stay connected to the live study experience. When your facilitator releases Daily Path, each day unlocks through My Path instead of exposing the entire week at once.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {hasDailyPath ? <Link href={`/study-path/${liveSession.id}/1`} className="lfp-button bg-violet-700 text-white">Open Daily Path</Link> : <Link href="/dashboard" className="lfp-button border bg-white text-slate-950">Return to My Path</Link>}
              <Link href="/events" className="lfp-button border bg-white text-slate-950">View Gatherings</Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
