import {notFound,redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {canManageStudies,getEffectiveRole} from "@/lib/effective-role";
import DiscoveryStudyPilot from "@/components/DiscoveryStudyPilot";
import {JAMES_DISCOVERY_LEADER_NOTES} from "@/lib/studies/discovery-leader-notes";

export const dynamic="force-dynamic";
type Props={searchParams:Promise<{phase?:string}>};
export default async function DiscoveryFacilitatorPreview({searchParams}:Props){
 if(process.env.LNF_DISCOVERY_PILOT_ENABLED!=="true")notFound();
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login?next=/studies/discovery-pilot");
 const {data:profile}=await supabase.from("profiles").select("role,preview_role").eq("id",user.id).single();
 const role=getEffectiveRole(profile?.role,profile?.preview_role);
 if(!canManageStudies(role))notFound();
 const params=await searchParams;
 const proposed=Number(params.phase??"1");
 const initialPhase=Number.isSafeInteger(proposed)?Math.max(0,Math.min(7,proposed-1)):0;
 return <DiscoveryStudyPilot mode="facilitator" leaderNotes={JAMES_DISCOVERY_LEADER_NOTES} initialPhase={initialPhase}/>;
}
