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
    redirect("/dashboard");
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
        "id, created_at, category_id, status, answered, prayer_count, flagged, moderation_status, archived"
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
