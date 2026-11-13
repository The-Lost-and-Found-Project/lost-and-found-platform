import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminCommandCenter from "@/components/AdminCommandCenter";
import { getEffectiveRole } from "@/lib/effective-role";
import { needsPrayerExposure } from "@/lib/prayer-distribution";

const adminModules=[{href:"/admin/notifications",title:"Notification Center",description:"Send push and in-app announcements to active members, ministries, leaders, or administrators.",icon:"🔔"},{href:"/admin/creator",title:"Creator Studio",description:"Create and publish library resources, collections, Bible studies, media, and ministry content from one editorial hub.",icon:"✦"},{href:"/admin/ministries",title:"Ministry Operations",description:"Publish portal announcements, gatherings, studies, resources, and service opportunities.",icon:"⌂"},{href:"/admin/studies",title:"Live Studies & Publishing",description:"Schedule live studies, create Google Meet rooms, assign facilitators, publish interactive studies, and manage devotional resources.",icon:"▣"},{href:"/admin/users",title:"People & Roles",description:"Manage Community Member access and administrative permissions.",icon:"👥"},{href:"/admin/content",title:"Community Moderation",description:"Moderate Community praise reports and testimonies separately from editorial publishing.",icon:"◇"},{href:"/admin/analytics",title:"Ministry Analytics",description:"Review participation, prayer activity, content engagement, and operational trends.",icon:"⌁"},{href:"/admin/live",title:"L&F Live Operations",description:"Review live usage, extensions, facilitator approvals, and supervisor overrides.",icon:"◉"}];

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fadmin");
  const { data: profile } = await supabase.from("profiles").select("full_name, role, preview_role").eq("id", user.id).single();
  const effectiveRole = getEffectiveRole(profile?.role, profile?.preview_role);
  if (effectiveRole !== "admin") redirect("/dashboard");
  const deliveryClient = createAdminClient();
  const [deliveryResult, requestsResult] = await Promise.all([
    deliveryClient.rpc("get_notification_delivery_health"),
    supabase.from("prayer_requests").select("id, is_public, moderation_status, status, answered, flagged, prayer_count").order("created_at", { ascending: false }),
  ]);
  const deliveryHealth = deliveryResult.data;
  const requestRows = requestsResult.data ?? [];
  const failedPushCount = deliveryHealth?.[0]?.failed_count ?? 0;
  const overduePushCount = deliveryHealth?.[0]?.pending_overdue_count ?? 0;
  const deliveryIssues = failedPushCount + overduePushCount;
  const openRequests = requestRows.filter((request) => !request.answered && request.status !== "Closed").length;
  const flaggedRequests = requestRows.filter((request) => request.flagged || request.moderation_status === "pending").length;
  const underexposedRequests = requestRows.filter(needsPrayerExposure).length;
  const answeredRequests = requestRows.filter((request) => request.answered || request.status === "Resolved").length;
  const firstName = profile?.full_name?.trim().split(" ")[0] || "Administrator";

  return (
    <main className="lfp-page pb-24">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(124,58,237,.34),transparent_34rem)]" />
        <div className="lfp-shell relative py-8 sm:py-12">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-amber-300">Administration Center</p>
            <h1 className="mt-3 text-3xl font-black sm:text-5xl">Command Center, {firstName}.</h1>
            <p className="mt-4 max-w-3xl text-indigo-100/75">Oversee community activity, streaming, care, and follow-up from one place.</p>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-5">
            <AdminStat label="Open prayer requests" value={String(openRequests)} />
            <AdminStat label="Moderation attention" value={String(flaggedRequests)} />
            <AdminStat label="Needs prayer exposure" value={String(underexposedRequests)} />
            <AdminStat label="Answered prayers" value={String(answeredRequests)} />
            <AdminStat label="Notification delivery issues" value={String(deliveryIssues)} />
          </div>
        </div>
      </section>
      <div className="lfp-shell py-7 sm:py-10">
        <AdminCommandCenter modules={adminModules} stats={{ openPrayerRequests: openRequests, moderationAttention: flaggedRequests, answeredPrayers: answeredRequests, notificationIssues: deliveryIssues }} />
      </div>
    </main>
  );
}

function AdminStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs text-indigo-100/70">{label}</p></div>;
}
