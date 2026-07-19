import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminAnalyticsClient from "@/components/AdminAnalyticsClient";
import { getEffectiveRole } from "@/lib/effective-role";

export default async function AdminAnalyticsPage() {
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

  // Growth/effectiveness metrics are admin-only, same restriction as
  // Manage Users and Feedback.
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

  const [
    { data: requests },
    { data: categories },
    { data: profiles },
    { data: testimonies },
    { data: praiseReports },
    { data: reactions },
  ] = await Promise.all([
    supabase
      .from("prayer_requests")
      .select(
        "id, created_at, category_id, status, assigned_to, answered, prayer_count, flagged, moderation_status, follow_up_needed, archived"
      ),
    supabase.from("prayer_categories").select("id, name"),
    supabase.from("profiles").select("id, created_at, role, is_active"),
    supabase.from("testimonies").select("id, created_at, moderation_status"),
    supabase
      .from("praise_reports")
      .select("id, created_at, moderation_status"),
    supabase.from("prayer_reactions").select("id, created_at"),
  ]);

  return (
    <AdminAnalyticsClient
      requests={requests ?? []}
      categories={categories ?? []}
      profiles={profiles ?? []}
      testimonies={testimonies ?? []}
      praiseReports={praiseReports ?? []}
      reactions={reactions ?? []}
    />
  );
}
