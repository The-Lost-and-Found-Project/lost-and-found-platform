import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShareButton from "@/components/ShareButton";
import PushPrompt from "@/components/PushPrompt";
import { ministryPortals } from "@/lib/ministry-hub";

const GIVE_URL = "https://www.zeffy.com/en-US/donation-form/donate-to-build-god-centered-marriages";

const communityActions = [
  { href: "/prayer", icon: "♡", title: "Prayer", description: "Share a need or pray with someone today." },
  { href: "/praise", icon: "✦", title: "Praise", description: "Celebrate God's faithfulness with the community." },
  { href: "/testimonies", icon: "◎", title: "Testimonies", description: "Read and share stories that point people toward hope." },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const firstName = profile?.full_name?.trim().split(" ")[0] || "friend";

  return (
    <main className="lfp-page pb-24">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.34),transparent_34rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">The Lost and Found Project</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Welcome, {firstName}. Find your next faithful step.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">One ministry hub for gathering, prayer, discipleship, encouragement, and service — built to help people move from feeling lost to being found, known, and growing in Christ.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/ministries" className="lfp-button bg-amber-300 text-slate-950 shadow-xl hover:bg-amber-200">Explore Ministries</Link>
            <ShareButton />
          </div>
        </div>
      </section>

      <div className="lfp-shell pt-8 sm:pt-12">
        <PushPrompt />

        <section aria-labelledby="ministries-title">
          <p className="lfp-eyebrow">Ministry Hub</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="ministries-title" className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Where do you want to grow?</h2>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">Enter a ministry portal for focused gatherings, studies, resources, service, and community.</p>
            </div>
            <Link href="/ministries" className="font-black text-indigo-700">View all ministries →</Link>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {ministryPortals.map((ministry) => (
              <Link key={ministry.slug} href={`/ministries/${ministry.slug}`} className="lfp-card group p-6 transition hover:border-indigo-200 hover:shadow-xl">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl ring-1 ring-indigo-100" aria-hidden="true">{ministry.icon}</span>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{ministry.eyebrow}</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">{ministry.title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{ministry.description}</p>
                <span className="mt-4 inline-flex font-black text-indigo-700">Enter <span className="ml-1 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14" aria-labelledby="community-title">
          <p className="lfp-eyebrow">Community Today</p>
          <h2 id="community-title" className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Pray. Celebrate. Tell the story.</h2>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">These shared spaces connect every ministry in The Lost and Found Project.</p>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {communityActions.map((action) => (
              <Link key={action.href} href={action.href} className="lfp-card group p-6 transition hover:border-indigo-200 hover:shadow-xl">
                <span className="text-2xl text-indigo-700" aria-hidden="true">{action.icon}</span>
                <h3 className="mt-4 text-xl font-black text-slate-950">{action.title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{action.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-5 md:grid-cols-2">
          <Link href="/events" className="rounded-[2rem] bg-indigo-50 p-6 ring-1 ring-indigo-100 transition hover:shadow-lg sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Gather</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Events & Gatherings</h2>
            <p className="mt-3 leading-7 text-slate-600">See what's happening across L&F and its ministries.</p>
          </Link>
          <Link href="/about" className="rounded-[2rem] bg-slate-100 p-6 ring-1 ring-slate-200 transition hover:shadow-lg sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">Our Mission</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Why The Lost and Found Project exists</h2>
            <p className="mt-3 leading-7 text-slate-600">Understand the ministry, what we believe, and how to get involved.</p>
          </Link>
        </section>

        <section className="mt-14 rounded-[2rem] border border-amber-200 bg-amber-50/70 p-6 shadow-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Support the mission</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Help us create practical pathways for people to find hope and grow in Christ.</h2>
              <p className="mt-2 max-w-2xl leading-7 text-slate-600">Giving is optional. Donations help cover responsible technology and ministry resources while participation remains free.</p>
            </div>
            <a href={GIVE_URL} target="_blank" rel="noopener noreferrer" className="lfp-button bg-slate-950 text-white">Give Securely</a>
          </div>
        </section>
      </div>
    </main>
  );
}
