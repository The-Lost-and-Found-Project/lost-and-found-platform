import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminPrayerDashboardClient from "@/components/AdminPrayerDashboardClient";

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
    .select("role")
    .eq("id", user.id)
    .single();

  const isCareTeam =
    profile?.role === "admin" ||
    profile?.role === "prayer_team" ||
    profile?.role === "pastor";

  if (!isCareTeam) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Access Restricted
        </h1>
        <p className="mt-4 text-gray-600">
          This area is reserved for prayer care team members. If you believe
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
      isAdmin={profile?.role === "admin"}
    />
  );
}
