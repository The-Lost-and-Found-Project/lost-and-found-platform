import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole } from "@/lib/effective-role";
import ManualSections, { ManualSection } from "@/components/ManualSections";

const sections: ManualSection[] = [
  {
    title: "My Prayer Assignments",
    paragraphs: [
      "This is your personal to-do list — every prayer request currently assigned to you. Requests are handed out automatically in rotation, so you won't need to go looking for them.",
      "For each request, work through the checklist: mark that you've prayed, and note whether you've reached out to the requester and whether they wanted to be contacted. Once a request is answered or no longer active, it comes off your list.",
    ],
  },
  {
    title: "Understanding Prayer Rotation",
    paragraphs: [
      "Ministry availability controls new assignments without changing login access. Available receives assignments, Away is a self-selected break, Limited pauses new assignments, and Inactive removes someone from assignment rotation until an admin restores availability.",
      "In any of these states, the rest of the app works normally for you — you can still submit prayer requests, read the Prayer Wall, share testimonies, and everything else a regular member can do.",
    ],
  },
  {
    title: "Going on Sabbatical",
    paragraphs: [
      "Need a break? On your Profile page, set your ministry availability to Away. Anything currently assigned to you is immediately handed to the next person in rotation, so nothing sits waiting on you while you're away.",
      "When you're ready to come back, return your availability to Available.",
    ],
  },
  {
    title: "If You Miss Assignments",
    paragraphs: [
      "If a request assigned to you goes 7 days without action, the request is flagged and reassigned for timely care. Your ministry availability becomes Limited, but your account and login stay active.",
      "After a first missed assignment you may return yourself to Available. Repeated missed assignments require care-leader review, and account deactivation remains a separate human decision.",
    ],
  },
];

export default async function PrayerTeamManualPage() {
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

  if (
    effectiveRole !== "prayer_team" &&
    effectiveRole !== "pastor" &&
    effectiveRole !== "admin"
  ) {
    redirect("/help");
  }

  return (
    <ManualSections
      title="Prayer Team Guide"
      intro="How assignments, rotation, and sabbatical work for the prayer care team."
      sections={sections}
    />
  );
}
