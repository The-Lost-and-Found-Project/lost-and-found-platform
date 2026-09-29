import { createClient } from "@/lib/supabase/server";

export type PlatformRole="content_editor"|"admin"|"owner";
export type MinistryRole="participant"|"facilitator"|"leader";

export async function hasPlatformRole(roles:PlatformRole[]){const s=await createClient();const{data,error}=await s.rpc("has_platform_role",{p_roles:roles});if(error)return false;return Boolean(data)}
export async function hasMinistryRole(ministryKey:string,roles:MinistryRole[]){const s=await createClient();const{data,error}=await s.rpc("has_ministry_role",{p_ministry_key:ministryKey,p_roles:roles});if(error)return false;return Boolean(data)}
export async function getMinistryAssignments(){const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)return[];const{data}=await s.from("ministry_role_assignments").select("ministry_key,role_key").eq("user_id",user.id).is("revoked_at",null);return data??[]}
export async function canAccessFacilitatorCenter(){if(await hasPlatformRole(["admin","owner"]))return true;const rows=await getMinistryAssignments();return rows.some((r:any)=>r.role_key==="facilitator"||r.role_key==="leader")}
