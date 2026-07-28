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
      "Your rotation status controls whether you're currently receiving new assignments. Active means you're in the normal rotation. Sabbatical means you've paused yourself temporarily. Paused (Neglect) and Inactive are automatic statuses that kick in if assignments go unattended — see below.",
      "In any of these states, the rest of the app works normally for you — you can still submit prayer requests, read the Prayer Wall, share testimonies, and everything else a regular member can do.",
    ],
  },
  {
    title: "Going on Sabbatical",
    paragraphs: [
      "Need a break? On your Profile page, use the Prayer Rotation card to pause yourself. Anything currently assigned to you is immediately handed to the next person in rotation, so nothing sits waiting on you while you're away.",
      "When you're ready to come back, tap Reactivate on the same card — you're back in the rotation right away.",
    ],
  },
  {
    title: "If You Miss Assignments",
    paragraphs: [
      "If a request assigned to you goes 7 days without action, the app automatically pauses you and reassigns your active requests, the same way sabbatical does. You'll get a popup the next time you open the app letting you know.",
      "You then have 30 days to unpause yourself with one tap from that popup. If you don't, your account moves to Inactive, and you'll instead see a Reactivate popup — tapping it sends a reinstatement request to an admin, who reviews and approves it before you're back in rotation.",
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
