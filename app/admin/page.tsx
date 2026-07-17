import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminPrayerDashboardClient from "@/components/AdminPrayerDashboardClient";
import { getEffectiveRole } from "@/lib/effective-role";

export default async function AdminPage() {
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

  // Use the effective role (which honors an admin's preview_role, if set)
  // so admins can preview the app as another role for training purposes.
  const effectiveRole = getEffectiveRole(profile?.role, profile?.preview_role);

  const isCareTeam =
    effectiveRole === "admin" ||
    effectiveRole === "prayer_team" ||
    effectiveRole === "pastor";

  if (!isCareTeam) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Access Restricted
        </h1>
        <p className="mt-4 text-gray-600">
          This area is reserved for Community Prayer Members. If you believe
          you should have access, please contact your ministry admin.
        </p>
      </div>
    );
  }

  const { data: requests } = await supabase
    .from("prayer_requests")
    .select(
      "id, created_at, name, email, phone, preferred_contact, contact_requested, category_id, request_text, is_public, is_anonymous, status, assigned_to, follow_up_needed, follow_up_date, answered, praise_report, prayer_count"
    )
    .order("created_at", { ascending: false });

  const { data: categories } = await supabase
    .from("prayer_categories")
    .select("id, name")
    .order("sort_order");

  const { data: careTeam } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("role", ["admin", "prayer_team", "pastor"]);

  return (
    <AdminPrayerDashboardClient
      requests={requests ?? []}
      categories={categories ?? []}
      careTeam={careTeam ?? []}
      isAdmin={effectiveRole === "admin"}
    />
  );
}
