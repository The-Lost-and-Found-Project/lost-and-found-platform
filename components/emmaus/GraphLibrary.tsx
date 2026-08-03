"use client";

import { useMemo, useState } from "react";
import {
  getConnectedKnowledge,
  getGraphStats,
  knowledgeEdges,
  knowledgeNodes,
  searchKnowledge,
  validateKnowledgeGraph,
  type EdgeConfidence,
  type KnowledgeNodeType,
  type ReviewStatus,
  type Testament,
} from "@/lib/emmaus/knowledge-graph";

const nodeTypes: Array<KnowledgeNodeType | "all"> = [
  "all", "book", "chapter", "verse", "passage", "person", "place", "event", "theme", "doctrine", "covenant", "prophecy", "word", "trail",
];

export default function GraphLibrary() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<KnowledgeNodeType | "all">("all");
  const [status, setStatus] = useState<ReviewStatus | "all">("all");
  const [testament, setTestament] = useState<Testament | "all">("all");
  const [selectedId, setSelectedId] = useState(knowledgeNodes[0]?.id ?? "");

  const stats = getGraphStats();
  const validation = validateKnowledgeGraph();
  const results = useMemo(() => searchKnowledge(query, {
    type: type === "all" ? undefined : type,
    status: status === "all" ? undefined : status,
    testament: testament === "all" ? undefined : testament,
  }), [query, status, testament, type]);
  const selected = knowledgeNodes.find((node) => node.id === selectedId) ?? results[0] ?? knowledgeNodes[0];
  const connections = selected ? getConnectedKnowledge(selected.id) : [];

  return (
    <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
      <aside className="self-start rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur xl:sticky xl:top-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Graph controls</p>
        <h2 className="mt-2 text-2xl font-black">Inspect the canonical library</h2>

        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search John, creation, covenant..." className={inputClass} />
        <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <Select label="Node type" value={type} onChange={(value) => setType(value as KnowledgeNodeType | "all")} options={nodeTypes} />
          <Select label="Review status" value={status} onChange={(value) => setStatus(value as ReviewStatus | "all")} options={["all", "draft", "reviewed", "approved"]} />
          <Select label="Testament" value={testament} onChange={(value) => setTestament(value as Testament | "all")} options={["all", "old", "new", "both"]} />
        </div>

        <div className="mt-5 max-h-[42rem] space-y-2 overflow-auto pr-1">
          {results.map((node) => (
            <button key={node.id} type="button" onClick={() => setSelectedId(node.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selected?.id === node.id ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-black/20 hover:border-indigo-300/40"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-300">{node.type}</p>
                  <p className="mt-1 font-black">{node.label}</p>
                </div>
                <StatusBadge status={node.status ?? "draft"} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-indigo-100/60">{node.description}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Nodes" value={String(stats.nodes)} />
          <Stat label="Edges" value={String(stats.edges)} />
          <Stat label="Approved edges" value={String(stats.byStatus.approved ?? 0)} />
          <Stat label="Validation" value={validation.valid ? "Passing" : "Review needed"} />
        </div>

        {selected && (
          <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{selected.type}</p>
                <h2 className="mt-2 text-4xl font-black">{selected.label}</h2>
                {selected.reference && <p className="mt-2 font-bold text-amber-700">{selected.reference}</p>}
                <p className="mt-4 text-lg leading-8 text-slate-600">{selected.description}</p>
              </div>
              <StatusBadge status={selected.status ?? "draft"} dark />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Meta label="Testament" value={selected.testament ?? "—"} />
              <Meta label="Book" value={selected.book ?? "—"} />
              <Meta label="Canonical order" value={selected.canonicalOrder ? String(selected.canonicalOrder) : "—"} />
            </div>

            {selected.tags?.length ? <div className="mt-5 flex flex-wrap gap-2">{selected.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{tag}</span>)}</div> : null}

            <div className="mt-8 border-t border-slate-200 pt-7">
              <h3 className="text-2xl font-black">Sources</h3>
              <div className="mt-4 space-y-3">
                {selected.sources?.length ? selected.sources.map((source, index) => <div key={`${source.citation}-${index}`} className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-700">{source.kind.replace("_", " ")}</p><p className="mt-1 font-bold">{source.citation}</p>{source.note && <p className="mt-2 text-sm text-slate-600">{source.note}</p>}</div>) : <Empty text="No source record has been attached yet." />}
              </div>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-7">
              <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Relationships</p><h3 className="mt-2 text-2xl font-black">Connected knowledge</h3></div><span className="text-sm text-slate-400">{connections.length}</span></div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {connections.length ? connections.map(({ node, edge, direction }) => <button key={edge.id ?? `${edge.from}-${edge.to}`} type="button" onClick={() => setSelectedId(node.id)} className="rounded-2xl border border-slate-200 p-5 text-left transition hover:border-indigo-300 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-3"><p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-700">{direction === "outgoing" ? edge.relationship : edge.reciprocalLabel ?? `linked by ${edge.relationship}`}</p><ConfidenceBadge confidence={edge.confidence ?? "inferred"} /></div>
                  <h4 className="mt-3 text-xl font-black">{node.label}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{edge.explanation}</p>
                  <div className="mt-4 flex items-center justify-between gap-3"><StatusBadge status={edge.status ?? "draft"} dark /><span className="text-xs text-slate-400">{edge.sources?.length ?? 0} source{edge.sources?.length === 1 ? "" : "s"}</span></div>
                  {edge.reviewNote && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">Review note: {edge.reviewNote}</p>}
                </button>) : <Empty text="No mapped relationships yet." />}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Graph validation</p>
          <h2 className="mt-2 text-2xl font-black">Integrity checks</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <ValidationCard label="Duplicate node IDs" count={validation.duplicateNodeIds.length} />
            <ValidationCard label="Orphaned edges" count={validation.orphanEdges.length} />
            <ValidationCard label="Approved edges without sources" count={validation.unsourcedApprovedEdges.length} />
          </div>
          <p className="mt-5 text-sm leading-6 text-indigo-100/60">Only approved, sourced relationships should eventually power learner-facing recommendations by default.</p>
        </div>
      </section>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[] }) {
  return <label className="text-sm font-semibold text-indigo-100">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function StatusBadge({ status, dark = false }: { status: ReviewStatus; dark?: boolean }) {
  const classes = status === "approved" ? "bg-emerald-100 text-emerald-800" : status === "reviewed" ? "bg-amber-100 text-amber-800" : dark ? "bg-slate-100 text-slate-600" : "bg-white/10 text-indigo-100";
  return <span className={`rounded-full px-3 py-1 text-xs font-black capitalize ${classes}`}>{status}</span>;
}

function ConfidenceBadge({ confidence }: { confidence: EdgeConfidence }) {
  const classes = confidence === "explicit" ? "bg-emerald-100 text-emerald-800" : confidence === "strong" ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${classes}`}>{confidence}</span>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-sm text-indigo-100/55">{label}</p></div>; }
function Meta({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 font-bold capitalize">{value}</p></div>; }
function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">{text}</div>; }
function ValidationCard({ label, count }: { label: string; count: number }) { return <div className={`rounded-2xl border p-5 ${count === 0 ? "border-emerald-300/30 bg-emerald-400/10" : "border-amber-300/30 bg-amber-400/10"}`}><p className="text-2xl font-black">{count}</p><p className="mt-1 text-sm text-indigo-100/65">{label}</p></div>; }
const inputClass = "mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-white outline-none focus:border-amber-300";
