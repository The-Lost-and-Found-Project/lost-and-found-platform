import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Discovery = {
  id: string;
  discovery_key: string;
  title: string | null;
  subtitle: string | null;
  translation: string | null;
  passage: unknown;
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
      .select("id, discovery_key, title, subtitle, translation, passage, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const firstName = profile?.full_name?.trim().split(" ")[0] || "friend";
  const published = (discoveries ?? []) as Discovery[];
  const featured = published[0] ?? null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const daypartMessage = hour < 12
    ? "Begin today with Scripture before the noise begins."
    : hour < 18
      ? "Pause for a few minutes and return your attention to God."
      : "Reflect on the day and finish it with the Word.";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Emmaus</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">
                {greeting}, {firstName}.
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-indigo-100/75">{daypartMessage}</p>
            </div>
            {profile?.role === "admin" && (
              <Link href="/emmaus/admin/dashboard" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                Founder Studio
              </Link>
            )}
          </div>
        </header>

        <section className="mt-7 overflow-hidden rounded-[2rem] border border-amber-300/20 bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 p-1 shadow-2xl">
          <div className="rounded-[1.8rem] bg-slate-950/95 p-6 sm:p-9">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Continue walking</p>
            {featured ? (
              <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <h2 className="text-3xl font-black sm:text-4xl">{featured.title || "Untitled Discovery"}</h2>
                  <p className="mt-3 max-w-2xl text-lg leading-8 text-indigo-100/70">
                    {featured.subtitle || "A guided journey through Scripture."}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2 text-sm text-indigo-100/60">
                    <span className="rounded-full bg-white/10 px-3 py-1.5">{featured.translation || "Bible"}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1.5">10–15 minutes</span>
                    <span className="rounded-full bg-white/10 px-3 py-1.5">Guided discovery</span>
                  </div>
                </div>
                <Link href={`/emmaus/discovery/${featured.discovery_key}`} className="inline-flex justify-center rounded-full bg-amber-300 px-6 py-3 font-black text-slate-950 shadow-lg transition hover:bg-amber-200">
                  Continue Walking →
                </Link>
              </div>
            ) : (
              <div className="mt-4">
                <h2 className="text-3xl font-black">Your first walk is ready.</h2>
                <p className="mt-3 text-indigo-100/70">Experience the John 1 Discovery while more studies are being prepared.</p>
                <Link href="/emmaus/discovery/demo" className="mt-6 inline-flex rounded-full bg-amber-300 px-6 py-3 font-black text-slate-950">Begin Discovery →</Link>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">Choose your next step</p>
            <h2 className="mt-2 text-3xl font-bold">Where would you like to walk today?</h2>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <WalkCard icon="📖" title="Explore the Bible" description="Choose a book, chapter, translation, and verse." href="/emmaus/admin/bible" />
            <WalkCard icon="✨" title="Discover Something New" description="Begin a guided Discovery centered on Scripture and questions." href={featured ? `/emmaus/discovery/${featured.discovery_key}` : "/emmaus/discovery/demo"} />
            <WalkCard icon="🙏" title="Spend Time in Prayer" description="Bring a request, pray for someone, or revisit God's faithfulness." href="/prayer" />
            <WalkCard icon="🌐" title="Follow a Connection" description="Explore how passages, themes, and biblical ideas connect." href="/emmaus/admin/graph" />
            <WalkCard icon="📚" title="Daily Devotions" description="Read a short teaching with Scripture and prayer." href="/devotions" />
            <WalkCard icon="🧠" title="Test Your Knowledge" description="Learn through Bible trivia and reinforce what you remember." href="/trivia" />
          </div>
        </section>

        {published.length > 1 && (
          <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Available walks</p>
                <h2 className="mt-2 text-2xl font-bold">Continue growing</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {published.slice(1).map((discovery) => (
                <Link key={discovery.id} href={`/emmaus/discovery/${discovery.discovery_key}`} className="group rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:-translate-y-0.5 hover:border-indigo-300/40 hover:bg-white/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-300">Emmaus Discovery</p>
                  <h3 className="mt-2 text-xl font-bold">{discovery.title || "Untitled Discovery"}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-indigo-100/65">{discovery.subtitle || "A guided journey through Scripture."}</p>
                  <p className="mt-4 text-sm font-semibold text-amber-300">Begin walk →</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-10 rounded-3xl border border-white/10 bg-black/20 p-6 text-center">
          <p className="text-lg font-semibold">Missed a few days?</p>
          <p className="mt-2 text-indigo-100/65">No guilt. No reset. The road is still here. Continue walking.</p>
        </footer>
      </div>
    </main>
  );
}

function WalkCard({ icon, title, description, href }: { icon: string; title: string; description: string; href: string }) {
  return (
    <Link href={href} className="group rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.1]">
      <div className="flex items-start justify-between gap-4">
        <span className="text-4xl" aria-hidden="true">{icon}</span>
        <span className="text-xl text-white/35 transition group-hover:translate-x-1 group-hover:text-white">→</span>
      </div>
      <h3 className="mt-6 text-xl font-bold">{title}</h3>
      <p className="mt-2 leading-7 text-indigo-100/65">{description}</p>
    </Link>
  );
}
