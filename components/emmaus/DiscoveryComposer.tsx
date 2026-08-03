"use client";

import { useMemo, useState } from "react";
import { getConnectedKnowledge, getKnowledgeNode } from "@/lib/emmaus/knowledge-graph";
import { rabbitTrails } from "@/lib/emmaus/rabbit-trails";

type LearnerDepth = "foundational" | "growing" | "deep" | "guide";
type StudyLength = "15" | "30" | "45" | "60";
type Competency = "Observation" | "Context" | "Connections" | "Theology" | "Application" | "Leadership";

const competencyOptions: Competency[] = ["Observation", "Context", "Connections", "Theology", "Application", "Leadership"];

const depthLabels: Record<LearnerDepth, string> = {
  foundational: "Foundational",
  growing: "Growing",
  deep: "Deep",
  guide: "Guide / Teacher",
};

export default function DiscoveryComposer() {
  const [title, setTitle] = useState("The Eternal Word");
  const [subtitle, setSubtitle] = useState("Discover what John reveals about Jesus before creation begins.");
  const [depth, setDepth] = useState<LearnerDepth>("deep");
  const [length, setLength] = useState<StudyLength>("45");
  const [competencies, setCompetencies] = useState<Competency[]>(["Observation", "Connections", "Theology"]);
  const [includeTrail, setIncludeTrail] = useState(true);
  const [copied, setCopied] = useState(false);

  const sourceNode = getKnowledgeNode("verse-john-1-1");
  const connections = getConnectedKnowledge("verse-john-1-1");
  const trail = rabbitTrails.logos;

  const draft = useMemo(() => {
    const promptSet = composePrompts(depth, length);
    const selectedConnections = connections.slice(0, Number(length) >= 45 ? 4 : Number(length) >= 30 ? 3 : 2);

    return {
      key: "john-1-1-eternal-word",
      title,
      subtitle,
      translation: "KJV",
      passage: [{ verse: 1, text: "In the beginning was the Word, and the Word was with God, and the Word was God." }],
      guide: promptSet.guide,
      openingPrayer: "Father, quiet the distractions around me and within me. Open my eyes to see what You have revealed, give me wisdom to understand it faithfully, and shape my heart to receive it humbly. Help me know Christ more deeply through Your Word. Amen.",
      prompts: {
        observe: promptSet.observe,
        wonder: promptSet.wonder,
        connect: promptSet.connect,
        reflect: promptSet.reflect,
        journal: promptSet.journal,
      },
      clues: promptSet.clues,
      competencies,
      estimatedMinutes: Number(length),
      learnerDepth: depth,
      connections: selectedConnections.map(({ node, edge }) => ({
        nodeId: node.id,
        label: node.label,
        relationship: edge.relationship,
        explanation: edge.explanation,
      })),
      rabbitTrails: includeTrail ? [{ slug: trail.slug, title: trail.title, href: `/emmaus/trails/${trail.slug}` }] : [],
      closingPrayer: "Father, do not allow this truth to remain only in my mind. Plant it deeply in my heart, show me where You are calling me to trust and obey, and continue shaping me into the image of Christ. Amen.",
    };
  }, [competencies, connections, depth, includeTrail, length, subtitle, title, trail.slug, trail.title]);

  function toggleCompetency(competency: Competency) {
    setCompetencies((current) => current.includes(competency) ? current.filter((item) => item !== competency) : [...current, competency]);
  }

  function sendToBuilder() {
    const builderDraft = {
      key: draft.key,
      title: draft.title,
      subtitle: draft.subtitle,
      translation: draft.translation,
      passage: draft.passage.map((verse) => `${verse.verse} ${verse.text}`).join("\n"),
      observe: draft.prompts.observe,
      wonder: draft.prompts.wonder,
      reflect: draft.prompts.reflect,
      pray: draft.closingPrayer,
      threads: draft.connections.map((connection) => ({
        reference: connection.label,
        text: connection.explanation,
        question: `How does this ${connection.relationship} connection sharpen your reading of John 1:1?`,
      })),
      composerMetadata: {
        guide: draft.guide,
        clues: draft.clues,
        connect: draft.prompts.connect,
        journal: draft.prompts.journal,
        competencies: draft.competencies,
        learnerDepth: draft.learnerDepth,
        estimatedMinutes: draft.estimatedMinutes,
        rabbitTrails: draft.rabbitTrails,
        openingPrayer: draft.openingPrayer,
        closingPrayer: draft.closingPrayer,
      },
    };

    window.localStorage.setItem("emmaus-discovery-builder-draft", JSON.stringify(builderDraft));
    window.location.href = "/emmaus/admin";
  }

  async function copyStructure() {
    await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <aside className="self-start rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur xl:sticky xl:top-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Composition controls</p>
        <h2 className="mt-2 text-2xl font-black">Shape the walk</h2>

        <label className="mt-6 block text-sm font-semibold text-indigo-100">Title<input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} /></label>
        <label className="mt-4 block text-sm font-semibold text-indigo-100">Subtitle<textarea value={subtitle} onChange={(event) => setSubtitle(event.target.value)} rows={3} className={inputClass} /></label>

        <label className="mt-4 block text-sm font-semibold text-indigo-100">Learner depth<select value={depth} onChange={(event) => setDepth(event.target.value as LearnerDepth)} className={inputClass}>{Object.entries(depthLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="mt-4 block text-sm font-semibold text-indigo-100">Study length<select value={length} onChange={(event) => setLength(event.target.value as StudyLength)} className={inputClass}><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option></select></label>

        <div className="mt-5">
          <p className="text-sm font-semibold text-indigo-100">Competencies</p>
          <div className="mt-3 flex flex-wrap gap-2">{competencyOptions.map((competency) => <button key={competency} type="button" onClick={() => toggleCompetency(competency)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${competencies.includes(competency) ? "bg-amber-300 text-slate-950" : "border border-white/15 bg-white/5 text-indigo-100"}`}>{competency}</button>)}</div>
        </div>

        <label className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><input type="checkbox" checked={includeTrail} onChange={(event) => setIncludeTrail(event.target.checked)} className="mt-1 h-4 w-4" /><span><span className="block font-semibold">Include Logos Rabbit Trail</span><span className="mt-1 block text-sm leading-6 text-indigo-100/60">Adds the approved creation-to-glory trail.</span></span></label>

        <div className="mt-6 grid gap-2">
          <button type="button" onClick={sendToBuilder} className="rounded-full bg-amber-300 px-5 py-3 font-black text-slate-950">Send Draft to Builder →</button>
          <button type="button" onClick={copyStructure} className="rounded-full border border-white/20 px-5 py-3 font-semibold text-white">{copied ? "Structure copied" : "Copy Structured JSON"}</button>
        </div>
      </aside>

      <section className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Generated Discovery Blueprint</p>
            <h2 className="mt-2 text-4xl font-black">{draft.title}</h2>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">{draft.subtitle}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 px-4 py-3 text-right"><p className="font-black">John 1:1</p><p className="text-xs text-slate-500">{depthLabels[depth]} · {length} min</p></div>
        </div>

        <div className="mt-7 rounded-3xl bg-stone-50 p-6"><p className="text-sm font-bold text-indigo-700">KJV</p><p className="mt-3 text-xl leading-9">In the beginning was the Word, and the Word was with God, and the Word was God.</p></div>

        <BlueprintSection number="01" title="Guide" body={draft.guide} />
        <BlueprintSection number="02" title="Observe" body={draft.prompts.observe} clues={draft.clues} />
        <BlueprintSection number="03" title="Wonder" body={draft.prompts.wonder} />
        <BlueprintSection number="04" title="Connect" body={draft.prompts.connect}>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{draft.connections.map((connection) => <div key={connection.nodeId} className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-700">{connection.relationship}</p><p className="mt-2 font-black">{connection.label}</p><p className="mt-2 text-sm leading-6 text-slate-600">{connection.explanation}</p></div>)}</div>
        </BlueprintSection>
        {includeTrail && <BlueprintSection number="05" title="Rabbit Trail" body={`${trail.title}: ${trail.subtitle}`} />}
        <BlueprintSection number={includeTrail ? "06" : "05"} title="Respond" body={draft.prompts.reflect} />
        <BlueprintSection number={includeTrail ? "07" : "06"} title="Journal" body={draft.prompts.journal} />

        <div className="mt-8 rounded-3xl border border-indigo-200 bg-indigo-50 p-6"><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Discovery Compass</p><div className="mt-4 flex flex-wrap gap-2">{draft.competencies.map((competency) => <span key={competency} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-indigo-700 shadow-sm">🌱 {competency}</span>)}</div></div>
      </section>
    </div>
  );
}

function composePrompts(depth: LearnerDepth, length: StudyLength) {
  const longer = Number(length) >= 45;
  const prompts = {
    foundational: {
      guide: "Slow down and notice what John says about the Word before trying to explain it.",
      observe: "List at least three things John says directly about the Word in this verse.",
      wonder: "Which phrase is hardest for you to understand, and what question does it raise?",
      connect: "Compare John 1:1 with Genesis 1:1. What wording do the two passages share?",
      reflect: "What does this verse begin to reveal about who Jesus is?",
      journal: "Write one truth about Jesus you want to remember.",
      clues: ["Notice when the Word existed.", "Notice both ‘with God’ and ‘was God’."],
    },
    growing: {
      guide: "Separate observation from interpretation. Make John’s wording carry the weight.",
      observe: "Identify the time statement, the relational statement, and the identity statement in John 1:1.",
      wonder: "Why might John choose ‘the Word’ before naming Jesus?",
      connect: "Compare Genesis 1:1–3 and John 1:1–3. Record every parallel before drawing conclusions.",
      reflect: "How should the eternal identity of Christ reshape the way you trust Him?",
      journal: "Summarize John’s three claims about the Word in your own words.",
      clues: ["The verb ‘was’ appears three times.", "John echoes the Bible’s opening words."],
    },
    deep: {
      guide: "Treat every clause as a deliberate theological claim. Resist collapsing distinction or deity.",
      observe: "Analyze how ‘in the beginning,’ ‘with God,’ and ‘was God’ function together. What errors does each clause prevent?",
      wonder: "What does the title Logos communicate about revelation, divine self-expression, and Christ’s relationship to creation?",
      connect: "Synthesize Genesis 1:1–3, Hebrews 1:1–3, and Colossians 1:15–17. Which claims converge around Christ?",
      reflect: "Where have you functionally treated Jesus as less than the eternal, fully divine Son?",
      journal: "State a concise Christological conclusion, cite its textual evidence, and preserve one unresolved question.",
      clues: ["Distinction and deity must both remain intact.", "Creation and revelation converge in the Son."],
    },
    guide: {
      guide: "Study the verse as both a learner and a future guide. Notice how to lead discovery without prematurely supplying conclusions.",
      observe: "Build a question sequence that helps another person discover preexistence, personal distinction, and deity from the text itself.",
      wonder: "Which common misunderstanding of John 1:1 would your questions need to surface and correct through Scripture?",
      connect: "Design a cross-reference path using Genesis 1, Hebrews 1, Colossians 1, and John 20:28. Explain the pedagogical order.",
      reflect: "How would you explain this verse faithfully without reducing mystery or overstating what one verse alone establishes?",
      journal: "Write a leader note identifying the discovery goal, likely obstacles, and the best follow-up question.",
      clues: ["Ask before explaining.", "Let multiple passages establish the conclusion."],
    },
  }[depth];

  if (longer) prompts.clues.push("Follow one phrase through at least two additional passages before applying it.");
  return prompts;
}

function BlueprintSection({ number, title, body, clues, children }: { number: string; title: string; body: string; clues?: string[]; children?: React.ReactNode }) {
  return <div className="mt-7 border-t border-slate-200 pt-7"><div className="flex gap-4"><span className="text-sm font-black text-amber-700">{number}</span><div className="min-w-0 flex-1"><h3 className="text-2xl font-black">{title}</h3><p className="mt-2 leading-7 text-slate-600">{body}</p>{clues && <div className="mt-4 space-y-2">{clues.map((clue) => <div key={clue} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-slate-700">🧩 {clue}</div>)}</div>}{children}</div></div></div>;
}

const inputClass = "mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-white outline-none placeholder:text-indigo-100/30 focus:border-amber-300";
