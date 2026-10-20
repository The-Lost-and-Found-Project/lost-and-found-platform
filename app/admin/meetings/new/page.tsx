import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {getEffectiveRole,canManageStudies} from "@/lib/effective-role";
import {ministryPortals} from "@/lib/ministry-hub";
import LiveStudySessionForm from "@/components/LiveStudySessionForm";

export const dynamic="force-dynamic";
export default async function ScheduleMeeting(){
 const s=await createClient();const {data:{user}}=await s.auth.getUser();
 if(!user)redirect("/login?next=%2Fadmin%2Fmeetings%2Fnew");
 const {data:profile,error:profileError}=await s.from("profiles").select("role,preview_role,is_active").eq("id",user.id).maybeSingle();
 if(profileError||!profile||!profile.is_active)throw new Error("Unable to verify an active account.");
 const role=getEffectiveRole(profile?.role,profile?.preview_role);if(!canManageStudies(role))redirect("/dashboard");
 const db=createAdminClient();
 const [{data:studies,error:studiesError},{data:groups,error:groupsError},{data:members,error:membersError},{data:people,error:peopleError},{data:supervision,error:supervisionError}]=await Promise.all([
 db.from("bible_studies").select("id,title,ministry_slug").eq("is_published",true).order("title"),
 db.from("study_groups").select("id,name,ministry_slug").eq("status","active").order("name"),
 db.from("study_group_members").select("group_id,user_id,group_role").eq("membership_status","active"),
 db.from("profiles").select("id,full_name,email").eq("is_active",true).order("full_name"),
 role==="supervisor"?db.from("facilitator_supervision").select("facilitator_user_id").eq("supervisor_user_id",user.id):Promise.resolve({data:[] as {facilitator_user_id:string}[],error:null})
 ]);
 if(studiesError||groupsError||membersError||peopleError||supervisionError)throw new Error("Unable to load authorized meeting scheduling options. Please try again.");
 const managedFacilitators=new Set([user.id,...(supervision||[]).map(x=>x.facilitator_user_id)]);
 const allowedGroups=(groups||[]).filter(g=>role==="admin"||(members||[]).some(m=>m.group_id===g.id&&m.group_role==="facilitator"&&managedFacilitators.has(m.user_id)));
 const groupIds=new Set(allowedGroups.map(g=>g.id));
 const allowedMembers=(members||[]).filter(m=>groupIds.has(m.group_id));
 const memberIds=new Set(allowedMembers.map(m=>m.user_id));
 const allowedPeople=(people||[]).filter(p=>role==="admin"||memberIds.has(p.id));
 const peopleById=new Map(allowedPeople.map(p=>[p.id,p]));
 const formGroups=allowedGroups.map(g=>{const gm=allowedMembers.filter(m=>m.group_id===g.id);const facilitatorIds=gm.filter(m=>m.group_role==="facilitator").map(m=>m.user_id);return {...g,ministry_slug:g.ministry_slug||"",memberIds:gm.map(m=>m.user_id),facilitatorIds,facilitatorLabel:facilitatorIds.map(id=>peopleById.get(id)?.full_name||peopleById.get(id)?.email).filter(Boolean).join(" / ")}});
 return <main className="lfp-page pb-24"><div className="lfp-shell max-w-5xl py-8 sm:py-10">
 <nav className="flex gap-2 text-sm font-bold text-indigo-700" aria-label="Breadcrumb"><Link href="/admin/meetings">← Meetings</Link><span className="text-slate-400">/</span><span className="text-slate-800">Schedule</span></nav>
 <header className="mt-8"><p className="lfp-eyebrow">Meeting preparation</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Schedule a gathering</h1><p className="mt-3 max-w-2xl text-slate-600">Choose the study and group, confirm the facilitator and participants, then set the meeting time. The existing notification workflow sends invitations after saving.</p></header>
 <div className="mt-6 grid gap-3 sm:grid-cols-3">{[{n:"01",title:"Choose the study",detail:"Select published material"},{n:"02",title:"Confirm your group",detail:"Assign facilitator and roster"},{n:"03",title:"Schedule and notify",detail:"Set time and save"}].map(step=><div key={step.n} className="rounded-2xl border border-slate-200 bg-white p-4"><span className="text-xs font-black text-indigo-700">{step.n}</span><h2 className="mt-1 font-bold">{step.title}</h2><p className="mt-1 text-xs text-slate-600">{step.detail}</p></div>)}</div>
 {!studies?.length&&<p role="status" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold">No published Bible studies are available. {role==="admin"?<Link href="/admin/studies#library" className="underline">Review the study library</Link>:"Ask an administrator to publish a study."}</p>}
 {!formGroups.length&&<p role="status" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold">No groups are available to your role. {role==="admin"?<Link href="/admin/studies/groups" className="underline">Review study groups</Link>:"Ask an administrator to assign you to an active study group."}</p>}
 <LiveStudySessionForm studies={studies||[]} facilitators={allowedPeople} participants={allowedPeople} ministries={ministryPortals.map(m=>({slug:m.slug,title:m.title}))} groups={formGroups}/>
 </div></main>;
}
