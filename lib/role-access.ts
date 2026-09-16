import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole, type Role } from "@/lib/effective-role";

export type AppCapability = "member_app" | "study_workspace" | "admin_center" | "people_roles" | "study_groups";

export function hasCapability(role: Role, capability: AppCapability) {
  if (capability === "member_app") return true;
  if (capability === "study_workspace") return role === "facilitator" || role === "supervisor" || role === "admin";
  return role === "admin";
}

export async function requireAppCapability(capability: AppCapability) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role,preview_role").eq("id", user.id).single();
  const role = getEffectiveRole(profile?.role, profile?.preview_role);
  if (!hasCapability(role, capability)) redirect("/dashboard");
  return { user, role, supabase };
}
