"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {hasMinistryRole} from "@/lib/access-control";

async function userIdFromEmail(email:string){const admin=createAdminClient();const{data,error}=await admin.from("profiles").select("id").ilike("email",email.trim()).maybeSingle();if(error||!data)throw new Error("No member found with that email");return data.id}
async function assertLeader(ministry:string){const s=await createClient();const{data:{user}}=await s.auth.getUser();if(!user)redirect("/login");if(!(await hasMinistryRole(ministry,["leader"])))throw new Error("Not authorized for this ministry");return s}
export async function grantMinistryMemberRole(fd:FormData){const ministry=String(fd.get("ministry_key")||"");const role=String(fd.get("role_key")||"");if(!["participant","facilitator"].includes(role))throw new Error("Ministry leaders may assign Participant or Facilitator only");const s=await assertLeader(ministry);const userId=await userIdFromEmail(String(fd.get("email")||""));const{error}=await s.rpc("grant_ministry_role",{p_user_id:userId,p_ministry_key:ministry,p_role_key:role});if(error)throw new Error(error.message);revalidatePath("/ministry/access")}
export async function revokeMinistryMemberRole(fd:FormData){const ministry=String(fd.get("ministry_key")||"");const role=String(fd.get("role_key")||"");if(!["participant","facilitator"].includes(role))throw new Error("Ministry leaders may revoke Participant or Facilitator only");const s=await assertLeader(ministry);const{error}=await s.rpc("revoke_ministry_role",{p_user_id:String(fd.get("user_id")),p_ministry_key:ministry,p_role_key:role});if(error)throw new Error(error.message);revalidatePath("/ministry/access")}
