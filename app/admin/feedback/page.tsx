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
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, preview_role")
    .eq("id", user.id)
    .single();

  // Reviewing beta feedback is admin-only, same restriction as Manage Users.
  const effectiveRole = getEffectiveRole(profile?.role, profile?.preview_role);

  if (effectiveRole !== "admin") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Access Restricted
        </h1>
        <p className="mt-4 text-gray-600">
          This area is reserved for Community Admins. If you believe you
          should have access, please contact your ministry admin.
        </p>
      </div>
    );
  }

  const { data: messages } = await supabase
    .from("feedback_messages")
    .select("id, user_id, name, email, message, status, created_at")
    .order("created_at", { ascending: false });

  return <AdminFeedbackClient messages={messages ?? []} />;
}
