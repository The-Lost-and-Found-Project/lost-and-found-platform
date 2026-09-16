"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveRole } from "@/lib/effective-role";
import { sendPushToUsers } from "@/lib/push/send";
import { LF_LIVE_POLICY } from "@/lib/lf-live/policy";

async function context(){
  const s=await createClient();
  const {data:{user}}=await s.auth.getUser();
  if(!user) redirect("/login");
  const {data:profile}=await s.from("profiles").select("role,preview_role,full_name,email").eq("id",user.id).single();
  return {user,role:getEffectiveRole(profile?.role,profile?.preview_role),profile,db:createAdminClient()};
}

async function loadSession(db:ReturnType<typeof createAdminClient>,sessionId:string){
  const {data:session}=await db.from("study_sessions").select("id,bible_study_id,group_id,facilitator_user_id,created_by,status,scheduled_start,live_started_at,live_ended_at").eq("id",sessionId).maybeSingle();
  if(!session) throw new Error("Live study session not found.");
  return session;
}

async function adminIds(db:ReturnType<typeof createAdminClient>){
  const {data}=await db.from("profiles").select("id").eq("role","admin").eq("is_active",true);
  return (data||[]).map(x=>x.id);
}

async function supervisorIds(db:ReturnType<typeof createAdminClient>,facilitatorUserId:string|null){
  if(!facilitatorUserId) return [] as string[];
  const {data}=await db.from("facilitator_supervision").select("supervisor_user_id").eq("facilitator_user_id",facilitatorUserId);
  return Array.from(new Set((data||[]).map(x=>x.supervisor_user_id).filter(Boolean)));
}

export async function requestInitialLiveExtension(sessionId:string,reason:string){
  const cleanReason=reason.trim();
  if(cleanReason.length<3) return {ok:false,message:"Enter a short reason for the extension."};
  const {user,role,profile,db}=await context();
  const session=await loadSession(db,sessionId);
  const allowed=role==="admin"||session.facilitator_user_id===user.id||(!session.facilitator_user_id&&session.created_by===user.id);
  if(!allowed) return {ok:false,message:"You are not the facilitator for this live study."};
  const {data:existing}=await db.from("study_session_extensions").select("id,status").eq("session_id",sessionId).eq("extension_level","facilitator_15").maybeSingle();
  if(existing) return {ok:true,existing:true,message:"The 15-minute extension has already been recorded."};
  const now=new Date().toISOString();
  const {data:extension,error}=await db.from("study_session_extensions").insert({session_id:sessionId,requested_by:user.id,extension_level:"facilitator_15",reason:cleanReason,requested_minutes:LF_LIVE_POLICY.facilitatorExtensionMinutes,status:"approved",decided_by:user.id,decided_at:now,metadata:{automatic:true}}).select("id").single();
  if(error||!extension) return {ok:false,message:error?.message||"Unable to extend the live study."};
  const supervisors=await supervisorIds(db,session.facilitator_user_id||user.id);
  const recipients=supervisors.length?supervisors:await adminIds(db);
  const facilitatorName=profile?.full_name||profile?.email||"A facilitator";
  if(recipients.length){
    const title="L&F Live extended to 90 minutes";
    const body=`${facilitatorName}: ${cleanReason}`;
    await db.from("notifications").insert(recipients.map(user_id=>({user_id,type:"live_extension",title,body,link:"/admin/live",push_status:"pending"})));
    try{await sendPushToUsers(recipients,{title,body,url:"/admin/live"});}catch(error){console.error("L&F Live supervisor extension push failed",error);}
  }
  revalidatePath("/admin/live");
  revalidatePath("/admin/studies");
  return {ok:true,extensionId:extension.id,minutesAdded:15,maxMinutes:90};
}

export async function approveSupervisorOverride(extensionId:string){
  const {user,role,db}=await context();
  if(role!=="supervisor"&&role!=="admin") return {ok:false,message:"Supervisor approval is required."};
  const {data:base}=await db.from("study_session_extensions").select("id,session_id,requested_by,reason,status").eq("id",extensionId).eq("extension_level","facilitator_15").maybeSingle();
  if(!base) return {ok:false,message:"Extension request not found."};
  const session=await loadSession(db,base.session_id);
  if(role==="supervisor"){
    const supervisors=await supervisorIds(db,session.facilitator_user_id);
    if(!supervisors.includes(user.id)) return {ok:false,message:"This facilitator is not assigned to you."};
  }
  const {data:existing}=await db.from("study_session_extensions").select("id").eq("session_id",base.session_id).eq("extension_level","supervisor_15").maybeSingle();
  if(existing) return {ok:true,existing:true,maxMinutes:105};
  const now=new Date().toISOString();
  const {data:approved,error}=await db.from("study_session_extensions").insert({session_id:base.session_id,requested_by:base.requested_by,extension_level:"supervisor_15",reason:`Supervisor override approved after initial reason: ${base.reason}`,requested_minutes:LF_LIVE_POLICY.supervisorExtensionMinutes,status:"approved",decided_by:user.id,decided_at:now,metadata:{source_extension_id:base.id}}).select("id").single();
  if(error||!approved) return {ok:false,message:error?.message||"Unable to approve the override."};
  revalidatePath("/admin/live");
  return {ok:true,extensionId:approved.id,minutesAdded:15,maxMinutes:105};
}

export async function requestAdminOverride(sessionId:string,reason:string,minutes=15){
  const cleanReason=reason.trim();
  if(cleanReason.length<3) return {ok:false,message:"Enter the reason additional time is needed."};
  const {user,role,db}=await context();
  if(role!=="supervisor"&&role!=="admin") return {ok:false,message:"Supervisor or administrator access is required."};
  const session=await loadSession(db,sessionId);
  if(role==="supervisor"){
    const supervisors=await supervisorIds(db,session.facilitator_user_id);
    if(!supervisors.includes(user.id)) return {ok:false,message:"This facilitator is not assigned to you."};
  }
  const admins=await adminIds(db);
  const {data:request,error}=await db.from("study_session_extensions").insert({session_id:sessionId,requested_by:user.id,extension_level:"admin_override",reason:cleanReason,requested_minutes:Math.max(1,Math.min(60,minutes)),status:role==="admin"?"approved":"pending",decided_by:role==="admin"?user.id:null,decided_at:role==="admin"?new Date().toISOString():null}).select("id").single();
  if(error||!request) return {ok:false,message:error?.message||"Unable to request admin approval."};
  if(role!=="admin"&&admins.length){
    const title="L&F Live admin override requested";
    const body=cleanReason;
    await db.from("notifications").insert(admins.map(user_id=>({user_id,type:"live_extension_admin",title,body,link:"/admin/live",push_status:"pending"})));
    try{await sendPushToUsers(admins,{title,body,url:"/admin/live"});}catch(error){console.error("L&F Live admin override push failed",error);}
  }
  revalidatePath("/admin/live");
  return {ok:true,extensionId:request.id,status:role==="admin"?"approved":"pending"};
}

export async function decideAdminOverride(extensionId:string,approve:boolean){
  const {user,role,db}=await context();
  if(role!=="admin") return {ok:false,message:"Administrator approval is required."};
  const {data,error}=await db.from("study_session_extensions").update({status:approve?"approved":"denied",decided_by:user.id,decided_at:new Date().toISOString()}).eq("id",extensionId).eq("extension_level","admin_override").eq("status","pending").select("id,session_id,requested_by,requested_minutes").maybeSingle();
  if(error||!data) return {ok:false,message:error?.message||"The override request is no longer pending."};
  const title=approve?"L&F Live override approved":"L&F Live override denied";
  const body=approve?`${data.requested_minutes} additional minutes were approved.`:"The requested additional meeting time was not approved.";
  await db.from("notifications").insert({user_id:data.requested_by,type:"live_extension_decision",title,body,link:"/admin/live",push_status:"pending"});
  try{await sendPushToUsers([data.requested_by],{title,body,url:"/admin/live"});}catch(error){console.error("L&F Live override decision push failed",error);}
  revalidatePath("/admin/live");
  return {ok:true,status:approve?"approved":"denied"};
}
