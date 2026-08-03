import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Discovery = {
  id: string;
  discovery_key: string;
  title: string | null;
  subtitle: string | null;
  translation: string | null;
  created_at: string;
};

export default async function EmmausWalkPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: discoveries }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    supabase
      .from("emmaus_discoveries")
      .select("id, discovery_key, title, subtitle, translation, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const firstName = profile?.full_name?.trim().split(" ")[0] || "friend";
  const published = (discoveries ?? []) as Discovery[];
  const featured = published[0] ?? null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const featuredHref = featured ? `/emmaus/discovery/${featured.discovery_key}` : "/emmaus/discovery/demo";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 pb-24 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">Emmaus · Walk with Christ through His Word</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">{greeting}, {firstName}.</h1>
              <p className="mt-4 text-xl leading-8 text-indigo-100/80">Where should you continue in Scripture today?</p>
            </div>
            {profile?.role === "admin" && (
              <div className="flex flex-wrap gap-2">
                <Link href="/emmaus/inspect/john-1-1" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">Review John 1:1</Link>
                <Link href="/emmaus/admin/dashboard" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">Founder Studio</Link>
              </div>
            )}
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-amber-300/30 bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 p-1 shadow-2xl">
          <div className="rounded-[1.8rem] bg-slate-950/95 p-6 sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Your next faithful step</p>
            <div className="mt-4 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h2 className="text-3xl font-black sm:text-5xl">{featured?.title || "The Eternal Word"}</h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-indigo-100/70">{featured?.subtitle || "Return to John 1:1 and follow the question that still holds your attention."}</p>
                <div className="mt-6 flex flex-wrap gap-2 text-sm">
                  <Pill>{featured?.translation || "KJV"}</Pill>
                  <Pill>Recommended depth: Growing</Pill>
                  <Pill>Current thread: Jesus · Identity · Trust</Pill>
                </div>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-indigo-100/55">Recommended because your recent journey has repeatedly connected Christ’s identity, creation, revelation, and trust.</p>
              </div>
              <Link href={featuredHref} className="inline-flex justify-center rounded-full bg-amber-300 px-7 py-3.5 font-black text-slate-950 shadow-lg transition hover:bg-amber-200">Continue Walking →</Link>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-4 md:grid-cols-3">
          <InsightCard eyebrow="Journey" title="Jesus remains your strongest study thread" description="See why Emmaus is recommending your next step." href="/emmaus/journey" action="Open Journey Engine" />
          <InsightCard eyebrow="Growth" title="Observation is strong; context is ready to grow" description="Review the evidence shaping your adaptive study depth." href="/emmaus/profile/learning" action="View Learning Profile" />
          <InsightCard eyebrow="Timeline" title="Your study has shifted toward trust and obedience" description="Look back across the seasons of your Scripture journey." href="/emmaus/timeline" action="View Timeline" />
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Choose another direction</p>
            <h2 className="mt-2 text-3xl font-black">The road stays open.</h2>
            <p className="mt-3 text-indigo-100/65">Follow the recommendation, return to a previous thread, or explore freely.</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ActionCard icon="📖" title="Open Scripture" description="Choose a book, chapter, and verse." href="/emmaus/admin/bible" />
            <ActionCard icon="🔍" title="Explore Connections" description="Move through verses, themes, people, and words." href="/emmaus/explore" />
            <ActionCard icon="🙏" title="Enter Prayer" description="Respond to Scripture and revisit God’s faithfulness." href="/prayer" />
            <ActionCard icon="🧭" title="Follow a Rabbit Trail" description="Trace The Word through creation, incarnation, and glory." href="/emmaus/trails/logos" />
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Continue exploring</p><h2 className="mt-2 text-2xl font-black">Available walks</h2></div>
              <Link href="/emmaus/assessment" className="text-sm font-bold text-amber-300">Discover your starting point →</Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {(published.length ? published.slice(0, 4) : [{ id: "demo", discovery_key: "demo", title: "The Eternal Word", subtitle: "A branching discovery through John 1:1.", translation: "KJV", created_at: "" }]).map((discovery) => (
                <Link key={discovery.id} href={discovery.discovery_key === "demo" ? "/emmaus/discovery/demo" : `/emmaus/discovery/${discovery.discovery_key}`} className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:-translate-y-0.5 hover:border-indigo-300/40 hover:bg-white/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-300">Emmaus Discovery</p>
                  <h3 className="mt-2 text-xl font-bold">{discovery.title || "Untitled Discovery"}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-indigo-100/65">{discovery.subtitle || "A guided journey through Scripture."}</p>
                  <p className="mt-4 text-sm font-semibold text-amber-300">Begin walk →</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">A gentle reminder</p>
            <h2 className="mt-3 text-2xl font-black">No guilt. No reset.</h2>
            <p className="mt-3 leading-7 text-amber-50/75">Missed a few days? The road is still here. Emmaus remembers where you were and invites you to continue.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/10 px-3 py-1.5 text-indigo-100/75">{children}</span>;
}

function InsightCard({ eyebrow, title, description, href, action }: { eyebrow: string; title: string; description: string; href: string; action: string }) {
  return <Link href={href} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.1]"><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-300">{eyebrow}</p><h3 className="mt-3 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-indigo-100/65">{description}</p><p className="mt-5 text-sm font-bold text-amber-300">{action} →</p></Link>;
}

function ActionCard({ icon, title, description, href }: { icon: string; title: string; description: string; href: string }) {
  return <Link href={href} className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:-translate-y-1 hover:border-indigo-300/40 hover:bg-white/10"><span className="text-3xl" aria-hidden="true">{icon}</span><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-indigo-100/60">{description}</p></Link>;
}