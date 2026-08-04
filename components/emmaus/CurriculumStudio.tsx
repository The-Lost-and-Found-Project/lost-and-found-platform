"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getConnectedKnowledge, knowledgeNodes, type KnowledgeNode } from "@/lib/emmaus/knowledge-graph";
import { buildReasoningPath, type ReasoningIntent } from "@/lib/emmaus/reasoning-engine";
import { beginDialogue, type DialogueDepth, type DialogueMove } from "@/lib/emmaus/socratic-dialogue";

type Objective = {
  id: string;
  label: string;
  enabled: boolean;
};

type StudioDraft = {
  title: string;
  subtitle: string;
  sourceNodeId: string;
  depth: DialogueDepth;
  estimatedMinutes: number;
  objectives: string[];
  selectedConnectionIds: string[];
  dialogueMoves: DialogueMove[];
  clues: string[];
  teachingNotes: string;
  openingPrayer: string;
  closingPrayer: string;
};

const moveOptions: DialogueMove[] = ["observe", "clarify", "connect", "probe", "test", "reflect", "apply", "summarize"];
const intentByMove: Partial<Record<DialogueMove, ReasoningIntent>> = {
  observe: "observe",
  connect: "connect",
  probe: "theology",
  test: "connect",
  reflect: "theology",
};

const defaultObjectives: Objective[] = [
  { id: "observation", label: "Identify the explicit claims in the passage", enabled: true },
  { id: "connections", label: "Trace the strongest biblical connections", enabled: true },
  { id: "theology", label: "Form a text-supported theological conclusion", enabled: true },
  { id: "application", label: "Respond with a specific act of faithfulness", enabled: true },
  { id: "leadership", label: "Practice guiding another learner through discovery", enabled: false },
];

export default function CurriculumStudio() {
  const router = useRouter();
  const [sourceNodeId, setSourceNodeId] = useState("verse-john-1-1");
  const [title, setTitle] = useState("The Eternal Word");
  const [subtitle, setSubtitle] = useState("Discover what John reveals about Jesus before creation begins.");
  const [depth, setDepth] = useState<DialogueDepth>("deep");
  const [estimatedMinutes, setEstimatedMinutes] = useState(45);
  const [objectives, setObjectives] = useState(defaultObjectives);
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>([]);
  const [dialogueMoves, setDialogueMoves] = useState<DialogueMove[]>(["observe", "connect", "probe", "test", "reflect", "apply", "summarize"]);
  const [clues, setClues] = useState([
    "Notice how often John uses the word ‘was.’",
    "Hold together both ‘with God’ and ‘was God.’",
  ]);
  const [teachingNotes, setTeachingNotes] = useState("Do not explain the Trinity before the learner has observed distinction and deity in the text.");
  const [openingPrayer, setOpeningPrayer] = useState("Father, quiet my heart and teach me through Your Word. Help me see clearly, think faithfully, and respond humbly. Amen.");
  const [closingPrayer, setClosingPrayer] = useState("Father, make this truth visible in the way I trust and obey Christ. Keep shaping me through Your Word. Amen.");
  const [copied, setCopied] = useState(false);

  const sourceNode = knowledgeNodes.find((node) => node.id === sourceNodeId) ?? knowledgeNodes[0];
  const connections = sourceNode ? getConnectedKnowledge(sourceNode.id).filter(({ edge }) => edge.status === "approved" || edge.status === "reviewed") : [];

  const selectedConnections = connections.filter(({ node }) => selectedConnectionIds.includes(node.id));

  const draft: StudioDraft = useMemo(() => ({
    title,
    subtitle,
    sourceNodeId,
    depth,
    estimatedMinutes,
    objectives: objectives.filter((objective) => objective.enabled).map((objective) => objective.label),
    selectedConnectionIds,
    dialogueMoves,
    clues,
    teachingNotes,
    openingPrayer,
    closingPrayer,
  }), [clues, closingPrayer, depth, dialogueMoves, estimatedMinutes, objectives, openingPrayer, selectedConnectionIds, sourceNodeId, subtitle, teachingNotes, title]);

  const question = sourceNode ? `What does ${sourceNode.label} reveal?` : "What does this passage reveal?";
  const preview = {
    dialogue: beginDialogue(question, depth, sourceNode?.id),
    reasoning: buildReasoningPath(sourceNode?.id ?? "", "connect", 4),
  };

  function toggleObjective(id: string) {
    setObjectives((current) => current.map((objective) => objective.id === id ? { ...objective, enabled: !objective.enabled } : objective));
  }

  function toggleConnection(node: KnowledgeNode) {
    setSelectedConnectionIds((current) => current.includes(node.id) ? current.filter((id) => id !== node.id) : [...current, node.id]);
  }

  function toggleMove(move: DialogueMove) {
    setDialogueMoves((current) => current.includes(move) ? current.filter((item) => item !== move) : [...current, move]);
  }

  function moveDialogue(move: DialogueMove, direction: -1 | 1) {
    setDialogueMoves((current) => {
      const index = current.indexOf(move);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const copy = [...current];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  }

  function addClue() {
    setClues((current) => [...current, ""]);
  }

  function updateClue(index: number, value: string) {
    setClues((current) => current.map((clue, clueIndex) => clueIndex === index ? value : clue));
  }

  function sendToComposer() {
    window.localStorage.setItem("emmaus-curriculum-studio-draft", JSON.stringify({
      ...draft,
      sourceNode,
      selectedConnections: selectedConnections.map(({ node, edge }) => ({ node, edge })),
      reasoningPreview: preview.reasoning,
    }));
    router.push("/emmaus/admin/composer");
  }

  async function copyDraft() {
    await navigator.clipboard.writeText(JSON.stringify(draft, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <aside className="self-start space-y-5 xl:sticky xl:top-6">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Curriculum controls</p>
          <h2 className="mt-2 text-2xl font-black">Shape the Discovery</h2>

          <label className={labelClass}>Source passage<select value={sourceNodeId} onChange={(event) => { setSourceNodeId(event.target.value); setSelectedConnectionIds([]); }} className={inputClass}>{knowledgeNodes.filter((node) => ["verse", "passage", "chapter"].includes(node.type)).map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}</select></label>
          <label className={labelClass}>Title<input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} /></label>
          <label className={labelClass}>Subtitle<textarea value={subtitle} onChange={(event) => setSubtitle(event.target.value)} rows={3} className={inputClass} /></label>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-sm font-semibold text-indigo-100">Depth<select value={depth} onChange={(event) => setDepth(event.target.value as DialogueDepth)} className={inputClass}><option value="foundational">Foundational</option><option value="growing">Growing</option><option value="deep">Deep</option><option value="guide">Guide</option></select></label>
            <label className="text-sm font-semibold text-indigo-100">Minutes<input type="number" min={10} max={120} value={estimatedMinutes} onChange={(event) => setEstimatedMinutes(Number(event.target.value))} className={inputClass} /></label>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">Learning objectives</p>
          <div className="mt-4 space-y-3">{objectives.map((objective) => <label key={objective.id} className="flex cursor-pointer gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"><input type="checkbox" checked={objective.enabled} onChange={() => toggleObjective(objective.id)} className="mt-1 h-4 w-4" /><span className="text-sm leading-6 text-indigo-100/80">{objective.label}</span></label>)}</div>
        </section>

        <div className="grid gap-2">
          <button type="button" onClick={sendToComposer} className="rounded-full bg-amber-300 px-5 py-3 font-black text-slate-950">Send to Discovery Composer →</button>
          <button type="button" onClick={copyDraft} className="rounded-full border border-white/20 px-5 py-3 font-semibold">{copied ? "Draft copied" : "Copy Structured Draft"}</button>
        </div>
      </aside>

      <section className="space-y-6">
        <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Passage foundation</p>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-4xl font-black">{sourceNode?.label}</h2><p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">{sourceNode?.description}</p></div><span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-800">{sourceNode?.status ?? "draft"}</span></div>

          <div className="mt-8 border-t border-slate-200 pt-7">
            <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Approved graph connections</p><h3 className="mt-2 text-2xl font-black">Choose what belongs in this Discovery</h3></div><span className="text-sm text-slate-400">{selectedConnectionIds.length} selected</span></div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {connections.map(({ node, edge }) => {
                const selected = selectedConnectionIds.includes(node.id);
                return <button key={edge.id ?? `${edge.from}-${edge.to}`} type="button" onClick={() => toggleConnection(node)} className={`rounded-2xl border p-5 text-left transition ${selected ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300"}`}>
                  <div className="flex items-start justify-between gap-3"><p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-700">{edge.relationship}</p><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{edge.confidence ?? "inferred"}</span></div>
                  <h4 className="mt-3 text-xl font-black">{node.label}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{edge.explanation}</p>
                </button>;
              })}
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Socratic sequence</p>
          <h2 className="mt-2 text-3xl font-black">Arrange the learner’s discovery path</h2>
          <div className="mt-6 space-y-3">
            {dialogueMoves.map((move, index) => <div key={move} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 font-black text-white">{index + 1}</div><div className="min-w-0 flex-1"><p className="font-black capitalize">{move}</p><p className="text-sm text-slate-500">{intentByMove[move] ? `Uses ${intentByMove[move]} reasoning` : "Uses learner response evidence"}</p></div><div className="flex gap-2"><button type="button" onClick={() => moveDialogue(move, -1)} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm">↑</button><button type="button" onClick={() => moveDialogue(move, 1)} className="rounded-full border border-slate-300 px-3 py-1.5 text-sm">↓</button><button type="button" onClick={() => toggleMove(move)} className="rounded-full border border-rose-200 px-3 py-1.5 text-sm text-rose-700">Remove</button></div></div>)}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">{moveOptions.filter((move) => !dialogueMoves.includes(move)).map((move) => <button key={move} type="button" onClick={() => toggleMove(move)} className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold capitalize text-indigo-700">+ {move}</button>)}</div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Clues</p>
            <h2 className="mt-2 text-2xl font-black">Help without giving away the answer</h2>
            <div className="mt-5 space-y-3">{clues.map((clue, index) => <input key={index} value={clue} onChange={(event) => updateClue(index, event.target.value)} className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 outline-none focus:border-amber-500" />)}</div>
            <button type="button" onClick={addClue} className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold">Add clue</button>
          </div>

          <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Teaching notes</p>
            <h2 className="mt-2 text-2xl font-black">Internal guidance for reviewers</h2>
            <textarea value={teachingNotes} onChange={(event) => setTeachingNotes(event.target.value)} rows={8} className="mt-5 w-full rounded-2xl border border-slate-300 p-4 leading-7 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
          </div>
        </div>

        <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Adaptive preview</p>
          <h2 className="mt-2 text-3xl font-black">Preview the learner experience</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6"><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Opening guide question</p><p className="mt-3 text-lg font-semibold leading-8">{preview.dialogue.nextQuestion}</p>{preview.dialogue.clue && <p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-slate-600">🧩 {preview.dialogue.clue}</p>}</div>
            <div className="rounded-3xl border border-slate-200 p-6"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Reasoning preview</p><p className="mt-3 leading-7 text-slate-700">{preview.reasoning?.summary ?? "No reviewed reasoning path is available."}</p><div className="mt-4 space-y-2">{preview.reasoning?.steps.slice(0, 3).map((step) => <div key={step.node.id} className="rounded-2xl bg-slate-50 p-4"><p className="font-bold">{step.node.label}</p><p className="mt-1 text-sm text-slate-500">{step.reason}</p></div>)}</div></div>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-black text-slate-700">Opening prayer<textarea value={openingPrayer} onChange={(event) => setOpeningPrayer(event.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-slate-300 p-4 font-normal leading-7 outline-none focus:border-indigo-500" /></label>
            <label className="text-sm font-black text-slate-700">Closing prayer<textarea value={closingPrayer} onChange={(event) => setClosingPrayer(event.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-slate-300 p-4 font-normal leading-7 outline-none focus:border-indigo-500" /></label>
          </div>
        </div>
      </section>
    </div>
  );
}

const labelClass = "mt-4 block text-sm font-semibold text-indigo-100";
const inputClass = "mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-white outline-none focus:border-amber-300";
