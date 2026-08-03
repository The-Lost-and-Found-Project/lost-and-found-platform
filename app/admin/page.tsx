import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminPrayerDashboardClient from "@/components/AdminPrayerDashboardClient";
import { getEffectiveRole } from "@/lib/effective-role";

const EMMAUS_FOUNDER_EMAIL = "chad@lostandfoundproject.org";
const EMMAUS_FOUNDER_USER_ID = process.env.EMMAUS_FOUNDER_USER_ID?.trim();

const adminModules = [
  {
    href: "/admin",
    title: "Prayer Operations",
    description: "Moderate requests, coordinate assignments, manage follow-up, and review answered-prayer activity.",
    icon: "🙏",
  },
  {
    href: "/admin/applications",
    title: "Prayer Care Applications",
    description: "Review applicants, document decisions, and protect the standards of the care team.",
    icon: "🤲",
  },
  {
    href: "/admin/users",
    title: "People & Roles",
    description: "Manage member access, ministry roles, rotation status, and account-level permissions.",
    icon: "👥",
  },
  {
    href: "/admin/content",
    title: "Content Publishing",
    description: "Manage devotionals, testimonies, trivia, and other published ministry content.",
    icon: "📚",
  },
  {
    href: "/admin/analytics",
    title: "Ministry Analytics",
    description: "Review participation, prayer activity, content engagement, and operational trends.",
    icon: "⌁",
  },
];

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, preview_role")
    .eq("id", user.id)
    .single();

  const effectiveRole = getEffectiveRole(profile?.role, profile?.preview_role);

  if (effectiveRole === "prayer_team" || effectiveRole === "pastor") {
    redirect("/prayer-assignments");
  }

  if (effectiveRole !== "admin") redirect("/dashboard");

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

  const requestRows = requests ?? [];
  const openRequests = requestRows.filter((request) => !request.answered && request.status !== "Closed").length;
  const flaggedRequests = requestRows.filter((request) => request.flagged || request.moderation_status === "pending").length;
  const followUps = requestRows.filter((request) => request.follow_up_needed && !request.answered).length;
  const firstName = profile?.full_name?.trim().split(" ")[0] || "Administrator";
  const isEmmausFounder = Boolean(
    (EMMAUS_FOUNDER_USER_ID && user.id === EMMAUS_FOUNDER_USER_ID) ||
      (!EMMAUS_FOUNDER_USER_ID && user.email?.toLowerCase() === EMMAUS_FOUNDER_EMAIL)
  );

  return (
    <main className="lfp-page pb-24">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(124,58,237,0.34),transparent_34rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-12 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Administration Center</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Lead the mission with clarity, {firstName}.</h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Review what needs attention, protect community trust, coordinate ministry care, and manage published experiences from one operational home.</p>
            </div>
            <Link href="/dashboard" className="lfp-button border border-white/20 bg-white/10 text-white hover:bg-white/15">Return to Member App</Link>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            <AdminStat label="Open prayer requests" value={String(openRequests)} />
            <AdminStat label="Moderation attention" value={String(flaggedRequests)} />
            <AdminStat label="Follow-ups needed" value={String(followUps)} />
          </div>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section>
          <div className="max-w-3xl">
            <p className="lfp-eyebrow">Mission control</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Administrative workspaces</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">Each workspace retains its existing role restrictions and operational workflow.</p>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {adminModules.map((module) => (
              <Link key={module.href} href={module.href} className="lfp-card group block p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl ring-1 ring-indigo-100" aria-hidden="true">{module.icon}</span>
                  <span className="font-black text-indigo-700 transition group-hover:translate-x-1">→</span>
                </div>
                <h3 className="mt-6 text-2xl font-black tracking-tight text-slate-950">{module.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{module.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {isEmmausFounder && (
          <section className="mt-12 overflow-hidden rounded-[2rem] border border-amber-300/30 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-1 shadow-2xl">
            <div className="rounded-[1.8rem] bg-white/[0.05] p-7 text-white sm:p-9">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Private Founder Lab</p>
                  <h2 className="mt-3 text-3xl font-black">Emmaus Founder Studio</h2>
                  <p className="mt-3 max-w-2xl leading-7 text-indigo-100/70">These tools remain visible only to your founder account while Emmaus is privately developed and reviewed.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/emmaus/admin/dashboard" className="lfp-button bg-amber-300 text-slate-950 shadow-xl">Open Founder Studio</Link>
                  <Link href="/emmaus/discovery/demo" className="lfp-button border border-white/20 bg-white/10 text-white">Preview Experience</Link>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mt-12">
          <div className="mb-7 max-w-3xl">
            <p className="lfp-eyebrow">Prayer operations</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Requests requiring care and oversight</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">The existing moderation, assignment, follow-up, and answered-prayer tools remain fully available below.</p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/92 shadow-2xl">
            <AdminPrayerDashboardClient
              requests={requestRows}
              categories={categories ?? []}
              careTeam={careTeam ?? []}
              isAdmin
              currentUserId={user.id}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function AdminStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-sm text-indigo-100/60">{label}</p>
    </div>
  );
}
