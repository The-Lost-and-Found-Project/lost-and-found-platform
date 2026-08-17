import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShareButton from "@/components/ShareButton";
import PushPrompt from "@/components/PushPrompt";
import { LfpSectionHeading } from "@/components/ui/LfpDesignSystem";

const GIVE_URL = "https://www.zeffy.com/en-US/donation-form/donate-to-build-god-centered-marriages";
const communityFocus = [
  {
    icon: "🙏",
    title: "Prayer",
    description: "Members can share needs and return as often as they are led to pray.",
  },
  {
    icon: "🙌",
    title: "Praise",
    description: "The community can celebrate answered prayer and God’s faithfulness together.",
  },
  {
    icon: "✝️",
    title: "Testimonies",
    description: "Stories of grace and perseverance help other people find hope.",
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
          <div className="mt-8">
            <ShareButton />
          </div>
        </div>
      </section>

      <div className="lfp-shell pt-8 sm:pt-12">
        <PushPrompt />

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start" aria-labelledby="project-purpose-title">
          <div>
            <p className="lfp-eyebrow">About the Project</p>
            <h2 id="project-purpose-title" className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Found, known, and growing in Christ.</h2>
          </div>
          <div className="space-y-5 text-lg leading-8 text-slate-600">
            <p>The Lost and Found Project is a Christian nonprofit ministry creating practical pathways for prayer, discipleship, stronger relationships, and meaningful community.</p>
            <p>Our goal is not to keep people inside an app. It is to help people pray, grow, serve, and build healthier relationships in everyday life.</p>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="community-app-title">
          <LfpSectionHeading eyebrow="About the App" title="A focused Community App" description="Prayer, Praise, and Testimonies each have a dedicated bottom tab and a page that brings its ticker, full stories, and actions together." />
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {communityFocus.map((focus) => (
              <article key={focus.title} className="lfp-card p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl ring-1 ring-indigo-100" aria-hidden="true">{focus.icon}</span>
                <h3 className="mt-5 text-xl font-black text-slate-950">{focus.title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{focus.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-[2rem] border border-amber-200 bg-amber-50/70 p-6 shadow-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Funding the mission</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Help The Lost and Found Project serve more people responsibly.</h2>
              <p className="mt-2 max-w-2xl leading-7 text-slate-600">Donations help cover technology and ministry resources. Giving is always optional, and Community participation remains free.</p>
            </div>
            <a href={GIVE_URL} target="_blank" rel="noopener noreferrer" className="lfp-button bg-slate-950 text-white">Give Securely</a>
          </div>
        </section>
      </div>
    </main>
  );
}
