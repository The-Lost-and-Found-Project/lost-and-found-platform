import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LfpSectionHeading } from "@/components/ui/LfpDesignSystem";

const GIVE_URL = "https://www.zeffy.com/en-US/donation-form/donate-to-build-god-centered-marriages";

const groups = [
  {
    title: "Account",
    eyebrow: "Your account",
    description: "Profile, alerts, privacy, and sign-in.",
    items: [
      { href: "/profile", label: "Profile", description: "Manage your personal information and testimony.", icon: "👤" },
      { href: "/notifications", label: "Notifications", description: "Review recent updates and activity.", icon: "🔔" },
      { href: "/settings", label: "Settings", description: "Choose notification and prayer privacy preferences.", icon: "⚙" },
      { href: "/account", label: "Account Security", description: "Manage your password, sign-in, and account access.", icon: "🛡" },
    ],
  },
  {
    title: "Support the mission",
    eyebrow: "Support and feedback",
    description: "Give securely or help us improve the platform.",
    items: [
      { href: GIVE_URL, label: "Give", description: "Support the ministry through a secure Zeffy donation.", icon: "♡", external: true },
      { href: "/feedback", label: "Send Feedback", description: "Tell us what is working and what needs improvement.", icon: "💬" },
    ],
  },
  {
    title: "The Lost and Found Project",
    eyebrow: "About and help",
    description: "Learn about the ministry or get support.",
    items: [
      { href: "/about", label: "About Us", description: "Learn about our mission, values, and ministry direction.", icon: "✦" },
      { href: "/apps", label: "Future Apps", description: "See the focused learning apps being prepared by L&F.", icon: "◫" },
      { href: "/support", label: "Help and Support", description: "Find assistance with your account or the platform.", icon: "?" },
    ],
  },
];

export default async function MorePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (
    <main className="lfp-page pb-20">
      <section className="bg-slate-950 text-white">
        <div className="lfp-shell py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">More</p>
          <h1 className="mt-4 text-4xl font-black sm:text-6xl">Everything else, kept simple.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Manage your account, support the mission, and find help without crowding the primary navigation.</p>
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
                  const content = (
                    <>
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl ring-1 ring-indigo-100" aria-hidden="true">{item.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-3">
                          <span className="text-lg font-black text-slate-950">{item.label}</span>
                          <span className="font-black text-indigo-700 transition group-hover:translate-x-1">→</span>
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-slate-600 sm:mt-2 sm:text-base sm:leading-7">{item.description}</span>
                      </span>
                    </>
                  );
                  return item.external ? (
                    <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className={className}>{content}</a>
                  ) : (
                    <Link key={item.label} href={item.href} className={className}>{content}</Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {profile?.role === "admin" && (
          <section className="mt-12 rounded-[2rem] border border-indigo-200 bg-indigo-50/80 p-6 sm:p-8">
            <p className="lfp-eyebrow">Administration</p>
            <div className="mt-3 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-950">Administration Center</h2>
                <p className="mt-2 leading-7 text-slate-600">Manage prayer requests, users, content, applications, and platform operations.</p>
              </div>
              <Link href="/admin" className="lfp-button lfp-button-primary">Open Admin</Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
