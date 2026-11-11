import Link from "next/link";
import { marriageSessions } from "@/lib/marriage-journey";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function MarriageJourneyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/marriage-journey");
  const { data: progress } = await supabase.from("marriage_journey_progress").select("session_number,completed_at").eq("user_id", user.id);
  const completed = new Set((progress ?? []).filter(row => row.completed_at).map(row => row.session_number));
  return <main className="lfp-page pb-24">
    <section className="bg-slate-950 text-white"><div className="lfp-shell py-14 sm:py-20">
      <p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">The Lost & Found Project · Marriage Discipleship</p>
      <h1 className="mt-3 text-4xl font-black sm:text-6xl">One Flesh, One Foundation</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">A Christ-centered, 21-session journey through communication, expectations, family, ministry, and healing. Progress at your own pace.</p>
      <p className="mt-5 text-sm text-amber-200">Your private reflections are yours. Do not enter sensitive information until private journaling and sharing controls are available.</p>
    </div></section>
    <div className="lfp-shell py-10 space-y-10">{[0,1,2].map(week => <section key={week}>
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
