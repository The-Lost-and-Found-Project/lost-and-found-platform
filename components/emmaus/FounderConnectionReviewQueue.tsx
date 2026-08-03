"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NodeRef = {
  id: string;
  title: string;
  node_type: string;
  scripture_reference: string | null;
};

type EvidenceItem = {
  type: string;
  detail: string;
  weight: number;
};

type SuggestionRow = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_key: string;
  score: number;
  confidence_class: string;
  rationale: string;
  evidence: EvidenceItem[];
  status: "pending" | "approved" | "rejected" | "dismissed";
  created_at: string;
};

type Relationship = { key: string; label: string };

export default function FounderConnectionReviewQueue() {
  const supabase = useMemo(() => createClient(), []);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [nodes, setNodes] = useState<Record<string, NodeRef>>({});
  const [relationships, setRelationships] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("pending");
  const [minimumScore, setMinimumScore] = useState(0);
  const [relationshipFilter, setRelationshipFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const [{ data: suggestionRows, error }, { data: nodeRows }, { data: relationshipRows }] = await Promise.all([
      supabase
        .from("emmaus_connection_suggestions")
        .select("id,source_node_id,target_node_id,relationship_key,score,confidence_class,rationale,evidence,status,created_at")
        .order("score", { ascending: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("emmaus_graph_nodes")
        .select("id,title,node_type,scripture_reference"),
      supabase
        .from("emmaus_relationship_types")
        .select("key,label")
        .order("label"),
    ]);

    if (error) setMessage(error.message);
    const loadedSuggestions = (suggestionRows ?? []) as SuggestionRow[];
    setSuggestions(loadedSuggestions);
    setNodes(Object.fromEntries(((nodeRows ?? []) as NodeRef[]).map((node) => [node.id, node])));
    setRelationships(Object.fromEntries(((relationshipRows ?? []) as Relationship[]).map((relationship) => [relationship.key, relationship.label])));
    setSelectedId((current) => current ?? loadedSuggestions[0]?.id ?? null);
    setLoading(false);
  }

  async function approve(suggestion: SuggestionRow) {
    setWorkingId(suggestion.id);
    setMessage("Approving suggestion and creating a draft relationship...");
    const { error } = await supabase.rpc("approve_emmaus_connection_suggestion", {
      suggestion_id: suggestion.id,
    });
    setWorkingId(null);
    if (error) return setMessage(error.message);
    setSuggestions((current) => current.map((item) => item.id === suggestion.id ? { ...item, status: "approved" } : item));
    setMessage("Suggestion approved. A draft graph relationship was created for final editorial review.");
  }

  async function setStatus(suggestion: SuggestionRow, status: "rejected" | "dismissed" | "pending") {
    setWorkingId(suggestion.id);
    const { error } = await supabase
      .from("emmaus_connection_suggestions")
      .update({ status, reviewed_at: status === "pending" ? null : new Date().toISOString() })
      .eq("id", suggestion.id);
    setWorkingId(null);
    if (error) return setMessage(error.message);
    setSuggestions((current) => current.map((item) => item.id === suggestion.id ? { ...item, status } : item));
    setMessage(`Suggestion marked ${status}.`);
  }

  const filtered = suggestions.filter((suggestion) => {
    const statusMatches = statusFilter === "all" || suggestion.status === statusFilter;
    const scoreMatches = suggestion.score >= minimumScore;
    const relationshipMatches = relationshipFilter === "all" || suggestion.relationship_key === relationshipFilter;
    return statusMatches && scoreMatches && relationshipMatches;
  });

  const selected = suggestions.find((suggestion) => suggestion.id === selectedId) ?? filtered[0] ?? null;
  const pendingCount = suggestions.filter((suggestion) => suggestion.status === "pending").length;
  const approvedCount = suggestions.filter((suggestion) => suggestion.status === "approved").length;
  const highConfidenceCount = suggestions.filter((suggestion) => suggestion.status === "pending" && suggestion.score >= 85).length;

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Review Queue</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Connection suggestions</h2>
          </div>
          <button type="button" onClick={() => void load()} className="rounded-full border border-slate-300 px-3 py-2 text-xs font-black text-slate-700">Refresh</button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <Metric value={pendingCount} label="Pending" />
          <Metric value={highConfidenceCount} label="85+ Score" />
          <Metric value={approvedCount} label="Approved" />
        </div>

        <div className="mt-5 grid gap-3">
          <label className="block"><span className={labelClass}>Status</span><select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="dismissed">Dismissed</option><option value="all">All</option></select></label>
          <label className="block"><span className={labelClass}>Minimum score</span><select className={inputClass} value={minimumScore} onChange={(event) => setMinimumScore(Number(event.target.value))}><option value={0}>Any score</option><option value={40}>40+ Tentative</option><option value={65}>65+ Supported</option><option value={85}>85+ Strong</option><option value={95}>95+ Explicit</option></select></label>
          <label className="block"><span className={labelClass}>Relationship type</span><select className={inputClass} value={relationshipFilter} onChange={(event) => setRelationshipFilter(event.target.value)}><option value="all">All relationships</option>{Object.entries(relationships).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        </div>

        <div className="mt-5 max-h-[680px] space-y-3 overflow-auto pr-1">
          {loading && <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">Loading suggestions...</p>}
          {!loading && !filtered.length && <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">No suggestions match the current filters.</p>}
          {filtered.map((suggestion) => {
            const source = nodes[suggestion.source_node_id];
            const target = nodes[suggestion.target_node_id];
            const active = selected?.id === suggestion.id;
            return (
              <button key={suggestion.id} type="button" onClick={() => setSelectedId(suggestion.id)} className={`w-full rounded-2xl border p-4 text-left transition ${active ? "border-indigo-500 bg-indigo-50 ring-4 ring-indigo-100" : "border-slate-200 bg-white hover:border-indigo-300"}`}>
                <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black uppercase text-white">{suggestion.score}%</span><span className="text-[10px] font-black uppercase tracking-wide text-slate-400">{suggestion.status}</span></div>
                <p className="mt-3 font-black text-slate-950">{source?.title ?? "Unknown source"}</p>
                <p className="my-1 text-xs font-black text-indigo-600">→ {relationships[suggestion.relationship_key] ?? suggestion.relationship_key}</p>
                <p className="font-black text-slate-950">{target?.title ?? "Unknown target"}</p>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
        {!selected ? (
          <div className="flex min-h-[520px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">Select a suggestion to inspect its evidence.</div>
        ) : (
          <SuggestionInspector
            suggestion={selected}
            source={nodes[selected.source_node_id]}
            target={nodes[selected.target_node_id]}
            relationshipLabel={relationships[selected.relationship_key] ?? selected.relationship_key}
            working={workingId === selected.id}
            onApprove={() => void approve(selected)}
            onReject={() => void setStatus(selected, "rejected")}
            onDismiss={() => void setStatus(selected, "dismissed")}
            onRestore={() => void setStatus(selected, "pending")}
          />
        )}
        <p className="mt-5 min-h-6 text-sm font-bold text-slate-500" aria-live="polite">{message}</p>
      </section>
    </div>
  );
}

function SuggestionInspector({ suggestion, source, target, relationshipLabel, working, onApprove, onReject, onDismiss, onRestore }: { suggestion: SuggestionRow; source?: NodeRef; target?: NodeRef; relationshipLabel: string; working: boolean; onApprove: () => void; onReject: () => void; onDismiss: () => void; onRestore: () => void }) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Suggestion Evidence</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">{source?.title ?? "Unknown source"} → {target?.title ?? "Unknown target"}</h2>
          <p className="mt-2 text-sm font-black text-indigo-700">Suggested relationship: {relationshipLabel}</p>
        </div>
        <div className="rounded-2xl bg-slate-950 px-5 py-4 text-center text-white"><p className="text-3xl font-black">{suggestion.score}</p><p className="text-[10px] font-black uppercase tracking-widest text-slate-300">{suggestion.confidence_class}</p></div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <NodeCard label="Source" node={source} />
        <NodeCard label="Target" node={target} />
      </div>

      <div className="mt-6 rounded-3xl border border-indigo-100 bg-indigo-50 p-5">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Rationale</p>
        <p className="mt-3 leading-7 text-slate-700">{suggestion.rationale}</p>
      </div>

      <div className="mt-6">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Evidence breakdown</p>
        <div className="mt-3 space-y-3">
          {(suggestion.evidence ?? []).map((item, index) => (
            <div key={`${item.type}-${index}`} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div><p className="font-black text-slate-950">{item.type.replaceAll("_", " ")}</p><p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p></div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-indigo-700 shadow-sm">+{item.weight}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        {suggestion.status === "pending" ? <><button type="button" disabled={working} onClick={onApprove} className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50">Approve as draft relationship</button><button type="button" disabled={working} onClick={onReject} className="rounded-full border border-rose-300 bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 disabled:opacity-50">Reject</button><button type="button" disabled={working} onClick={onDismiss} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-700 disabled:opacity-50">Dismiss</button></> : <button type="button" disabled={working || suggestion.status === "approved"} onClick={onRestore} className="rounded-full border border-indigo-300 bg-indigo-50 px-5 py-3 text-sm font-black text-indigo-700 disabled:opacity-40">Return to pending</button>}
      </div>
    </div>
  );
}

function NodeCard({ label, node }: { label: string; node?: NodeRef }) { return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p><h3 className="mt-2 text-xl font-black text-slate-950">{node?.title ?? "Unknown node"}</h3><p className="mt-2 text-sm text-slate-600">{node?.node_type?.replaceAll("_", " ")}{node?.scripture_reference ? ` · ${node.scripture_reference}` : ""}</p></div>; }
function Metric({ value, label }: { value: number; label: string }) { return <div className="rounded-xl bg-slate-100 p-3"><p className="text-xl font-black text-slate-950">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p></div>; }
const labelClass = "text-sm font-black text-slate-700";
const inputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
