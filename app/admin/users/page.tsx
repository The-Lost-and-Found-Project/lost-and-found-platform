import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminUsersClient from "@/components/AdminUsersClient";
import { getEffectiveRole } from "@/lib/effective-role";

export default async function AdminUsersPage() {
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

  // Use the effective role (honors an admin's preview_role override) so an
  // admin previewing as another role sees the same restriction a real user
  // of that role would.
  const effectiveRole = getEffectiveRole(profile?.role, profile?.preview_role);

  // Managing roles and deactivating accounts is admin-only, unlike the
  // broader prayer care dashboard which is open to the whole care team
  // (admin, prayer_team, pastor).
  if (effectiveRole !== "admin") {
    redirect("/dashboard");
  }

  const [{ data: users }, { data: activeResponsibilities }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, email, role, is_active, created_at, rotation_status, ministry_availability, missed_assignment_count, availability_review_required, reinstatement_requested_at"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("prayer_requests")
      .select("assigned_to")
      .not("assigned_to", "is", null)
      .eq("answered", false)
      .eq("archived", false),
  ]);

  const responsibilityCounts = new Map<string, number>();
  for (const responsibility of activeResponsibilities ?? []) {
    if (!responsibility.assigned_to) continue;
    responsibilityCounts.set(
      responsibility.assigned_to,
      (responsibilityCounts.get(responsibility.assigned_to) ?? 0) + 1
    );
  }

  const usersWithResponsibilityCounts = (users ?? []).map((row) => ({
    ...row,
    active_responsibility_count: responsibilityCounts.get(row.id) ?? 0,
  }));

  return (
    <AdminUsersClient users={usersWithResponsibilityCounts} currentUserId={user.id} />
  );
}
