import { NextRequest,NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveRole } from "@/lib/effective-role";
import { createDailyMeetingToken,ensureDailyRoom,isDailyConfigured } from "@/lib/lf-live/daily";
import { facilitatorSlides,participantSlides } from "@/lib/studies/live-content";

export const dynamic="force-dynamic";

export async function POST(_request:NextRequest,{params}:{params:Promise<{sessionId:string}>}){
 try{
  const{sessionId}=await params;const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)return NextResponse.json({error:"Not signed in"},{status:401});
  const db=createAdminClient();const[{data:profile},{data:session},{data:participant}]=await Promise.all([
   db.from("profiles").select("full_name,email,role,preview_role,is_active").eq("id",user.id).maybeSingle(),
   db.from("study_sessions").select("id,bible_study_id,group_id,facilitator_user_id,created_by,status,live_provider,live_room_name,live_started_at,live_ended_at,bible_studies(title,subtitle,slides)").eq("id",sessionId).maybeSingle(),
   db.from("study_session_participants").select("study_session_id").eq("study_session_id",sessionId).eq("user_id",user.id).maybeSingle()
  ]);
  if(!profile?.is_active)return NextResponse.json({error:"Your L&F account is not active."},{status:403});if(!session)return NextResponse.json({error:"Live study not found."},{status:404});if(session.status==="completed"||session.status==="cancelled"||session.live_ended_at)return NextResponse.json({error:"This live study has ended."},{status:410});
  const role=getEffectiveRole(profile.role,profile.preview_role);let supervisor=false;if(role==="supervisor"&&session.facilitator_user_id){const{data}=await db.from("facilitator_supervision").select("facilitator_user_id").eq("supervisor_user_id",user.id).eq("facilitator_user_id",session.facilitator_user_id).maybeSingle();supervisor=Boolean(data);}
  const facilitator=role==="admin"||session.facilitator_user_id===user.id||(!session.facilitator_user_id&&session.created_by===user.id);if(!participant&&!facilitator&&!supervisor)return NextResponse.json({error:"You are not assigned to this live study."},{status:403});
  const study:any=Array.isArray((session as any).bible_studies)?(session as any).bible_studies[0]:(session as any).bible_studies;
  // Supervisors can observe the room, but private teaching material remains facilitator/admin-only.
  const slides=facilitator?facilitatorSlides(study?.slides):participantSlides(study?.slides);
  if(!isDailyConfigured())return NextResponse.json({configured:false,sessionId,title:study?.title||"L&F Live Study",subtitle:study?.subtitle||null,slides,facilitator,supervisor,message:"L&F Live is built and waiting for the Daily API key. Google Meet remains available as fallback."});
  const room=await ensureDailyRoom(sessionId,session.live_provider==="daily"?session.live_room_name:null);if(session.live_provider!=="daily"||session.live_room_name!==room.name){await db.from("study_sessions").update({live_provider:"daily",live_room_name:room.name,updated_at:new Date().toISOString()}).eq("id",sessionId);}
  const token=await createDailyMeetingToken({roomName:room.name,userId:user.id,userName:profile.full_name||profile.email||"L&F member",owner:facilitator});
  return NextResponse.json({configured:true,sessionId,roomUrl:room.url,token,title:study?.title||"L&F Live Study",subtitle:study?.subtitle||null,slides,facilitator,supervisor});
 }catch(error){console.error("L&F Live join failed",error);return NextResponse.json({error:error instanceof Error?error.message:"Unable to join L&F Live."},{status:500});}
}
