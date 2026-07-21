import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MyPrayerAssignmentsClient from "@/components/MyPrayerAssignmentsClient";
import { getEffectiveRole } from "@/lib/effective-role";

// A prayer partner's own, assignments-only view. Deliberately separate from
// /admin: prayer team members should only ever see prayer requests assigned
// to them, never the full queue of every request in the app, moderation
// tools, or the ability to reassign requests to other people.
export default async function PrayerAssignmentsPage() {
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
          This area is reserved for prayer care team members. If you believe
          you should have access, please contact your ministry admin.
        </p>
      </div>
    );
  }

  // Scoped to only this user's own assignments — no other member's requests
  // are ever fetched here, regardless of role.
  const { data: requests } = await supabase
    .from("prayer_requests")
    .select(
      "id, created_at, name, email, phone, preferred_contact, contact_requested, category_id, request_text, is_public, is_anonymous, status, follow_up_needed, follow_up_date, answered, praise_report, prayer_count"
    )
    .eq("assigned_to", user.id)
    .order("created_at", { ascending: false });

  const { data: categories } = await supabase
    .from("prayer_categories")
    .select("id, name")
    .order("sort_order");

  return (
    <MyPrayerAssignmentsClient
      requests={requests ?? []}
      categories={categories ?? []}
    />
  );
}
