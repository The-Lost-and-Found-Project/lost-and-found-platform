"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  canonWave1Passages,
  getCanonWaveSummary,
  getNextCanonAssignments,
  type CanonWavePassage,
  type CanonWavePathway,
} from "@/lib/emmaus/canon-wave-1";

const pathways = [...new Set(canonWave1Passages.map((passage) => passage.pathway))] as CanonWavePathway[];

export default function WaveOnePage() {
  const [passages, setPassages] = useState(canonWave1Passages);
  const [pathway, setPathway] = useState<CanonWavePathway | "all">("all");
  const [testament, setTestament] = useState<"all" | "old" | "new">("all");
  const [selectedId, setSelectedId] = useState(canonWave1Passages[0].id);

  const summary = useMemo(() => getCanonWaveSummary(passages), [passages]);
  const visible = useMemo(() => passages.filter((passage) =>
    (pathway === "all" || passage.pathway === pathway) &&
    (testament === "all" || passage.testament === testament)
  ), [passages, pathway, testament]);
  const selected = passages.find((passage) => passage.id === selectedId) ?? visible[0] ?? passages[0];
  const nextAssignments = useMemo(() => getNextCanonAssignments(10), []);

  function advancePassage(id: string) {
    const statusOrder: CanonWavePassage["dnaStatus"][] = ["not-started", "draft", "review", "approved"];
    setPassages((current) => current.map((passage) => {
      if (passage.id !== id) return passage;
      const index = statusOrder.indexOf(passage.dnaStatus);
      const dnaStatus = statusOrder[Math.min(statusOrder.length - 1, index + 1)];
      const completeness = dnaStatus === "approved" ? 100 : Math.max(passage.completeness, dnaStatus === "review" ? 75 : 35);
      return { ...passage, dnaStatus, completeness };
    }));
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Wave 1 Canon Build</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">Turn the registry into a working library.</h1>
              <p className="mt-4 text-lg leading-8 text-indigo-100/75">Manage the first foundational passages by pathway, testament, priority, workstream, Passage DNA status, and editorial readiness.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/emmaus/admin/canon-build" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">Canon Command Center</Link>
              <Link href="/emmaus/admin/canon-builder" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">Open Passage DNA Studio</Link>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-5">
          <Stat label="Wave 1 passages" value={String(summary.total)} />
          <Stat label="Old Testament" value={String(summary.oldTestament)} />
          <Stat label="New Testament" value={String(summary.newTestament)} />
          <Stat label="Critical priority" value={String(summary.critical)} />
          <Stat label="Approved DNA" value={String(passages.filter((passage) => passage.dnaStatus === "approved").length)} />
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-indigo-100">Pathway<select value={pathway} onChange={(event) => setPathway(event.target.value as CanonWavePathway | "all")} className={inputClass}><option value="all">All pathways</option>{pathways.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label className="text-sm font-semibold text-indigo-100">Testament<select value={testament} onChange={(event) => setTestament(event.target.value as typeof testament)} className={inputClass}><option value="all">Both testaments</option><option value="old">Old Testament</option><option value="new">New Testament</option></select></label>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[390px_1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Passage registry</p>
            <p className="mt-2 text-sm text-indigo-100/50">{visible.length} passages match the current filters.</p>
            <div className="mt-4 max-h-[70rem] space-y-3 overflow-auto pr-1">
              {visible.map((passage) => (
                <button key={passage.id} type="button" onClick={() => setSelectedId(passage.id)} className={`w-full rounded-2xl border p-4 text-left ${passage.id === selected.id ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-black/20"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-300">{passage.pathway}</p><p className="mt-1 font-black">{passage.reference}</p><p className="mt-1 text-sm text-indigo-100/55">{passage.title}</p></div>
                    <Priority priority={passage.priority} />
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-amber-300" style={{ width: `${passage.completeness}%` }} /></div>
                  <div className="mt-2 flex justify-between text-xs text-indigo-100/45"><span>{passage.completeness}% ECS</span><span>{passage.dnaStatus.replace("-", " ")}</span></div>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{selected.pathway}</p><h2 className="mt-2 text-4xl font-black">{selected.reference}</h2><p className="mt-2 text-lg text-slate-600">{selected.title}</p></div>
                <div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black capitalize text-slate-700">{selected.dnaStatus.replace("-", " ")}</span><button type="button" onClick={() => advancePassage(selected.id)} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-black text-white">Advance Passage DNA</button></div>
              </div>

              <div className="mt-7 grid gap-4 md:grid-cols-4">
                <Meta label="Priority" value={selected.priority} />
                <Meta label="Build wave" value={`Wave ${selected.wave}`} />
                <Meta label="Testament" value={selected.testament === "old" ? "Old" : "New"} />
                <Meta label="Completeness" value={`${selected.completeness}%`} />
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <Panel title="Secondary pathways">
                  <div className="flex flex-wrap gap-2">{selected.secondaryPathways.map((item) => <span key={item} className="rounded-full bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700">{item}</span>)}</div>
                </Panel>
                <Panel title="Required workstreams">
                  <div className="grid gap-2 sm:grid-cols-2">{selected.workstreams.map((item) => <div key={item} className="rounded-2xl border border-slate-200 p-4 font-semibold">{item}</div>)}</div>
                </Panel>
              </div>

              <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">Production discipline</p>
                <p className="mt-3 leading-7 text-amber-950">This passage should not produce learner-facing content until its Passage DNA is reviewed, its graph relationships are sourced, and all required workstreams have completed their sections.</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Next assignments</p>
                <h2 className="mt-2 text-2xl font-black">Highest-value passages to start</h2>
                <div className="mt-5 space-y-3">{nextAssignments.map((passage, index) => <button key={passage.id} onClick={() => setSelectedId(passage.id)} className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-300 font-black text-slate-950">{index + 1}</span><span className="min-w-0 flex-1"><span className="block font-bold">{passage.reference}</span><span className="block text-sm text-indigo-100/50">{passage.pathway} · {passage.priority}</span></span></button>)}</div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Pathway coverage</p>
                <h2 className="mt-2 text-2xl font-black">Primary passage distribution</h2>
                <div className="mt-5 space-y-3">{Object.entries(summary.pathwayCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => <div key={name}><div className="flex justify-between gap-4 text-sm"><span>{name}</span><span className="text-indigo-100/45">{count}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-indigo-300" style={{ width: `${Math.min(100, count * 10)}%` }} /></div></div>)}</div>
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
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{title}</p><div className="mt-4">{children}</div></div>; }
function Priority({ priority }: { priority: CanonWavePassage["priority"] }) { const classes = priority === "critical" ? "bg-rose-100 text-rose-800" : priority === "high" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"; return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${classes}`}>{priority}</span>; }
const inputClass = "mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-white outline-none focus:border-amber-300";
