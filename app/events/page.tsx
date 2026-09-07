import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ministryPortals } from "@/lib/ministry-hub";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: gatherings } = await supabase.from("ministry_content")
    .select("id,ministry_slug,title,summary,link_url,starts_at,ends_at,location")
    .eq("content_type", "gathering").eq("is_published", true)
    .gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }).limit(30);

  return <main className="lfp-page pb-24">
    <section className="relative overflow-hidden bg-slate-950 text-white"><div className="lfp-shell relative py-12 sm:py-16">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Gather Together</p><h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Events & Gatherings</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">One calendar for gatherings across The Lost and Found Project.</p>
    </div></section>
    <div className="lfp-shell py-10 sm:py-14">
      <section><p className="lfp-eyebrow">Coming Up</p><h2 className="mt-2 text-3xl font-black text-slate-950">Gather with your L&F community.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">{gatherings?.length ? gatherings.map((event:any) => {
          const ministry = ministryPortals.find((item) => item.slug === event.ministry_slug);
          return <article key={event.id} className="lfp-card p-6"><div className="flex items-center justify-between gap-3"><span className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{ministry?.title || "L&F"}</span><span className="text-sm font-bold text-slate-500">{event.starts_at ? new Date(event.starts_at).toLocaleString() : "Date coming soon"}</span></div><h3 className="mt-3 text-xl font-black text-slate-950">{event.title}</h3>{event.summary && <p className="mt-2 leading-7 text-slate-600">{event.summary}</p>}{event.location && <p className="mt-3 text-sm font-bold text-slate-700">📍 {event.location}</p>}{event.link_url && <a href={event.link_url} className="mt-4 inline-flex font-black text-indigo-700">Event details →</a>}</article>;
        }) : <div className="rounded-[2rem] border border-indigo-200 bg-indigo-50/70 p-6 md:col-span-2"><h3 className="text-xl font-black text-slate-950">No upcoming gatherings are published yet.</h3><p className="mt-2 text-slate-600">Approved ministry gatherings will appear here automatically when they are published.</p></div>}</div>
      </section>
      <section className="mt-12"><p className="lfp-eyebrow">Browse by Ministry</p><div className="mt-6 grid gap-4 md:grid-cols-3">{ministryPortals.map((ministry) => <Link key={ministry.slug} href={`/ministries/${ministry.slug}`} className="lfp-card p-6"><span className="text-2xl">{ministry.icon}</span><h3 className="mt-4 text-xl font-black">{ministry.title}</h3><p className="mt-2 text-slate-600">{ministry.description}</p></Link>)}</div></section>
    </div>
  </main>;
}
