"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { john11PassageDna } from "@/lib/emmaus/passage-dna/john-1-1";
import { getEmmausCompletenessScore, getSectionCompleteness, type PassageDnaSectionId } from "@/lib/emmaus/passage-dna";

const sectionOrder: PassageDnaSectionId[] = [
  "canon",
  "observation",
  "literary",
  "language",
  "historical",
  "connections",
  "theology",
  "narrative",
  "formation",
  "discovery",
  "rabbit-trails",
  "mentor",
  "group",
  "prayer",
  "journal",
  "assessment",
  "memory",
  "atlas",
  "ai",
  "editorial",
];

const sectionIcons: Record<PassageDnaSectionId, string> = {
  canon: "📖",
  literary: "🧱",
  observation: "👁️",
  language: "🔤",
  historical: "🏺",
  connections: "🔗",
  theology: "🕊️",
  narrative: "🧵",
  formation: "🧭",
  mentor: "🤝",
  group: "👥",
  discovery: "🔎",
  "rabbit-trails": "🐇",
  prayer: "🙏",
  journal: "✍️",
  assessment: "✅",
  memory: "🧠",
  atlas: "🗺️",
  ai: "⚙️",
  editorial: "📝",
};

export default function John11GoldStandardPage() {
  const [activeSection, setActiveSection] = useState<PassageDnaSectionId>("observation");
  const [feedback, setFeedback] = useState("");
  const [decision, setDecision] = useState<"needs-work" | "approved" | "">("");
  const [saved, setSaved] = useState(false);

  const score = useMemo(() => getEmmausCompletenessScore(john11PassageDna), []);
  const section = john11PassageDna.sections[activeSection];
  const sectionScore = getSectionCompleteness(section);

  function saveFeedback() {
    const payload = {
      passageId: john11PassageDna.id,
      section: activeSection,
      feedback,
      decision,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(`emmaus-review:${john11PassageDna.id}:${activeSection}`, JSON.stringify(payload));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Emmaus Gold Standard Review</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">John 1:1 — The Eternal Word</h1>
              <p className="mt-4 text-lg leading-8 text-indigo-100/75">Inspect the complete Passage DNA that will set the editorial standard for every future Emmaus passage.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/emmaus/workspace/john-1-1" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">Learner Workspace</Link>
              <Link href="/emmaus/inspect/identity-of-jesus" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">Identity Pathway</Link>
            </div>
          </div>

          <div className="mt-7 rounded-3xl border border-amber-300/25 bg-amber-300/10 p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-amber-200">Passage</p>
            <blockquote className="mt-3 text-2xl font-semibold leading-10 text-amber-50 sm:text-3xl">“In the beginning was the Word, and the Word was with God, and the Word was God.”</blockquote>
            <p className="mt-3 text-sm text-amber-100/60">John 1:1, public-domain wording used for review</p>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Passage completeness" value={`${score}%`} />
          <Stat label="DNA sections" value={String(sectionOrder.length)} />
          <Stat label="Editorial state" value={john11PassageDna.status.replace("-", " ")} />
          <Stat label="Version" value={`v${john11PassageDna.version}`} />
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
          <div className="grid gap-4 md:grid-cols-4">
            <WhyCard label="Canonical connections" value="9" description="Genesis through Revelation" />
            <WhyCard label="Core doctrines" value="4" description="Preexistence, deity, distinction, Trinity" />
            <WhyCard label="Rabbit trails" value="2" description="Creation to glory; divine identity" />
            <WhyCard label="Recommended next" value="Genesis 1:1–3" description="Explore the creation echo" />
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[320px_1fr_360px]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur xl:sticky xl:top-6 xl:self-start">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Inspection sections</p>
            <div className="mt-4 space-y-2">
              {sectionOrder.map((sectionId) => {
                const item = john11PassageDna.sections[sectionId];
                const completeness = getSectionCompleteness(item);
                return (
                  <button
                    key={sectionId}
                    type="button"
                    onClick={() => setActiveSection(sectionId)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${activeSection === sectionId ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-black/20 hover:border-indigo-300/40"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold">{sectionIcons[sectionId]} {item.label}</span>
                      <span className="text-xs text-indigo-100/45">{completeness}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-amber-300" style={{ width: `${completeness}%` }} /></div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="space-y-6">
            <article className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{sectionIcons[activeSection]} {section.label}</p>
                  <h2 className="mt-2 text-3xl font-black sm:text-4xl">{section.description}</h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black capitalize text-emerald-800">{section.reviewStatus}</span>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <Meta label="Section score" value={`${sectionScore}%`} />
                <Meta label="Required fields" value={section.requiredFields.join(", ")} />
              </div>

              <div className="mt-8 space-y-6">
                {Object.entries(section.data).map(([key, value]) => (
                  <DataBlock key={key} label={humanize(key)} value={value} />
                ))}
              </div>
            </article>

            {activeSection === "observation" && (
              <article className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6 shadow-2xl sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-200">Gold-standard test</p>
                <h3 className="mt-2 text-2xl font-black">Can a learner discover the three claims before receiving theological terminology?</h3>
                <p className="mt-4 leading-7 text-emerald-50/75">The approved sequence should first isolate existence, relationship, and identity. Terms such as Trinity and Christology belong later, after the learner identifies the textual evidence.</p>
              </article>
            )}

            {activeSection === "language" && (
              <article className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-6 shadow-2xl sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-amber-200">Language boundary</p>
                <p className="mt-3 leading-7 text-amber-50/80">Greek data must clarify John's wording without implying that a dictionary definition can replace syntax, literary context, or the rest of the Gospel.</p>
              </article>
            )}
          </section>

          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-[2rem] border border-amber-300/25 bg-amber-300/10 p-6 shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">Editorial feedback</p>
              <h2 className="mt-2 text-2xl font-black">Review {section.label}</h2>
              <p className="mt-3 text-sm leading-6 text-amber-50/65">Your feedback is saved locally for this section while the persistent editorial database is being built.</p>

              <textarea
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                rows={9}
                placeholder="Examples: Add more OT connections; make the Greek note deeper; question 3 is too leading..."
                className="mt-5 w-full rounded-2xl border border-white/15 bg-black/20 p-4 text-white outline-none placeholder:text-amber-100/30 focus:border-amber-300"
              />

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDecision("needs-work")} className={`rounded-full px-3 py-2 text-sm font-bold ${decision === "needs-work" ? "bg-rose-300 text-rose-950" : "border border-white/15"}`}>Needs work</button>
                <button type="button" onClick={() => setDecision("approved")} className={`rounded-full px-3 py-2 text-sm font-bold ${decision === "approved" ? "bg-emerald-300 text-emerald-950" : "border border-white/15"}`}>Approve section</button>
              </div>

              <button type="button" onClick={saveFeedback} className="mt-4 w-full rounded-full bg-amber-300 px-4 py-3 font-black text-slate-950">{saved ? "Feedback saved" : "Save feedback"}</button>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Review checklist</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-indigo-100/70">
                <Check text="Scripture remains primary" />
                <Check text="Observation precedes explanation" />
                <Check text="Connections state why they matter" />
                <Check text="Interpretive claims show evidence" />
                <Check text="Questions probe without giving answers" />
                <Check text="Application follows the text" />
                <Check text="Rules mode works without AI" />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Continue inspection</p>
              <div className="mt-4 grid gap-2">
                <Link href="/emmaus/canon" className="rounded-full border border-white/15 px-4 py-2.5 text-center text-sm font-semibold">Canon Lens</Link>
                <Link href="/emmaus/atlas" className="rounded-full border border-white/15 px-4 py-2.5 text-center text-sm font-semibold">Atlas</Link>
                <Link href="/emmaus/questions" className="rounded-full border border-white/15 px-4 py-2.5 text-center text-sm font-semibold">Question Atlas</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function DataBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <section>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{label}</p>
      <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        {renderValue(value)}
      </div>
    </section>
  );
}

function renderValue(value: unknown): React.ReactNode {
  if (Array.isArray(value)) {
    return <div className="space-y-3">{value.map((item, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 leading-7 text-slate-700">{typeof item === "object" && item !== null ? renderObject(item as Record<string, unknown>) : String(item)}</div>)}</div>;
  }
  if (typeof value === "object" && value !== null) return renderObject(value as Record<string, unknown>);
  return <p className="leading-7 text-slate-700">{String(value)}</p>;
}

function renderObject(value: Record<string, unknown>) {
  return <div className="space-y-2">{Object.entries(value).map(([key, item]) => <div key={key}><span className="font-black capitalize text-slate-900">{humanize(key)}: </span><span className="leading-7 text-slate-700">{Array.isArray(item) ? item.join(", ") : String(item)}</span></div>)}</div>;
}

function humanize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><p className="text-2xl font-black capitalize">{value}</p><p className="mt-1 text-sm text-indigo-100/55">{label}</p></div>;
}

function WhyCard({ label, value, description }: { label: string; value: string; description: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-300">{label}</p><p className="mt-2 text-2xl font-black">{value}</p><p className="mt-2 text-sm leading-6 text-indigo-100/50">{description}</p></div>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-800">{value}</p></div>;
}

function Check({ text }: { text: string }) {
  return <p className="flex gap-3"><span className="text-emerald-300">✓</span><span>{text}</span></p>;
}
