import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {getEffectiveRole,canManageStudies} from "@/lib/effective-role";

export const dynamic="force-dynamic";

export default async function MeetingsWorkspace(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login?next=%2Fadmin%2Fmeetings");
 const {data:profile,error:profileError}=await supabase.from("profiles").select("role,preview_role,is_active").eq("id",user.id).maybeSingle();
 if(profileError||!profile||!profile.is_active)throw new Error("Unable to verify an active account.");
 const role=getEffectiveRole(profile?.role,profile?.preview_role);
 if(!canManageStudies(role))redirect("/dashboard");
 const db=createAdminClient();

 const {data:membership,error:membershipError}=role==="admin"?{data:[],error:null}:await db.from("study_group_members").select("group_id,group_role").eq("user_id",user.id).eq("membership_status","active");
 const {data:supervised,error:supervisedError}=role==="supervisor"?await db.from("facilitator_supervision").select("facilitator_user_id").eq("supervisor_user_id",user.id):{data:[] as {facilitator_user_id:string}[],error:null};
 const facilitatorIds=new Set([user.id,...(supervised||[]).map(x=>x.facilitator_user_id)]);
 const {data:supervisedGroups,error:supervisedGroupsError}=role==="supervisor"&&facilitatorIds.size?await db.from("study_group_members").select("group_id,user_id,group_role").in("user_id",[...facilitatorIds]).eq("group_role","facilitator").eq("membership_status","active"):{data:[] as {group_id:string;user_id:string;group_role:string}[],error:null};
 if(membershipError||supervisedError||supervisedGroupsError)throw new Error("Unable to verify meeting access. Please try again.");
 const ownGroups=new Set([...(membership||[]).filter(x=>x.group_role==="facilitator").map(x=>x.group_id),...(supervisedGroups||[]).map(x=>x.group_id)]);
 const accessibleFacilitatorIds=[...facilitatorIds];
 const accessibleGroupIds=[...ownGroups];
 // Filter by authorized scope in SQL before applying row limits; global limits can hide a facilitator's meetings.
 const scopeFilter=[
  accessibleFacilitatorIds.length?`facilitator_user_id.in.(${accessibleFacilitatorIds.join(",")})`:null,
  accessibleGroupIds.length?`group_id.in.(${accessibleGroupIds.join(",")})`:null
 ].filter(Boolean).join(",");
 const sessionFields="id,scheduled_start,ended_at,status,facilitator_user_id,group_id,bible_study_id";
 let activeQuery=db.from("study_sessions").select(sessionFields).in("status",["scheduled","live"]).order("scheduled_start",{ascending:true}).limit(250);
 let pastQuery=db.from("study_sessions").select(sessionFields).eq("status","completed").order("ended_at",{ascending:false,nullsFirst:false}).limit(50);
 if(role!=="admin"){activeQuery=activeQuery.or(scopeFilter);pastQuery=pastQuery.or(scopeFilter);}
 const [{data:activeRows,error:activeError},{data:pastRows,error:pastError}]=await Promise.all([activeQuery,pastQuery]);
 if(activeError||pastError)throw new Error("Unable to load the Meetings workspace. Please try again.");
 const rows=[...(activeRows||[]),...(pastRows||[])];
 const visible=(rows||[]).filter(x=>role==="admin"||(x.facilitator_user_id&&facilitatorIds.has(x.facilitator_user_id))||(x.group_id&&ownGroups.has(x.group_id)));
 const studyIds=[...new Set(visible.map(x=>x.bible_study_id).filter(Boolean))];
 const groupIds=[...new Set(visible.map(x=>x.group_id).filter(Boolean))];
 const [{data:studyRows,error:studyError},{data:groupRows,error:groupError}]=await Promise.all([studyIds.length?db.from("bible_studies").select("id,title").in("id",studyIds):Promise.resolve({data:[] as {id:string;title:string}[],error:null}),groupIds.length?db.from("study_groups").select("id,name").in("id",groupIds):Promise.resolve({data:[] as {id:string;name:string}[],error:null})]);
 if(studyError||groupError)throw new Error("Unable to load meeting study and group details. Please try again.");
 const studyNames=new Map((studyRows||[]).map(x=>[x.id,x.title]));const groupNames=new Map((groupRows||[]).map(x=>[x.id,x.name]));
 const upcoming=visible.filter(x=>x.status==="scheduled"&&(!x.scheduled_start||new Date(x.scheduled_start).getTime()>=Date.now())).sort((a,b)=>(a.scheduled_start?new Date(a.scheduled_start).getTime():Number.MAX_SAFE_INTEGER)-(b.scheduled_start?new Date(b.scheduled_start).getTime():Number.MAX_SAFE_INTEGER));
 const overdue=visible.filter(x=>x.status==="scheduled"&&x.scheduled_start&&new Date(x.scheduled_start).getTime()<Date.now()).sort((a,b)=>new Date(a.scheduled_start!).getTime()-new Date(b.scheduled_start!).getTime());
 const live=visible.filter(x=>x.status==="live");
 const past=visible.filter(x=>x.status==="completed");
 const staleLive=live.filter(x=>x.scheduled_start&&Date.now()-new Date(x.scheduled_start).getTime()>24*60*60*1000);
 const recentlyCompleted=[...past].sort((a,b)=>(b.ended_at?new Date(b.ended_at).getTime():0)-(a.ended_at?new Date(a.ended_at).getTime():0)).slice(0,6);
 const activeLimitReached=(activeRows||[]).length===250;
 const completedLimitReached=(pastRows||[]).length===50;
 const tile="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
 return <main className="lfp-page min-h-screen pb-24"><div className="lfp-shell py-8 sm:py-10">
 <nav aria-label="Admin breadcrumbs" className="flex flex-wrap gap-2 text-sm font-semibold text-slate-600"><Link href="/admin" className="hover:underline">Admin</Link><span aria-hidden>›</span><span className="text-slate-950">Meetings</span></nav>
 <header className="mt-7 flex flex-wrap items-end justify-between gap-4"><div><p className="lfp-eyebrow">Ministry operations</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Meetings</h1><p className="mt-2 max-w-2xl text-slate-600">See what is happening, prepare the next gathering, and get into L&F Live quickly.</p></div><Link href="/admin/meetings/new" className="lfp-button bg-indigo-700 text-white">+ Schedule meeting</Link></header>
 <section aria-label="Meeting summary" className="mt-7 grid gap-3 sm:grid-cols-3">
 <div className={tile}><p className="text-sm font-bold text-slate-600">Marked live</p><p className="mt-2 text-3xl font-black">{live.length}</p></div>
 <div className={tile}><p className="text-sm font-bold text-slate-600">Upcoming</p><p className="mt-2 text-3xl font-black">{upcoming.length}</p></div>
 <div className={tile}><p className="text-sm font-bold text-slate-600">Completed (loaded)</p><p className="mt-2 text-3xl font-black">{past.length}</p></div>
 </section>
 {staleLive.length>0&&<section role="status" className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950"><p className="font-bold">{staleLive.length} meeting{staleLive.length===1?" is":"s are"} still marked live after 24 hours</p><p className="mt-1 text-sm">A live status does not confirm that anyone is currently meeting. Review these sessions before deciding whether to close them.</p><Link href={`/admin/meetings/${staleLive[0].id}`} className="mt-2 inline-block text-sm font-bold underline">Review meeting</Link></section>}
 {overdue.length>0&&<section role="status" className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950"><p className="font-bold">{overdue.length} scheduled meeting{overdue.length===1?"":"s"} need review</p><p className="mt-1 text-sm">Their scheduled start time has passed, but the session is still marked scheduled. Check whether to start, reschedule, or close them.</p><Link href={`/admin/meetings/${overdue[0].id}`} className="mt-2 inline-block text-sm font-bold underline">Review first meeting</Link></section>}
 {overdue.length>0&&<section className={tile+" mt-5"}><h2 className="text-lg font-black">Meetings requiring review</h2><div className="mt-3 grid gap-2">{overdue.slice(0,8).map(x=><Link key={x.id} href={`/admin/meetings/${x.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 hover:bg-slate-50"><span className="font-semibold">{studyNames.get(x.bible_study_id)||"Bible study meeting"}</span><span className="text-sm font-bold text-indigo-700">{x.scheduled_start?new Intl.DateTimeFormat("en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"America/New_York"}).format(new Date(x.scheduled_start))+" ET · ":""}Review →</span></Link>)}</div></section>}
 <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]"><section className={tile}><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">Next meetings</h2><Link href="/admin/meetings/new" className="text-sm font-bold text-indigo-700">Schedule another →</Link></div>
 <div className="mt-4 space-y-3">{[...live,...upcoming].slice(0,8).map(x=><article key={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-bold">{studyNames.get(x.bible_study_id)||"Bible study meeting"}</p><p className="mt-1 text-xs font-semibold text-indigo-700">{x.status==="live"?(staleLive.some(m=>m.id===x.id)?"MARKED LIVE · REVIEW":"LIVE STATUS"):x.group_id?groupNames.get(x.group_id)||"Group meeting":"Group meeting"}</p><p className="mt-1 text-sm text-slate-600">{x.scheduled_start?new Intl.DateTimeFormat("en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"America/New_York"}).format(new Date(x.scheduled_start))+" ET":"Time not set"}</p></div><div className="flex flex-wrap gap-2"><Link href={`/admin/meetings/${x.id}`} className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-bold text-slate-900">Prepare / Manage</Link><Link href={`/live/${x.id}`} className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white">Open room</Link></div></article>)}{!live.length&&!upcoming.length&&<p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No upcoming meetings. Schedule your next gathering to get started.</p>}</div></section>
 <aside className={tile}><h2 className="text-xl font-black">Quick actions</h2><div className="mt-4 grid gap-2">{[{href:"/admin/meetings/new",label:"Schedule a meeting"},{href:"/admin/studies",label:"Study publishing"},{href:"/admin/studies/groups",label:"Manage groups"},...(role==="admin"?[{href:"/admin/studies#library",label:"Bible study library"},{href:"/admin/live",label:"L&F Live usage"}]:[])].map(a=><Link key={a.href} href={a.href} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">{a.label} →</Link>)}</div></aside></div>
 {recentlyCompleted.length>0&&<section className={tile+" mt-5"}><h2 className="text-xl font-black">Recent completed meetings</h2><div className="mt-4 grid gap-2">{recentlyCompleted.map(x=><Link key={x.id} href={`/admin/meetings/${x.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"><span className="font-semibold">{studyNames.get(x.bible_study_id)||"Bible study meeting"}</span><span className="text-sm font-bold text-indigo-700">{x.scheduled_start?new Intl.DateTimeFormat("en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"America/New_York"}).format(new Date(x.scheduled_start))+" ET · ":""}Follow-up →</span></Link>)}</div></section>}
 {(activeLimitReached||completedLimitReached)&&<p role="status" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">This overview has reached its {activeLimitReached&&completedLimitReached?"active and completed meeting limits":activeLimitReached?"active meeting limit":"completed meeting limit"}. Some meetings may not appear here; counts reflect only loaded records.</p>}
 <p className="mt-6 text-xs text-slate-500">Meeting counts reflect up to 250 active and 50 recently completed sessions loaded. Older history may not appear in this overview.</p>
 </div></main>;
}
