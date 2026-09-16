import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveRole } from "@/lib/effective-role";
import { closeDailyRoom } from "@/lib/lf-live/daily";
import { sendPushToUsers } from "@/lib/push/send";

export async function POST(_request:Request,{params}:{params:Promise<{sessionId:string}>}){
 const{sessionId}=await params;const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)return NextResponse.json({error:"Not signed in"},{status:401});const db=createAdminClient();
 const[{data:p},{data:ss}]=await Promise.all([db.from("profiles").select("role,preview_role").eq("id",user.id).maybeSingle(),db.from("study_sessions").select("id,bible_study_id,facilitator_user_id,created_by,live_started_at,live_ended_at,live_room_name,daily_path_released_at").eq("id",sessionId).maybeSingle()]);
 if(!ss)return NextResponse.json({error:"Not found"},{status:404});const role=getEffectiveRole(p?.role,p?.preview_role);const facilitator=role==="admin"||ss.facilitator_user_id===user.id||(!ss.facilitator_user_id&&ss.created_by===user.id);if(!facilitator)return NextResponse.json({error:"Facilitator access required"},{status:403});if(ss.live_ended_at)return NextResponse.json({ok:true,alreadyEnded:true});
 const now=new Date();const{data:presence}=await db.from("study_session_live_presence").select("joined_at,last_seen_at,left_at").eq("session_id",sessionId);let participantMinutes=0;for(const row of presence||[]){const start=new Date(row.joined_at).getTime();const end=new Date(row.left_at||row.last_seen_at||now.toISOString()).getTime();if(Number.isFinite(start)&&Number.isFinite(end)&&end>start)participantMinutes+=Math.ceil((end-start)/60000);}const ended=now.toISOString();
 const{error}=await db.from("study_sessions").update({live_ended_at:ended,live_participant_minutes:participantMinutes,status:"completed",ended_at:ended,daily_path_released_at:ss.daily_path_released_at||ended,updated_at:ended}).eq("id",sessionId);if(error)return NextResponse.json({error:error.message},{status:500});
 let roomClosed=true;if(ss.live_room_name){try{await closeDailyRoom(ss.live_room_name)}catch{roomClosed=false}}
 if(!ss.daily_path_released_at){
  const[{data:participants},{data:study}]=await Promise.all([db.from("study_session_participants").select("user_id").eq("study_session_id",sessionId),db.from("bible_studies").select("title,devotional_cards").eq("id",ss.bible_study_id).maybeSingle()]);const ids=(participants||[]).map(x=>x.user_id);
  if(ids.length&&Array.isArray(study?.devotional_cards)&&study.devotional_cards.length){const body=`Continue ${study?.title||"your Bible study"} in Daily Path.`;await db.from("notifications").insert(ids.map(user_id=>({user_id,type:"daily_study",title:"Day 1 is ready",body,link:`/study-path/${sessionId}/1`,push_status:"pending"})));try{await sendPushToUsers(ids,{title:"Day 1 is ready",body,url:`/study-path/${sessionId}/1`})}catch(pushError){console.error("Daily Path push failed",{sessionId,error:pushError instanceof Error?pushError.message:String(pushError)})}}
 }
 return NextResponse.json({ok:true,participantMinutes,roomClosed,dailyPathReleased:true});
}
