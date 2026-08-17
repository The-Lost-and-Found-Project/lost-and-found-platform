import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShareButton from "@/components/ShareButton";
import PushPrompt from "@/components/PushPrompt";
import { LfpSectionHeading } from "@/components/ui/LfpDesignSystem";

const GIVE_URL = "https://www.zeffy.com/en-US/donation-form/donate-to-build-god-centered-marriages";
const communityPaths = [
  {
    href: "/prayer",
    icon: "🙏",
    title: "Prayer",
    description: "Submit a request or pray with someone who needs support.",
  },
  {
    href: "/praise",
    icon: "🙌",
    title: "Praise",
    description: "Celebrate what God is doing and share an expression of Love.",
  },
  {
    href: "/testimonies",
    icon: "✝️",
    title: "Testimonies",
    description: "Read and share stories of grace, restoration, and hope.",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const firstName = profile?.full_name?.trim().split(" ")[0] || "friend";

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.34),transparent_34rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">The Lost and Found Project</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Welcome, {firstName}. You belong here.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">A Christian community where people bring needs before God, celebrate His faithfulness, and share stories that help others find hope.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/prayer/submit" className="lfp-button bg-amber-300 text-slate-950 shadow-xl hover:bg-amber-200">Request Prayer</Link>
            <ShareButton />
          </div>
        </div>
      </section>

      <div className="lfp-shell pt-8 sm:pt-12">
        <PushPrompt />

        <section>
          <LfpSectionHeading eyebrow="Community" title="Pray. Praise. Testify." description="Choose a community space. Each page now brings its ticker, full stories, and actions together." />
          <div className="mt-7 grid gap-6 md:grid-cols-2 md:items-start xl:grid-cols-3">
            {communityPaths.map((path) => (
              <Link key={path.href} href={path.href} className="group lfp-card flex h-full items-start gap-4 p-6 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-2xl ring-1 ring-indigo-100" aria-hidden="true">{path.icon}</span>
                <span>
                  <span className="block text-xl font-black text-slate-950">{path.title}</span>
                  <span className="mt-2 block leading-7 text-slate-600">{path.description}</span>
                  <span className="mt-4 block font-black text-indigo-700 group-hover:text-indigo-600">Open {path.title} →</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-[2rem] border border-amber-200 bg-amber-50/70 p-6 shadow-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Support the ministry</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Help The Lost and Found Project serve more people.</h2>
              <p className="mt-2 max-w-2xl leading-7 text-slate-600">Giving is always optional. Community participation does not require a donation.</p>
            </div>
            <a href={GIVE_URL} target="_blank" rel="noopener noreferrer" className="lfp-button bg-slate-950 text-white">Give Securely</a>
          </div>
        </section>
      </div>
    </main>
  );
}
