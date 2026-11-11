import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { changeMentorShare, shareMarriageUpdate } from "./actions";
export default async function MarriageSharingPage({ searchParams }: { searchParams: Promise<{ updated?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/marriage-journey/sharing");
  const { data: grants, error } = await supabase.from("marriage_mentor_shares")
    .select("mentor_id,share_progress,share_commitments,status").eq("participant_id", user.id);
  const { updated } = await searchParams;
  return <main className="lfp-page pb-24"><div className="lfp-shell max-w-3xl py-10">
    <Link href="/marriage-journey" className="font-bold text-indigo-700">← Marriage journey</Link>
    <h1 className="mt-6 text-4xl font-black">Your sharing permissions</h1>
    <p className="mt-4 leading-7 text-slate-700">You decide whether to share completion updates or a practical commitment. Private reflections are never shared through this feature. Sharing is off until you explicitly grant access.</p>
    {updated === "1" && <p role="status" className="mt-4 font-bold text-emerald-700">Sharing settings updated.</p>}
    {error ? <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-5">Sharing is unavailable until the database is ready.</p> : <>
      <section className="lfp-card mt-7 p-6"><h2 className="text-xl font-black">Add a mentor</h2>
        <p className="mt-2 text-sm text-slate-600">Your mentor can find their account ID on the <a className="font-bold text-indigo-700 underline" href="/marriage-journey/mentor">mentor check-ins page</a>. Ask them to send it directly to you. Verify the ID with them directly by phone or in person. Do not grant access to an unverified ID.</p>
        <form action={changeMentorShare} className="mt-5 space-y-4"><input type="hidden" name="operation" value="grant"/>
          <label className="block font-bold" htmlFor="mentorId">Mentor account ID</label><input id="mentorId" name="mentorId" required placeholder="Account UUID" className="w-full rounded-xl border p-3"/>
          <label className="flex gap-3"><input type="checkbox" name="shareProgress" defaultChecked/>Allow session completion updates</label>
          <label className="flex gap-3"><input type="checkbox" name="shareCommitments"/>Allow practical commitments that I explicitly send</label>
          <label className="flex gap-3 text-sm"><input type="checkbox" name="verifiedMentor" required/>I have independently confirmed this account belongs to my intended mentor, and I understand what I am allowing them to see.</label>
          <button className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">Grant permission</button>
        </form></section>
      <section className="mt-8 space-y-4"><h2 className="text-xl font-black">Current permissions</h2>
        {grants?.length ? grants.map(grant => <div className="lfp-card p-6" key={grant.mentor_id}>
          <p className="break-all font-bold">Mentor ID: {grant.mentor_id}</p>
          <p className="mt-2 text-sm">Completion updates: {grant.share_progress ? "Allowed" : "Off"} · Commitments: {grant.share_commitments ? "Allowed" : "Off"}</p>
          <div className="mt-5 flex flex-wrap gap-3"><form action={changeMentorShare}><input type="hidden" name="operation" value="revoke"/><input type="hidden" name="mentorId" value={grant.mentor_id}/><button className="rounded-xl border border-red-300 px-4 py-2 font-bold text-red-800">Revoke and delete shared updates</button></form></div>
          <p className="mt-5 text-sm text-slate-600">Save the session first. To send a specific session update, select its number. Only its completion status and, if permitted, its practical commitment will be copied. Your private reflection is excluded. Nothing is shared automatically.</p>
          <form action={shareMarriageUpdate} className="mt-3 flex flex-wrap gap-3"><input type="hidden" name="mentorId" value={grant.mentor_id}/><select name="session" aria-label="Session to share" className="rounded-xl border p-2">{Array.from({length:21},(_,i)=><option key={i} value={i+1}>Session {i+1}</option>)}</select><button className="rounded-xl bg-indigo-700 px-4 py-2 font-bold text-white">Share this session update</button></form>
        </div>) : <p className="text-slate-600">No mentor access granted.</p>}
      </section>
    </>}
  </div></main>;
}
