import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminUsersClient from "@/components/AdminUsersClient";

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
    .select("role")
    .eq("id", user.id)
    .single();

  // Managing roles and deactivating accounts is admin-only, unlike the
  // broader prayer care dashboard which is open to the whole care team
  // (admin, prayer_team, pastor).
  if (profile?.role !== "admin") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Access Restricted
        </h1>
        <p className="mt-4 text-gray-600">
          This area is reserved for admins. If you believe you should have
          access, please contact your ministry admin.
        </p>
      </div>
    );
  }

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active, created_at")
    .order("created_at", { ascending: false });

  return (
    <AdminUsersClient users={users ?? []} currentUserId={user.id} />
  );
}
