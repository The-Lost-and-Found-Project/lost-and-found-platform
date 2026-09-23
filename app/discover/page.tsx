import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ministryPortals } from "@/lib/ministry-hub";

const primaryLanes = [
  { href: "/library#study", icon: "▤", eyebrow: "Study", title: "Study Scripture", description: "Choose an L&F study or move deeper into Emmaus." },
  { href: "/library#devotional", icon: "☼", eyebrow: "Devotions", title: "Build a daily rhythm", description: "Short teaching, Scripture, reflection, and application for everyday formation." },
  { href: "/learn", icon: "?", eyebrow: "Trivia", title: "Learn by playing", description: "Bible-learning experiences designed to help truth stick, not just test recall." },
  { href: "/library#audio", icon: "◉", eyebrow: "Watch & Listen", title: "Hear something worth carrying", description: "Original L&F teaching and carefully approved media from trusted voices." },
  { href: "/library#collection", icon: "◇", eyebrow: "For Me", title: "Follow a guided path", description: "Collections connect Scripture, study, devotion, media, prayer, and a practical next step." },
];

const quickNeeds = [
  { href: "/prayer", label: "I need prayer", copy: "Share a request or pray with someone else." },
  { href: "/learn", label: "I want to learn", copy: "Start with Bible Trivia, Memory Verses, or Language Insights." },
  { href: "/library#devotional", label: "I need a reset", copy: "Open a short devotional rhythm for today." },
  { href: "/community", label: "I need community", copy: "See prayer, praise, testimony, and encouragement in one place." },
  { href: "/directory", label: "I need a resource", copy: "Find ministries, churches, nonprofits, and practical help." },
];

const provenanceLabel = (value: string) => value === "lfp_original" ? "L&F Original" : value === "lfp_approved" ? "L&F Approved" : "Emmaus";
const typeLabel = (value: string) => value === "audio" ? "Listen" : value === "video" ? "Watch" : value === "collection" ? "Collection" : value.charAt(0).toUpperCase() + value.slice(1);

export default async function DiscoverPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: fresh }, { data: catalog }] = await Promise.all([
    supabase.from("ministry_content").select("id,ministry_slug,title,summary,content_type,created_at").eq("is_published", true).order("created_at", { ascending: false }).limit(4),
    supabase.from("content_catalog").select("id,slug,title,summary,content_type,provenance,external_url,published_at,is_featured,duration_minutes,difficulty").eq("is_published", true).order("is_featured", { ascending: false }).order("published_at", { ascending: false }).limit(10),
  ]);

  const featured = (catalog ?? []).filter((item: any) => item.is_featured).slice(0, 3);
  const recent = (catalog ?? []).filter((item: any) => !item.is_featured).slice(0, 6);

  return <main className="lfp-page pb-24">
    <section className="relative overflow-hidden border-b border-white/60">
      <div aria-hidden className="lfp-grid absolute inset-0" />
      <div aria-hidden className="lfp-orb -right-28 top-0 h-80 w-80 bg-sky-200/45" />
      <div className="lfp-shell relative py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <div className="max-w-4xl">
            <p className="lfp-eyebrow">Discover</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-6xl">What would help you take your <span className="lfp-gradient-text">next step?</span></h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Discover is your starting point for Scripture, devotion, Bible learning, trusted media, community, and guided collections. Start with what you need now; L&F can help you go deeper from there.</p>
          </div>
          <div className="lfp-card p-6">
            <p className="text-[11px] font-black uppercase tracking-[.17em] text-blue-700">Not sure where to begin?</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Start with one honest need.</h2>
            <div className="mt-5 grid gap-2">{quickNeeds.map((item) => <Link key={item.label} href={item.href} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50/60"><span className="font-black text-slate-950">{item.label}</span><span className="mt-1 block text-sm leading-5 text-slate-500">{item.copy}</span></Link>)}</div>
          </div>
        </div>
      </div>
    </section>

    <div className="lfp-shell py-10 sm:py-14">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="lfp-eyebrow">Choose a lane</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Five ways to discover what is next.</h2></div><Link href="/library" className="font-black text-blue-700">Open full library →</Link></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{primaryLanes.map((lane) => <Link key={lane.title} href={lane.href} className="lfp-card group p-5"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-700">{lane.icon}</span><p className="mt-5 text-[11px] font-black uppercase tracking-[.17em] text-blue-700">{lane.eyebrow}</p><h3 className="mt-1 text-xl font-black text-slate-950">{lane.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{lane.description}</p><span className="mt-4 inline-flex font-black text-blue-700 transition group-hover:translate-x-1">Explore →</span></Link>)}</div>
      </section>

      <section className="mt-14 rounded-[2rem] bg-[rgb(var(--lfp-ink))] p-7 text-white sm:p-9">
        <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><p className="text-[11px] font-black uppercase tracking-[.17em] text-sky-300">Learning Lab</p><h2 className="mt-2 text-3xl font-black">Play → Learn → Remember → Understand → Apply.</h2><p className="mt-3 max-w-3xl leading-7 text-slate-300">Bible Trivia is only the front door. Learning Lab uses questions, feedback, memory practice, and language insights to turn play into understanding. In Language Insights, context determines semantic sense; a Greek or Hebrew word does not mean every dictionary definition at once.</p></div>
          <Link href="/learn" className="lfp-button bg-white text-slate-950">Open Learning Lab →</Link>
        </div>
      </section>

      {featured.length > 0 && <section className="mt-14"><p className="lfp-eyebrow">Featured for you</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Strong places to start.</h2><div className="mt-6 grid gap-4 lg:grid-cols-3">{featured.map((item: any) => <ResourceCard key={item.id} item={item} featured />)}</div></section>}

      {recent.length > 0 && <section className="mt-14"><div className="flex items-end justify-between gap-4"><div><p className="lfp-eyebrow">Fresh in Discover</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Study, watch, listen, practice.</h2></div><Link href="/library" className="hidden font-black text-blue-700 sm:inline-flex">View everything →</Link></div><div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{recent.map((item: any) => <ResourceCard key={item.id} item={item} />)}</div></section>}

      <section className="mt-14 rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-7 sm:p-9"><div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="lfp-eyebrow">Ministry & Resource Directory</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Find help beyond L&F without losing context.</h2><p className="mt-3 max-w-3xl leading-7 text-slate-600">Search curated ministries, churches, nonprofits, online resources, and practical support. Save useful listings to your account and return to them later.</p></div><div className="flex flex-wrap gap-3"><Link href="/directory" className="lfp-button lfp-button-primary">Open Directory</Link><Link href="/directory/saved" className="lfp-button lfp-button-secondary">Saved Resources</Link></div></div></section>

      <section className="mt-14 grid gap-4 lg:grid-cols-2">
        <div className="lfp-card p-7 sm:p-8"><p className="lfp-eyebrow">My Path</p><h2 className="mt-2 text-3xl font-black text-slate-950">You should not have to wonder what comes next.</h2><p className="mt-3 leading-7 text-slate-600">My Path is becoming the place where your studies, saved resources, Emmaus progress, devotions, Learning Lab practice, media, and ministry involvement come together into relevant next steps.</p><Link href="/dashboard" className="mt-5 inline-flex font-black text-blue-700">See your path →</Link></div>
        <div className="lfp-card p-7 sm:p-8"><p className="lfp-eyebrow">Emmaus</p><h2 className="mt-2 text-3xl font-black text-slate-950">When you are ready to go deeper.</h2><p className="mt-3 leading-7 text-slate-600">Emmaus is L&F’s deeper Bible-study environment. Use Discover to find what you need, then move naturally into deeper passage study without duplicating the Emmaus experience here.</p><Link href="/auth/emmaus?next=/study" className="mt-5 inline-flex font-black text-blue-700">Go deeper in Emmaus →</Link></div>
      </section>

      <section className="mt-14"><div className="flex items-end justify-between gap-4"><div><p className="lfp-eyebrow">Ministry spaces</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Find your people and your practice.</h2></div><Link href="/ministries" className="hidden font-black text-blue-700 sm:inline-flex">View all →</Link></div><div className="mt-6 grid gap-4 md:grid-cols-3">{ministryPortals.map((m) => <Link key={m.slug} href={`/ministries/${m.slug}`} className="lfp-card p-6"><span className="text-2xl">{m.icon}</span><p className="mt-4 text-[11px] font-black uppercase tracking-[.16em] text-blue-700">{m.eyebrow}</p><h3 className="mt-1 text-2xl font-black text-slate-950">{m.title}</h3><p className="mt-2 leading-7 text-slate-600">{m.description}</p></Link>)}</div></section>

      <section className="mt-14"><p className="lfp-eyebrow">Fresh around L&F</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Ministry updates and gatherings</h2>{fresh?.length ? <div className="mt-6 grid gap-4 md:grid-cols-2">{fresh.map((item) => { const ministry = ministryPortals.find(m => m.slug === item.ministry_slug); return <Link key={item.id} href={`/ministries/${item.ministry_slug}`} className="lfp-card p-6"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-blue-700"><span>{ministry?.icon}</span><span>{ministry?.title || "L&F"}</span><span className="text-slate-300">•</span><span className="text-slate-500">{item.content_type}</span></div><h3 className="mt-3 text-xl font-black text-slate-950">{item.title}</h3>{item.summary && <p className="mt-2 leading-7 text-slate-600">{item.summary}</p>}</Link> })}</div> : <div className="lfp-card mt-6 p-7"><h3 className="text-xl font-black text-slate-950">Fresh ministry content will appear here.</h3><p className="mt-2 leading-7 text-slate-600">The library remains available even between ministry announcements and gatherings.</p></div>}</section>
    </div>
  </main>;
}

function ResourceCard({ item, featured = false }: { item: any; featured?: boolean }) {
  const isEmmaus = item.provenance === "emmaus";
  const href = isEmmaus ? "/auth/emmaus?next=/study" : item.external_url || `/library/${item.slug}`;
  const external = Boolean(item.external_url) && !isEmmaus;
  const body = <><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[.13em] text-blue-700">{provenanceLabel(item.provenance)}</span><span className="text-xs font-bold text-slate-400">{typeLabel(item.content_type)}</span>{featured && <span className="text-xs font-black text-amber-600">Featured</span>}</div><h3 className="mt-4 text-xl font-black text-slate-950">{item.title}</h3>{item.summary && <p className="mt-2 line-clamp-3 leading-7 text-slate-600">{item.summary}</p>}<div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-500">{item.duration_minutes && <span>{item.duration_minutes} min</span>}{item.difficulty && <span>• {item.difficulty}</span>}</div><span className="mt-5 inline-flex font-black text-blue-700">{isEmmaus ? "Continue in Emmaus" : "Open"} →</span></>;
  return external ? <a href={href} target="_blank" rel="noopener noreferrer" className="lfp-card p-6">{body}</a> : <Link href={href} className="lfp-card p-6">{body}</Link>;
}
