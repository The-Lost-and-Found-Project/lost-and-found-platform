import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminContentClient from "@/components/AdminContentClient";
import { getEffectiveRole } from "@/lib/effective-role";

export default async function AdminContentPage() {
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

  // Moderating/removing testimonies and praise reports is admin-only, same
  // as user management — not open to the broader care team.
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

  const { data: testimonies } = await supabase
    .from("testimonies")
    .select("id, content_text, is_anonymous, user_id, created_at")
    .order("created_at", { ascending: false });

  const { data: praiseReports } = await supabase
    .from("praise_reports")
    .select("id, content_text, user_id, prayer_request_id, created_at")
    .order("created_at", { ascending: false });

  const authorIds = Array.from(
    new Set(
      [...(testimonies ?? []), ...(praiseReports ?? [])].map((r) => r.user_id)
    )
  );

  const { data: authors } =
    authorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", authorIds)
      : { data: [] };

  const authorById: Record<string, { full_name: string | null; email: string | null }> = {};
  for (const a of authors ?? []) {
    authorById[a.id] = { full_name: a.full_name, email: a.email };
  }

  return (
    <AdminContentClient
      testimonies={(testimonies ?? []).map((t) => ({
        ...t,
        author: authorById[t.user_id] ?? null,
      }))}
      praiseReports={(praiseReports ?? []).map((p) => ({
        ...p,
        author: authorById[p.user_id] ?? null,
      }))}
    />
  );
}
