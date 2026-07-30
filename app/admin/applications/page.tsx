import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminApplicationsClient from "@/components/AdminApplicationsClient";
import { getEffectiveRole } from "@/lib/effective-role";

export default async function AdminApplicationsPage() {
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

  // Approving an application changes someone's role, so this is admin-only,
  // same restriction as Manage Users.
  if (effectiveRole !== "admin") {
    redirect("/dashboard");
  }

  const { data: applications } = await supabase
    .from("prayer_care_applications")
    .select(
      "id, user_id, reason, experience, availability, status, review_note, reviewed_at, created_at, applicant:user_id(full_name, email, created_at)"
    )
    .order("created_at", { ascending: false });

  // Supabase's generated types return the joined `applicant` relation as an
  // array (it can't tell from the query alone that user_id is a one-to-one
  // foreign key), but at runtime it's a single row. Normalize it here so the
  // client component can work with a plain object.
  const normalizedApplications = (applications ?? []).map((application) => ({
    ...application,
    applicant: Array.isArray(application.applicant)
      ? application.applicant[0] ?? null
      : application.applicant,
  }));

  return <AdminApplicationsClient applications={normalizedApplications} />;
}
