import { redirect } from "next/navigation";
import { getMarriageCouple } from "@/lib/marriage-couple";
import { createClient } from "@/lib/supabase/server";

export async function requireMarriageAssignment(next: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  const { data, error } = await supabase.from("marriage_journey_assignments")
    .select("user_id").eq("user_id", user.id).is("revoked_at", null).maybeSingle();
  if (error || !data || !(await getMarriageCouple(supabase,user.id))) redirect("/dashboard?marriage=not-assigned");
  return { supabase, user };
}
