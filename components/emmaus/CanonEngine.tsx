"use client";

import { useMemo, useState } from "react";
import { knowledgeNodes, searchKnowledge } from "@/lib/emmaus/knowledge-graph";
import { rabbitTrails } from "@/lib/emmaus/rabbit-trails";

type Depth = "foundational" | "growing" | "deep" | "guide";
type Focus = "observation" | "connections" | "theology" | "application" | "leadership";

const passageOptions = [
  { id: "verse-john-1-1", label: "John 1:1", text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
  { id: "verse-genesis-1-1", label: "Genesis 1:1–3", text: "In the beginning God created the heaven and the earth... And God said, Let there be light: and there was light." },
  { id: "verse-colossians-1-15", label: "Colossians 1:15–17", text: "Christ is the image of the invisible God, and all things were created through Him and for Him." },
  { id: "verse-hebrews-1-1", label: "Hebrews 1:1–3", text: "God has spoken through His Son, through whom He made the world and revealed His glory." },
];

const depthLabels: Record<Depth, string> = {
  foundational: "Foundational",
  growing: "Growing",
  deep: "Deep",
  guide: "Guide / Teacher",
};

const focusLabels: Record<Focus, string> = {
  observation: "Observation",
  connections: "Biblical Connections",
  theology: "Theology",
  application: "Application",
  leadership: "Leadership",
};

export default function CanonEngine() {
  const [passageId, setPassageId] = useState("verse-john-1-1");
  const [depth, setDepth] = useState<Depth>("deep");
  const [focuses, setFocuses] = useState<Focus[]>(["observation", "connections", "theology"]);
  const [includeTrail, setIncludeTrail] = useState(true);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const passage = passageOptions.find((item) => item.id === passageId) ?? passageOptions[0];
  const related = useMemo(() => {
    const source = query.trim() ? searchKnowledge(query) : knowledgeNodes;
    return source.filter((node) => node.id !== passageId).slice(0, 8);
  }, [passageId, query]);

  const draft = useMemo(() => {
    const selectedNodes = related.slice(0, depth === "foundational" ? 3 : depth === "growing" ? 5 : 8);
    return {
      passage: passage.label,
      sourceText: passage.text,
      learnerDepth: depth,
      focuses,
      researchSummary: buildResearchSummary(passage.label, depth),
      observationPrompts: buildObservationPrompts(depth),
      connectionPrompts: buildConnectionPrompts(depth, selectedNodes.map((node) => node.label)),
      theologicalGuardrails: [
        "Keep Scripture primary and distinguish explicit claims from inference.",
        "Do not present denominational conclusions as uncontested biblical fact.",
        "Require human theological review before publication.",
      ],
      approvedAssets: {
        graphNodes: selectedNodes.map((node) => ({ id: node.id, label: node.label, type: node.type, description: node.description })),
        rabbitTrails: includeTrail && passageId === "verse-john-1-1" ? [{ slug: rabbitTrails.logos.slug, title: rabbitTrails.logos.title }] : [],
      },
      suggestedQuestions: buildSuggestedQuestions(depth, focuses),
      status: "draft-for-founder-review",
    };
  }, [depth, focuses, includeTrail, passage.label, passage.text, passageId, related]);

  function toggleFocus(focus: Focus) {
    setFocuses((current) => current.includes(focus) ? current.filter((item) => item !== focus) : [...current, focus]);
  }

  async function copyDraft() {
    await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function sendToComposer() {
    window.localStorage.setItem("emmaus-canon-engine-draft", JSON.stringify(draft));
    window.location.href = "/emmaus/admin/composer";
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
      <aside className="self-start rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur xl:sticky xl:top-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Research controls</p>
        <h2 className="mt-2 text-2xl font-black">Assemble the source pack</h2>

        <label className="mt-6 block text-sm font-semibold text-indigo-100">Passage<select value={passageId} onChange={(event) => setPassageId(event.target.value)} className={inputClass}>{passageOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="mt-4 block text-sm font-semibold text-indigo-100">Learner depth<select value={depth} onChange={(event) => setDepth(event.target.value as Depth)} className={inputClass}>{Object.entries(depthLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="mt-4 block text-sm font-semibold text-indigo-100">Filter approved graph assets<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="creation, light, Logos..." className={inputClass} /></label>

        <div className="mt-5"><p className="text-sm font-semibold text-indigo-100">Study focus</p><div className="mt-3 flex flex-wrap gap-2">{(Object.keys(focusLabels) as Focus[]).map((focus) => <button key={focus} type="button" onClick={() => toggleFocus(focus)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${focuses.includes(focus) ? "bg-amber-300 text-slate-950" : "border border-white/15 bg-white/5 text-indigo-100"}`}>{focusLabels[focus]}</button>)}</div></div>

        <label className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><input type="checkbox" checked={includeTrail} onChange={(event) => setIncludeTrail(event.target.checked)} className="mt-1 h-4 w-4" /><span><span className="block font-semibold">Attach approved Rabbit Trails</span><span className="mt-1 block text-sm leading-6 text-indigo-100/60">Only trails already reviewed in the Emmaus library are included.</span></span></label>

        <div className="mt-6 grid gap-2"><button type="button" onClick={sendToComposer} className="rounded-full bg-amber-300 px-5 py-3 font-black text-slate-950">Send to Discovery Composer →</button><button type="button" onClick={copyDraft} className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white">{copied ? "Draft copied" : "Copy Research Draft"}</button></div>
      </aside>

      <section className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Canon Engine Draft</p><h2 className="mt-2 text-4xl font-black">{passage.label}</h2><p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">{draft.researchSummary}</p></div><span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-800">Founder review required</span></div>

        <div className="mt-7 rounded-3xl bg-stone-50 p-6"><p className="text-sm font-bold text-indigo-700">Source passage</p><p className="mt-3 text-xl leading-9">{passage.text}</p></div>

        <Section title="Observation prompts">{draft.observationPrompts.map((prompt) => <Prompt key={prompt}>{prompt}</Prompt>)}</Section>
        <Section title="Connection prompts">{draft.connectionPrompts.map((prompt) => <Prompt key={prompt}>{prompt}</Prompt>)}</Section>

        <Section title="Approved graph assets"><div className="grid gap-3 md:grid-cols-2">{draft.approvedAssets.graphNodes.map((node) => <div key={node.id} className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-700">{node.type}</p><h4 className="mt-2 font-black">{node.label}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{node.description}</p></div>)}</div>{draft.approvedAssets.rabbitTrails.length > 0 && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">Approved Rabbit Trail</p><p className="mt-2 font-black">{draft.approvedAssets.rabbitTrails[0].title}</p></div>}</Section>

        <Section title="Suggested adaptive questions">{draft.suggestedQuestions.map((question) => <Prompt key={question}>{question}</Prompt>)}</Section>
        <Section title="Theological guardrails">{draft.theologicalGuardrails.map((guardrail) => <div key={guardrail} className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">✓ {guardrail}</div>)}</Section>
      </section>
    </div>
  );
}

function buildResearchSummary(passage: string, depth: Depth) {
  return `${passage} assembled for a ${depthLabels[depth].toLowerCase()} learner. The engine gathers only currently approved Emmaus graph assets and leaves all interpretation, wording, and publication decisions under founder review.`;
}

function buildObservationPrompts(depth: Depth) {
  if (depth === "foundational") return ["What does the passage say directly?", "Which word or phrase stands out most?", "What question does the wording raise?"];
  if (depth === "growing") return ["Identify time, identity, relationship, and action statements.", "Which repeated or contrasting words shape the passage?", "What conclusion is explicit, and what remains inference?"];
  if (depth === "guide") return ["Design a sequence that helps another learner discover the passage's claims.", "Identify likely misunderstandings before supplying explanation.", "Decide which clue should appear first and why."];
  return ["Analyze the logical force of each clause.", "Identify theological claims that must be held together.", "List interpretive errors prevented by the wording itself."];
}

function buildConnectionPrompts(depth: Depth, labels: string[]) {
  const selected = labels.slice(0, depth === "foundational" ? 2 : 4);
  return selected.map((label) => `Compare ${label} with the source passage. What relationship is explicit, echoed, or thematically developed?`);
}

function buildSuggestedQuestions(depth: Depth, focuses: Focus[]) {
  const questions = [`What does the text require the learner to notice before interpretation?`, `Which approved connection most clearly deepens the passage?`];
  if (focuses.includes("theology")) questions.push("What does this passage reveal about God, Christ, salvation, or the kingdom?");
  if (focuses.includes("application")) questions.push("What belief or behavior should change if this is true?");
  if (focuses.includes("leadership") || depth === "guide") questions.push("How could a guide lead someone to this conclusion without stating it first?");
  return questions;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <div className="mt-8 border-t border-slate-200 pt-7"><h3 className="text-2xl font-black">{title}</h3><div className="mt-4">{children}</div></div>; }
function Prompt({ children }: { children: React.ReactNode }) { return <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-7 text-slate-700">{children}</div>; }
const inputClass = "mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-white outline-none placeholder:text-indigo-100/30 focus:border-amber-300";
