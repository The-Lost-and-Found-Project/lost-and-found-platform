import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole } from "@/lib/effective-role";
import ManualSections, { ManualSection } from "@/components/ManualSections";

const sections: ManualSection[] = [
  {
    title: "Prayer Care Admin",
    paragraphs: [
      "The Requests tab is the master view of every prayer request. Flagged requests (auto-detected or reported) sit in their own queue for you to approve, deny, or edit before they go live. From any request you can also mark it answered/archived, which prompts the requester to share a praise report.",
    ],
  },
  {
    title: "Manage Users",
    paragraphs: [
      "Change a member's role, mark them active/inactive, or delete their account entirely (any active prayer assignments are handed off automatically first, with a note to the new assignee explaining the handoff).",
      "You can also preview the app as another role for training or troubleshooting — use the small toggle on your own Profile page, and end the preview from the same place.",
      "If a prayer team member's account has gone Inactive due to missed assignments, you'll see a Pending Reinstatement Requests banner here once they request to come back — approve it to restore them to active rotation.",
    ],
  },
  {
    title: "Applications",
    paragraphs: [
      "Review applications from members who want to join the prayer care team. You're notified automatically whenever a new one comes in.",
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
      "The app sends a weekly digest (new members, new requests, and more) and nudges the care team automatically when an assignment has gone quiet — you generally won't need to chase this manually.",
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
