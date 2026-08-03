"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type StageKey = "research" | "compose" | "founder_review" | "theological_review" | "preview" | "published";
type LifecycleRecord = {
  id: string;
  title: string;
  passage: string;
  stage: StageKey;
  version: number;
  updatedAt: string;
  notes: string;
  approvals: { founder: boolean; theological: boolean };
  history: Array<{ stage: StageKey; at: string; note: string }>;
};

const stages: Array<{ key: StageKey; label: string; description: string; href?: string }> = [
  { key: "research", label: "Research", description: "Canon Engine assembles approved source material.", href: "/emmaus/admin/canon" },
  { key: "compose", label: "Compose", description: "Discovery Composer shapes the learner experience.", href: "/emmaus/admin/composer" },
  { key: "founder_review", label: "Founder Review", description: "Mission, voice, depth, and usability are reviewed." },
  { key: "theological_review", label: "Theological Review", description: "Claims, context, and guardrails are verified." },
  { key: "preview", label: "Preview", description: "The learner-facing Walk is tested before release.", href: "/emmaus/discovery/demo" },
  { key: "published", label: "Published", description: "Approved content is released with version history." },
];

const seedRecord: LifecycleRecord = {
  id: "john-1-1-eternal-word",
  title: "The Eternal Word",
  passage: "John 1:1",
  stage: "founder_review",
  version: 1,
  updatedAt: new Date().toISOString(),
  notes: "Verify the deeper probing, clue sequence, and Logos Rabbit Trail before theological review.",
  approvals: { founder: false, theological: false },
  history: [
    { stage: "research", at: new Date().toISOString(), note: "Canon source pack assembled." },
    { stage: "compose", at: new Date().toISOString(), note: "Adaptive Discovery blueprint generated." },
    { stage: "founder_review", at: new Date().toISOString(), note: "Submitted for founder review." },
  ],
};

export default function ContentLifecycle() {
  const storageKey = "emmaus-content-lifecycle-v1";
  const [record, setRecord] = useState<LifecycleRecord>(seedRecord);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setRecord(JSON.parse(raw) as LifecycleRecord);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(record));
    setSaved(true);
    const timer = window.setTimeout(() => setSaved(false), 900);
    return () => window.clearTimeout(timer);
  }, [record]);

  const stageIndex = stages.findIndex((stage) => stage.key === record.stage);
  const publishReady = record.approvals.founder && record.approvals.theological;
  const completion = Math.round(((stageIndex + 1) / stages.length) * 100);
  const statusText = useMemo(() => publishReady ? "Ready for preview or publication" : "Approvals still required", [publishReady]);

  function moveTo(stage: StageKey, note: string) {
    const now = new Date().toISOString();
    setRecord((current) => ({
      ...current,
      stage,
      updatedAt: now,
      version: stage === "published" ? current.version + 1 : current.version,
      history: [...current.history, { stage, at: now, note }],
    }));
  }

  function toggleApproval(type: "founder" | "theological") {
    setRecord((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      approvals: { ...current.approvals, [type]: !current.approvals[type] },
    }));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Active Discovery</p>
            <h2 className="mt-2 text-4xl font-black">{record.title}</h2>
            <p className="mt-2 text-lg text-slate-600">{record.passage} · Version {record.version}</p>
          </div>
          <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-800">{stages[stageIndex]?.label}</span>
        </div>

        <div className="mt-7 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-amber-400" style={{ width: `${completion}%` }} /></div>
        <div className="mt-3 flex justify-between text-xs text-slate-500"><span>{statusText}</span><span>{completion}% through lifecycle</span></div>

        <div className="mt-8 grid gap-4">
          {stages.map((stage, index) => {
            const active = stage.key === record.stage;
            const complete = index < stageIndex || record.stage === "published";
            return (
              <div key={stage.key} className={`rounded-3xl border p-5 ${active ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : complete ? "border-emerald-200 bg-emerald-50" : "border-slate-200"}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-black ${complete ? "bg-emerald-600 text-white" : active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>{complete ? "✓" : index + 1}</div>
                    <div><h3 className="text-xl font-black">{stage.label}</h3><p className="mt-1 leading-6 text-slate-600">{stage.description}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stage.href && <Link href={stage.href} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Open workspace</Link>}
                    {!active && index <= stageIndex + 1 && <button type="button" onClick={() => moveTo(stage.key, `Moved to ${stage.label}.`)} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-bold text-white">Move here</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between gap-4"><h3 className="text-2xl font-black">Editorial notes</h3><span className="text-xs text-slate-400">{saved ? "Saved" : "Autosave"}</span></div>
          <textarea value={record.notes} onChange={(event) => setRecord((current) => ({ ...current, notes: event.target.value, updatedAt: new Date().toISOString() }))} rows={7} className="mt-4 w-full rounded-2xl border border-slate-300 bg-white p-4 leading-7 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
        </div>
      </section>

      <aside className="space-y-5">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Required approvals</p>
          <h3 className="mt-2 text-2xl font-black">Publication gate</h3>
          <ApprovalRow label="Founder review" checked={record.approvals.founder} onChange={() => toggleApproval("founder")} />
          <ApprovalRow label="Theological review" checked={record.approvals.theological} onChange={() => toggleApproval("theological")} />
          <button type="button" disabled={!publishReady} onClick={() => moveTo("published", "Published after founder and theological approval.")} className="mt-5 w-full rounded-full bg-amber-300 px-5 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">Publish Version {record.version + 1}</button>
          <p className="mt-3 text-sm leading-6 text-indigo-100/60">Publication stays locked until both approvals are recorded.</p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Audit trail</p>
          <h3 className="mt-2 text-2xl font-black">Version history</h3>
          <div className="mt-5 space-y-4">{[...record.history].reverse().map((entry, index) => <div key={`${entry.at}-${index}`} className="border-l-2 border-indigo-400/40 pl-4"><p className="font-bold">{stages.find((stage) => stage.key === entry.stage)?.label}</p><p className="mt-1 text-sm leading-6 text-indigo-100/65">{entry.note}</p><p className="mt-1 text-xs text-indigo-100/35">{new Date(entry.at).toLocaleString()}</p></div>)}</div>
        </div>
      </aside>
    </div>
  );
}

function ApprovalRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <label className="mt-4 flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"><span className="font-semibold">{label}</span><input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5" /></label>;
}
