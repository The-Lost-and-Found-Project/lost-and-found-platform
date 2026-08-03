"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type GraphNode = {
  id: string;
  node_type: string;
  title: string;
  status: string;
  metadata: Record<string, unknown> | null;
};

type GraphEdge = {
  source_node_id: string;
  target_node_id: string;
  status: string;
};

type Position = { x: number; y: number };
type LayoutMode = "grid" | "hierarchical" | "radial";

const GRID = 24;

export default function FounderGraphLayoutTools() {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<LayoutMode>("hierarchical");
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
      supabase.from("emmaus_graph_edges").select("source_node_id,target_node_id,status").neq("status", "archived"),
    ]);

    if (nodeError || edgeError) {
      setMessage(nodeError?.message ?? edgeError?.message ?? "Unable to load the graph.");
      setWorking(false);
      return;
    }

    const nodes = (nodeRows ?? []) as GraphNode[];
    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges = ((edgeRows ?? []) as GraphEdge[]).filter(
      (edge) => nodeIds.has(edge.source_node_id) && nodeIds.has(edge.target_node_id),
    );

    if (!nodes.length) {
      setMessage("No graph nodes match the selected scope.");
      setWorking(false);
      return;
    }

    const positions =
      mode === "radial"
        ? createRadialLayout(nodes, spacing)
        : mode === "hierarchical"
          ? createHierarchicalLayout(nodes, edges, spacing)
          : createGridLayout(nodes, spacing);

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

    setMessage(`${capitalize(mode)} layout saved for ${nodes.length} nodes. Refresh the canvas to view it.`);
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
          <select value={mode} onChange={(event) => setMode(event.target.value as LayoutMode)} className={inputClass}>
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

function createGridLayout(nodes: GraphNode[], spacing: number): Record<string, Position> {
  const sorted = [...nodes].sort((a, b) => a.node_type.localeCompare(b.node_type) || a.title.localeCompare(b.title));
  const columns = Math.max(3, Math.ceil(Math.sqrt(sorted.length)));
  const xGap = 280 * spacing;
  const yGap = 170 * spacing;

  return Object.fromEntries(
    sorted.map((node, index) => [
      node.id,
      snap({ x: 72 + (index % columns) * xGap, y: 72 + Math.floor(index / columns) * yGap }),
    ]),
  );
}

function createHierarchicalLayout(nodes: GraphNode[], edges: GraphEdge[], spacing: number): Record<string, Position> {
  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, [] as string[]]));

  for (const edge of edges) {
    incoming.set(edge.target_node_id, (incoming.get(edge.target_node_id) ?? 0) + 1);
    outgoing.get(edge.source_node_id)?.push(edge.target_node_id);
  }

  const roots = nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0);
  const queue = (roots.length ? roots : nodes.slice(0, 1)).map((node) => ({ id: node.id, level: 0 }));
  const levels = new Map<string, number>();

  while (queue.length) {
    const current = queue.shift()!;
    if (levels.has(current.id) && (levels.get(current.id) ?? 0) <= current.level) continue;
    levels.set(current.id, current.level);
    for (const target of outgoing.get(current.id) ?? []) queue.push({ id: target, level: current.level + 1 });
  }

  for (const node of nodes) if (!levels.has(node.id)) levels.set(node.id, 0);

  const grouped = new Map<number, GraphNode[]>();
  for (const node of nodes) {
    const level = levels.get(node.id) ?? 0;
    grouped.set(level, [...(grouped.get(level) ?? []), node]);
  }

  const positions: Record<string, Position> = {};
  const xGap = 290 * spacing;
  const yGap = 190 * spacing;

  for (const [level, levelNodes] of [...grouped.entries()].sort(([a], [b]) => a - b)) {
    const sorted = [...levelNodes].sort((a, b) => a.title.localeCompare(b.title));
    const totalWidth = Math.max(0, (sorted.length - 1) * xGap);
    sorted.forEach((node, index) => {
      positions[node.id] = snap({ x: 100 + index * xGap - totalWidth / 2 + 600, y: 72 + level * yGap });
    });
  }

  return positions;
}

function createRadialLayout(nodes: GraphNode[], edges: GraphEdge[], spacing: number): Record<string, Position> {
  const degree = new Map(nodes.map((node) => [node.id, 0]));
  for (const edge of edges) {
    degree.set(edge.source_node_id, (degree.get(edge.source_node_id) ?? 0) + 1);
    degree.set(edge.target_node_id, (degree.get(edge.target_node_id) ?? 0) + 1);
  }

  const sorted = [...nodes].sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0));
  const center = sorted[0];
  const rest = sorted.slice(1);
  const positions: Record<string, Position> = { [center.id]: snap({ x: 650, y: 500 }) };

  let index = 0;
  let ring = 1;
  while (index < rest.length) {
    const count = Math.min(rest.length - index, Math.max(6, ring * 8));
    const radius = ring * 230 * spacing;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const node = rest[index + i];
      positions[node.id] = snap({ x: 650 + Math.cos(angle) * radius, y: 500 + Math.sin(angle) * radius });
    }
    index += count;
    ring += 1;
  }

  return positions;
}

function snap(position: Position): Position {
  return {
    x: Math.max(GRID, Math.round(position.x / GRID) * GRID),
    y: Math.max(GRID, Math.round(position.y / GRID) * GRID),
  };
}

function Description({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="font-black text-slate-950">{title}</p><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const inputClass = "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
