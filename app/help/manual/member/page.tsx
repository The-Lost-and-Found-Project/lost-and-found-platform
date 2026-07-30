import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ManualSections, { ManualSection } from "@/components/ManualSections";

const sections: ManualSection[] = [
  {
    title: "Getting Around",
    paragraphs: [
      "After you sign in, the Home tab is your dashboard — it shows your recent activity and quick links. The bar at the bottom of the screen gets you to Prayer, Testimonies, Praise, and My Journey. Tap your profile picture (top right) for Profile, Settings, Programs, Help, and to sign out.",
    ],
  },
  {
    title: "Submitting a Prayer Request",
    paragraphs: [
      "From the Prayer tab, tap to submit a new request. You can share as much or as little as you're comfortable with, and choose to submit anonymously. If you'd like, you can request a prayer partner of a specific gender.",
      "Every request is reviewed before it appears on the public Prayer Wall, and it's automatically assigned to a member of our prayer care team, who will be praying for you personally.",
    ],
  },
  {
    title: "Praying for Others",
    paragraphs: [
      "The Prayer Wall shows requests from the community. Tap \"Pray\" whenever you intentionally pray for a request. Each prayer is recorded, and the button remains available if you pray for that request again later.",
    ],
  },
  {
    title: "Sharing a Testimony",
    paragraphs: [
      "The Testimonies tab is where you can share your story of faith. You can post it under your name or anonymously, and you can come back and edit it any time. Each member can have one testimony on the board at a time.",
    ],
  },
  {
    title: "Sharing a Praise Report",
    paragraphs: [
      "When a prayer is answered, share the good news on the Praise tab. It's a great way to encourage the rest of the community and celebrate what God is doing.",
    ],
  },
  {
    title: "My Journey",
    paragraphs: [
      "My Journey is your personal timeline — every prayer request, testimony, and milestone you've shared, all in one place. It's a good way to look back and see how far you've come.",
    ],
  },
  {
    title: "Notifications",
    paragraphs: [
      "The bell icon at the top of the app shows updates — like when someone prays for your request, or when your prayer care partner reaches out. Turn on push notifications in Settings to get alerted even when the app isn't open (see \"Install the App\" on the Help page first, especially on iPhone).",
    ],
  },
  {
    title: "Profile & Settings",
    paragraphs: [
      "Update your name, photo, and other details on your Profile page. Settings is where you manage your notification preferences and other account options.",
    ],
  },
  {
    title: "Your Account",
    paragraphs: [
      "The Account page lets you reset your password. If you ever need to, you can also permanently delete your account there — if you have any active prayer requests assigned to a care team member at the time, they'll be handed off to someone else first.",
    ],
  },
  {
    title: "Joining the Prayer Care Team",
    paragraphs: [
      "Feel called to pray for others as part of the care team? You can apply right from the app — look for the application card on your dashboard, or ask us directly using Contact Us.",
    ],
  },
  {
    title: "Contact Us",
    paragraphs: [
      "Use Contact Us on the Help page to send our team a message any time. It's a one-way note — if we need to follow up, we'll reach out by email.",
    ],
  },
];

export default async function MemberManualPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <ManualSections
      title="Member Guide"
      intro="Everything you need to make the most of the app as a member of the community."
      sections={sections}
    />
  );
}
