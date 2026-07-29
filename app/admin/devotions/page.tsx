import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDevotionsClient from "@/components/AdminDevotionsClient";
import { getEffectiveRole } from "@/lib/effective-role";

export default async function AdminDevotionsPage() {
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

  // Same admin-only restriction as Bible Trivia management -- reviewing and
  // approving devotion content before it goes live is Chad's call.
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

  const { data: weeks } = await supabase
    .from("devotion_weeks")
    .select(
      "id, week_number, title, days, status, source, published_at, reviewed_at, created_at"
    )
    .order("week_number");

  return <AdminDevotionsClient weeks={weeks ?? []} />;
}
