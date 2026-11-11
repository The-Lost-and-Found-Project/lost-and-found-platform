import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveRole } from "@/lib/effective-role";
import { updateMarriageAssignment } from "./actions";
export const dynamic="force-dynamic";
export default async function MarriageAssignmentAdmin(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?next=/admin/marriage-journey");
 const {data:profile}=await supabase.from("profiles").select("role,preview_role").eq("id",user.id).single();
 if(getEffectiveRole(profile?.role,profile?.preview_role)!=="admin")redirect("/dashboard");
 const db=createAdminClient();
 const [{data:people,error:peopleError},{data:assignments,error:assignmentError}]=await Promise.all([
  db.from("profiles").select("id,full_name,email").eq("is_active",true).order("full_name"),
  db.from("marriage_journey_assignments").select("user_id,assigned_at,revoked_at")
 ]);
 const active=new Set((assignments||[]).filter(a=>!a.revoked_at).map(a=>a.user_id));
 return <main className="lfp-page pb-24"><div className="lfp-shell max-w-4xl py-10"><Link href="/admin/studies" className="font-bold text-indigo-700">← Study workspace</Link>
 <p className="lfp-eyebrow mt-7">Assigned Discipleship</p><h1 className="mt-2 text-4xl font-black">Marriage Journey assignments</h1>
 <p className="mt-4 text-slate-600">Assign One Flesh, One Foundation to an individual member. Only assigned members see it on their dashboard or can open lessons. Revoking access removes mentor sharing grants, but preserves the participant’s private journal for possible future reassignment.</p>
 {(peopleError||assignmentError)?<p role="alert" className="mt-6 rounded-xl bg-amber-50 p-5">Assignments are unavailable. No changes can be made.</p>:<div className="mt-8 space-y-3">{(people||[]).map(person=><div key={person.id} className="lfp-card flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="font-black">{person.full_name||person.email||"Member"}</p><p className="text-xs text-slate-500">{person.email}</p><p className="mt-1 text-sm font-bold text-slate-600">{active.has(person.id)?"Assigned":"Not assigned"}</p></div><form action={updateMarriageAssignment}><input type="hidden" name="userId" value={person.id}/><input type="hidden" name="operation" value={active.has(person.id)?"revoke":"assign"}/><button className={`rounded-xl px-4 py-3 font-bold ${active.has(person.id)?"border border-rose-200 text-rose-800":"bg-indigo-700 text-white"}`}>{active.has(person.id)?"Revoke access":"Assign study"}</button></form></div>)}</div>}
 </div></main>;
}
