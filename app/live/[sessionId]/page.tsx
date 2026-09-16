import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LfLiveRoom from "@/components/LfLiveRoom";

export const dynamic="force-dynamic";
export default async function LiveRoomPage({params}:{params:Promise<{sessionId:string}>}){const{sessionId}=await params;const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)redirect(`/login?next=/live/${sessionId}`);return <LfLiveRoom sessionId={sessionId}/>;}
