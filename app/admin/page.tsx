import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminPrayerDashboardClient from "@/components/AdminPrayerDashboardClient";
import { getEffectiveRole } from "@/lib/effective-role";

const EMMAUS_FOUNDER_EMAIL = "chad@lostandfoundproject.org";
const EMMAUS_FOUNDER_USER_ID = process.env.EMMAUS_FOUNDER_USER_ID?.trim();

const adminModules = [
  {
    href: "/admin/users",
    title: "People & Roles",
    description: "Manage Community Member access and administrative permissions.",
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

  if (effectiveRole !== "admin") {
    redirect("/dashboard");
  }

  const deliveryClient = createAdminClient();
  const [deliveryResult, requestsResult, categoriesResult] =
    await Promise.all([
      deliveryClient.rpc("get_notification_delivery_health"),
      supabase
        .from("prayer_requests")
        .select(
          "id, user_id, created_at, name, email, phone, category_id, request_text, is_public, is_anonymous, status, answered, praise_report, prayer_count, flagged, flag_reason, moderation_status"
        )
        .order("created_at", { ascending: false }),
      supabase.from("prayer_categories").select("id, name").order("sort_order"),
    ]);

  const deliveryHealth = deliveryResult.data;
  const requests = requestsResult.data;
  const categories = categoriesResult.data;
  const failedPushCount = deliveryHealth?.[0]?.failed_count ?? 0;
  const overduePushCount = deliveryHealth?.[0]?.pending_overdue_count ?? 0;
  const deliveryIssues = failedPushCount + overduePushCount;

  const requestRows = requests ?? [];
  const openRequests = requestRows.filter((request) => !request.answered && request.status !== "Closed").length;
  const flaggedRequests = requestRows.filter((request) => request.flagged || request.moderation_status === "pending").length;
  const answeredRequests = requestRows.filter((request) => request.answered || request.status === "Resolved").length;
  const firstName = profile?.full_name?.trim().split(" ")[0] || "Administrator";
  const isEmmausFounder = Boolean(
    (EMMAUS_FOUNDER_USER_ID && user.id === EMMAUS_FOUNDER_USER_ID) ||
      (!EMMAUS_FOUNDER_USER_ID && user.email?.toLowerCase() === EMMAUS_FOUNDER_EMAIL)
  );

  return (
    <main className="lfp-page pb-24">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(124,58,237,0.34),transparent_34rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-8 sm:py-12">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Administration Center</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Lead the mission with clarity, {firstName}.</h1>
              <p className="mt-4 max-w-3xl leading-7 text-indigo-100/75 sm:text-lg">Start with what needs attention, then open specialized tools only when you need them.</p>
            </div>
            <Link href="/dashboard" className="lfp-button border border-white/20 bg-white/10 text-white hover:bg-white/15">Return to Member App</Link>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <AdminStat label="Open prayer requests" value={String(openRequests)} />
            <AdminStat label="Moderation attention" value={String(flaggedRequests)} />
            <AdminStat label="Answered prayers" value={String(answeredRequests)} />
            <AdminStat label="Notification delivery issues" value={String(deliveryIssues)} />
          </div>
        </div>
      </section>

      <div className="lfp-shell py-7 sm:py-10">
        {deliveryIssues > 0 && (
          <section className="mb-8 rounded-3xl border border-amber-300 bg-amber-50 p-5 sm:p-6" role="status">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Delivery health</p>
            <h2 className="mt-2 text-xl font-black text-slate-950">Some push notifications need review</h2>
            <p className="mt-2 leading-7 text-slate-700">
              {failedPushCount ?? 0} failed in the last seven days and {overduePushCount ?? 0} have remained pending for more than five minutes. In-app notifications are still preserved.
            </p>
          </section>
        )}
        <section>
          <div className="mb-5 max-w-3xl">
            <p className="lfp-eyebrow">Prayer moderation</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Request review</h2>
            <p className="mt-3 leading-7 text-slate-600 sm:text-lg">Review privacy, safety, public visibility, and answered-prayer updates without assigning requests to individual members.</p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/92 shadow-2xl">
            <AdminPrayerDashboardClient
              requests={requestRows}
              categories={categories ?? []}
              isAdmin
            />
          </div>
        </section>

        <details className="lfp-card group mt-8 overflow-hidden">
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:content-none sm:px-6 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="block text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Administration</span>
              <span className="mt-1 block text-lg font-black text-slate-950">Other administrative tools</span>
              <span className="mt-1 block text-sm text-slate-600">People, content, and analytics</span>
            </span>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 transition group-open:rotate-180" aria-hidden="true">⌄</span>
          </summary>
          <div className="grid gap-3 border-t border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2 sm:p-6">
            {adminModules.map((module) => (
              <Link key={module.href} href={module.href} className="group/tool flex min-h-20 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-md">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl ring-1 ring-indigo-100" aria-hidden="true">{module.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-black text-slate-950">{module.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-slate-600">{module.description}</span>
                </span>
                <span className="font-black text-indigo-700 transition group-hover/tool:translate-x-1" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </details>

        {isEmmausFounder && (
          <details className="group mt-4 overflow-hidden rounded-[2rem] border border-amber-300/30 bg-slate-950 text-white shadow-xl">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:content-none sm:px-6 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block text-xs font-black uppercase tracking-[0.16em] text-amber-300">Private Founder Lab</span>
                <span className="mt-1 block text-lg font-black">Emmaus Founder Studio</span>
              </span>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-amber-300 transition group-open:rotate-180" aria-hidden="true">⌄</span>
            </summary>
            <div className="border-t border-white/10 px-5 py-5 sm:px-6">
              <p className="max-w-2xl leading-7 text-indigo-100/70">Visible only to your founder account while Emmaus is privately developed and reviewed.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/emmaus/admin/dashboard" className="lfp-button bg-amber-300 text-slate-950">Open Founder Studio</Link>
                <Link href="/emmaus/discovery/demo" className="lfp-button border border-white/20 bg-white/10 text-white">Preview Experience</Link>
              </div>
            </div>
          </details>
        )}
      </div>
    </main>
  );
}

function AdminStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur sm:p-5">
      <p className="text-2xl font-black sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs leading-5 text-indigo-100/70 sm:text-sm">{label}</p>
    </div>
  );
}
