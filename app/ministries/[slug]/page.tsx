import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMinistryPortal, ministryPortals } from "@/lib/ministry-hub";

export function generateStaticParams() {
  return ministryPortals.map(({ slug }) => ({ slug }));
}

export default async function MinistryPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ministry = getMinistryPortal(slug);
  if (!ministry) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="lfp-page pb-24">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.34),transparent_34rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-12 sm:py-16">
          <Link href="/ministries" className="text-sm font-bold text-indigo-200 hover:text-white">← All ministries</Link>
          <div className="mt-6 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl ring-1 ring-white/15" aria-hidden="true">{ministry.icon}</span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">{ministry.eyebrow}</p>
              <h1 className="mt-1 text-4xl font-black tracking-tight sm:text-6xl">{ministry.title}</h1>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-indigo-100/75">{ministry.description}</p>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="lfp-card p-6 sm:p-8">
            <p className="lfp-eyebrow">Why this ministry exists</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">A clear purpose inside the larger mission.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">{ministry.purpose}</p>
          </article>
          <aside className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Scripture anchor</p>
            <p className="mt-3 text-3xl font-black text-slate-950">{ministry.scripture}</p>
            <p className="mt-3 leading-7 text-slate-600">The portal will keep Scripture, ministry purpose, and practical participation connected rather than functioning as an information-only page.</p>
          </aside>
        </section>

        <section className="mt-12">
          <p className="lfp-eyebrow">Portal Modules</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Everything for this ministry, in one place.</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ministry.modules.map((module) => (
              <article key={module} className="lfp-card p-5">
                <h3 className="text-lg font-black text-slate-950">{module}</h3>
                <p className="mt-2 leading-7 text-slate-600">This module is part of the portal foundation and is ready for ministry-specific content and workflow.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] bg-slate-950 p-6 text-white sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Connected to L&F</p>
          <h2 className="mt-2 text-2xl font-black">Prayer and community stay close.</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-300">Ministry portals connect into the shared life of The Lost and Found Project instead of creating isolated silos.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/prayer" className="lfp-button bg-amber-300 text-slate-950">Pray</Link>
            <Link href="/events" className="lfp-button border border-white/20 bg-white/10 text-white">Events</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
