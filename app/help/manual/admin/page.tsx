import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole } from "@/lib/effective-role";
import ManualSections, { ManualSection } from "@/components/ManualSections";

const sections: ManualSection[] = [
  {
    title: "Prayer Moderation",
    paragraphs: [
      "The request review area is the master view of prayer requests. Flagged requests sit in the attention queue so you can approve, deny, edit, or close them before public display. Requests are never assigned to individual members.",
    ],
  },
  {
    title: "Manage Users",
    paragraphs: [
      "Keep normal accounts as Community Members. Grant Community Admin only when a person needs moderation and account-management access. Account deactivation is reversible; deletion is permanent.",
      "You can preview the app as a Community Member from your own Profile page for training or troubleshooting.",
    ],
  },
  {
    title: "Content",
    paragraphs: [
      "Delete testimonies or praise reports that need to come down — for example, at a member's request, or if something needs to be removed for any other reason.",
    ],
  },
  {
    title: "Analytics",
    paragraphs: [
      "Track growth and engagement — new members, prayer requests, testimonies, and praise reports — with both all-time totals and a recent-range view.",
    ],
  },
  {
    title: "Feedback",
    paragraphs: [
      "Every message members send through Contact Us on the Help page lands here.",
    ],
  },
  {
    title: "Automatic Emails & Notifications",
    paragraphs: [
      "The app keeps in-app notifications. The retired assignment reminder and Prayer Care digest jobs no longer run.",
    ],
  },
];

export default async function AdminManualPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, preview_role")
    .eq("id", user.id)
    .single();
  const effectiveRole = getEffectiveRole(profile?.role, profile?.preview_role);

  if (effectiveRole !== "admin") {
    redirect("/help");
  }

  return (
    <ManualSections
      title="Admin Guide"
      intro="A quick reference for moderation, user management, and the rest of the admin tools."
      sections={sections}
    />
  );
}
