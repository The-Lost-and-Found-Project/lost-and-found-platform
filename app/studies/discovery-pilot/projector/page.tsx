import {notFound,redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import DiscoveryStudyPilot from "@/components/DiscoveryStudyPilot";

export const dynamic="force-dynamic";
type Props={searchParams:Promise<{phase?:string}>};
export default async function DiscoveryGroupPreview({searchParams}:Props){
 if(process.env.LNF_DISCOVERY_PILOT_ENABLED!=="true")notFound();
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login?next=/studies/discovery-pilot/projector");
 const params=await searchParams;
 const proposed=Number(params.phase??"1");
 const initialPhase=Number.isSafeInteger(proposed)?Math.max(0,Math.min(7,proposed-1)):0;
 return <DiscoveryStudyPilot mode="projector" initialPhase={initialPhase}/>;
}
