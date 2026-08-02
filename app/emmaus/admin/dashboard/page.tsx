import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const tools = [
  {
    title: "Bible Browser",
    description: "Read KJV or WEB, select verses, open insights, and create Discoveries.",
    href: "/emmaus/admin/bible",
    icon: "📖",
    accent: "from-indigo-500 to-violet-600",
  },
  {
    title: "Scripture Graph",
    description: "Explore verse-to-verse relationships and recenter the visual graph.",
    href: "/emmaus/admin/graph",
    icon: "🌐",
    accent: "from-violet-500 to-fuchsia-600",
  },
  {
    title: "Discovery Builder",
    description: "Author guided Bible Discoveries with prompts, prayer, and Scripture threads.",
    href: "/emmaus/admin",
    icon: "✍️",
    accent: "from-amber-500 to-orange-600",
  },
  {
    title: "Discovery Library",
    description: "Search, edit, publish, and archive your growing Discovery collection.",
    href: "/emmaus/admin/library",
    icon: "📚",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    title: "Thread Builder",
    description: "Design typed connections between passages and write discovery questions.",
    href: "/emmaus/admin/threads",
    icon: "🧵",
    accent: "from-sky-500 to-blue-600",
  },
  {
    title: "Scripture Importer",
    description: "Import verified public-domain Bible text into the canonical graph.",
    href: "/emmaus/admin/import",
    icon: "📥",
    accent: "from-rose-500 to-pink-600",
  },
];

export default async function EmmausFounderDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const [discoveries, scriptureNodes, scriptureEdges, entities] = await Promise.all([
    supabase.from("emmaus_discoveries").select("id", { count: "exact", head: true }),
    supabase.from("emmaus_scripture_nodes").select("id", { count: "exact", head: true }),
    supabase.from("emmaus_scripture_edges").select("id", { count: "exact", head: true }),
    supabase.from("emmaus_entities").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Discoveries", value: discoveries.count ?? 0 },
    { label: "Scripture Nodes", value: scriptureNodes.count ?? 0 },
    { label: "Graph Connections", value: scriptureEdges.count ?? 0 },
    { label: "Biblical Entities", value: entities.count ?? 0 },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">The Lost and Found Project</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Emmaus Founder Dashboard</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-indigo-100/80">
                Build Discoveries, expand the Scripture Graph, and review the biblical knowledge system from one private workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200">
              Founder access only
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-3xl font-black">{stat.value.toLocaleString()}</p>
                <p className="mt-1 text-sm text-indigo-100/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </header>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">Founder Suite</p>
              <h2 className="mt-2 text-3xl font-bold">Choose a workspace</h2>
            </div>
            <Link href="/emmaus/admin/bible" className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-amber-300">
              Start with Scripture →
            </Link>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.1]"
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tool.accent}`} />
                <div className="flex items-start justify-between gap-4">
                  <span className="text-4xl" aria-hidden="true">{tool.icon}</span>
                  <span className="text-xl text-white/40 transition group-hover:translate-x-1 group-hover:text-white">→</span>
                </div>
                <h3 className="mt-6 text-2xl font-bold">{tool.title}</h3>
                <p className="mt-3 leading-7 text-indigo-100/65">{tool.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Recommended workflow</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {["Read Scripture", "Select Verses", "Build Discovery", "Connect the Graph"].map((step, index) => (
                <div key={step} className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs font-bold text-indigo-300">STEP {index + 1}</p>
                  <p className="mt-2 font-semibold">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">Current phase</p>
            <h3 className="mt-3 text-2xl font-bold">Knowledge Graph Foundation</h3>
            <p className="mt-3 leading-7 text-amber-50/75">
              Scripture nodes, typed connections, Discoveries, and biblical entities now share the same foundation.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
