"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveRole } from "@/lib/effective-role";

async function adminContext(){const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)redirect("/login");const{data:p}=await s.from("profiles").select("role,preview_role").eq("id",user.id).single();if(getEffectiveRole(p?.role,p?.preview_role)!=="admin")redirect("/dashboard");return {s,user,admin:createAdminClient()}}
export async function createStudySession(fd:FormData){const{user,admin}=await adminContext();const studyId=String(fd.get("study_id")||"");const ministryKey=String(fd.get("ministry_key")||"general");if(!studyId)return;const{error}=await admin.from("bible_study_sessions").insert({study_id:studyId,facilitator_id:user.id,ministry_key:ministryKey,status:"scheduled"});if(error)throw new Error(error.message);revalidatePath("/admin/study-journeys")}
export async function startLiveSession(fd:FormData){const{user,admin}=await adminContext();const id=String(fd.get("session_id"));const{error}=await admin.from("bible_study_sessions").update({status:"live",live_started_at:new Date().toISOString()}).eq("id",id).eq("facilitator_id",user.id);if(error)throw new Error(error.message);revalidatePath("/admin/study-journeys")}
export async function endLiveSession(fd:FormData){const{user,admin}=await adminContext();const id=String(fd.get("session_id"));const{error}=await admin.from("bible_study_sessions").update({live_ended_at:new Date().toISOString()}).eq("id",id).eq("facilitator_id",user.id);if(error)throw new Error(error.message);revalidatePath("/admin/study-journeys")}
export async function startFollowUp(fd:FormData){const{s}=await adminContext();const{error}=await s.rpc("start_bible_study_journey",{p_session_id:String(fd.get("session_id"))});if(error)throw new Error(error.message);revalidatePath("/admin/study-journeys")}
export async function changeJourneyState(fd:FormData){const{s}=await adminContext();const{error}=await s.rpc("set_bible_study_journey_state",{p_session_id:String(fd.get("session_id")),p_action:String(fd.get("action"))});if(error)throw new Error(error.message);revalidatePath("/admin/study-journeys")}
