import Link from "next/link";
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

  // The full admin dashboard (moderation queue, reassigning requests, seeing
  // every member's assignments) is now reserved for admins only. Prayer
  // partners (the "prayer_team" role) and pastors both have their own
  // dedicated, assignments-only page instead — send them there rather than
  // showing them the broader admin view.
  if (effectiveRole === "prayer_team" || effectiveRole === "pastor") {
    redirect("/prayer-assignments");
  }

  const isAdmin = effectiveRole === "admin";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  const { data: requests } = await supabase
    .from("prayer_requests")
    .select(
      "id, user_id, created_at, name, email, phone, preferred_contact, contact_requested, category_id, request_text, is_public, is_anonymous, status, assigned_to, follow_up_needed, follow_up_date, answered, praise_report, prayer_count, flagged, flag_reason, moderation_status, last_action_at"
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
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-indigo-100 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
              The Lost and Found Project
            </p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">Admin Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100/75">
              Prayer administration remains below. Emmaus founder tools are now available from this dashboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/emmaus/admin/dashboard"
              className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg transition hover:bg-amber-300"
            >
              Open Emmaus Founder Studio →
            </Link>
            <Link
              href="/emmaus/discovery/demo"
              className="rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Preview Learner Experience
            </Link>
          </div>
        </div>
      </section>

      <AdminPrayerDashboardClient
        requests={requests ?? []}
        categories={categories ?? []}
        careTeam={careTeam ?? []}
        isAdmin={isAdmin}
        currentUserId={user.id}
      />
    </main>
  );
}
