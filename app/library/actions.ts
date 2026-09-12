"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/login");
  return {supabase,user};
}

export async function setContentProgress(formData:FormData){
  const {supabase,user}=await requireUser();
  const contentId=String(formData.get("content_id")??"");
  const slug=String(formData.get("slug")??"");
  const status=String(formData.get("status")??"saved");
  const progress=status==="completed"?100:status==="started"?10:0;
  if(!contentId)return;
  const {error}=await supabase.from("content_progress").upsert({user_id:user.id,content_id:contentId,status,progress_percent:progress,updated_at:new Date().toISOString()},{onConflict:"user_id,content_id"});
  if(error)throw new Error(error.message);
  revalidatePath("/dashboard"); revalidatePath("/library"); if(slug)revalidatePath(`/library/${slug}`);
}
