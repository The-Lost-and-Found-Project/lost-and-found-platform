import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LfpSectionHeading } from "@/components/ui/LfpDesignSystem";

const GIVE_URL = "https://www.zeffy.com/en-US/donation-form/donate-to-build-god-centered-marriages";

const groups = [
  {
    title: "Your L&F Life",
    eyebrow: "Your account",
    description: "Your profile, activity, prayer requests, and preferences.",
    items: [
      { href: "/profile", label: "My Profile", description: "Manage your information and the story you share with the community.", icon: "◉" },
      { href: "/prayer/my-requests", label: "My Prayer Requests", description: "Review, update, and resolve the prayer needs you have shared.", icon: "♡" },
      { href: "/notifications", label: "Notifications", description: "See prayer activity, ministry updates, and recent alerts.", icon: "♢" },
      { href: "/settings", label: "Preferences", description: "Choose notification and prayer privacy preferences.", icon: "⚙" },
      { href: "/account", label: "Account Security", description: "Manage your password, sign-in, and account access.", icon: "▣" },
    ],
  },
  {
    title: "Explore & Participate",
    eyebrow: "Ministry",
    description: "Find ministries, gatherings, and shared community spaces.",
    items: [
      { href: "/ministries", label: "Ministry Hub", description: "Enter The Hearth, The Foundry, Men's Study, and future ministries.", icon: "◇" },
      { href: "/events", label: "Events & Gatherings", description: "Find gatherings across the entire L&F ministry family.", icon: "◫" },
      { href: "/praise", label: "Praise", description: "Celebrate God's faithfulness with the community.", icon: "✦" },
      { href: "/testimonies", label: "Testimonies", description: "Read and share stories of grace, restoration, and hope.", icon: "◎" },
    ],
  },
  {
    title: "The Lost and Found Project",
    eyebrow: "Mission & support",
    description: "Understand the mission, help improve it, or support the work.",
    items: [
      { href: "/about", label: "About the Ministry", description: "Learn about our mission, values, and ministry direction.", icon: "✦" },
      { href: GIVE_URL, label: "Give", description: "Support the ministry through a secure Zeffy donation.", icon: "♡", external: true },
      { href: "/feedback", label: "Send Feedback", description: "Tell us what is working and what needs improvement.", icon: "□" },
      { href: "/support", label: "Help & Support", description: "Find assistance with your account or the platform.", icon: "?" },
    ],
  },
];

export default async function MorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).single();
  const displayName = profile?.full_name?.trim() || user.email?.split("@")[0] || "Member";

  return (
    <main className="lfp-page pb-24">
      <section className="bg-slate-950 text-white">
        <div className="lfp-shell py-12 sm:py-16">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">My L&F</p>
          <h1 className="mt-4 text-4xl font-black sm:text-6xl">{displayName}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Your place to manage your account, revisit what you have shared, explore ministry, and stay connected to The Lost and Found Project.</p>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <div className="space-y-10 sm:space-y-12">
          {groups.map((group) => (
            <section key={group.title}>
              <LfpSectionHeading eyebrow={group.eyebrow} title={group.title} description={group.description} />
              <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
                {group.items.map((item) => {
                  const className = "lfp-card group flex items-start gap-4 p-4 sm:p-6";
                  const content = <><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl ring-1 ring-indigo-100" aria-hidden="true">{item.icon}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><span className="text-lg font-black text-slate-950">{item.label}</span><span className="font-black text-indigo-700 transition group-hover:translate-x-1">→</span></span><span className="mt-1 block text-sm leading-6 text-slate-600 sm:mt-2 sm:text-base sm:leading-7">{item.description}</span></span></>;
                  return item.external ? <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={className}>{content}</a> : <Link key={item.label} href={item.href} className={className}>{content}</Link>;
                })}
              </div>
            </section>
          ))}
        </div>

        {profile?.role === "admin" && (
          <section className="mt-12 rounded-[2rem] border border-indigo-200 bg-indigo-50/80 p-6 sm:p-8">
            <p className="lfp-eyebrow">Administration</p>
            <div className="mt-3 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div><h2 className="text-2xl font-black text-slate-950">Administration Center</h2><p className="mt-2 leading-7 text-slate-600">Manage prayer requests, members, ministry content, applications, and platform operations.</p></div>
              <Link href="/admin" className="lfp-button lfp-button-primary">Open Admin</Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
