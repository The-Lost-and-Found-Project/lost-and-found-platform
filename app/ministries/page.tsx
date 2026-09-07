import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ministryPortals } from "@/lib/ministry-hub";

export default async function MinistriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="lfp-page pb-24">
      <section className="relative overflow-hidden bg-slate-950 text-white"><div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.34),transparent_34rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" /><div className="lfp-shell relative py-12 sm:py-16"><p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Ministry Hub</p><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Find your place to gather, grow, and serve.</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Choose a ministry based on the next step you need. Each portal now connects purpose directly to participation while sharing the larger community life of L&F.</p></div></section>

      <div className="lfp-shell py-10 sm:py-14">
        <section className="grid gap-5 md:grid-cols-3" aria-label="Ministry portals">{ministryPortals.map((ministry) => <Link key={ministry.slug} href={`/ministries/${ministry.slug}`} className="lfp-card group flex h-full flex-col p-6 transition hover:border-indigo-200 hover:shadow-xl"><div className="flex items-start justify-between gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl ring-1 ring-indigo-100" aria-hidden="true">{ministry.icon}</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-800">Open</span></div><p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{ministry.eyebrow}</p><h2 className="mt-2 text-2xl font-black text-slate-950">{ministry.title}</h2><p className="mt-3 flex-1 leading-7 text-slate-600">{ministry.description}</p><span className="mt-5 inline-flex font-black text-indigo-700">Enter ministry <span className="ml-1 transition group-hover:translate-x-1">→</span></span></Link>)}</section>

        <section className="mt-12 grid gap-5 lg:grid-cols-[1fr_0.7fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><p className="lfp-eyebrow">Shared Community</p><h2 className="mt-2 text-3xl font-black text-slate-950">Different ministries. One family.</h2><p className="mt-3 max-w-3xl leading-7 text-slate-600">Prayer, Praise, Testimonies, and Events remain shared across The Lost and Found Project. That keeps members connected to the whole ministry instead of trapping relationships inside separate portals.</p><div className="mt-6 flex flex-wrap gap-3"><Link href="/prayer" className="lfp-button bg-slate-950 text-white">Prayer</Link><Link href="/praise" className="lfp-button border border-slate-200 bg-white text-slate-900">Praise</Link><Link href="/testimonies" className="lfp-button border border-slate-200 bg-white text-slate-900">Testimonies</Link><Link href="/events" className="lfp-button border border-slate-200 bg-white text-slate-900">Events</Link></div></div>
          <aside className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Not sure where to start?</p><h2 className="mt-2 text-2xl font-black text-slate-950">Choose the need in front of you.</h2><p className="mt-3 leading-7 text-slate-600"><strong>The Hearth</strong> for belonging and connection. <strong>The Foundry</strong> for formation and service. <strong>Men's Study</strong> for Scripture, brotherhood, and application.</p></aside>
        </section>
      </div>
    </main>
  );
}
