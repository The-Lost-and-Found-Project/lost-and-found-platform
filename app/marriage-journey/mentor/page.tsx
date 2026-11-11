import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export default async function MarriageMentorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/marriage-journey/mentor");
  const { data: grants, error: grantsError } = await supabase.from("marriage_mentor_shares")
    .select("participant_id,share_progress,share_commitments")
    .eq("mentor_id",user.id).eq("status","active");
  const { data: updates, error: updatesError } = await supabase.from("marriage_mentor_updates")
    .select("participant_id,session_number,completed,commitment,shared_at")
    .eq("mentor_id",user.id).order("session_number");
  return <main className="lfp-page pb-24"><div className="lfp-shell max-w-5xl py-10">
    <Link href="/marriage-journey" className="font-bold text-indigo-700">← Marriage journey</Link>
    <h1 className="mt-6 text-4xl font-black">Mentor check-ins</h1>
    <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5"><h2 className="font-black">Your mentor account ID</h2><p className="mt-2 break-all font-mono text-sm">{user.id}</p><p className="mt-2 text-sm text-slate-600">Share this ID directly with a participant who has asked you to mentor them. This ID is not a password.</p></section>
    <p className="mt-4 max-w-3xl leading-7 text-slate-700">Only updates that a participant deliberately sends appear here. Personal journals, unshared commitments, and other account data are not accessible.</p>
    {grantsError || updatesError ? <p role="alert" className="mt-6 rounded-xl bg-amber-50 p-5">Mentor updates are unavailable. No information is being shown as complete.</p> :
      grants?.length ? <div className="mt-8 grid gap-5">{grants.map(grant => {
        const shared = (updates ?? []).filter(update => update.participant_id === grant.participant_id);
        return <section key={grant.participant_id} className="lfp-card p-6">
          <h2 className="text-xl font-black">Participant <span className="break-all text-sm font-normal text-slate-500">{grant.participant_id}</span></h2>
          <p className="mt-2 text-sm text-slate-600">{shared.length} explicitly shared session updates</p>
          <div className="mt-5 space-y-3">{shared.map(update => <div key={update.session_number} className="rounded-xl border border-slate-200 p-4">
            <p className="font-bold">Session {update.session_number}{grant.share_progress ? (update.completed ? " · Completed" : " · Not marked complete") : ""}</p>
            {grant.share_commitments && update.commitment && <p className="mt-2 whitespace-pre-wrap text-slate-700">Commitment: {update.commitment}</p>}
            <p className="mt-2 text-xs text-slate-500">Shared {new Date(update.shared_at).toLocaleDateString("en-US")}</p>
          </div>)}</div>
          {!shared.length && <p className="mt-4 text-slate-600">No session updates sent yet.</p>}
        </section>;
      })}</div> : <p className="mt-8 text-slate-600">No participants have granted you access.</p>}
  </div></main>;
}
