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
  const partner = String(form.get("partnerId")||"");
  const coupleId = String(form.get("coupleId")||"");
  const operation = String(form.get("operation")||"");
  if (!["assign","revoke"].includes(operation) || (operation==="assign" && (!/^[0-9a-f-]{36}$/i.test(target) || !/^[0-9a-f-]{36}$/i.test(partner) || target===partner)) || (operation==="revoke" && !/^[0-9a-f-]{36}$/i.test(coupleId))) throw new Error("Invalid assignment");
  const db = createAdminClient();

  if (operation === "assign") {
    const {data:people,error:peopleError}=await db.from("profiles").select("id,is_active").in("id",[target,partner]);
    if(peopleError || people?.length!==2 || people.some(p=>!p.is_active)) throw new Error("Select two different active members");
    const {data:existing,error:existingError}=await db.from("marriage_couples").select("id").is("revoked_at",null)
      .or(`spouse_one.in.(${target},${partner}),spouse_two.in.(${target},${partner})`);
    if(existingError || existing?.length) throw new Error("One of these members already belongs to an active couple");
    const {data:created,error:coupleError}=await db.from("marriage_couples").insert({spouse_one:target,spouse_two:partner,assigned_by:user.id}).select("id").single();
    if(coupleError || !created) throw new Error("Could not create couple assignment");
    const {error:assignmentError}=await db.from("marriage_journey_assignments").upsert([target,partner].map(user_id=>({user_id,assigned_by:user.id,assigned_at:new Date().toISOString(),revoked_at:null})),{onConflict:"user_id"});
    if(assignmentError){await db.from("marriage_couples").update({revoked_at:new Date().toISOString()}).eq("id",created.id);throw new Error("Could not activate both spouse assignments");}
  } else {
    const {error}=await db.from("marriage_couples").update({revoked_at:new Date().toISOString()}).eq("id",coupleId).is("revoked_at",null);
    if(error) throw new Error("Could not revoke couple assignment");
  }
  revalidatePath("/admin/marriage-journey");
  revalidatePath("/dashboard");
}
