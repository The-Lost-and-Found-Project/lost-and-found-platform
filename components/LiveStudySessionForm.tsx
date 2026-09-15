"use client";

import { useState } from "react";
import { createLiveSession } from "@/app/admin/studies/actions";

type Study = { id: string; title: string; ministry_slug: string | null };
type Person = { id: string; full_name: string | null; email: string | null };
type Ministry = { slug: string; title: string };

export default function LiveStudySessionForm({ studies, facilitators, participants, ministries }: { studies: Study[]; facilitators: Person[]; participants: Person[]; ministries: Ministry[] }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function submit(formData: FormData) {
    setPending(true); setMessage(null);
    try {
      const startLocal=String(formData.get("scheduled_start_local")||""); const endLocal=String(formData.get("scheduled_end_local")||"");
      if(!startLocal) throw new Error("Choose a start date and time.");
      formData.set("scheduled_start",new Date(startLocal).toISOString()); if(endLocal) formData.set("scheduled_end",new Date(endLocal).toISOString());
      await createLiveSession(formData); setMessage("Live study scheduled. Selected participants have been notified and will see it on My Path.");
      (document.getElementById("live-study-session-form") as HTMLFormElement|null)?.reset();
    } catch(error){setMessage(error instanceof Error?error.message:"Unable to schedule the live study.");} finally{setPending(false);}
  }
  return <form id="live-study-session-form" action={submit} className="lfp-card mt-6 grid gap-4 p-6 sm:grid-cols-2">
    <label className="text-sm font-bold sm:col-span-2">Bible study<select required name="bible_study_id" className="mt-1 w-full rounded-xl border p-3"><option value="">Choose a study</option>{studies.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></label>
    <label className="text-sm font-bold">Ministry<select required name="ministry_slug" className="mt-1 w-full rounded-xl border p-3"><option value="">Choose ministry</option>{ministries.map(m=><option key={m.slug} value={m.slug}>{m.title}</option>)}</select></label>
    <label className="text-sm font-bold">Facilitator<select name="facilitator_user_id" className="mt-1 w-full rounded-xl border p-3"><option value="">Organizer only</option>{facilitators.map(p=><option key={p.id} value={p.id}>{p.full_name||p.email||"L&F member"}{p.email?` · ${p.email}`:""}</option>)}</select></label>
    <label className="text-sm font-bold">Starts<input required name="scheduled_start_local" type="datetime-local" className="mt-1 w-full rounded-xl border p-3"/></label>
    <label className="text-sm font-bold">Ends<input name="scheduled_end_local" type="datetime-local" className="mt-1 w-full rounded-xl border p-3"/></label>
    <fieldset className="sm:col-span-2"><legend className="text-sm font-black">Invite participants</legend><p className="mt-1 text-xs text-slate-500">Selected members receive an in-app/push notification and the meeting appears on their My Path dashboard.</p><div className="mt-3 grid max-h-64 gap-2 overflow-y-auto rounded-2xl border bg-white p-3 sm:grid-cols-2">{participants.map(p=><label key={p.id} className="flex items-center gap-3 rounded-xl p-2 text-sm hover:bg-slate-50"><input type="checkbox" name="participant_user_id" value={p.id}/><span><strong>{p.full_name||"L&F member"}</strong>{p.email&&<small className="block text-slate-500">{p.email}</small>}</span></label>)}</div></fieldset>
    <p className="text-sm text-slate-500 sm:col-span-2">Times use your device&apos;s local timezone. Scheduling assigns the selected participants immediately.</p>
    {message&&<p className="rounded-xl bg-slate-50 p-3 text-sm font-bold sm:col-span-2">{message}</p>}
    <button disabled={pending} className="lfp-button bg-slate-950 text-white sm:col-span-2 disabled:opacity-60">{pending?"Scheduling…":"Schedule & Notify Participants"}</button>
  </form>;
}
