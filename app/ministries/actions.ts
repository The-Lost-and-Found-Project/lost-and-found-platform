"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function joinMinistry(formData:FormData){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");const ministry_slug=String(formData.get("ministry_slug")||"");const {error}=await supabase.from("ministry_memberships").insert({ministry_slug,user_id:user.id,membership_role:"member"});if(error&&error.code!=="23505")throw new Error(error.message);revalidatePath(`/ministries/${ministry_slug}`);revalidatePath("/ministries");}
export async function leaveMinistry(formData:FormData){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");const ministry_slug=String(formData.get("ministry_slug")||"");const {error}=await supabase.from("ministry_memberships").delete().eq("ministry_slug",ministry_slug).eq("user_id",user.id);if(error)throw new Error(error.message);revalidatePath(`/ministries/${ministry_slug}`);revalidatePath("/ministries");}
