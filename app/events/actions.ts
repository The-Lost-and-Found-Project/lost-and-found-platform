"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowed=new Set(["going","maybe","declined"]);

export async function respondToInvitation(formData:FormData){
 const sessionId=String(formData.get("session_id")||"").trim();
 const status=String(formData.get("status")||"").trim();
 if(!sessionId||!allowed.has(status))throw new Error("Choose a valid gathering response.");
 const supabase=await createClient();
 const{data:{user}}=await supabase.auth.getUser();
 if(!user)redirect("/login?next=%2Fevents");
 const{error}=await supabase.rpc("respond_to_study_session",{p_session_id:sessionId,p_status:status});
 if(error)throw new Error(error.message);
 revalidatePath("/events");
 revalidatePath("/dashboard");
}
