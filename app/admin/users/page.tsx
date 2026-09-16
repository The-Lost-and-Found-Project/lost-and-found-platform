import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminUsersClient from "@/components/AdminUsersClient";
import { getEffectiveRole } from "@/lib/effective-role";

export default async function AdminUsersPage(){
 const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const{data:profile}=await supabase.from("profiles").select("role,preview_role").eq("id",user.id).single();const effectiveRole=getEffectiveRole(profile?.role,profile?.preview_role);if(effectiveRole!=="admin")redirect("/dashboard");
 const db=createAdminClient();const[{data:users},{data:supervision}]=await Promise.all([db.from("profiles").select("id,full_name,email,role,is_active,created_at").order("created_at",{ascending:false}),db.from("facilitator_supervision").select("supervisor_user_id,facilitator_user_id")]);
 return <AdminUsersClient users={users??[]} currentUserId={user.id} supervision={supervision??[]}/>;
}
