import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminFeedbackClient from "@/components/AdminFeedbackClient";
import { getEffectiveRole } from "@/lib/effective-role";

export default async function AdminFeedbackPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=%2Fadmin%2Ffeedback");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, preview_role, is_active")
    .eq("id", user.id)
    .single();

  // Reviewing beta feedback is admin-only, same restriction as Manage Users.
  const effectiveRole = getEffectiveRole(profile?.role, profile?.preview_role);

  const isAdmin = profile?.is_active === true && effectiveRole === "admin";
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const { data: messages, error } = await supabase
    .from("feedback_messages")
    .select("id, user_id, name, email, message, status, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Unable to load feedback. Please try again.");

  return <AdminFeedbackClient messages={messages ?? []} />;
}
