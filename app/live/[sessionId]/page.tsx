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
 const[{data:profile},{data:session},{data:extensions}]=await Promise.all([
  db.from("profiles").select("role,preview_role").eq("id",user.id).maybeSingle(),
  db.from("study_sessions").select("facilitator_user_id,created_by,live_started_at").eq("id",sessionId).maybeSingle(),
  db.from("study_session_extensions").select("extension_level,status").eq("session_id",sessionId).eq("status","approved")
 ]);
 const role=getEffectiveRole(profile?.role,profile?.preview_role);
 const facilitator=role==="admin"||session?.facilitator_user_id===user.id||(!session?.facilitator_user_id&&session?.created_by===user.id);
 const levels=new Set((extensions||[]).map(x=>x.extension_level));
 const maxMinutes=levels.has("admin_override")?120:levels.has("supervisor_15")?105:levels.has("facilitator_15")?90:75;
 return <LfLiveFullscreen><LfLiveRoom sessionId={sessionId}/><LfLiveTimingControl sessionId={sessionId} startedAt={session?.live_started_at||null} facilitator={facilitator} initialMaxMinutes={maxMinutes}/></LfLiveFullscreen>;
}
