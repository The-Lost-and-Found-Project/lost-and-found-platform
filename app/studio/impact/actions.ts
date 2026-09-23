"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
async function admin(){const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)redirect("/login");const{data:p}=await s.from("profiles").select("role").eq("id",user.id).maybeSingle();if(p?.role!=="admin")redirect("/dashboard");return{s,user}}
const v=(f:FormData,k:string)=>String(f.get(k)||"").trim()||null;
export async function createImpactUpdate(f:FormData){const{s,user}=await admin();const title=v(f,"title"),summary=v(f,"summary");if(!title||!summary)return;const{error}=await s.from("ministry_impact_updates").insert({title,summary,ministry_slug:v(f,"ministry_slug"),occurred_on:v(f,"occurred_on")||new Date().toISOString().slice(0,10),created_by:user.id});if(error)throw new Error(error.message);revalidatePath("/studio/impact");}
export async function verifyImpactUpdate(f:FormData){const{s,user}=await admin();const id=v(f,"id");if(!id)return;const{error}=await s.from("ministry_impact_updates").update({status:"verified",verified_by:user.id,verified_at:new Date().toISOString()}).eq("id",id);if(error)throw new Error(error.message);revalidatePath("/studio/impact");revalidatePath("/account/giving");revalidatePath("/give");}
