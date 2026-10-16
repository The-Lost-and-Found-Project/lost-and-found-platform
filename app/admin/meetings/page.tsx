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
 const {data:profile}=await supabase.from("profiles").select("role,preview_role").eq("id",user.id).maybeSingle();
 const role=getEffectiveRole(profile?.role,profile?.preview_role);
 if(!canManageStudies(role))redirect("/dashboard");
 const db=createAdminClient();
 const {data:rows}=await db.from("study_sessions").select("id,scheduled_start,status,facilitator_user_id,created_by,group_id").in("status",["scheduled","live","completed"]).order("scheduled_start",{ascending:false}).limit(100);
 const {data:membership}=role==="admin"?{data:[]}:await db.from("study_group_members").select("group_id,group_role").eq("user_id",user.id).eq("membership_status","active");
 const ownGroups=new Set((membership||[]).filter(x=>x.group_role==="facilitator").map(x=>x.group_id));
 const visible=(rows||[]).filter(x=>role==="admin"||x.facilitator_user_id===user.id||x.created_by===user.id||(x.group_id&&ownGroups.has(x.group_id)));
 const upcoming=visible.filter(x=>x.status==="scheduled"&&x.scheduled_start&&new Date(x.scheduled_start).getTime()>=Date.now()).sort((a,b)=>new Date(a.scheduled_start!).getTime()-new Date(b.scheduled_start!).getTime());
 const live=visible.filter(x=>x.status==="live");
 const past=visible.filter(x=>x.status==="completed");
 const tile="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
 return <main className="lfp-page min-h-screen pb-24"><div className="lfp-shell py-8 sm:py-10">
 <nav aria-label="Admin breadcrumbs" className="flex flex-wrap gap-2 text-sm font-semibold text-slate-600"><Link href="/admin" className="hover:underline">Admin</Link><span aria-hidden>›</span><span className="text-slate-950">Meetings</span></nav>
 <header className="mt-7 flex flex-wrap items-end justify-between gap-4"><div><p className="lfp-eyebrow">Ministry operations</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Meetings</h1><p className="mt-2 max-w-2xl text-slate-600">See what is happening, prepare the next gathering, and get into L&F Live quickly.</p></div><Link href="/admin/studies#schedule" className="lfp-button bg-indigo-700 text-white">+ Schedule meeting</Link></header>
 <section aria-label="Meeting summary" className="mt-7 grid gap-3 sm:grid-cols-3">
 <div className={tile}><p className="text-sm font-bold text-slate-600">Live now</p><p className="mt-2 text-3xl font-black">{live.length}</p></div>
 <div className={tile}><p className="text-sm font-bold text-slate-600">Upcoming</p><p className="mt-2 text-3xl font-black">{upcoming.length}</p></div>
 <div className={tile}><p className="text-sm font-bold text-slate-600">Completed (recent)</p><p className="mt-2 text-3xl font-black">{past.length}</p></div>
 </section>
 <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]"><section className={tile}><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">Next meetings</h2><Link href="/admin/studies#sessions" className="text-sm font-bold text-indigo-700">Manage all →</Link></div>
 <div className="mt-4 space-y-3">{[...live,...upcoming].slice(0,8).map(x=><article key={x.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div><p className="font-bold">{x.status==="live"?"Meeting in progress":"Upcoming meeting"}</p><p className="mt-1 text-sm text-slate-600">{x.scheduled_start?new Intl.DateTimeFormat("en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"America/New_York"}).format(new Date(x.scheduled_start))+" ET":"Time not set"}</p></div><Link href={`/live/${x.id}`} className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white">Open room</Link></article>)}{!live.length&&!upcoming.length&&<p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">No upcoming meetings. Schedule your next gathering to get started.</p>}</div></section>
 <aside className={tile}><h2 className="text-xl font-black">Quick actions</h2><div className="mt-4 grid gap-2">{[{href:"/admin/studies#schedule",label:"Schedule a meeting"},{href:"/admin/studies#sessions",label:"Manage sessions"},{href:"/admin/studies/groups",label:"Manage groups"},{href:"/admin/studies#library",label:"Bible study library"},...(role==="admin"?[{href:"/admin/live",label:"L&F Live usage"}]:[])].map(a=><Link key={a.href} href={a.href} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">{a.label} →</Link>)}</div></aside></div>
 <p className="mt-6 text-xs text-slate-500">This is the first workspace pass. Existing meeting scheduling and session management remain available while those tools are moved into dedicated screens.</p>
 </div></main>;
}
