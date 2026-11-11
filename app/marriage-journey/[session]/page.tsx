import { requireMarriageAssignment } from "@/lib/marriage-assignment";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveMarriageSession } from "./actions";
import { marriageSessions, marriageMilestones } from "@/lib/marriage-journey";
import { marriageCoupleRhythm, marriageWeeklyRhythm } from "@/lib/marriage-couple-rhythm";
import { marriageDailyExercises } from "@/lib/marriage-daily-exercises";
import { marriagePastoralSafetyNote } from "@/lib/marriage-editorial-notes";
import { marriageWeeklyMeetings, marriageMeetingPrivacy } from "@/lib/marriage-weekly-meetings";
import { marriageDeepLessons } from "@/lib/marriage-deep-lessons";

export default async function MarriageSessionPage({ params, searchParams }: { params: Promise<{ session: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { session: slug } = await params;
  const number = Number(slug);
  if (!Number.isInteger(number) || number < 1 || number > 21) notFound();
  const item = marriageSessions[number - 1];
  const milestone = marriageMilestones[number];
  const deepLesson = marriageDeepLessons[number];
  const { supabase, user } = await requireMarriageAssignment(`/marriage-journey/${number}`);
  const { data: progress, error: progressError } = await supabase.from("marriage_journey_progress")
    .select("private_reflection,shared_commitment,completed_at")
    .eq("user_id", user.id).eq("session_number", number).maybeSingle();
  const { saved } = await searchParams;
  return <main className="lfp-page pb-24"><div className="lfp-shell max-w-4xl py-10">
    <Link href="/marriage-journey" className="font-bold text-indigo-700">← All sessions</Link>
    <p className="mt-8 text-xs font-black uppercase tracking-widest text-indigo-700">Session {number} of 21 · {item.week}</p>
    <h1 className="mt-3 text-4xl font-black text-slate-900">{item.title}</h1>
    <p className="mt-4 text-lg text-slate-600">Read Scripture together: {item.scripture}</p>
    <section className="lfp-card mt-8 p-6 sm:p-8" aria-label="Our daily rhythm">
      <h2 className="text-xl font-black">Your time together today</h2>
      <p className="mt-2 text-sm text-slate-600">Work through these five steps together at a comfortable pace. Both spouses should participate willingly.</p>
      <ol className="mt-5 space-y-4">{marriageCoupleRhythm.map((step, index) => <li key={step.title} className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-black text-indigo-800">{index + 1}</span><div><h3 className="font-bold">{step.title}</h3><p className="mt-1 text-sm leading-6 text-slate-700">{step.detail}</p></div></li>)}</ol>
      <p className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">{marriageWeeklyRhythm}</p>
    </section>
    <section className="lfp-card mt-6 p-6 sm:p-8"><h2 className="text-xl font-black">Today's focus</h2>
      {deepLesson && <section className="mt-8 border-t border-slate-200 pt-6" aria-label="Expanded Scripture teaching">
        <h3 className="text-xl font-black">Understanding Scripture in its setting</h3>
        <p className="mt-3 leading-8 text-slate-700">{deepLesson.setting}</p>
        <h3 className="mt-7 text-xl font-black">A deeper look at your marriage</h3>
        {deepLesson.teaching.map((paragraph, index) => <p key={index} className="mt-4 leading-8 text-slate-700">{paragraph}</p>)}
        <h3 className="mt-7 text-xl font-black">Talk it through together</h3>
        <ol className="mt-3 list-decimal space-y-3 pl-6 leading-7 text-slate-700">{deepLesson.questions.map(question => <li key={question}>{question}</li>)}</ol>
        <h3 className="mt-7 text-xl font-black">Pray together</h3>
        <p className="mt-3 leading-8 text-slate-700">{deepLesson.prayer}</p>
      </section>}
      <h3 className="mt-7 font-black">Put the teaching into practice</h3>
      <p className="mt-2 leading-7 text-slate-700">{item.practice}</p>
      <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-5"><h4 className="font-black text-indigo-950">{marriageDailyExercises[number - 1][0]}</h4><p className="mt-2 leading-7 text-slate-800">{marriageDailyExercises[number - 1][1]}</p></div>
      <p className="mt-5 text-sm text-slate-600">Complete this daily session together: read the passage, discuss the questions, pray for one another, and try the exercise as a couple. Both people should participate freely and safely. Write personal reflections in your own private workbook; sharing private answers is optional.</p>
    </section>
    <p className="mt-5 text-sm leading-6 text-slate-600">{marriagePastoralSafetyNote}</p>
    {milestone && <section className="lfp-card mt-6 border-amber-200 bg-amber-50/40 p-6 sm:p-8">
      <p className="text-xs font-black uppercase tracking-widest text-amber-800">End-of-week checkpoint</p>
      <h2 className="mt-2 text-2xl font-black text-slate-900">{milestone.title}</h2>
      <p className="mt-2 text-sm text-slate-600">Review this week together before meeting your ministry mentor. Each person chooses what to share; private workbook answers and trauma disclosures are never required.</p>
      <ol className="mt-5 list-decimal space-y-3 pl-6 text-slate-800">{milestone.questions.map(question => <li key={question}>{question}</li>)}</ol>
      <h3 className="mt-6 font-black">Prepare together for your weekly meeting</h3>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-800">{marriageWeeklyMeetings[number].preparation.map(step => <li key={step}>{step}</li>)}</ul>
      <p className="mt-4 text-sm leading-6 text-slate-600">{marriageMeetingPrivacy}</p>
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
