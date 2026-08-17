"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Workstream = "Text" | "Language" | "Context" | "Connections" | "Formation" | "Editorial";
type BuildStatus = "queued" | "in-progress" | "in-review" | "approved" | "published";

type PassageRecord = {
  id: string;
  reference: string;
  title: string;
  pathway: string;
  priority: "critical" | "high" | "normal";
  completeness: number;
  status: BuildStatus;
  assigned: Partial<Record<Workstream, string>>;
  gaps: string[];
  downstreamReady: string[];
};

const seedRecords: PassageRecord[] = [
  {
    id: "john-1-1",
    reference: "John 1:1",
    title: "The Eternal Word",
    pathway: "Identity of Jesus",
    priority: "critical",
    completeness: 62,
    status: "in-progress",
    assigned: { Text: "Canon Team", Language: "Language Team", Connections: "Connections Team", Formation: "Formation Team" },
    gaps: ["Historical DNA", "Assessment DNA", "Editorial reviewers"],
    downstreamReady: ["Discovery", "Atlas"],
  },
  {
    id: "genesis-1-1-3",
    reference: "Genesis 1:1–3",
    title: "In the Beginning",
    pathway: "Creation",
    priority: "critical",
    completeness: 48,
    status: "in-progress",
    assigned: { Text: "Canon Team", Context: "Context Team", Connections: "Connections Team" },
    gaps: ["Language DNA", "Formation DNA", "Group DNA"],
    downstreamReady: ["Atlas"],
  },
  {
    id: "colossians-1-15-17",
    reference: "Colossians 1:15–17",
    title: "Christ Before All Things",
    pathway: "Identity of Jesus",
    priority: "high",
    completeness: 37,
    status: "queued",
    assigned: { Text: "Canon Team", Connections: "Connections Team" },
    gaps: ["Observation DNA", "Language DNA", "Mentor DNA"],
    downstreamReady: [],
  },
  {
    id: "psalm-27",
    reference: "Psalm 27",
    title: "Wait for the Lord",
    pathway: "Prayer and Trust",
    priority: "high",
    completeness: 54,
    status: "in-review",
    assigned: { Text: "Canon Team", Formation: "Formation Team", Editorial: "Editorial Team" },
    gaps: ["Historical DNA", "Rabbit Trail DNA"],
    downstreamReady: ["Discovery", "Mentor Guide", "Group Study"],
  },
  {
    id: "romans-8-1",
    reference: "Romans 8:1",
    title: "No Condemnation",
    pathway: "Redemption",
    priority: "normal",
    completeness: 29,
    status: "queued",
    assigned: { Text: "Canon Team" },
    gaps: ["Connections DNA", "Theology DNA", "Formation DNA"],
    downstreamReady: [],
  },
];

const workstreams: Workstream[] = ["Text", "Language", "Context", "Connections", "Formation", "Editorial"];

export default function CanonBuildInitiativePage() {
  const [records, setRecords] = useState(seedRecords);
  const [selectedId, setSelectedId] = useState(seedRecords[0].id);
  const [filter, setFilter] = useState<BuildStatus | "all">("all");
  const selected = records.find((record) => record.id === selectedId) ?? records[0];

  const filtered = useMemo(() => records.filter((record) => filter === "all" || record.status === filter), [filter, records]);
  const average = Math.round(records.reduce((sum, record) => sum + record.completeness, 0) / records.length);
  const readyCount = records.filter((record) => record.downstreamReady.length > 0).length;
  const reviewCount = records.filter((record) => record.status === "in-review").length;

  function advanceStatus() {
    const order: BuildStatus[] = ["queued", "in-progress", "in-review", "approved", "published"];
    setRecords((current) => current.map((record) => {
      if (record.id !== selected.id) return record;
      const index = order.indexOf(record.status);
      return { ...record, status: order[Math.min(order.length - 1, index + 1)] };
    }));
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Emmaus Canon Build Initiative</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">Build the living library.</h1>
              <p className="mt-4 text-lg leading-8 text-indigo-100/75">Prioritize foundational passages, coordinate specialist workstreams, close Passage DNA gaps, and move reviewed content into every Emmaus experience.</p>
            </div>
            <Link href="/emmaus/admin/canon-builder" className="rounded-full bg-amber-300 px-5 py-3 font-black text-slate-950">Open Canon Builder</Link>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Passages in build" value={String(records.length)} />
          <Stat label="Average ECS" value={`${average}%`} />
          <Stat label="Ready for generation" value={String(readyCount)} />
          <Stat label="Awaiting review" value={String(reviewCount)} />
        </section>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {(["all", "queued", "in-progress", "in-review", "approved", "published"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setFilter(item)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize ${filter === item ? "bg-amber-300 text-slate-950" : "border border-white/15 bg-white/[0.06] text-indigo-100"}`}>{item.replace("-", " ")}</button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Production queue</p>
            <div className="mt-4 space-y-3">
              {filtered.map((record) => (
                <button key={record.id} type="button" onClick={() => setSelectedId(record.id)} className={`w-full rounded-2xl border p-4 text-left ${record.id === selected.id ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-black/20"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-300">{record.pathway}</p><p className="mt-1 font-black">{record.reference}</p><p className="mt-1 text-sm text-indigo-100/55">{record.title}</p></div>
                    <Priority priority={record.priority} />
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-amber-300" style={{ width: `${record.completeness}%` }} /></div>
                  <div className="mt-2 flex justify-between text-xs text-indigo-100/45"><span>{record.completeness}% ECS</span><span>{record.status.replace("-", " ")}</span></div>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{selected.pathway}</p><h2 className="mt-2 text-4xl font-black">{selected.reference}</h2><p className="mt-2 text-lg text-slate-600">{selected.title}</p></div>
                <div className="flex gap-2"><span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black capitalize text-slate-700">{selected.status.replace("-", " ")}</span><button onClick={advanceStatus} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-black text-white">Advance status</button></div>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <Meta label="Completeness" value={`${selected.completeness}%`} />
                <Meta label="Priority" value={selected.priority} />
                <Meta label="Ready outputs" value={String(selected.downstreamReady.length)} />
              </div>

              <div className="mt-8 border-t border-slate-200 pt-7">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Workstream assignments</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {workstreams.map((stream) => <div key={stream} className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{stream}</p><p className="mt-2 font-bold">{selected.assigned[stream] ?? "Unassigned"}</p></div>)}
                </div>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">Priority gaps</p>
                  <div className="mt-4 space-y-3">{selected.gaps.map((gap) => <div key={gap} className="rounded-2xl border border-rose-200 bg-rose-50 p-4 font-semibold text-rose-950">{gap}</div>)}</div>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Generation readiness</p>
                  <div className="mt-4 space-y-3">{selected.downstreamReady.length ? selected.downstreamReady.map((output) => <div key={output} className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-950">{output} ready</div>) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-slate-500">No downstream drafts are ready yet.</div>}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Initiative priorities</p>
                <h2 className="mt-2 text-2xl font-black">Build by foundational pathways</h2>
                <div className="mt-5 space-y-3">{["Identity of Jesus", "Creation", "Covenant", "Kingdom", "Prayer and Trust", "Redemption"].map((pathway, index) => <div key={pathway} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"><span className="font-semibold">{pathway}</span><span className="text-xs text-indigo-100/45">Wave {index < 2 ? 1 : index < 4 ? 2 : 3}</span></div>)}</div>
              </div>

              <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-6 shadow-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">Production rule</p>
                <h2 className="mt-2 text-2xl font-black">No downstream content without Passage DNA.</h2>
                <p className="mt-4 leading-7 text-amber-50/75">Discoveries, Rabbit Trails, mentor guides, group studies, assessments, Atlas nodes, and AI prompts must derive from the same reviewed passage foundation.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-sm text-indigo-100/55">{label}</p></div>; }
function Meta({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 text-xl font-black capitalize">{value}</p></div>; }
function Priority({ priority }: { priority: PassageRecord["priority"] }) { const classes = priority === "critical" ? "bg-rose-100 text-rose-800" : priority === "high" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"; return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${classes}`}>{priority}</span>; }
