"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function currentUser(){const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)redirect("/login");return{s,user};}
const t=(f:FormData,k:string)=>String(f.get(k)||"").trim();
async function assertDailyPathAccess(s:any,userId:string,sessionId:string,day:number){
 if(!Number.isInteger(day)||day<1||day>31)throw new Error("Choose a valid Daily Path day.");
 const[{data:participant},{data:session}]=await Promise.all([
  s.from("study_session_participants").select("study_session_id").eq("study_session_id",sessionId).eq("user_id",userId).maybeSingle(),
  s.from("study_sessions").select("daily_path_released_at,bible_studies(devotional_cards)").eq("id",sessionId).maybeSingle()
 ]);
 if(!participant||!session)throw new Error("You are not assigned to this study session.");
 if(!session.daily_path_released_at)throw new Error("Daily Path has not been released yet.");
 const study:any=Array.isArray((session as any).bible_studies)?(session as any).bible_studies[0]:(session as any).bible_studies;
 const cards=Array.isArray(study?.devotional_cards)?study.devotional_cards:[];
 if(day>cards.length)throw new Error("That Daily Path day does not exist.");
 const releaseMs=new Date(session.daily_path_released_at).getTime();const nowMs=Date.now();
 if(!Number.isFinite(releaseMs)||nowMs<releaseMs)throw new Error("That Daily Path day is not available yet.");
 const unlocked=Math.min(cards.length,Math.max(1,Math.floor((nowMs-releaseMs)/86400000)+1));
 if(day>unlocked)throw new Error("That Daily Path day is not available yet.");
}
export async function savePrivateJournal(f:FormData){const{s,user}=await currentUser();const sessionId=t(f,"session_id"),day=Number(t(f,"day_number")),response=t(f,"response_text");await assertDailyPathAccess(s,user.id,sessionId,day);const{error}=await s.from("study_daily_responses").upsert({study_session_id:sessionId,user_id:user.id,day_number:day,response_type:"private_journal",response_text:response},{onConflict:"study_session_id,user_id,day_number,response_type"});if(error)throw new Error(error.message);revalidatePath(`/study-path/${sessionId}/${day}`);}
export async function lockGroupResponse(f:FormData){const{s,user}=await currentUser();const sessionId=t(f,"session_id"),day=Number(t(f,"day_number")),response=t(f,"response_text");if(!response)throw new Error("Write your response before revealing the group.");await assertDailyPathAccess(s,user.id,sessionId,day);const{data:existing}=await s.from("study_daily_responses").select("locked_at").eq("study_session_id",sessionId).eq("user_id",user.id).eq("day_number",day).eq("response_type","group_response").maybeSingle();if(existing?.locked_at)throw new Error("Your group response is already locked.");const{error}=await s.from("study_daily_responses").upsert({study_session_id:sessionId,user_id:user.id,day_number:day,response_type:"group_response",response_text:response,locked_at:new Date().toISOString()},{onConflict:"study_session_id,user_id,day_number,response_type"});if(error)throw new Error(error.message);revalidatePath(`/study-path/${sessionId}/${day}`);}
export async function savePersonalReflection(f:FormData){const{s,user}=await currentUser();const sessionId=t(f,"session_id"),day=Number(t(f,"day_number")),response=t(f,"response_text");await assertDailyPathAccess(s,user.id,sessionId,day);const{error}=await s.from("study_daily_responses").upsert({study_session_id:sessionId,user_id:user.id,day_number:day,response_type:"personal_reflection",response_text:response},{onConflict:"study_session_id,user_id,day_number,response_type"});if(error)throw new Error(error.message);revalidatePath(`/study-path/${sessionId}/${day}`);}
export async function completeDailyStudy(f:FormData){const{s,user}=await currentUser();const sessionId=t(f,"session_id"),day=Number(t(f,"day_number"));await assertDailyPathAccess(s,user.id,sessionId,day);const{error}=await s.from("study_daily_progress").upsert({study_session_id:sessionId,user_id:user.id,day_number:day,opened_at:new Date().toISOString(),completed_at:new Date().toISOString()},{onConflict:"study_session_id,user_id,day_number"});if(error)throw new Error(error.message);revalidatePath(`/study-path/${sessionId}/${day}`);revalidatePath("/dashboard");}
