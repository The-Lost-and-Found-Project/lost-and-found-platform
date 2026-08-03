"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateConnectionSuggestions } from "@/lib/emmaus/connection-suggestions";
import { getOrphanNodeIds } from "@/lib/emmaus/graph-layout";

 type NodeRow = {
  id: string;
  node_type: string;
  title: string;
  subtitle: string | null;
  scripture_reference: string | null;
  summary: string | null;
  status: string;
};

type EdgeRow = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_key: string;
  confidence_score: number;
  status: string;
};

type SuggestionRow = {
  id: string;
  score: number;
  status: string;
};

type RelationshipRow = { key: string; label: string };

export default function FounderGraphIntelligenceDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [nodes, setNodes] = useState<NodeRow[]>([]);
  const [edges, setEdges] = useState<EdgeRow[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [relationships, setRelationships] = useState<RelationshipRow[]>([]);
  const [minimumScore, setMinimumScore] = useState(45);
  const [maximumSuggestions, setMaximumSuggestions] = useState(100);
  const [scope, setScope] = useState<"active" | "published" | "all">("active");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const [{ data: nodeRows }, { data: edgeRows }, { data: suggestionRows }, { data: relationshipRows }] = await Promise.all([
      supabase.from("emmaus_graph_nodes").select("id,node_type,title,subtitle,scripture_reference,summary,status").order("title"),
      supabase.from("emmaus_graph_edges").select("id,source_node_id,target_node_id,relationship_key,confidence_score,status"),
      supabase.from("emmaus_connection_suggestions").select("id,score,status"),
      supabase.from("emmaus_relationship_types").select("key,label").order("label"),
    ]);
    setNodes((nodeRows ?? []) as NodeRow[]);
    setEdges((edgeRows ?? []) as EdgeRow[]);
    setSuggestions((suggestionRows ?? []) as SuggestionRow[]);
    setRelationships((relationshipRows ?? []) as RelationshipRow[]);
    setLoading(false);
  }

  const scopedNodes = nodes.filter((node) => scope === "all" || (scope === "active" ? node.status !== "archived" : node.status === "published"));
  const scopedIds = new Set(scopedNodes.map((node) => node.id));
  const scopedEdges = edges.filter((edge) => scopedIds.has(edge.source_node_id) && scopedIds.has(edge.target_node_id) && edge.status !== "archived");
  const orphanIds = getOrphanNodeIds(scopedNodes, scopedEdges);
  const pendingSuggestions = suggestions.filter((suggestion) => suggestion.status === "pending");
  const strongPending = pendingSuggestions.filter((suggestion) => suggestion.score >= 85);
  const weakEdges = scopedEdges.filter((edge) => edge.confidence_score < 65);
  const publishedNodes = scopedNodes.filter((node) => node.status === "published").length;
  const publishedEdges = scopedEdges.filter((edge) => edge.status === "published").length;
  const graphPublication = scopedNodes.length + scopedEdges.length
    ? Math.round(((publishedNodes + publishedEdges) / (scopedNodes.length + scopedEdges.length)) * 100)
    : 0;

  const nodeTypeCoverage = Object.entries(
    scopedNodes.reduce<Record<string, number>>((counts, node) => {
      counts[node.node_type] = (counts[node.node_type] ?? 0) + 1;
      return counts;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  async function generateSuggestions() {
    setWorking(true);
    setMessage("Analyzing graph nodes and existing relationships...");

    const allowedRelationships = new Set(relationships.map((relationship) => relationship.key));
    const generated = generateConnectionSuggestions(scopedNodes, scopedEdges, {
      minimumScore,
      maximumSuggestions,
    });
    const valid = generated.filter((suggestion) => allowedRelationships.has(suggestion.relationship_key));

    if (!valid.length) {
      setWorking(false);
      setMessage("No new valid suggestions were found at the selected threshold.");
      return;
    }

    setMessage(`Saving ${valid.length} reviewable suggestions...`);
    const { error } = await supabase
      .from("emmaus_connection_suggestions")
      .upsert(valid, { onConflict: "source_node_id,target_node_id,relationship_key", ignoreDuplicates: true });

    setWorking(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`${valid.length} suggestions analyzed and added to the founder review queue where new.`);
    await load();
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Biblical Intelligence Layer</p>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">Measure, strengthen, and expand the graph.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-indigo-100/70">Analyze graph quality, identify structural gaps, and generate explainable connection suggestions for founder review.</p>
          </div>
          <button type="button" onClick={() => void load()} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black">Refresh metrics</button>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric value={scopedNodes.length} label="Nodes in scope" detail={`${publishedNodes} published`} />
          <Metric value={scopedEdges.length} label="Relationships" detail={`${weakEdges.length} below 65 confidence`} />
          <Metric value={orphanIds.length} label="Orphan nodes" detail="No visible relationships" />
          <Metric value={`${graphPublication}%`} label="Published graph" detail={`${pendingSuggestions.length} pending suggestions`} />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Suggestion Generator</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">Generate explainable connections</h3>
          <p className="mt-3 leading-7 text-slate-600">The deterministic engine compares Scripture references, shared terms, node types, and existing edges. Nothing is published automatically.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Field label="Content scope"><select className={inputClass} value={scope} onChange={(event) => setScope(event.target.value as typeof scope)}><option value="active">Active content</option><option value="published">Published only</option><option value="all">All content</option></select></Field>
            <Field label="Minimum score"><select className={inputClass} value={minimumScore} onChange={(event) => setMinimumScore(Number(event.target.value))}><option value={40}>40+ Tentative</option><option value={45}>45+ Recommended</option><option value={65}>65+ Supported</option><option value={85}>85+ Strong</option></select></Field>
            <Field label="Maximum results"><select className={inputClass} value={maximumSuggestions} onChange={(event) => setMaximumSuggestions(Number(event.target.value))}><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option><option value={250}>250</option></select></Field>
          </div>

          <button type="button" disabled={working || loading} onClick={() => void generateSuggestions()} className="mt-6 rounded-full bg-indigo-600 px-6 py-3 font-black text-white shadow-lg disabled:opacity-50">{working ? "Analyzing graph..." : "Generate connection suggestions"}</button>
          <p className="mt-4 min-h-6 text-sm font-bold text-slate-500" aria-live="polite">{message}</p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Editorial Queue</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">Review readiness</h3>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <SmallMetric value={pendingSuggestions.length} label="Pending" />
            <SmallMetric value={strongPending.length} label="Strong 85+" />
          </div>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-black text-amber-950">Founder approval remains required.</p>
            <p className="mt-2 text-sm leading-6 text-amber-900/70">Approved suggestions become draft relationships. They still require final editorial review before publication.</p>
          </div>
          <a href="/emmaus/admin/intelligence/review" className="mt-5 inline-flex rounded-full border border-indigo-300 bg-indigo-50 px-5 py-3 text-sm font-black text-indigo-700">Open review queue →</a>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Coverage</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">Node types represented</h3>
          <div className="mt-5 space-y-3">
            {nodeTypeCoverage.slice(0, 12).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="font-black text-slate-700">{type.replaceAll("_", " ")}</span><span className="rounded-full bg-white px-3 py-1 text-sm font-black text-indigo-700 shadow-sm">{count}</span></div>
            ))}
            {!nodeTypeCoverage.length && <p className="text-sm text-slate-500">No nodes in the selected scope.</p>}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Priority Issues</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">Graph health findings</h3>
          <div className="mt-5 space-y-3">
            <Finding severity={orphanIds.length ? "attention" : "good"} title={`${orphanIds.length} orphan ${orphanIds.length === 1 ? "node" : "nodes"}`} text="Nodes without relationships cannot contribute to discovery paths." />
            <Finding severity={weakEdges.length ? "attention" : "good"} title={`${weakEdges.length} weak-confidence ${weakEdges.length === 1 ? "relationship" : "relationships"}`} text="Relationships below 65 confidence should be strengthened with evidence or reconsidered." />
            <Finding severity={pendingSuggestions.length > 50 ? "attention" : "good"} title={`${pendingSuggestions.length} pending suggestions`} text="A growing queue may require a focused founder review session." />
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ value, label, detail }: { value: number | string; label: string; detail: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5"><p className="text-3xl font-black">{value}</p><p className="mt-1 font-black">{label}</p><p className="mt-1 text-xs text-indigo-100/50">{detail}</p></div>; }
function SmallMetric({ value, label }: { value: number; label: string }) { return <div className="rounded-2xl bg-slate-100 p-5 text-center"><p className="text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{label}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="text-sm font-black text-slate-700">{label}</span>{children}</label>; }
function Finding({ severity, title, text }: { severity: "attention" | "good"; title: string; text: string }) { return <div className={`rounded-2xl border p-4 ${severity === "attention" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}><p className={`font-black ${severity === "attention" ? "text-amber-950" : "text-emerald-950"}`}>{title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div>; }
const inputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
