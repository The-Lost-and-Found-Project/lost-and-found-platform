"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { provisionMeetSpace } from "@/lib/google-meet/server";
import { sendPushToUsers } from "@/lib/push/send";
import { getEffectiveRole } from "@/lib/effective-role";

const val=(f:FormData,k:string)=>String(f.get(k)||"").trim()||null;
const lines=(v:string|null)=>(v?v.split("\n").map(x=>x.trim()).filter(Boolean):[]);
const ministrySlugs=new Set(["hearth","foundry","mens-study"]);

async function currentUser(){
 const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)redirect("/login");
 const{data:p}=await s.from("profiles").select("role,preview_role").eq("id",user.id).single();const role=getEffectiveRole(p?.role,p?.preview_role);
 return{s,user,role,isAdmin:role==="admin"};
}
async function requireAdmin(){const ctx=await currentUser();if(!ctx.isAdmin)redirect("/dashboard");return ctx;}

async function canManageGroup(userId:string,role:string,groupId:string){
 if(role==="admin")return true;const db=createAdminClient();
 const{data:facilitators}=await db.from("study_group_members").select("user_id").eq("group_id",groupId).eq("group_role","facilitator").eq("membership_status","active");const facilitatorIds=(facilitators||[]).map(x=>x.user_id);
 if(role==="facilitator")return facilitatorIds.includes(userId);
 if(role==="supervisor"){
  if(facilitatorIds.includes(userId))return true;
  const{data:rows}=await db.from("facilitator_supervision").select("facilitator_user_id").eq("supervisor_user_id",userId).in("facilitator_user_id",facilitatorIds.length?facilitatorIds:["00000000-0000-0000-0000-000000000000"]);
  return Boolean(rows?.length);
 }
 return false;
}
async function requireScheduler(groupId?:string|null){const ctx=await currentUser();if(!groupId||!await canManageGroup(ctx.user.id,ctx.role,groupId))redirect("/dashboard");return ctx;}

export async function createStudy(f:FormData){
 const{user}=await requireAdmin();const db=createAdminClient();const title=val(f,"title");if(!title)return{ok:false,message:"Add a study title before saving."};let slides:any[]=[];let devotionals:any[]=[];
 try{slides=JSON.parse(String(f.get("slides")||"[]"));devotionals=JSON.parse(String(f.get("devotional_cards")||"[]"));}catch{return{ok:false,message:"Study sections could not be saved. Please try again."};}
 const ministry=val(f,"ministry_slug");if(ministry&&!ministrySlugs.has(ministry))return{ok:false,message:"Choose a valid ministry."};
 const payload={title,subtitle:val(f,"subtitle"),description:val(f,"description"),ministry_slug:ministry,scripture_refs:lines(val(f,"scripture_refs")),slides,devotional_cards:devotionals,meeting_url:val(f,"meeting_url"),downloadable_url:val(f,"downloadable_url"),is_published:f.get("is_published")==="on",created_by:user.id};
 const{data,error}=await db.from("bible_studies").insert(payload).select("id,title").single();
 if(error||!data){console.error("Bible Study save failed",{code:error?.code,message:error?.message,details:error?.details,hint:error?.hint,userId:user.id,title});return{ok:false,message:error?.message||"The study could not be saved."};}
 console.info("Bible Study saved",{id:data.id,userId:user.id,title:data.title});revalidatePath("/studies");revalidatePath("/admin/studies");return{ok:true,id:data.id,title:data.title};
}
export async function toggleStudy(f:FormData){const{s}=await requireAdmin();const id=String(f.get("id"));const published=f.get("published")==="true";const{error}=await s.from("bible_studies").update({is_published:!published,updated_at:new Date().toISOString()}).eq("id",id);if(error)throw new Error(error.message);revalidatePath("/studies");revalidatePath("/admin/studies");}

export async function createLiveSession(f:FormData){
 const bibleStudyId=val(f,"bible_study_id"),ministrySlug=val(f,"ministry_slug"),groupId=val(f,"group_id"),facilitatorUserId=val(f,"facilitator_user_id"),scheduledStart=val(f,"scheduled_start"),scheduledEnd=val(f,"scheduled_end");
 if(!groupId)return{ok:false,message:"Choose a saved study group first."};const ctx=await requireScheduler(groupId);const db=createAdminClient();let participantIds=Array.from(new Set(f.getAll("participant_user_id").map(String).filter(Boolean)));
 if(!bibleStudyId)return{ok:false,message:"Choose a Bible study."};if(!ministrySlug||!ministrySlugs.has(ministrySlug))return{ok:false,message:"Choose a ministry for the live study."};if(!scheduledStart||Number.isNaN(Date.parse(scheduledStart)))return{ok:false,message:"Choose a valid start date and time."};if(scheduledEnd&&new Date(scheduledEnd)<=new Date(scheduledStart))return{ok:false,message:"The end time must be after the start time."};
 const{data:study,error:studyError}=await db.from("bible_studies").select("id,title").eq("id",bibleStudyId).maybeSingle();if(studyError||!study)return{ok:false,message:"Bible study not found."};
 const{data:g,error:groupError}=await db.from("study_groups").select("id,ministry_slug,status").eq("id",groupId).maybeSingle();if(groupError||!g||g.status!=="active")return{ok:false,message:"Choose an active study group."};if(g.ministry_slug!==ministrySlug)return{ok:false,message:"The selected group belongs to a different ministry."};
 const{data:roster,error:rosterError}=await db.from("study_group_members").select("user_id,group_role").eq("group_id",groupId).eq("membership_status","active");if(rosterError)return{ok:false,message:"The group roster could not be loaded."};const allowed=new Set((roster||[]).map(r=>r.user_id));participantIds=participantIds.filter(id=>allowed.has(id));
 if(!participantIds.length)return{ok:false,message:"Select at least one participant from this group."};
 if(facilitatorUserId){const facilitatorAllowed=(roster||[]).some(r=>r.user_id===facilitatorUserId&&r.group_role==="facilitator");if(!facilitatorAllowed)return{ok:false,message:"Choose a facilitator assigned to this group."};}
 const{data:existing}=await db.from("study_sessions").select("id").eq("bible_study_id",bibleStudyId).eq("group_id",groupId).eq("scheduled_start",scheduledStart).eq("status","scheduled").maybeSingle();
 if(existing){revalidatePath("/admin/studies");return{ok:true,id:existing.id,existing:true,message:"This live study was already scheduled."};}
 const{data:session,error}=await db.from("study_sessions").insert({bible_study_id:bibleStudyId,ministry_slug:ministrySlug,group_id:groupId,facilitator_user_id:facilitatorUserId,scheduled_start:scheduledStart,scheduled_end:scheduledEnd,status:"scheduled",created_by:ctx.user.id}).select("id").single();if(error||!session){console.error("Live study save failed",{code:error?.code,message:error?.message,details:error?.details,hint:error?.hint});return{ok:false,message:error?.message||"Unable to create session."};}
 const{error:pe}=await db.from("study_session_participants").insert(participantIds.map(user_id=>({study_session_id:session.id,user_id,assigned_by:ctx.user.id})));if(pe){await db.from("study_sessions").delete().eq("id",session.id);console.error("Live study participant save failed",{sessionId:session.id,message:pe.message});return{ok:false,message:"The session could not save its participant roster."};}
 const when=new Intl.DateTimeFormat("en-US",{dateStyle:"medium",timeStyle:"short",timeZone:"America/New_York"}).format(new Date(scheduledStart));
 const{error:notificationError}=await db.from("notifications").insert(participantIds.map(user_id=>({user_id,type:"live_study",title:"Live Study Scheduled",body:`${study.title} · ${when} ET`,link:"/dashboard",push_status:"pending"})));
 if(notificationError)console.error("Live study in-app notification save failed",{sessionId:session.id,message:notificationError.message});
 let pushDelivered=true;try{await sendPushToUsers(participantIds,{title:"Live Study Scheduled",body:`${study.title} · ${when} ET`,url:"/dashboard"});}catch(pushError){pushDelivered=false;console.error("Live study push send failed",{sessionId:session.id,error:pushError instanceof Error?pushError.message:String(pushError)});}
 revalidatePath("/admin/studies");revalidatePath("/admin/studies/groups");revalidatePath("/dashboard");revalidatePath(`/studies/${bibleStudyId}`);
 console.info("Live study saved",{sessionId:session.id,participantCount:participantIds.length,pushDelivered});
 return{ok:true,id:session.id,participantCount:participantIds.length,pushDelivered,notificationStored:!notificationError};
}

async function assertSessionManager(sessionId:string){
 const ctx=await currentUser();const db=createAdminClient();const{data:session}=await db.from("study_sessions").select("id,bible_study_id,group_id,facilitator_user_id,google_space_name,google_meeting_uri,daily_path_released_at").eq("id",sessionId).maybeSingle();if(!session)throw new Error("Live study session not found.");
 // Administrators manage the complete study-session catalog, including legacy/test sessions
 // that may predate study groups. Supervisors and facilitators remain group-scoped.
 if(!ctx.isAdmin&&(!session.group_id||!await canManageGroup(ctx.user.id,ctx.role,session.group_id)))throw new Error("You do not manage this session.");return{ctx,db,session};
}

export async function provisionLiveSession(f:FormData){const sessionId=val(f,"session_id");if(!sessionId)throw new Error("Missing live study session.");const{db,session}=await assertSessionManager(sessionId);if(session.google_space_name&&session.google_meeting_uri)return;let facilitatorEmail:string|null=null;if(session.facilitator_user_id){const{data:facilitator}=await db.from("profiles").select("email").eq("id",session.facilitator_user_id).maybeSingle();facilitatorEmail=facilitator?.email||null;}const meeting=await provisionMeetSpace(facilitatorEmail);const{error:updateError}=await db.from("study_sessions").update({google_space_name:meeting.spaceName,google_meeting_code:meeting.meetingCode,google_meeting_uri:meeting.meetingUri,google_organizer_email:meeting.organizerEmail,updated_at:new Date().toISOString()}).eq("id",sessionId).is("google_space_name",null);if(updateError)throw new Error(updateError.message);revalidatePath("/admin/studies");revalidatePath("/dashboard");revalidatePath(`/studies/${session.bible_study_id}`);}

export async function endAndReleaseDailyPath(f:FormData){const sessionId=val(f,"session_id");if(!sessionId)throw new Error("Missing study session.");const{db,session}=await assertSessionManager(sessionId);if(session.daily_path_released_at)return;const now=new Date().toISOString();const{error}=await db.from("study_sessions").update({status:"completed",ended_at:now,daily_path_released_at:now,updated_at:now}).eq("id",sessionId);if(error)throw new Error(error.message);const[{data:participants},{data:study}]=await Promise.all([db.from("study_session_participants").select("user_id").eq("study_session_id",sessionId),db.from("bible_studies").select("title,devotional_cards").eq("id",session.bible_study_id).maybeSingle()]);const ids=(participants||[]).map(p=>p.user_id);if(ids.length&&Array.isArray(study?.devotional_cards)&&study.devotional_cards.length){await db.from("notifications").insert(ids.map(user_id=>({user_id,type:"daily_study",title:"Day 1 is ready",body:`Continue ${study?.title||"your Bible study"} in Daily Path.`,link:`/study-path/${sessionId}/1`,push_status:"pending"})));await sendPushToUsers(ids,{title:"Day 1 is ready",body:`Continue ${study?.title||"your Bible study"} in Daily Path.`,url:`/study-path/${sessionId}/1`});}revalidatePath("/admin/studies");revalidatePath("/dashboard");}
