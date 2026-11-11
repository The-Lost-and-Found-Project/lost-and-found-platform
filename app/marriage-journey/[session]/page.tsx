import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveMarriageSession } from "./actions";
import { marriageSessions, marriageMilestones } from "@/lib/marriage-journey";
import { marriageGuidance } from "@/lib/marriage-journey-guidance";

export default async function MarriageSessionPage({ params, searchParams }: { params: Promise<{ session: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { session: slug } = await params;
  const number = Number(slug);
  if (!Number.isInteger(number) || number < 1 || number > 21) notFound();
  const item = marriageSessions[number - 1];
  const milestone = marriageMilestones[number];
  const [context, application, reflection] = marriageGuidance[number - 1];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/marriage-journey/${number}`);
  const { data: progress, error: progressError } = await supabase.from("marriage_journey_progress")
    .select("private_reflection,shared_commitment,completed_at")
    .eq("user_id", user.id).eq("session_number", number).maybeSingle();
  const { saved } = await searchParams;
  return <main className="lfp-page pb-24"><div className="lfp-shell max-w-4xl py-10">
    <Link href="/marriage-journey" className="font-bold text-indigo-700">← All sessions</Link>
    <p className="mt-8 text-xs font-black uppercase tracking-widest text-indigo-700">Session {number} of 21 · {item.week}</p>
    <h1 className="mt-3 text-4xl font-black text-slate-900">{item.title}</h1>
    <p className="mt-4 text-lg text-slate-600">Your Scripture reading: {item.scripture}</p>
    <section className="lfp-card mt-8 p-6 sm:p-8"><h2 className="text-xl font-black">Today's focus</h2>
      <p className="mt-3 leading-8 text-slate-700">{item.teaching}</p>
      <h3 className="mt-6 font-black">Understanding the passage</h3><p className="mt-2 leading-8 text-slate-700">{context}</p>
      <h3 className="mt-6 font-black">Bring it home</h3><p className="mt-2 leading-7">{application}</p>
      <h3 className="mt-6 font-black">Heart question</h3><p className="mt-2 leading-7">{reflection}</p>
      <h3 className="mt-6 font-black">Consider privately</h3><p className="mt-2 leading-7">{item.discussion}</p>
      <h3 className="mt-6 font-black">Personal practice</h3><p className="mt-2 leading-7">{item.practice}</p>
      <p className="mt-5 text-sm text-slate-600">Complete this session independently. When an exercise involves your spouse, use it naturally and only when both people are willing and feel safe. You do not need to compare workbook answers or hold a daily study meeting.</p>
    </section>
    {milestone && <section className="lfp-card mt-6 border-amber-200 bg-amber-50/40 p-6 sm:p-8">
      <p className="text-xs font-black uppercase tracking-widest text-amber-800">End-of-week checkpoint</p>
      <h2 className="mt-2 text-2xl font-black text-slate-900">{milestone.title}</h2>
      <p className="mt-2 text-sm text-slate-600">Prepare privately for your weekly meeting with your ministry mentor. You decide what to share; private workbook answers and trauma disclosures are never required.</p>
      <ol className="mt-5 list-decimal space-y-3 pl-6 text-slate-800">{milestone.questions.map(question => <li key={question}>{question}</li>)}</ol>
      <p className="mt-5 font-bold text-slate-900">Practice: <span className="font-normal">{milestone.practice}</span></p>
    </section>}
    <form action={saveMarriageSession} className="lfp-card mt-6 space-y-6 p-6 sm:p-8">
      <input type="hidden" name="session" value={number}/>
      <h2 className="text-xl font-black">Your personal workbook</h2>
      {progressError && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">Private saving is unavailable. Your responses cannot be stored until the database is ready.</p>}
      <p className="text-sm text-slate-600">Your private reflection is visible only to your account. Your practical commitment stays private unless you explicitly choose to share a session update with a verified mentor and enable commitment sharing. Nothing is sent automatically.</p>
      <label className="block font-bold" htmlFor="privateReflection">Private reflection</label>
      <textarea id="privateReflection" name="privateReflection" maxLength={10000} rows={7} defaultValue={progress?.private_reflection ?? ""} className="w-full rounded-xl border border-slate-300 p-4" placeholder="What is God showing me about my own heart and actions?"/>
      <label className="block font-bold" htmlFor="sharedCommitment">A practical commitment</label>
      <textarea id="sharedCommitment" name="sharedCommitment" maxLength={3000} rows={3} defaultValue={progress?.shared_commitment ?? ""} className="w-full rounded-xl border border-slate-300 p-4" placeholder="One specific change I will practice..."/>
      <label className="flex items-center gap-3 font-bold"><input type="checkbox" name="completed" defaultChecked={Boolean(progress?.completed_at)} className="h-5 w-5"/>Mark this session complete</label>
      {saved === "1" && <p role="status" className="font-bold text-emerald-700">Your responses were saved.</p>}
      <button type="submit" disabled={Boolean(progressError)} className="rounded-xl bg-slate-950 px-6 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40">Save my responses</button>
    </form>
    <nav className="mt-8 flex justify-between font-bold text-indigo-700">{number > 1 ? <Link href={`/marriage-journey/${number-1}`}>← Previous</Link> : <span/>}{number < 21 && <Link href={`/marriage-journey/${number+1}`}>Next →</Link>}</nav>
  </div></main>;
}
