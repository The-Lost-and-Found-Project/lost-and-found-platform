"use client";

import { useMemo, useState } from "react";
import {
  createPassageDna,
  generateDownstreamDrafts,
  getEmmausCompletenessScore,
  getPassageDnaGaps,
  getSectionCompleteness,
  type PassageDna,
  type PassageDnaSectionId,
} from "@/lib/emmaus/passage-dna";

const seed = createPassageDna({ id: "john-1-1-dna", reference: "John 1:1", sourceNodeId: "verse-john-1-1", title: "The Eternal Word" });
seed.sections.canon.data = { book: "John", chapter: 1, verses: "1", genre: "Gospel" };
seed.sections.canon.reviewStatus = "approved";
seed.sections.observation.data = { observations: ["The word ‘was’ appears three times.", "The Word is with God.", "The Word is God."] };
seed.sections.observation.reviewStatus = "reviewed";
seed.sections.connections.data = { links: ["Genesis 1:1–3", "Colossians 1:15–17", "Hebrews 1:1–3"] };
seed.sections.connections.reviewStatus = "reviewed";
seed.sections.theology.data = { claims: ["The Word is personally distinct from God and fully divine."] };
seed.sections.theology.reviewStatus = "draft";

export default function CanonBuilderPage() {
  const [dna, setDna] = useState<PassageDna>(seed);
  const [activeSection, setActiveSection] = useState<PassageDnaSectionId>("canon");
  const [preview, setPreview] = useState<"discovery" | "atlas" | "mentor">("discovery");
  const [saved, setSaved] = useState(false);

  const score = useMemo(() => getEmmausCompletenessScore(dna), [dna]);
  const gaps = useMemo(() => getPassageDnaGaps(dna), [dna]);
  const drafts = useMemo(() => generateDownstreamDrafts(dna), [dna]);
  const section = dna.sections[activeSection];

  function updateSectionData(value: string) {
    const key = section.requiredFields[0] ?? "content";
    setDna((current) => ({
      ...current,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
      sections: {
        ...current.sections,
        [activeSection]: {
          ...section,
          data: { ...section.data, [key]: value.split("\n").map((item) => item.trim()).filter(Boolean) },
          reviewStatus: section.reviewStatus === "empty" ? "draft" : section.reviewStatus,
        },
      },
    }));
  }

  function saveDraft() {
    window.localStorage.setItem(`emmaus-passage-dna:${dna.id}`, JSON.stringify(dna));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Emmaus Canon Builder</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">Build the passage once.</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-indigo-100/75">Create Passage DNA, measure completeness, identify gaps, and generate every downstream experience from one canonical source.</p>
            </div>
            <button onClick={saveDraft} className="rounded-full bg-amber-300 px-5 py-3 font-black text-slate-950">{saved ? "Saved" : "Save Passage DNA"}</button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Passage" value={dna.reference} />
          <Stat label="Version" value={`v${dna.version}`} />
          <Stat label="Completeness" value={`${score}%`} />
          <Stat label="Priority gaps" value={String(gaps.length)} />
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[320px_1fr_360px]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Passage DNA</p>
            <div className="mt-4 space-y-2">
              {Object.values(dna.sections).map((item) => {
                const completeness = getSectionCompleteness(item);
                return <button key={item.id} onClick={() => setActiveSection(item.id)} className={`w-full rounded-2xl border p-4 text-left ${activeSection === item.id ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-black/20"}`}>
                  <div className="flex items-center justify-between gap-3"><span className="font-bold">{item.label}</span><span className="text-xs text-indigo-100/50">{completeness}%</span></div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-amber-300" style={{ width: `${completeness}%` }} /></div>
                </button>;
              })}
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{section.label}</p><h2 className="mt-2 text-3xl font-black">{section.description}</h2></div>
                <select value={section.reviewStatus} onChange={(event) => setDna((current) => ({ ...current, sections: { ...current.sections, [activeSection]: { ...section, reviewStatus: event.target.value as typeof section.reviewStatus } } }))} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold">
                  <option value="empty">Empty</option><option value="draft">Draft</option><option value="reviewed">Reviewed</option><option value="approved">Approved</option>
                </select>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-black text-slate-700">Required fields</p>
                <div className="mt-3 flex flex-wrap gap-2">{section.requiredFields.map((field) => <span key={field} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">{field}</span>)}</div>
              </div>

              <label className="mt-6 block text-sm font-black text-slate-700">Section content<textarea rows={14} value={Object.values(section.data).flat().join("\n")} onChange={(event) => updateSectionData(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 p-4 font-normal leading-7 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label>
            </div>

            <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Generated previews</p>
              <div className="mt-4 flex flex-wrap gap-2">{(["discovery", "atlas", "mentor"] as const).map((item) => <button key={item} onClick={() => setPreview(item)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${preview === item ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>{item}</button>)}</div>
              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                {preview === "discovery" && <><h3 className="text-2xl font-black">Discovery draft</h3><p className="mt-3 leading-7 text-slate-600">Begin with observation from {dna.reference}, then connect to approved passages, probe conclusions, and move toward faithful application.</p></>}
                {preview === "atlas" && <><h3 className="text-2xl font-black">Atlas draft</h3><p className="mt-3 leading-7 text-slate-600">Center node: {dna.reference}. Supporting rings will populate from Connections, Language, Historical, Theology, and Narrative DNA.</p></>}
                {preview === "mentor" && <><h3 className="text-2xl font-black">Mentor guide draft</h3><p className="mt-3 leading-7 text-slate-600">Mentor prompts will focus on misconceptions, unresolved questions, and the next study skill rather than completion metrics.</p></>}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Build readiness</p>
              <h2 className="mt-2 text-2xl font-black">Downstream drafts</h2>
              <div className="mt-5 space-y-3">{drafts.map((draft) => <div key={draft.id} className={`rounded-2xl border p-4 ${draft.enabled ? "border-emerald-300/30 bg-emerald-400/10" : "border-white/10 bg-black/20"}`}><div className="flex items-center justify-between gap-3"><p className="font-bold">{draft.label}</p><span className="text-xs">{draft.enabled ? "Ready" : "Blocked"}</span></div><p className="mt-2 text-xs leading-5 text-indigo-100/55">{draft.reason}</p></div>)}</div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Priority gaps</p>
              <div className="mt-4 space-y-3">{gaps.slice(0, 6).map(({ section: gap, completeness }) => <button key={gap.id} onClick={() => setActiveSection(gap.id)} className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left"><div className="flex justify-between gap-3"><p className="font-bold">{gap.label}</p><span className="text-xs text-indigo-100/50">{completeness}%</span></div><p className="mt-2 text-xs leading-5 text-indigo-100/55">Complete: {gap.requiredFields.join(", ")}</p></button>)}</div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-sm text-indigo-100/55">{label}</p></div>;
}
