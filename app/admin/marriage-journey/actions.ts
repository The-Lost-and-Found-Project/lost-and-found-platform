"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEffectiveRole } from "@/lib/effective-role";

export async function updateMarriageAssignment(form: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in required");
  const { data: profile } = await supabase.from("profiles").select("role,preview_role").eq("id",user.id).single();
  if (getEffectiveRole(profile?.role,profile?.preview_role)!=="admin") throw new Error("Admin access required");
  const target = String(form.get("userId")||"");
  const operation = String(form.get("operation")||"");
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(target) || !["assign","revoke"].includes(operation)) throw new Error("Invalid assignment");
  const db = createAdminClient();
  const { data: person } = await db.from("profiles").select("id,is_active").eq("id",target).maybeSingle();
  if (!person?.is_active) throw new Error("Select an active member");
  if (operation === "assign") {
    const { error } = await db.from("marriage_journey_assignments").upsert({user_id:target,assigned_by:user.id,assigned_at:new Date().toISOString(),revoked_at:null},{onConflict:"user_id"});
    if (error) throw new Error("Could not assign marriage study");
  } else {
    const { error } = await db.from("marriage_journey_assignments").update({revoked_at:new Date().toISOString()}).eq("user_id",target).is("revoked_at",null);
    if (error) throw new Error("Could not revoke marriage study");
  }
  revalidatePath("/admin/marriage-journey");
  revalidatePath("/dashboard");
}
