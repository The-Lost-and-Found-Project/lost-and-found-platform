import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const tools = [
  {
    title: "Visual Graph Builder",
    description: "Arrange biblical nodes, draw relationships, document evidence, and publish trusted connections.",
    href: "/emmaus/admin/graph-builder",
    icon: "🕸️",
    accent: "from-fuchsia-500 to-violet-600",
    featured: true,
  },
  {
    title: "Discovery Map Studio",
    description: "Build guided journeys with required stops, optional branches, challenges, and reflections.",
    href: "/emmaus/admin/maps",
    icon: "🧭",
    accent: "from-amber-500 to-orange-600",
    featured: true,
  },
  {
    title: "Bible Browser",
    description: "Read Scripture, select passages, inspect content packs, and begin new Discoveries.",
    href: "/emmaus/admin/bible",
    icon: "📖",
    accent: "from-indigo-500 to-violet-600",
  },
  {
    title: "Knowledge Graph Preview",
    description: "Explore the published learner-facing graph and inspect confidence and evidence.",
    href: "/emmaus/admin/graph",
    icon: "🌐",
    accent: "from-violet-500 to-fuchsia-600",
  },
  {
    title: "Discovery Builder",
    description: "Author guided Bible Discoveries with prompts, prayer, reflection, and Scripture threads.",
    href: "/emmaus/admin",
    icon: "✍️",
    accent: "from-amber-500 to-orange-600",
  },
  {
    title: "Discovery Library",
    description: "Search, edit, publish, and archive the growing Discovery collection.",
    href: "/emmaus/admin/library",
    icon: "📚",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    title: "Thread Builder",
    description: "Manage legacy passage threads while content is migrated into the new relationship engine.",
    href: "/emmaus/admin/threads",
    icon: "🧵",
    accent: "from-sky-500 to-blue-600",
  },
  {
    title: "Scripture Importer",
    description: "Import verified public-domain Bible text into the canonical Scripture system.",
    href: "/emmaus/admin/import",
    icon: "📥",
    accent: "from-rose-500 to-pink-600",
  },
];

export default async function EmmausFounderDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  const [catalog, graphNodes, graphEdges, maps, publishedNodes, publishedEdges] = await Promise.all([
    supabase.from("emmaus_discovery_catalog").select("discovery_id", { count: "exact", head: true }),
    supabase.from("emmaus_graph_nodes").select("id", { count: "exact", head: true }),
    supabase.from("emmaus_graph_edges").select("id", { count: "exact", head: true }),
    supabase.from("emmaus_discovery_maps").select("id", { count: "exact", head: true }),
    supabase.from("emmaus_graph_nodes").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("emmaus_graph_edges").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);

  const nodeCount = graphNodes.count ?? 0;
  const edgeCount = graphEdges.count ?? 0;
  const publishedNodeCount = publishedNodes.count ?? 0;
  const publishedEdgeCount = publishedEdges.count ?? 0;
  const publicationPercent = nodeCount + edgeCount > 0
    ? Math.round(((publishedNodeCount + publishedEdgeCount) / (nodeCount + edgeCount)) * 100)
    : 0;

  const stats = [
    { label: "Discovery Catalog", value: catalog.count ?? 0, detail: "Available studies" },
    { label: "Graph Nodes", value: nodeCount, detail: `${publishedNodeCount} published` },
    { label: "Relationships", value: edgeCount, detail: `${publishedEdgeCount} published` },
    { label: "Discovery Maps", value: maps.count ?? 0, detail: `${publicationPercent}% graph published` },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 pb-16 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300">The Lost and Found Project</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Emmaus Founder Studio</h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-indigo-100/80">
                Build Discoveries, curate the biblical knowledge graph, create guided journeys, and publish the Emmaus learning experience from one private workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/emmaus/walk" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white">Open Emmaus</Link>
              <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-200">Founder access only</div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-3xl font-black">{stat.value.toLocaleString()}</p>
                <p className="mt-1 font-black text-indigo-50">{stat.label}</p>
                <p className="mt-1 text-xs text-indigo-100/50">{stat.detail}</p>
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
            <Link href="/emmaus/admin/graph-builder" className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-amber-300">
              Open Visual Builder →
            </Link>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className={`group relative overflow-hidden rounded-3xl border p-6 shadow-xl transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.1] ${tool.featured ? "border-amber-300/25 bg-amber-300/[0.08]" : "border-white/10 bg-white/[0.06]"}`}
              >
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tool.accent}`} />
                {tool.featured && <span className="absolute right-5 top-5 rounded-full bg-amber-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-950">Core Studio</span>}
                <div className="flex items-start justify-between gap-4">
                  <span className="text-4xl" aria-hidden="true">{tool.icon}</span>
                  {!tool.featured && <span className="text-xl text-white/40 transition group-hover:translate-x-1 group-hover:text-white">→</span>}
                </div>
                <h3 className="mt-6 text-2xl font-bold">{tool.title}</h3>
                <p className="mt-3 leading-7 text-indigo-100/65">{tool.description}</p>
                {tool.featured && <p className="mt-5 text-sm font-black text-amber-300">Open workspace →</p>}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_.6fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-300">Recommended workflow</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-5">
              {["Read Scripture", "Build Discovery", "Connect Graph", "Create Map", "Preview & Publish"].map((step, index) => (
                <div key={step} className="rounded-2xl bg-black/20 p-4">
                  <p className="text-xs font-bold text-indigo-300">STEP {index + 1}</p>
                  <p className="mt-2 font-semibold">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">Current phase</p>
            <h3 className="mt-3 text-2xl font-bold">Authoring & Curation</h3>
            <p className="mt-3 leading-7 text-amber-50/75">
              The core engines are in place. Founder Studio can now build the graph and Discovery Maps that power personalized learner journeys.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
