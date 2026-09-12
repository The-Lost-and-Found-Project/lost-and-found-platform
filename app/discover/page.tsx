import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ministryPortals } from "@/lib/ministry-hub";

const lanes = [
  { href: "https://emmaus.lostandfoundproject.org", external: true, icon: "▤", eyebrow: "Study", title: "Open the Word", description: "Go deeper with Emmaus and make Scripture discovery part of your rhythm." },
  { href: "/prayer", icon: "♡", eyebrow: "Prayer", title: "Carry a need", description: "Pray with someone, share a request, or return to a need you are carrying." },
  { href: "/community", icon: "◎", eyebrow: "Community", title: "See what God is doing", description: "Move between prayer, praise, testimony, and encouragement in one community." },
  { href: "/events", icon: "◫", eyebrow: "Gather", title: "Show up", description: "Find the next gathering, study, event, or opportunity to be present." },
];

export default async function DiscoverPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: fresh } = await supabase.from("ministry_content").select("id,ministry_slug,title,summary,content_type,created_at").eq("is_published", true).order("created_at", { ascending: false }).limit(6);

  return <main className="lfp-page pb-24">
    <section className="relative overflow-hidden border-b border-white/60">
      <div aria-hidden className="lfp-grid absolute inset-0" />
      <div className="lfp-shell relative py-12 sm:py-16">
        <div className="max-w-3xl"><p className="lfp-eyebrow">Discover</p><h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-6xl">What do you need <span className="lfp-gradient-text">right now?</span></h1><p className="mt-5 text-lg leading-8 text-slate-600">Don't hunt through menus. Start with the next faithful action and let L&F take you there.</p></div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{lanes.map((lane) => { const card=<><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-700">{lane.icon}</span><p className="mt-5 text-[11px] font-black uppercase tracking-[.17em] text-blue-700">{lane.eyebrow}</p><h2 className="mt-1 text-xl font-black text-slate-950">{lane.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{lane.description}</p><span className="mt-4 inline-flex font-black text-blue-700">Go →</span></>; return lane.external?<a key={lane.title} href={lane.href} target="_blank" rel="noopener noreferrer" className="lfp-card p-5">{card}</a>:<Link key={lane.title} href={lane.href} className="lfp-card p-5">{card}</Link>; })}</div>
      </div>
    </section>

    <div className="lfp-shell py-10 sm:py-14">
      <section><div className="flex items-end justify-between gap-4"><div><p className="lfp-eyebrow">Ministry spaces</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Find your people and your practice.</h2></div><Link href="/ministries" className="hidden font-black text-blue-700 sm:inline-flex">View all →</Link></div><div className="mt-6 grid gap-4 md:grid-cols-3">{ministryPortals.map((m)=><Link key={m.slug} href={`/ministries/${m.slug}`} className="lfp-card p-6"><span className="text-2xl">{m.icon}</span><p className="mt-4 text-[11px] font-black uppercase tracking-[.16em] text-blue-700">{m.eyebrow}</p><h3 className="mt-1 text-2xl font-black text-slate-950">{m.title}</h3><p className="mt-2 leading-7 text-slate-600">{m.description}</p></Link>)}</div></section>

      <section className="mt-14"><p className="lfp-eyebrow">Fresh for you</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">New around L&F</h2>{fresh?.length?<div className="mt-6 grid gap-4 md:grid-cols-2">{fresh.map((item)=>{const ministry=ministryPortals.find(m=>m.slug===item.ministry_slug); return <Link key={item.id} href={`/ministries/${item.ministry_slug}`} className="lfp-card p-6"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-blue-700"><span>{ministry?.icon}</span><span>{ministry?.title||"L&F"}</span><span className="text-slate-300">•</span><span className="text-slate-500">{item.content_type}</span></div><h3 className="mt-3 text-xl font-black text-slate-950">{item.title}</h3>{item.summary&&<p className="mt-2 leading-7 text-slate-600">{item.summary}</p>}</Link>})}</div>:<div className="lfp-card mt-6 p-7"><h3 className="text-xl font-black text-slate-950">Discovery is ready for content.</h3><p className="mt-2 leading-7 text-slate-600">As ministry resources are published, this space becomes a living discovery stream instead of another static resource library.</p></div>}</section>
    </div>
  </main>;
}
