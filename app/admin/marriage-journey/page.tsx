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
 const [{data:people,error:peopleError},{data:couples,error:coupleError}]=await Promise.all([
  db.from("profiles").select("id,full_name,email").eq("is_active",true).order("full_name"),
  db.from("marriage_couples").select("id,spouse_one,spouse_two,assigned_at").is("revoked_at",null).order("assigned_at",{ascending:false})
 ]);
 const names=new Map((people||[]).map(p=>[p.id,p.full_name||p.email||"Member"]));
 const paired=new Set((couples||[]).flatMap(c=>[c.spouse_one,c.spouse_two]));
 const available=(people||[]).filter(p=>!paired.has(p.id));
 return <main className="lfp-page pb-24"><div className="lfp-shell max-w-4xl py-10"><Link href="/admin/studies" className="font-bold text-indigo-700">← Study workspace</Link>
 <p className="lfp-eyebrow mt-7">Couples discipleship</p><h1 className="mt-2 text-4xl font-black">Marriage Journey · Couple assignments</h1>
 <p className="mt-4 text-slate-600">Assign two active members together. Both receive the 21-day journey, and only their explicitly shared discussion answers can be seen by their spouse after answering. Personal workbooks remain private. Couples are never connected to other couples automatically.</p>
 {(peopleError||coupleError)?<p role="alert" className="mt-6 rounded-xl bg-amber-50 p-5">Couple assignments are unavailable. No changes can be made.</p>:<>
 <form action={updateMarriageAssignment} className="lfp-card mt-8 grid gap-4 p-6 sm:grid-cols-2"><input type="hidden" name="operation" value="assign"/>
 <label className="grid gap-2 font-bold">First spouse<select required name="userId" className="rounded-xl border p-3" defaultValue=""><option value="" disabled>Select first spouse</option>{available.map(p=><option key={p.id} value={p.id}>{p.full_name||p.email}</option>)}</select></label>
 <label className="grid gap-2 font-bold">Second spouse<select required name="partnerId" className="rounded-xl border p-3" defaultValue=""><option value="" disabled>Select second spouse</option>{available.map(p=><option key={p.id} value={p.id}>{p.full_name||p.email}</option>)}</select></label>
 <button disabled={available.length<2} className="rounded-xl bg-indigo-700 px-5 py-3 font-black text-white disabled:opacity-40 sm:col-span-2">Assign study to couple</button></form>
 <h2 className="mt-9 text-2xl font-black">Assigned couples</h2>
 <div className="mt-4 space-y-3">{(couples||[]).map(c=><div key={c.id} className="lfp-card flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-black">{names.get(c.spouse_one)||"Member"} &amp; {names.get(c.spouse_two)||"Member"}</p><p className="text-sm text-slate-500">Assigned {new Date(c.assigned_at).toLocaleDateString()}</p></div><form action={updateMarriageAssignment}><input type="hidden" name="operation" value="revoke"/><input type="hidden" name="coupleId" value={c.id}/><button className="rounded-xl border border-rose-200 px-4 py-3 font-bold text-rose-800">Revoke couple access</button></form></div>)}{!couples?.length&&<p className="text-slate-500">No couples assigned yet.</p>}</div>
 </>}
 </div></main>;
}
