"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type GraphNode = {
  node_key: string;
  node_type: string;
  title: string;
  subtitle: string | null;
  scripture_reference: string | null;
  depth: number;
  via_relationship: string | null;
  parent_node_key: string | null;
};

type Connection = {
  id: string;
  source_key: string;
  source_type: string;
  source_title: string;
  target_key: string;
  target_type: string;
  target_title: string;
  relationship_key: string;
  relationship_label: string;
  explanation: string | null;
  confidence_score: number;
  confidence_class: "explicit" | "strong" | "supported" | "tentative" | "disputed";
  evidence_summary: string | null;
  interpretive_notes: string | null;
  source_count: number;
  weight: number;
};

type ScriptureGraphExplorerProps = {
  initialReference?: string;
  initialTranslation?: "KJV" | "WEB";
};

const typeIcons: Record<string, string> = {
  verse: "📖",
  passage: "📜",
  book: "📚",
  person: "👤",
  place: "📍",
  event: "✦",
  theme: "◈",
  doctrine: "◆",
  attribute: "☀",
  language_term: "Α",
  command: "!",
  promise: "✓",
  question: "?",
  discipline: "🧭",
  life_topic: "♡",
  discovery: "🔍",
  rabbit_trail: "↗",
};

export default function ScriptureGraphExplorer({ initialReference = "John 1:1" }: ScriptureGraphExplorerProps) {
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState(initialReference);
  const [center, setCenter] = useState<GraphNode | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selected, setSelected] = useState<Connection | null>(null);
  const [history, setHistory] = useState<GraphNode[]>([]);
  const [depth, setDepth] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function resolveNodeKey(value: string) {
    const cleaned = value.trim();
    if (!cleaned) return null;

    const { data: exact } = await supabase
      .from("emmaus_graph_nodes")
      .select("node_key")
      .eq("status", "published")
      .or(`node_key.eq.${cleaned},scripture_reference.ilike.${cleaned}`)
      .limit(1)
      .maybeSingle();

    if (exact?.node_key) return exact.node_key as string;

    const { data: fuzzy } = await supabase
      .from("emmaus_graph_nodes")
      .select("node_key")
      .eq("status", "published")
      .ilike("title", `%${cleaned}%`)
      .limit(1)
      .maybeSingle();

    return (fuzzy?.node_key as string | undefined) ?? null;
  }

  async function loadGraph(value: string, pushHistory = true) {
    setLoading(true);
    setSelected(null);
    setMessage("");

    const nodeKey = await resolveNodeKey(value);
    if (!nodeKey) {
      setCenter(null);
      setNodes([]);
      setConnections([]);
      setMessage("No published graph node matches that verse, theme, person, place, or concept yet.");
      setLoading(false);
      return;
    }

    const { data: neighborhood, error: neighborhoodError } = await supabase.rpc("get_emmaus_node_neighborhood", {
      p_node_key: nodeKey,
      p_depth: depth,
      p_limit: 80,
    });

    if (neighborhoodError || !neighborhood?.length) {
      setCenter(null);
      setNodes([]);
      setConnections([]);
      setMessage(neighborhoodError?.message ?? "This node has not been published to the graph yet.");
      setLoading(false);
      return;
    }

    const graphNodes = neighborhood as GraphNode[];
    const nextCenter = graphNodes.find((node) => node.depth === 0) ?? graphNodes[0];

    if (pushHistory && center && center.node_key !== nextCenter.node_key) {
      setHistory((current) => [...current.slice(-9), center]);
    }

    const nodeKeys = graphNodes.map((node) => node.node_key);
    const { data: edgeRows, error: edgeError } = await supabase
      .from("emmaus_published_connections")
      .select("id, source_key, source_type, source_title, target_key, target_type, target_title, relationship_key, relationship_label, explanation, confidence_score, confidence_class, evidence_summary, interpretive_notes, source_count, weight")
      .or(`source_key.in.(${nodeKeys.join(",")}),target_key.in.(${nodeKeys.join(",")})`);

    setCenter(nextCenter);
    setNodes(graphNodes);
    setConnections(edgeError ? [] : ((edgeRows ?? []) as Connection[]));
    setQuery(nextCenter.scripture_reference || nextCenter.title);
    if (edgeError) setMessage(edgeError.message);
    setLoading(false);
  }

  useEffect(() => {
    void loadGraph(initialReference, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function recenter(node: GraphNode) {
    void loadGraph(node.node_key);
  }

  function goBack() {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((current) => current.slice(0, -1));
    void loadGraph(previous.node_key, false);
  }

  const visibleNodes = nodes.filter((node) => node.depth > 0).slice(0, 18);
  const grouped = visibleNodes.reduce<Record<number, GraphNode[]>>((acc, node) => {
    (acc[node.depth] ??= []).push(node);
    return acc;
  }, {});

  const centerHref = center?.scripture_reference
    ? `/emmaus/admin/bible?reference=${encodeURIComponent(center.scripture_reference)}`
    : "/emmaus/admin/bible";

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Emmaus Knowledge Graph</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Explore the living connections of Scripture.</h1>
            <p className="mt-4 text-lg leading-8 text-indigo-100/70">Search by verse, theme, person, place, doctrine, or original-language term. Select any node to recenter the map.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={goBack} disabled={!history.length} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black disabled:opacity-40">← Back</button>
            <Link href={centerHref} className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">Open Scripture</Link>
          </div>
        </div>
      </header>

      <section className="grid gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl md:grid-cols-[1fr_160px_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") void loadGraph(query); }}
          placeholder="John 1:1, Light, Logos, Temple..."
          className={inputClass}
        />
        <select value={depth} onChange={(event) => setDepth(Number(event.target.value))} className={inputClass}>
          <option value={1}>1 layer</option>
          <option value={2}>2 layers</option>
          <option value={3}>3 layers</option>
        </select>
        <button type="button" onClick={() => void loadGraph(query)} className="rounded-xl bg-indigo-600 px-6 py-3 font-black text-white shadow-lg">Explore</button>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-h-[640px] overflow-x-auto rounded-[2rem] border border-indigo-100 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12),transparent_34rem),linear-gradient(to_bottom_right,#f8fafc,#ffffff,#fffbeb)] p-6 shadow-xl sm:p-10">
          {loading && <div className="flex min-h-[560px] items-center justify-center"><p className="font-black text-slate-500">Building the graph...</p></div>}
          {!loading && !center && <div className="flex min-h-[560px] items-center justify-center"><div className="max-w-lg rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">{message}</div></div>}
          {!loading && center && (
            <div className="min-w-[760px]">
              <div className="mx-auto w-80 rounded-[2rem] border-2 border-indigo-500 bg-slate-950 p-6 text-center text-white shadow-2xl">
                <span className="text-3xl" aria-hidden="true">{typeIcons[center.node_type] ?? "✦"}</span>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-amber-300">{center.node_type.replace("_", " ")}</p>
                <h2 className="mt-2 text-2xl font-black">{center.title}</h2>
                {center.subtitle && <p className="mt-2 text-sm leading-6 text-indigo-100/65">{center.subtitle}</p>}
                {center.scripture_reference && <p className="mt-3 text-sm font-black text-indigo-200">{center.scripture_reference}</p>}
              </div>

              {Object.entries(grouped).map(([layer, layerNodes]) => (
                <div key={layer}>
                  <div className="mx-auto h-12 w-px bg-indigo-300" />
                  <p className="mx-auto mb-4 w-fit rounded-full bg-indigo-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Layer {layer}</p>
                  <div className="grid grid-cols-3 gap-5">
                    {layerNodes.map((node) => {
                      const edge = connections.find((item) =>
                        (item.source_key === node.node_key && item.target_key === node.parent_node_key) ||
                        (item.target_key === node.node_key && item.source_key === node.parent_node_key)
                      );
                      return (
                        <button key={`${node.node_key}-${node.depth}`} type="button" onClick={() => recenter(node)} className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-lg transition hover:-translate-y-1 hover:border-indigo-400 hover:shadow-2xl">
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-2xl" aria-hidden="true">{typeIcons[node.node_type] ?? "✦"}</span>
                            {edge && <ConfidenceBadge value={edge.confidence_class} score={edge.confidence_score} />}
                          </div>
                          <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{node.node_type.replace("_", " ")}</p>
                          <h3 className="mt-2 text-lg font-black text-slate-950">{node.title}</h3>
                          {node.subtitle && <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{node.subtitle}</p>}
                          {edge && <p className="mt-4 text-xs font-black text-amber-700">{edge.relationship_label}</p>}
                          <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-slate-400 group-hover:text-indigo-600">Recenter map →</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {!visibleNodes.length && <div className="mx-auto mt-10 max-w-xl rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">This node is published, but no published relationships have been connected yet.</div>}
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Connection Inspector</p>
            {selected ? (
              <div className="mt-5">
                <ConfidenceBadge value={selected.confidence_class} score={selected.confidence_score} large />
                <h2 className="mt-4 text-2xl font-black text-slate-950">{selected.source_title} → {selected.target_title}</h2>
                <p className="mt-2 text-sm font-black text-indigo-700">{selected.relationship_label}</p>
                <p className="mt-4 leading-7 text-slate-600">{selected.explanation || "No explanation has been published for this connection yet."}</p>
                {selected.evidence_summary && <Detail label="Evidence" text={selected.evidence_summary} />}
                {selected.interpretive_notes && <Detail label="Interpretive note" text={selected.interpretive_notes} />}
                <p className="mt-5 text-xs font-bold text-slate-400">{selected.source_count} evidence {selected.source_count === 1 ? "item" : "items"}</p>
              </div>
            ) : (
              <p className="mt-4 leading-7 text-slate-600">Select a published connection below to inspect its confidence, evidence summary, and interpretive notes.</p>
            )}
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Visible Connections</p>
            <div className="mt-4 max-h-[430px] space-y-3 overflow-y-auto pr-1">
              {connections.map((connection) => (
                <button key={connection.id} type="button" onClick={() => setSelected(connection)} className={`w-full rounded-2xl border p-4 text-left transition ${selected?.id === connection.id ? "border-indigo-400 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:border-indigo-300"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-black text-slate-950">{connection.source_title} ↔ {connection.target_title}</p>
                    <ConfidenceBadge value={connection.confidence_class} score={connection.confidence_score} />
                  </div>
                  <p className="mt-2 text-xs font-black text-indigo-700">{connection.relationship_label}</p>
                </button>
              ))}
              {!connections.length && <p className="text-sm leading-6 text-slate-500">No published connection records are available for this neighborhood yet.</p>}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}

function ConfidenceBadge({ value, score, large = false }: { value: Connection["confidence_class"]; score: number; large?: boolean }) {
  const classes = {
    explicit: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    strong: "bg-blue-100 text-blue-800 ring-blue-200",
    supported: "bg-indigo-100 text-indigo-800 ring-indigo-200",
    tentative: "bg-amber-100 text-amber-800 ring-amber-200",
    disputed: "bg-rose-100 text-rose-800 ring-rose-200",
  }[value];
  return <span className={`inline-flex items-center rounded-full font-black capitalize ring-1 ${classes} ${large ? "px-4 py-2 text-sm" : "px-2.5 py-1 text-[11px]"}`}>{value} · {score}%</span>;
}

function Detail({ label, text }: { label: string; text: string }) {
  return <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-2 text-sm leading-6 text-slate-700">{text}</p></div>;
}

const inputClass = "w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
