import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {getEffectiveRole,canManageStudies} from "@/lib/effective-role";
import {saveMeetingAttendance} from "@/app/admin/meetings/attendance-actions";
import {endStudySession,provisionLiveSession,releaseDailyPath} from "@/app/admin/studies/actions";
export const dynamic="force-dynamic";
export default async function MeetingDetail({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const s=await createClient();const {data:{user}}=await s.auth.getUser();
 if(!user)redirect("/login?next=%2Fadmin%2Fmeetings");
 const {data:profile}=await s.from("profiles").select("role,preview_role").eq("id",user.id).maybeSingle();
 const role=getEffectiveRole(profile?.role,profile?.preview_role);if(!canManageStudies(role))redirect("/dashboard");
 const db=createAdminClient();
 const {data:meeting}=await db.from("study_sessions").select("id,bible_study_id,group_id,facilitator_user_id,scheduled_start,scheduled_end,status,google_meeting_uri,daily_path_released_at").eq("id",id).maybeSingle();
 if(!meeting)notFound();
 if(role!=="admin"){
  if(!meeting.group_id)notFound();
  const {data:facilitators}=await db.from("study_group_members").select("user_id").eq("group_id",meeting.group_id).eq("group_role","facilitator").eq("membership_status","active");
  const ids=(facilitators||[]).map(x=>x.user_id);
  let allowed=ids.includes(user.id);
  if(!allowed&&role==="supervisor"&&ids.length){
   const {data:supervised}=await db.from("facilitator_supervision").select("facilitator_user_id").eq("supervisor_user_id",user.id).in("facilitator_user_id",ids);
   allowed=Boolean(supervised?.length);
  }
  if(!allowed)notFound();
 }
 const [{data:study},{data:group},{data:facilitator},{data:attendees},{data:presence},{data:manual}]=await Promise.all([
 db.from("bible_studies").select("id,title,is_published,devotional_cards").eq("id",meeting.bible_study_id).maybeSingle(),
 meeting.group_id?db.from("study_groups").select("name").eq("id",meeting.group_id).maybeSingle():Promise.resolve({data:null}),
 meeting.facilitator_user_id?db.from("profiles").select("full_name").eq("id",meeting.facilitator_user_id).maybeSingle():Promise.resolve({data:null}),
 db.from("study_session_participants").select("user_id,rsvp_status").eq("study_session_id",id),
 db.from("study_session_live_presence").select("user_id,joined_at,last_seen_at,left_at").eq("session_id",id),
 db.from("study_session_attendance").select("user_id,status").eq("session_id",id)
 ]);
 const presentIds=new Set((presence||[]).filter(p=>p.joined_at).map(p=>p.user_id));
 const confirmed=(attendees||[]).filter(p=>p.rsvp_status==="going").length;
 const declined=(attendees||[]).filter(p=>p.rsvp_status==="declined").length;
 const attended=(attendees||[]).filter(p=>presentIds.has(p.user_id)).length;
 const manualByUser=new Map((manual||[]).map(x=>[x.user_id,x.status]));
 const {data:names}=attendees?.length?await db.from("profiles").select("id,full_name").in("id",attendees.map(x=>x.user_id)):{data:[] as {id:string;full_name:string|null}[]};
 const namesById=new Map((names||[]).map(x=>[x.id,x.full_name]));
 const fmt=(v:string|null)=>v?new Intl.DateTimeFormat("en-US",{dateStyle:"full",timeStyle:"short",timeZone:"America/New_York"}).format(new Date(v))+" ET":"Not set";
 const cards=Array.isArray(study?.devotional_cards)?study.devotional_cards:[];
 const panel="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";
 return <main className="lfp-page pb-24"><div className="lfp-shell max-w-5xl py-8">
 <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm font-bold text-indigo-700"><Link href="/admin/meetings">← Meetings</Link><span className="text-slate-400">/</span><span className="text-slate-800">Meeting details</span></nav>
 <header className="mt-8"><p className="lfp-eyebrow">Meeting workspace</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">{study?.title||"Bible study meeting"}</h1><p className="mt-3 text-slate-600">{group?.name||"No group assigned"} · {meeting.status}</p></header>
 <section className="mt-6 grid gap-4 sm:grid-cols-2"><div className={panel}><h2 className="text-lg font-black">Meeting details</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="font-bold text-slate-600">Starts</dt><dd>{fmt(meeting.scheduled_start)}</dd></div><div><dt className="font-bold text-slate-600">Ends</dt><dd>{fmt(meeting.scheduled_end)}</dd></div><div><dt className="font-bold text-slate-600">Facilitator</dt><dd>{facilitator?.full_name||"Organizer only"}</dd></div><div><dt className="font-bold text-slate-600">Assigned participants</dt><dd>{attendees?.length||0}</dd></div></dl></div>
 <div className={panel}><h2 className="text-lg font-black">Prepare and lead</h2><div className="mt-4 flex flex-wrap gap-2"><Link href={`/live/${id}`} className="lfp-button bg-indigo-700 text-white">Open L&F Live</Link>{study?.is_published&&<Link href={`/studies/${study.id}/present`} className="lfp-button border bg-white text-slate-900">Present study</Link>}{meeting.google_meeting_uri?<a href={meeting.google_meeting_uri} target="_blank" rel="noreferrer" className="lfp-button border bg-white text-slate-900">Meet fallback</a>:meeting.status!=="completed"&&<form action={provisionLiveSession}><input type="hidden" name="session_id" value={id}/><button className="lfp-button border bg-white text-slate-900">Create Meet fallback</button></form>}</div></div></section>
 <section className={panel+" mt-5"}><h2 className="text-lg font-black">Participation and attendance</h2><p className="mt-2 text-sm text-slate-600">RSVPs are invitations and responses. Attendance below counts invited participants who joined L&F Live; it does not include attendance through external meeting links.</p><dl className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><dt className="text-sm text-slate-600">Confirmed RSVPs</dt><dd className="mt-1 text-2xl font-black">{confirmed}</dd></div><div className="rounded-xl bg-slate-50 p-4"><dt className="text-sm text-slate-600">Declined</dt><dd className="mt-1 text-2xl font-black">{declined}</dd></div><div className="rounded-xl bg-slate-50 p-4"><dt className="text-sm text-slate-600">Joined L&F Live</dt><dd className="mt-1 text-2xl font-black">{attended}</dd></div></dl></section>
 <section className={panel+" mt-5"}><h2 className="text-lg font-black">After the gathering</h2><p className="mt-2 text-sm text-slate-600">Close the session when finished. Release the devotional path when the study is ready for participants.</p><div className="mt-4 flex flex-wrap gap-3">{meeting.status!=="completed"?<form action={endStudySession}><input type="hidden" name="session_id" value={id}/><button className="lfp-button border bg-white text-slate-900">End meeting</button></form>:<span className="rounded-lg bg-slate-100 px-4 py-3 text-sm font-bold">Meeting completed</span>}{meeting.daily_path_released_at?<span className="rounded-lg bg-violet-50 px-4 py-3 text-sm font-bold text-violet-800">Daily Path released</span>:cards.length?<form action={releaseDailyPath}><input type="hidden" name="session_id" value={id}/><button className="lfp-button bg-violet-700 text-white">Release Daily Path ({cards.length} days)</button></form>:<span className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">No devotionals available for release</span>}</div></section>
 </div></main>;
}
