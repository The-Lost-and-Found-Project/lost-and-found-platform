import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { emmausContentPacks, getEmmausDiscovery } from "@/lib/emmaus/content-packs/registry";

type ProgressRow = {
  pack_id: string;
  discovery_id: string;
  current_step: number;
  is_completed: boolean;
  completed_at: string | null;
  started_at: string;
  updated_at: string;
};

export default async function EmmausWalkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: progressData }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    supabase
      .from("emmaus_discovery_progress")
      .select("pack_id, discovery_id, current_step, is_completed, completed_at, started_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
  ]);

  const progress = (progressData ?? []) as ProgressRow[];
  const inProgress = progress.filter((item) => !item.is_completed);
  const completed = progress.filter((item) => item.is_completed);
  const latest = inProgress[0] ?? null;
  const latestResolved = latest ? getEmmausDiscovery(latest.discovery_id) : null;
  const firstAvailable = emmausContentPacks[0]?.discoveries[0] ?? null;
  const firstPack = emmausContentPacks[0] ?? null;

  const continuePack = latestResolved?.pack ?? firstPack;
  const continueDiscovery = latestResolved?.discovery ?? firstAvailable;
  const continueHref = continuePack && continueDiscovery
    ? `/emmaus/content/${continuePack.id}/discovery/${continueDiscovery.id}`
    : "/emmaus/bible";

  const totalDiscoveries = emmausContentPacks.reduce((sum, pack) => sum + pack.discoveries.length, 0);
  const completionPercent = totalDiscoveries > 0 ? Math.round((completed.length / totalDiscoveries) * 100) : 0;
  const firstName = profile?.full_name?.trim().split(" ")[0] || "friend";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 pb-28 text-white lg:pb-12">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">Emmaus · Walk with Christ through His Word</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">{greeting}, {firstName}.</h1>
              <p className="mt-4 text-xl leading-8 text-indigo-100/80">Emmaus remembers where you stopped and keeps the road open.</p>
            </div>
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-amber-300/30 bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 p-1 shadow-2xl">
          <div className="rounded-[1.8rem] bg-slate-950/95 p-6 sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">{latest ? "Continue where you left off" : "Begin your first discovery"}</p>
            <div className="mt-4 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.14em] text-indigo-300">{continueDiscovery?.passage ?? "Emmaus Bible Library"}</p>
                <h2 className="mt-2 text-3xl font-black sm:text-5xl">{continueDiscovery?.title ?? "Choose a passage to explore"}</h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-indigo-100/70">{continueDiscovery?.subtitle ?? "Start with a reviewed content pack and let guided questions lead you deeper into Scripture."}</p>
                <div className="mt-6 flex flex-wrap gap-2 text-sm">
                  <Pill>{continuePack?.title ?? "Content Library"}</Pill>
                  <Pill>{continueDiscovery?.estimatedMinutes ?? 0} minutes</Pill>
                  {latest && <Pill>Resume at step {latest.current_step + 1}</Pill>}
                </div>
              </div>
              <Link href={continueHref} className="inline-flex min-h-12 justify-center rounded-full bg-amber-300 px-7 py-3.5 font-black text-slate-950 shadow-lg transition hover:bg-amber-200">
                {latest ? "Resume Discovery →" : "Start Discovery →"}
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard value={inProgress.length} label="In progress" description="Discoveries waiting for your return" />
          <MetricCard value={completed.length} label="Completed" description="Finished guided discoveries" />
          <MetricCard value={`${completionPercent}%`} label="Library explored" description={`${completed.length} of ${totalDiscoveries} discoveries`} />
          <MetricCard value={emmausContentPacks.length} label="Content packs" description="Reviewed passage collections" />
        </section>

        {inProgress.length > 0 && (
          <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Your active studies</p>
              <h2 className="mt-2 text-3xl font-black">Continue studying</h2>
              <p className="mt-3 text-indigo-100/65">Your responses and exact step are saved automatically.</p>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {inProgress.slice(0, 4).map((item) => {
                const resolved = getEmmausDiscovery(item.discovery_id);
                if (!resolved) return null;
                return (
                  <Link key={`${item.pack_id}-${item.discovery_id}`} href={`/emmaus/content/${resolved.pack.id}/discovery/${resolved.discovery.id}`} className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/10">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-300">{resolved.discovery.passage}</p>
                        <h3 className="mt-2 text-xl font-black">{resolved.discovery.title}</h3>
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-indigo-100">Step {item.current_step + 1}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-indigo-100/65">{resolved.discovery.subtitle}</p>
                    <p className="mt-5 text-sm font-black text-amber-300">Resume →</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Choose another direction</p>
            <h2 className="mt-2 text-3xl font-black">The road stays open.</h2>
            <p className="mt-3 text-indigo-100/65">Return to a study, explore the biblical network, pray, or choose a new passage.</p>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ActionCard icon="📖" title="Open Scripture" description="Browse reviewed passages and discoveries." href="/emmaus/bible" />
            <ActionCard icon="🔍" title="Discover" description="Choose a guided question and follow Scripture deeper." href="/emmaus/discover" />
            <ActionCard icon="🙏" title="Enter Prayer" description="Share a request or pray with the community." href="/emmaus/prayer" />
            <ActionCard icon="👤" title="My Emmaus" description="Review your learning profile and personal journey." href="/emmaus/me" />
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Available now</p>
                <h2 className="mt-2 text-2xl font-black">Reviewed discoveries</h2>
              </div>
              <Link href="/emmaus/bible" className="text-sm font-bold text-amber-300">View complete library →</Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {emmausContentPacks.flatMap((pack) => pack.discoveries.map((discovery) => ({ pack, discovery }))).slice(0, 4).map(({ pack, discovery }) => (
                <Link key={discovery.id} href={`/emmaus/content/${pack.id}/discovery/${discovery.id}`} className="rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:-translate-y-0.5 hover:border-indigo-300/40 hover:bg-white/10">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-300">{discovery.passage}</p>
                  <h3 className="mt-2 text-xl font-bold">{discovery.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-indigo-100/65">{discovery.subtitle}</p>
                  <p className="mt-4 text-sm font-semibold text-amber-300">Begin discovery →</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">A gentle reminder</p>
            <h2 className="mt-3 text-2xl font-black">No guilt. No reset.</h2>
            <p className="mt-3 leading-7 text-amber-50/75">Missed a few days? The road is still here. Emmaus remembers your work and invites you to continue without shame.</p>
            {completed.length > 0 && (
              <div className="mt-6 border-t border-amber-200/20 pt-5">
                <p className="font-black text-amber-100">Most recent completion</p>
                <p className="mt-2 text-sm leading-6 text-amber-50/70">{getEmmausDiscovery(completed[0].discovery_id)?.discovery.title ?? "Completed discovery"}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/10 px-3 py-1.5 text-indigo-100/75">{children}</span>;
}

function MetricCard({ value, label, description }: { value: number | string; label: string; description: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl"><p className="text-3xl font-black text-amber-300">{value}</p><p className="mt-2 font-black">{label}</p><p className="mt-1 text-sm leading-5 text-indigo-100/55">{description}</p></div>;
}

function ActionCard({ icon, title, description, href }: { icon: string; title: string; description: string; href: string }) {
  return <Link href={href} className="rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:-translate-y-1 hover:border-indigo-300/40 hover:bg-white/10"><span className="text-3xl" aria-hidden="true">{icon}</span><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-indigo-100/60">{description}</p></Link>;
}
