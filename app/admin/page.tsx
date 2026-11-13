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
  const { data: profile } = await supabase.from("profiles").select("full_name, role, preview_role, is_active").eq("id", user.id).single();
  const effectiveRole = getEffectiveRole(profile?.role, profile?.preview_role);
  if (profile?.is_active !== true || effectiveRole !== "admin") redirect("/dashboard");
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
    <main className="lfp-page">
      <AdminCommandCenter
        modules={adminModules}
        stats={{
          openPrayerRequests: openRequests,
          moderationAttention: flaggedRequests,
          answeredPrayers: answeredRequests,
          notificationIssues: deliveryIssues,
        }}
      />
    </main>
  );
}
