"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createGraphLayout,
  getOrphanNodeIds,
  type GraphLayoutMode,
  type GraphLayoutNode,
  type GraphLayoutEdge,
} from "@/lib/emmaus/graph-layout";

type GraphNodeRow = GraphLayoutNode & {
  status: string;
  metadata: Record<string, unknown> | null;
};

type GraphEdgeRow = GraphLayoutEdge & {
  status: string;
};

export default function FounderGraphLayoutTools() {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<GraphLayoutMode>("hierarchical");
  const [scope, setScope] = useState<"active" | "published" | "all">("active");
  const [spacing, setSpacing] = useState(1);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  async function applyLayout() {
    setWorking(true);
    setMessage("Loading graph...");

    let nodeQuery = supabase
      .from("emmaus_graph_nodes")
      .select("id,node_type,title,status,metadata")
      .order("title");

    if (scope === "active") nodeQuery = nodeQuery.neq("status", "archived");
    if (scope === "published") nodeQuery = nodeQuery.eq("status", "published");

    const [{ data: nodeRows, error: nodeError }, { data: edgeRows, error: edgeError }] = await Promise.all([
      nodeQuery,
      supabase
        .from("emmaus_graph_edges")
        .select("source_node_id,target_node_id,status")
        .neq("status", "archived"),
    ]);

    if (nodeError || edgeError) {
      setMessage(nodeError?.message ?? edgeError?.message ?? "Unable to load the graph.");
      setWorking(false);
      return;
    }

    const nodes = (nodeRows ?? []) as GraphNodeRow[];
    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges = ((edgeRows ?? []) as GraphEdgeRow[]).filter(
      (edge) => nodeIds.has(edge.source_node_id) && nodeIds.has(edge.target_node_id),
    );

    if (!nodes.length) {
      setMessage("No graph nodes match the selected scope.");
      setWorking(false);
      return;
    }

    const positions = createGraphLayout(mode, nodes, edges, {
      spacing,
      gridSize: 24,
      originX: 72,
      originY: 72,
    });

    const orphanCount = getOrphanNodeIds(nodes, edges).length;
    setMessage(`Saving ${mode} layout for ${nodes.length} nodes...`);

    const results = await Promise.all(
      nodes.map((node) => {
        const position = positions[node.id];
        return supabase
          .from("emmaus_graph_nodes")
          .update({
            metadata: {
              ...(node.metadata ?? {}),
              canvas_x: position.x,
              canvas_y: position.y,
              layout_mode: mode,
              layout_updated_at: new Date().toISOString(),
            },
          })
          .eq("id", node.id);
      }),
    );

    const failed = results.find((result) => result.error);
    if (failed?.error) {
      setMessage(failed.error.message);
      setWorking(false);
      return;
    }

    setMessage(
      `${capitalize(mode)} layout saved for ${nodes.length} nodes. ${orphanCount} orphaned ${orphanCount === 1 ? "node was" : "nodes were"} included. Refresh the canvas to view it.`,
    );
    setWorking(false);
  }

  return (
    <section className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Advanced Layout</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Arrange the graph intelligently.</h2>
          <p className="mt-2 leading-7 text-slate-600">
            Apply a structured layout across the selected graph scope. Existing relationships remain unchanged; only saved canvas positions are updated.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void applyLayout()}
          disabled={working}
          className="rounded-full bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg disabled:opacity-50"
        >
          {working ? "Applying layout..." : "Apply layout"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-black text-slate-700">Layout style</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as GraphLayoutMode)} className={inputClass}>
            <option value="hierarchical">Hierarchical</option>
            <option value="radial">Radial</option>
            <option value="grid">Grid</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-black text-slate-700">Content scope</span>
          <select value={scope} onChange={(event) => setScope(event.target.value as typeof scope)} className={inputClass}>
            <option value="active">Active content</option>
            <option value="published">Published only</option>
            <option value="all">All content</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-black text-slate-700">Spacing</span>
          <select value={spacing} onChange={(event) => setSpacing(Number(event.target.value))} className={inputClass}>
            <option value={0.8}>Compact</option>
            <option value={1}>Standard</option>
            <option value={1.3}>Comfortable</option>
            <option value={1.6}>Expanded</option>
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Description title="Hierarchical" text="Places root concepts first and organizes connected nodes into successive levels." />
        <Description title="Radial" text="Places highly connected nodes near the center and distributes the rest around them." />
        <Description title="Grid" text="Creates a clean, predictable arrangement ordered by node type and title." />
      </div>

      <p className="mt-5 min-h-6 text-sm font-bold text-slate-500" aria-live="polite">{message}</p>
    </section>
  );
}

function Description({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-black text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const inputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
