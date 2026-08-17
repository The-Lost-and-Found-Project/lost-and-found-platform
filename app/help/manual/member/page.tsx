import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ManualSections, { ManualSection } from "@/components/ManualSections";

const sections: ManualSection[] = [
  {
    title: "Getting Around",
    paragraphs: [
      "After you sign in, the Home tab is your dashboard. The bar at the bottom gets you to Prayer, Praise, Testimonies, and Notifications. Tap your profile picture for Profile, Settings, Help, and sign out.",
    ],
  },
  {
    title: "Submitting a Prayer Request",
    paragraphs: [
      "From the Prayer tab, submit a new request and choose whether it may appear on the Prayer Wall and whether your name is shown.",
      "Authorized administrators review requests for safety and privacy before public display. Requests are not assigned to individual members.",
    ],
  },
  {
    title: "Praying for Others",
    paragraphs: [
      "The Prayer Wall shows requests from the community. Tap \"I Prayed\" whenever you intentionally pray for another member's request. Each prayer is recorded, and the button remains available if you pray for that request again later.",
      "You cannot react to your own prayer request. Your own request is clearly identified when you open it, and the reaction button is not shown.",
    ],
  },
  {
    title: "Sharing a Testimony",
    paragraphs: [
      "The Testimonies tab is where you can share your story of faith. You can post it under your name or anonymously, and you can come back and edit it any time. Each member can have one testimony on the board at a time.",
      "You may tap \"This encouraged me\" once on another member's testimony and tap again to remove it. You cannot encourage your own testimony.",
    ],
  },
  {
    title: "Sharing a Praise Report",
    paragraphs: [
      "When a prayer is answered, share the good news on the Praise tab. It's a great way to encourage the rest of the community and celebrate what God is doing.",
      "You may give one Love to another member's praise report and tap again to remove it. You cannot Love your own praise report.",
    ],
  },
  {
    title: "My Prayer Requests",
    paragraphs: [
      "Open My Prayer Requests from the Prayer page to review what you shared, make an update, mark a prayer answered, or remove it from your active list.",
    ],
  },
  {
    title: "Notifications",
    paragraphs: [
      "The Notifications tab shows updates when someone prays for your request, Loves your praise report, or is encouraged by your testimony. Reaction notifications never identify the member who reacted.",
      "Use Settings to choose which reaction notifications you receive. Turn on push notifications there if you also want alerts when the app is not open.",
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
      "The Account page lets you reset your password or permanently delete your account. Prayer requests are community records and are not assigned to another member.",
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
