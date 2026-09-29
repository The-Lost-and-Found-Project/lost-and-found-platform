import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveRole } from "@/lib/effective-role";
import LfLiveRoom from "@/components/LfLiveRoom";
import LfLiveFullscreen from "@/components/LfLiveFullscreen";
import LfLiveTimingControl from "@/components/LfLiveTimingControl";

export const dynamic="force-dynamic";
export default async function LiveRoomPage({params}:{params:Promise<{sessionId:string}>}){
 const{sessionId}=await params;const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)redirect(`/login?next=/live/${sessionId}`);
 const db=createAdminClient();
 const[{data:profile},{data:session},{data:extensions},{data:participant}]=await Promise.all([
  db.from("profiles").select("role,preview_role,is_active").eq("id",user.id).maybeSingle(),
  db.from("study_sessions").select("facilitator_user_id,created_by,status,live_started_at,live_ended_at").eq("id",sessionId).maybeSingle(),
  db.from("study_session_extensions").select("extension_level,status,requested_minutes").eq("session_id",sessionId).eq("status","approved"),
  db.from("study_session_participants").select("study_session_id").eq("study_session_id",sessionId).eq("user_id",user.id).maybeSingle()
 ]);
 if(!profile?.is_active||!session||session.status==="completed"||session.status==="cancelled"||session.live_ended_at)redirect("/events");
 const role=getEffectiveRole(profile?.role,profile?.preview_role);
 let supervisor=false;if(role==="supervisor"&&session.facilitator_user_id){const{data}=await db.from("facilitator_supervision").select("facilitator_user_id").eq("supervisor_user_id",user.id).eq("facilitator_user_id",session.facilitator_user_id).maybeSingle();supervisor=Boolean(data);}
 const facilitator=role==="admin"||session?.facilitator_user_id===user.id||(!session?.facilitator_user_id&&session?.created_by===user.id);
 if(!participant&&!facilitator&&!supervisor)redirect("/events");
 const levels=new Set((extensions||[]).map(x=>x.extension_level));
 const adminMinutes=(extensions||[]).filter(x=>x.extension_level==="admin_override").reduce((sum,x)=>sum+Number(x.requested_minutes||0),0);
 const maxMinutes=(levels.has("supervisor_15")?105:levels.has("facilitator_15")?90:75)+adminMinutes;
 return <LfLiveFullscreen><LfLiveRoom sessionId={sessionId}/><LfLiveTimingControl sessionId={sessionId} startedAt={session?.live_started_at||null} facilitator={facilitator} initialMaxMinutes={maxMinutes}/></LfLiveFullscreen>;
}
