import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const GIVE_URL = "https://www.zeffy.com/en-US/donation-form/donate-to-build-god-centered-marriages";
const communityFocus = [
  {
    icon: "🙏",
    title: "Prayer",
    description: "A moderated place to share needs and carry one another before God.",
  },
  {
    icon: "🙌",
    title: "Praise",
    description: "A shared record of answered prayer and God’s everyday faithfulness.",
  },
  {
    icon: "✝️",
    title: "Testimonies",
    description: "Stories of grace, restoration, perseverance, and hope that point back to God.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.34),transparent_34rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">The Lost and Found Project</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">You don&apos;t have to carry it alone.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-indigo-100/80">A Christian community where people bring needs before God, celebrate His faithfulness, and share stories that help others find hope.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="lfp-button bg-amber-300 text-slate-950 shadow-xl hover:bg-amber-200">Join the Community</Link>
              <Link href="/login" className="lfp-button border border-white/20 bg-white/10 text-white">Sign In</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="lfp-shell py-12 sm:py-16">
        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start" aria-labelledby="project-purpose-title">
          <div>
            <p className="lfp-eyebrow">About the Project</p>
            <h2 id="project-purpose-title" className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Helping people move from feeling lost to being found, known, and growing in Christ.</h2>
          </div>
          <div className="space-y-5 text-lg leading-8 text-slate-600">
            <p>The Lost and Found Project is a Christian nonprofit ministry creating practical pathways for prayer, discipleship, stronger relationships, and meaningful community.</p>
            <p>We are building tools that support real spiritual growth without replacing the local church, trusted relationships, or everyday acts of faithfulness.</p>
          </div>
        </section>

        <section className="mt-14" aria-labelledby="community-app-title">
          <div className="max-w-3xl">
            <p className="lfp-eyebrow">About the Community App</p>
            <h2 id="community-app-title" className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">A focused space to pray, celebrate, and share hope.</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">The bottom tabs keep these community spaces close at hand while Home remains a place to understand the mission and its impact.</p>
          </div>
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

        <section className="mt-14 rounded-[2rem] border border-amber-200 bg-amber-50/70 p-7 shadow-sm sm:p-10" aria-labelledby="funding-title">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Funding the mission</p>
              <h2 id="funding-title" className="mt-2 text-3xl font-black text-slate-950">Built with care and supported by generosity.</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">Donations help cover responsible technology, ministry resources, and the work required to serve more people. Giving is always optional, and Community participation remains free.</p>
            </div>
            <a href={GIVE_URL} target="_blank" rel="noopener noreferrer" className="lfp-button bg-slate-950 text-white lg:justify-self-end">Give Securely</a>
          </div>
        </section>
      </div>
    </main>
  );
}
