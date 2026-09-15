"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {hasPlatformRole} from "@/lib/access-control";

async function ctx(){const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)redirect("/login");if(!(await hasPlatformRole(["admin","owner"])))redirect("/dashboard");return{s,admin:createAdminClient()}}
async function userIdFromEmail(email:string){const{admin}=await ctx();const{data,error}=await admin.from("profiles").select("id").ilike("email",email.trim()).maybeSingle();if(error||!data)throw new Error("No member found with that email");return data.id}
export async function claimInitialOwner(){const{s}=await ctx();const{error}=await s.rpc("claim_initial_platform_owner");if(error)throw new Error(error.message);revalidatePath("/admin/access")}
export async function grantPlatformRole(fd:FormData){const{s}=await ctx();const userId=await userIdFromEmail(String(fd.get("email")||""));const role=String(fd.get("role_key")||"");const{error}=await s.rpc("grant_platform_role",{p_user_id:userId,p_role_key:role});if(error)throw new Error(error.message);revalidatePath("/admin/access")}
export async function revokePlatformRole(fd:FormData){const{s}=await ctx();const{error}=await s.rpc("revoke_platform_role",{p_user_id:String(fd.get("user_id")),p_role_key:String(fd.get("role_key"))});if(error)throw new Error(error.message);revalidatePath("/admin/access")}
export async function grantMinistryRole(fd:FormData){const{s}=await ctx();const userId=await userIdFromEmail(String(fd.get("email")||""));const{error}=await s.rpc("grant_ministry_role",{p_user_id:userId,p_ministry_key:String(fd.get("ministry_key")),p_role_key:String(fd.get("role_key"))});if(error)throw new Error(error.message);revalidatePath("/admin/access")}
export async function revokeMinistryRole(fd:FormData){const{s}=await ctx();const{error}=await s.rpc("revoke_ministry_role",{p_user_id:String(fd.get("user_id")),p_ministry_key:String(fd.get("ministry_key")),p_role_key:String(fd.get("role_key"))});if(error)throw new Error(error.message);revalidatePath("/admin/access")}
