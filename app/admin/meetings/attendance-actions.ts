"use server";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {getEffectiveRole,canManageStudies} from "@/lib/effective-role";

export async function saveMeetingAttendance(form:FormData){
 const sessionId=String(form.get("session_id")||"");
 const userId=String(form.get("user_id")||"");
 const status=String(form.get("status")||"");
 if(!/^[0-9a-f-]{36}$/i.test(sessionId)||!/^[0-9a-f-]{36}$/i.test(userId)||!["present","absent","excused","unmarked"].includes(status))throw new Error("Invalid attendance request.");
 const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)throw new Error("Sign in to record attendance.");
 const {data:p}=await s.from("profiles").select("role,preview_role").eq("id",user.id).maybeSingle();
 const role=getEffectiveRole(p?.role,p?.preview_role);if(!canManageStudies(role))throw new Error("Not authorized.");
 const db=createAdminClient();
 const {data:session}=await db.from("study_sessions").select("id,group_id").eq("id",sessionId).maybeSingle();
 if(!session)throw new Error("Meeting not found.");
 if(role!=="admin"){
  if(!session.group_id)throw new Error("Not authorized.");
  const {data:facilitators}=await db.from("study_group_members").select("user_id").eq("group_id",session.group_id).eq("group_role","facilitator").eq("membership_status","active");
  const ids=(facilitators||[]).map(x=>x.user_id);
  let allowed=ids.includes(user.id);
  if(!allowed&&role==="supervisor"&&ids.length){
   const {data:supervised}=await db.from("facilitator_supervision").select("facilitator_user_id").eq("supervisor_user_id",user.id).in("facilitator_user_id",ids);
   allowed=Boolean(supervised?.length);
  }
  if(!allowed)throw new Error("Not authorized.");
 }
 const {data:assigned}=await db.from("study_session_participants").select("user_id").eq("study_session_id",sessionId).eq("user_id",userId).maybeSingle();
 if(!assigned)throw new Error("Only assigned participants can be marked.");
 if(status==="unmarked"){
  const {error}=await db.from("study_session_attendance").delete().eq("session_id",sessionId).eq("user_id",userId);
  if(error)throw new Error("Attendance could not be cleared.");
 }else{
  const {error}=await db.from("study_session_attendance").upsert({session_id:sessionId,user_id:userId,status,recorded_by:user.id,recorded_at:new Date().toISOString()},{onConflict:"session_id,user_id"});
  if(error)throw new Error("Attendance could not be saved.");
 }
 revalidatePath(`/admin/meetings/${sessionId}`);
}
