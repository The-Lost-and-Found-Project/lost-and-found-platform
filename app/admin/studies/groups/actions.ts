"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAppCapability } from "@/lib/role-access";

async function requireAdmin(){const {user}=await requireAppCapability("study_groups");return user;}
const text=(f:FormData,k:string)=>String(f.get(k)||"").trim();
export async function createStudyGroup(f:FormData){const user=await requireAdmin();const db=createAdminClient();const name=text(f,"name"),ministry_slug=text(f,"ministry_slug"),description=text(f,"description")||null;if(!name||!ministry_slug)throw new Error("Group name and ministry are required.");const{error}=await db.from("study_groups").insert({name,ministry_slug,description,created_by:user.id});if(error)throw new Error(error.message);revalidatePath("/admin/studies/groups");}
export async function saveGroupMembers(f:FormData){await requireAdmin();const db=createAdminClient();const groupId=text(f,"group_id");if(!groupId)throw new Error("Missing group.");const facilitatorIds=new Set(f.getAll("facilitator_user_id").map(String).filter(Boolean));const memberIds=new Set(f.getAll("member_user_id").map(String).filter(Boolean));facilitatorIds.forEach(id=>memberIds.add(id));const{error:deleteError}=await db.from("study_group_members").delete().eq("group_id",groupId);if(deleteError)throw new Error(deleteError.message);if(memberIds.size){const{error}=await db.from("study_group_members").insert(Array.from(memberIds).map(user_id=>({group_id:groupId,user_id,group_role:facilitatorIds.has(user_id)?"facilitator":"member",membership_status:"active"})));if(error)throw new Error(error.message);}revalidatePath("/admin/studies/groups");revalidatePath("/admin/studies");redirect(`/admin/studies/groups?saved=${encodeURIComponent(groupId)}&count=${memberIds.size}`);}
export async function archiveStudyGroup(f:FormData){await requireAdmin();const db=createAdminClient();const id=text(f,"group_id");const{error}=await db.from("study_groups").update({status:"archived",updated_at:new Date().toISOString()}).eq("id",id);if(error)throw new Error(error.message);revalidatePath("/admin/studies/groups");}
