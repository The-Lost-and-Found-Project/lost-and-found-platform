"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NodeRow = {
  id: string;
  node_key: string;
  node_type: string;
  title: string;
  status: "draft" | "reviewed" | "published" | "archived";
  metadata: Record<string, unknown> | null;
};

type EdgeRow = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  status: "draft" | "reviewed" | "published" | "archived";
};

type Position = { x: number; y: number };

const colors: Record<string, string> = {
  verse: "#4f46e5",
  passage: "#6366f1",
  book: "#7c3aed",
  person: "#0284c7",
  place: "#0f766e",
  event: "#059669",
  theme: "#d97706",
  doctrine: "#c2410c",
  attribute: "#ca8a04",
  language_term: "#9333ea",
  discovery: "#db2777",
  rabbit_trail: "#e11d48",
};

export default function FounderGraphNavigator() {
  const supabase = useMemo(() => createClient(), []);
  const [nodes, setNodes] = useState<NodeRow[]>([]);
  const [edges, setEdges] = useState<EdgeRow[]>([]);
  const [filter, setFilter] = useState("active");
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    const [{ data: nodeRows }, { data: edgeRows }] = await Promise.all([
      supabase.from("emmaus_graph_nodes").select("id,node_key,node_type,title,status,metadata"),
      supabase.from("emmaus_graph_edges").select("id,source_node_id,target_node_id,status"),
    ]);
    setNodes((nodeRows ?? []) as NodeRow[]);
    setEdges((edgeRows ?? []) as EdgeRow[]);
    setLoading(false);
  }

  const visibleNodes = nodes.filter((node) => filter === "all" || (filter === "active" ? node.status !== "archived" : node.status === filter));
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = edges.filter((edge) => visibleIds.has(edge.source_node_id) && visibleIds.has(edge.target_node_id));
  const positions = Object.fromEntries(visibleNodes.map((node, index) => {
    const metadata = node.metadata ?? {};
    return [node.id, {
      x: typeof metadata.canvas_x === "number" ? metadata.canvas_x : 60 + (index % 5) * 260,
      y: typeof metadata.canvas_y === "number" ? metadata.canvas_y : 60 + Math.floor(index / 5) * 160,
    }];
  })) as Record<string, Position>;

  const width = Math.max(1000, ...Object.values(positions).map((p) => p.x + 240));
  const height = Math.max(600, ...Object.values(positions).map((p) => p.y + 140));
  const scale = Math.min(260 / width, 150 / height);
  const selectedNode = visibleNodes.find((node) => node.id === selected) ?? null;
  const orphanCount = visibleNodes.filter((node) => !visibleEdges.some((edge) => edge.source_node_id === node.id || edge.target_node_id === node.id)).length;
  const publishedCount = visibleNodes.filter((node) => node.status === "published").length;

  return (
    <section className="mb-6 grid gap-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl lg:grid-cols-[300px_1fr]">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Graph Navigator</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Minimap overview</h2>
          </div>
          <button type="button" onClick={() => void load()} className="rounded-full border border-slate-300 px-3 py-2 text-xs font-black text-slate-700">Refresh</button>
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-black text-slate-800">
          <option value="active">Active content</option>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="reviewed">Reviewed</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Metric value={visibleNodes.length} label="Nodes" />
          <Metric value={visibleEdges.length} label="Edges" />
          <Metric value={orphanCount} label="Orphans" />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-500">{publishedCount} of {visibleNodes.length} visible nodes are published. Select a point in the minimap to identify it before locating it in the main canvas.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <div className="relative h-[180px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
          {loading ? <p className="p-5 text-sm font-bold text-slate-300">Loading graph overview...</p> : (
            <svg viewBox={`0 0 ${Math.max(width * scale, 280)} ${Math.max(height * scale, 170)}`} className="h-full w-full">
              {visibleEdges.map((edge) => {
                const source = positions[edge.source_node_id];
                const target = positions[edge.target_node_id];
                if (!source || !target) return null;
                return <line key={edge.id} x1={source.x * scale} y1={source.y * scale} x2={target.x * scale} y2={target.y * scale} stroke="#475569" strokeWidth="1" />;
              })}
              {visibleNodes.map((node) => {
                const position = positions[node.id];
                return <circle key={node.id} cx={position.x * scale} cy={position.y * scale} r={selected === node.id ? 5 : 3} fill={colors[node.node_type] ?? "#94a3b8"} stroke={selected === node.id ? "#fbbf24" : "none"} strokeWidth="2" onClick={() => setSelected(node.id)} className="cursor-pointer" />;
              })}
            </svg>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          {selectedNode ? (
            <>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Selected node</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">{selectedNode.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{selectedNode.node_type.replace("_", " ")} · {selectedNode.status}</p>
              <p className="mt-3 break-all text-xs font-bold text-slate-400">{selectedNode.node_key}</p>
            </>
          ) : (
            <>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Graph health</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">{orphanCount === 0 ? "Every visible node is connected." : `${orphanCount} orphaned ${orphanCount === 1 ? "node" : "nodes"}`}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">Orphaned nodes are not currently connected by any visible relationship. They may need a relationship, review, or archival decision.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return <div className="rounded-xl bg-slate-100 p-3"><p className="text-xl font-black text-slate-950">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-500">{label}</p></div>;
}
