import Link from "next/link";
import { marriageSessions } from "@/lib/marriage-journey";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MarriageJourneyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/marriage-journey");
  const { data: progress, error: progressError } = await supabase.from("marriage_journey_progress").select("session_number,completed_at").eq("user_id", user.id);
  const completed = new Set((progress ?? []).filter(row => row.completed_at).map(row => row.session_number));
  const completedCount = completed.size;
  return <main className="lfp-page pb-24">
    <section className="bg-slate-950 text-white"><div className="lfp-shell py-14 sm:py-20">
      <p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">The Lost & Found Project · Marriage Discipleship</p>
      <h1 className="mt-3 text-4xl font-black sm:text-6xl">One Flesh, One Foundation</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">A Christ-centered, 21-day independent discipleship journey through communication, expectations, family, ministry, and healing. Each spouse completes one session privately each day, with a weekly pastoral check-in after days 7, 14, and 21. Adjust the pace when needed.</p>
      <p className="mt-5 text-sm text-amber-200">Your reflections are private to your account. Mentor updates are shared only when you explicitly send them. This feature is in development; do not enter sensitive information until launch approval.</p>
    </div></section>
    <div className="lfp-shell py-10 space-y-10">
      <nav className="flex flex-wrap gap-4"><Link href="/marriage-journey/sharing" className="rounded-xl border px-5 py-3 font-black text-indigo-700">Manage mentor sharing</Link><Link href="/marriage-journey/mentor" className="rounded-xl border px-5 py-3 font-black text-indigo-700">Mentor check-ins</Link></nav>
      <section aria-label="Your journey progress" className="lfp-card p-6 sm:p-8">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-indigo-700">Your journey</p><h2 className="mt-2 text-2xl font-black">{completedCount} of 21 sessions completed</h2></div><p className="text-2xl font-black text-slate-900">{Math.round(completedCount / 21 * 100)}%</p></div>
        <div role="progressbar" aria-label="Sessions completed" aria-valuemin={0} aria-valuemax={21} aria-valuenow={completedCount} className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-700" style={{width: `${completedCount / 21 * 100}%`}}/></div>
        <p className="mt-3 text-sm text-slate-600">Your progress belongs to your account. Meet with your ministry mentor after sessions 7, 14, and 21. Your daily workbook remains private.</p>
      </section>{progressError && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 font-bold text-amber-900">Progress is unavailable until the private workbook database is set up. Do not enter personal information yet.</p>}{[0,1,2].map(week => <section key={week}>
      <h2 className="text-2xl font-black text-slate-900">Week {week+1} · {['Learning to Hear and Understand','Marriage, Ministry, and Expectations','Healing, Trust, and Lasting Habits'][week]}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{marriageSessions.slice(week*7,week*7+7).map(({title,scripture},index)=><article key={title} className="lfp-card p-6">
        <p className="text-xs font-black uppercase tracking-widest text-indigo-700">Session {week*7+index+1}</p>
        <h3 className="mt-2 text-xl font-black">{title}</h3><p className="mt-2 text-sm text-slate-600">Read: {scripture}</p>
        <p className="mt-4 text-sm font-bold text-slate-600">{completed.has(week*7+index+1) ? "Completed" : "Not yet completed"}</p>
        <Link href={`/marriage-journey/${week*7+index+1}`} className="mt-4 inline-block font-black text-indigo-700">Open session →</Link>
      </article>)}</div>
    </section>)}
      <p className="text-sm text-slate-600">This discipleship journey does not replace professional trauma-informed counseling or emergency support.</p>
      <Link href="/studies" className="font-bold text-indigo-700">Return to Bible Studies</Link>
    </div>
  </main>;
}
