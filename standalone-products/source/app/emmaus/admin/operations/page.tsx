"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Track = "platform" | "canon";
type WorkStatus = "planned" | "active" | "blocked" | "review" | "done";
type Priority = "critical" | "high" | "normal";

type WorkItem = {
  id: string;
  track: Track;
  title: string;
  description: string;
  owner: string;
  priority: Priority;
  status: WorkStatus;
  progress: number;
  value: string;
  nextAction: string;
};

const seedItems: WorkItem[] = [
  {
    id: "canon-john-1",
    track: "canon",
    title: "Complete John 1 Passage DNA",
    description: "Close remaining Historical, Assessment, AI-rule, and Editorial DNA gaps for the first flagship content pack.",
    owner: "Canon Team",
    priority: "critical",
    status: "active",
    progress: 62,
    value: "Unlocks reviewed Discoveries, Atlas nodes, Rabbit Trails, mentor resources, and group studies.",
    nextAction: "Assign historical-context and editorial reviewers.",
  },
  {
    id: "canon-creation-wave",
    track: "canon",
    title: "Creation Pathway — Wave 1",
    description: "Build Passage DNA for Genesis 1:1–3, John 1:1–5, Colossians 1:15–17, Hebrews 1:1–3, Romans 8, and Revelation 21–22.",
    owner: "Connections Team",
    priority: "critical",
    status: "active",
    progress: 34,
    value: "Creates an immediately useful cross-canonical pathway and strengthens the Knowledge Graph.",
    nextAction: "Finish observation and connection DNA for Genesis 1:1–3.",
  },
  {
    id: "canon-prayer-pathway",
    track: "canon",
    title: "Prayer and Trust Pathway",
    description: "Develop Psalm 27 and linked passages into a reviewed formation pathway.",
    owner: "Formation Team",
    priority: "high",
    status: "review",
    progress: 54,
    value: "Provides a practical learner pathway and mentor conversation model without AI.",
    nextAction: "Complete Rabbit Trail DNA and final editorial review.",
  },
  {
    id: "platform-mobile-nav",
    track: "platform",
    title: "Mobile Navigation Audit",
    description: "Verify book, chapter, verse, Discovery, Atlas, and profile navigation across iPhone and iPad layouts.",
    owner: "Platform Team",
    priority: "critical",
    status: "planned",
    progress: 10,
    value: "Prevents the growing content library from becoming difficult to use on the devices most learners will carry.",
    nextAction: "Audit all Emmaus routes at tablet and phone breakpoints.",
  },
  {
    id: "platform-rules-integration",
    track: "platform",
    title: "Rules Intelligence Integration",
    description: "Route learner question, dialogue, and Journey calls through the Intelligence Layer instead of importing engines directly.",
    owner: "Platform Team",
    priority: "high",
    status: "active",
    progress: 25,
    value: "Makes no-AI production behavior explicit and preserves a future adapter path.",
    nextAction: "Update the first learner-facing Discovery to use defaultEmmausIntelligence.",
  },
  {
    id: "platform-persistence",
    track: "platform",
    title: "Replace Demonstration Local Storage",
    description: "Move Passage DNA, mentor plans, memory, and Journey evidence into durable organization-scoped storage.",
    owner: "Platform Team",
    priority: "high",
    status: "planned",
    progress: 5,
    value: "Turns current prototypes into durable multi-user workflows.",
    nextAction: "Define Supabase tables and row-level security policies.",
  },
  {
    id: "platform-accessibility",
    track: "platform",
    title: "Accessibility Baseline",
    description: "Establish keyboard navigation, semantic landmarks, contrast, labels, focus states, and screen-reader testing.",
    owner: "Platform Team",
    priority: "normal",
    status: "planned",
    progress: 0,
    value: "Makes Scripture study usable by more people and prevents expensive remediation later.",
    nextAction: "Create an accessibility checklist for all shared Emmaus components.",
  },
];

export default function EmmausOperationsPage() {
  const [items, setItems] = useState(seedItems);
  const [track, setTrack] = useState<Track | "all">("all");
  const [selectedId, setSelectedId] = useState(seedItems[0].id);
  const visible = useMemo(() => items.filter((item) => track === "all" || item.track === track), [items, track]);
  const selected = items.find((item) => item.id === selectedId) ?? visible[0] ?? items[0];

  const canon = items.filter((item) => item.track === "canon");
  const platform = items.filter((item) => item.track === "platform");
  const canonAverage = Math.round(canon.reduce((sum, item) => sum + item.progress, 0) / canon.length);
  const platformAverage = Math.round(platform.reduce((sum, item) => sum + item.progress, 0) / platform.length);
  const blocked = items.filter((item) => item.status === "blocked").length;

  function advance(itemId: string) {
    const order: WorkStatus[] = ["planned", "active", "review", "done"];
    setItems((current) => current.map((item) => {
      if (item.id !== itemId || item.status === "blocked") return item;
      const index = order.indexOf(item.status);
      const status = order[Math.min(order.length - 1, index + 1)];
      return { ...item, status, progress: status === "done" ? 100 : Math.max(item.progress, status === "review" ? 75 : 25) };
    }));
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Emmaus Operations</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">Protect the platform. Build the canon.</h1>
              <p className="mt-4 text-lg leading-8 text-indigo-100/75">Run two distinct workstreams: a focused Platform Track that keeps Emmaus reliable, and a primary Canon Track that builds the long-term biblical knowledge asset.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/emmaus/admin/canon-build" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">Canon Build</Link>
              <Link href="/emmaus/admin/canon-builder" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">Passage DNA Studio</Link>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Canon progress" value={`${canonAverage}%`} />
          <Stat label="Platform progress" value={`${platformAverage}%`} />
          <Stat label="Active priorities" value={String(items.filter((item) => item.status === "active").length)} />
          <Stat label="Blocked" value={String(blocked)} />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <TrackCard
            title="Canon Track"
            share="Primary investment"
            description="Passage DNA, Knowledge Graph density, pathways, Discoveries, Rabbit Trails, mentor guides, group resources, assessments, and editorial review."
            progress={canonAverage}
            href="/emmaus/admin/canon-build"
            emphasis
          />
          <TrackCard
            title="Platform Track"
            share="Focused support"
            description="Reliability, mobile usability, accessibility, persistence, search, performance, publishing, and no-AI rules integration."
            progress={platformAverage}
            href="/emmaus/walk"
          />
        </section>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {(["all", "canon", "platform"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setTrack(item)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize ${track === item ? "bg-amber-300 text-slate-950" : "border border-white/15 bg-white/[0.06] text-indigo-100"}`}>{item === "all" ? "All work" : `${item} track`}</button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[390px_1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Operating queue</p>
            <div className="mt-4 space-y-3">
              {visible.map((item) => (
                <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-4 text-left ${selected.id === item.id ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-black/20"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-300">{item.track} · {item.status}</p><p className="mt-1 font-black">{item.title}</p></div>
                    <PriorityBadge priority={item.priority} />
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-amber-300" style={{ width: `${item.progress}%` }} /></div>
                  <p className="mt-2 text-xs text-indigo-100/45">{item.progress}% · {item.owner}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{selected.track} track</p><h2 className="mt-2 text-4xl font-black">{selected.title}</h2><p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{selected.description}</p></div>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black capitalize text-slate-700">{selected.status}</span>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <Meta label="Owner" value={selected.owner} />
                <Meta label="Priority" value={selected.priority} />
                <Meta label="Progress" value={`${selected.progress}%`} />
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-2">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">Why it matters</p>
                  <p className="mt-3 leading-7 text-emerald-950">{selected.value}</p>
                </div>
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">Next action</p>
                  <p className="mt-3 leading-7 text-amber-950">{selected.nextAction}</p>
                </div>
              </div>

              <button type="button" onClick={() => advance(selected.id)} className="mt-7 rounded-full bg-indigo-600 px-6 py-3 font-black text-white">Advance work item</button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-6 shadow-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">Capacity principle</p>
                <h2 className="mt-2 text-2xl font-black">Canon growth receives the majority of sustained effort.</h2>
                <p className="mt-4 leading-7 text-amber-50/75">Platform work should remove friction, protect quality, and enable publishing. It should not repeatedly delay reviewed Passage DNA and content production.</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">No-AI release rule</p>
                <h2 className="mt-2 text-2xl font-black">Every v1 learner pathway must work in rules mode.</h2>
                <p className="mt-4 leading-7 text-indigo-100/65">Dynamic AI capabilities may be added later, but question order, clues, branching, recommendations, mentor support, and content access cannot depend on them.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-sm text-indigo-100/55">{label}</p></div>;
}

function TrackCard({ title, share, description, progress, href, emphasis = false }: { title: string; share: string; description: string; progress: number; href: string; emphasis?: boolean }) {
  return <Link href={href} className={`rounded-[2rem] border p-6 shadow-2xl transition hover:-translate-y-1 ${emphasis ? "border-amber-300/30 bg-amber-300/10" : "border-white/10 bg-white/[0.06]"}`}><p className={`text-xs font-black uppercase tracking-[0.16em] ${emphasis ? "text-amber-200" : "text-indigo-300"}`}>{share}</p><h2 className="mt-2 text-3xl font-black">{title}</h2><p className="mt-3 leading-7 text-indigo-100/65">{description}</p><div className="mt-6 h-2 overflow-hidden rounded-full bg-black/20"><div className="h-full bg-amber-300" style={{ width: `${progress}%` }} /></div><p className="mt-2 text-sm text-indigo-100/50">{progress}% current operational progress</p></Link>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 text-xl font-black capitalize">{value}</p></div>;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const classes = priority === "critical" ? "bg-rose-100 text-rose-800" : priority === "high" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${classes}`}>{priority}</span>;
}
