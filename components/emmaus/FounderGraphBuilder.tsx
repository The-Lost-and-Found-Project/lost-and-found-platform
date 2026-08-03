"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NodeRow = {
  id: string;
  node_key: string;
  node_type: string;
  title: string;
  subtitle: string | null;
  scripture_reference: string | null;
  summary: string | null;
  status: "draft" | "reviewed" | "published" | "archived";
  metadata: Record<string, unknown> | null;
};

type EdgeRow = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_key: string;
  explanation: string | null;
  confidence_score: number;
  confidence_class: string;
  evidence_summary: string | null;
  interpretive_notes: string | null;
  status: "draft" | "reviewed" | "published" | "archived";
};

type Relationship = { key: string; label: string };
type Position = { x: number; y: number };

const NODE_WIDTH = 220;
const NODE_HEIGHT = 116;
const nodeTypes = ["verse", "passage", "book", "person", "place", "event", "theme", "doctrine", "attribute", "language_term", "command", "promise", "question", "discipline", "life_topic", "discovery", "rabbit_trail"];

export default function FounderGraphBuilder() {
  const supabase = useMemo(() => createClient(), []);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<NodeRow[]>([]);
  const [edges, setEdges] = useState<EdgeRow[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [nodeDraft, setNodeDraft] = useState({ node_key: "", node_type: "theme", title: "", subtitle: "", scripture_reference: "", summary: "", status: "draft" as NodeRow["status"] });
  const [edgeDraft, setEdgeDraft] = useState({ relationship_key: "develops_theme", explanation: "", evidence_summary: "", interpretive_notes: "", confidence_score: 70, status: "draft" as EdgeRow["status"] });

  useEffect(() => { void loadGraph(); }, []);

  async function loadGraph() {
    const [{ data: nodeRows }, { data: edgeRows }, { data: relationRows }] = await Promise.all([
      supabase.from("emmaus_graph_nodes").select("id,node_key,node_type,title,subtitle,scripture_reference,summary,status,metadata").neq("status", "archived").order("title"),
      supabase.from("emmaus_graph_edges").select("id,source_node_id,target_node_id,relationship_key,explanation,confidence_score,confidence_class,evidence_summary,interpretive_notes,status").neq("status", "archived"),
      supabase.from("emmaus_relationship_types").select("key,label").order("sort_order"),
    ]);
    const loadedNodes = (nodeRows ?? []) as NodeRow[];
    setNodes(loadedNodes);
    setEdges((edgeRows ?? []) as EdgeRow[]);
    setRelationships((relationRows ?? []) as Relationship[]);
    setPositions(Object.fromEntries(loadedNodes.map((node, index) => {
      const metadata = node.metadata ?? {};
      const x = typeof metadata.canvas_x === "number" ? metadata.canvas_x : 60 + (index % 4) * 270;
      const y = typeof metadata.canvas_y === "number" ? metadata.canvas_y : 60 + Math.floor(index / 4) * 170;
      return [node.id, { x, y }];
    })));
  }

  function beginDrag(event: React.PointerEvent, nodeId: string) {
    const position = positions[nodeId] ?? { x: 0, y: 0 };
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragging({ id: nodeId, dx: event.clientX - rect.left - position.x, dy: event.clientY - rect.top - position.y });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: React.PointerEvent) {
    if (!dragging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPositions((current) => ({
      ...current,
      [dragging.id]: {
        x: Math.max(10, event.clientX - rect.left - dragging.dx),
        y: Math.max(10, event.clientY - rect.top - dragging.dy),
      },
    }));
  }

  async function endDrag() {
    if (!dragging) return;
    const node = nodes.find((item) => item.id === dragging.id);
    const position = positions[dragging.id];
    setDragging(null);
    if (!node || !position) return;
    await supabase.from("emmaus_graph_nodes").update({ metadata: { ...(node.metadata ?? {}), canvas_x: position.x, canvas_y: position.y } }).eq("id", node.id);
  }

  async function createNode() {
    if (!nodeDraft.node_key.trim() || !nodeDraft.title.trim()) return setMessage("Node key and title are required.");
    setSaving(true);
    const { data, error } = await supabase.from("emmaus_graph_nodes").insert({
      ...nodeDraft,
      node_key: nodeDraft.node_key.trim().toLowerCase().replace(/[^a-z0-9:-]+/g, "-"),
      subtitle: nodeDraft.subtitle || null,
      scripture_reference: nodeDraft.scripture_reference || null,
      summary: nodeDraft.summary || null,
      metadata: { canvas_x: 80, canvas_y: 80 },
    }).select("id,node_key,node_type,title,subtitle,scripture_reference,summary,status,metadata").single();
    setSaving(false);
    if (error) return setMessage(error.message);
    setNodes((current) => [...current, data as NodeRow]);
    setPositions((current) => ({ ...current, [data.id]: { x: 80, y: 80 } }));
    setNodeDraft({ node_key: "", node_type: "theme", title: "", subtitle: "", scripture_reference: "", summary: "", status: "draft" });
    setMessage("Node created.");
  }

  function selectNode(nodeId: string) {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    if (connectSource && connectSource !== nodeId) void createEdge(connectSource, nodeId);
  }

  async function createEdge(sourceId: string, targetId: string) {
    setSaving(true);
    const { data, error } = await supabase.from("emmaus_graph_edges").insert({
      source_node_id: sourceId,
      target_node_id: targetId,
      relationship_key: edgeDraft.relationship_key,
      explanation: edgeDraft.explanation || null,
      evidence_summary: edgeDraft.evidence_summary || null,
      interpretive_notes: edgeDraft.interpretive_notes || null,
      confidence_score: edgeDraft.confidence_score,
      confidence_class: confidenceClass(edgeDraft.confidence_score),
      status: edgeDraft.status,
    }).select("id,source_node_id,target_node_id,relationship_key,explanation,confidence_score,confidence_class,evidence_summary,interpretive_notes,status").single();
    setSaving(false);
    setConnectSource(null);
    if (error) return setMessage(error.message);
    setEdges((current) => [...current, data as EdgeRow]);
    setSelectedEdgeId(data.id);
    setMessage("Relationship created.");
  }

  async function updateSelectedNode(patch: Partial<NodeRow>) {
    if (!selectedNodeId) return;
    const { error } = await supabase.from("emmaus_graph_nodes").update(patch).eq("id", selectedNodeId);
    if (error) return setMessage(error.message);
    setNodes((current) => current.map((node) => node.id === selectedNodeId ? { ...node, ...patch } : node));
    setMessage("Node updated.");
  }

  async function updateSelectedEdge(patch: Partial<EdgeRow>) {
    if (!selectedEdgeId) return;
    const next = patch.confidence_score === undefined ? patch : { ...patch, confidence_class: confidenceClass(patch.confidence_score) };
    const { error } = await supabase.from("emmaus_graph_edges").update(next).eq("id", selectedEdgeId);
    if (error) return setMessage(error.message);
    setEdges((current) => current.map((edge) => edge.id === selectedEdgeId ? { ...edge, ...next } : edge));
    setMessage("Relationship updated.");
  }

  async function deleteSelected() {
    if (selectedEdgeId) {
      const { error } = await supabase.from("emmaus_graph_edges").delete().eq("id", selectedEdgeId);
      if (error) return setMessage(error.message);
      setEdges((current) => current.filter((edge) => edge.id !== selectedEdgeId));
      setSelectedEdgeId(null);
      return setMessage("Relationship deleted.");
    }
    if (selectedNodeId) {
      const { error } = await supabase.from("emmaus_graph_nodes").delete().eq("id", selectedNodeId);
      if (error) return setMessage(error.message);
      setNodes((current) => current.filter((node) => node.id !== selectedNodeId));
      setEdges((current) => current.filter((edge) => edge.source_node_id !== selectedNodeId && edge.target_node_id !== selectedNodeId));
      setSelectedNodeId(null);
      setMessage("Node deleted.");
    }
  }

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId) ?? null;
  const canvasHeight = Math.max(760, ...Object.values(positions).map((position) => position.y + NODE_HEIGHT + 80));

  return (
    <div className="grid gap-5 xl:grid-cols-[280px_1fr_340px]">
      <aside className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl">
        <div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Node Palette</p><h2 className="mt-2 text-2xl font-black text-slate-950">Add to the graph</h2></div>
        <Field label="Node key"><input className={inputClass} value={nodeDraft.node_key} onChange={(e) => setNodeDraft({ ...nodeDraft, node_key: e.target.value })} placeholder="theme-light" /></Field>
        <Field label="Type"><select className={inputClass} value={nodeDraft.node_type} onChange={(e) => setNodeDraft({ ...nodeDraft, node_type: e.target.value })}>{nodeTypes.map((type) => <option key={type}>{type}</option>)}</select></Field>
        <Field label="Title"><input className={inputClass} value={nodeDraft.title} onChange={(e) => setNodeDraft({ ...nodeDraft, title: e.target.value })} /></Field>
        <Field label="Scripture reference"><input className={inputClass} value={nodeDraft.scripture_reference} onChange={(e) => setNodeDraft({ ...nodeDraft, scripture_reference: e.target.value })} /></Field>
        <Field label="Summary"><textarea className={inputClass} rows={3} value={nodeDraft.summary} onChange={(e) => setNodeDraft({ ...nodeDraft, summary: e.target.value })} /></Field>
        <button type="button" disabled={saving} onClick={() => void createNode()} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-black text-white">Create node</button>

        <div className="border-t border-slate-200 pt-5"><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Connection defaults</p></div>
        <Field label="Relationship"><select className={inputClass} value={edgeDraft.relationship_key} onChange={(e) => setEdgeDraft({ ...edgeDraft, relationship_key: e.target.value })}>{relationships.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></Field>
        <Field label="Confidence"><input className={inputClass} type="number" min={0} max={100} value={edgeDraft.confidence_score} onChange={(e) => setEdgeDraft({ ...edgeDraft, confidence_score: Number(e.target.value) })} /></Field>
        <Field label="Explanation"><textarea className={inputClass} rows={3} value={edgeDraft.explanation} onChange={(e) => setEdgeDraft({ ...edgeDraft, explanation: e.target.value })} /></Field>
      </aside>

      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Visual Graph Builder</p><p className="mt-1 text-sm text-indigo-100/70">Drag nodes. Select one, choose Connect, then select a target.</p></div>
          <div className="flex gap-2"><button type="button" disabled={!selectedNodeId} onClick={() => setConnectSource(selectedNodeId)} className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-40">{connectSource ? "Select target…" : "Connect selected"}</button><button type="button" onClick={() => void loadGraph()} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black">Refresh</button></div>
        </div>
        <div ref={canvasRef} onPointerMove={drag} onPointerUp={() => void endDrag()} className="relative overflow-auto bg-[radial-gradient(circle,#cbd5e1_1px,transparent_1px)] [background-size:24px_24px]" style={{ height: canvasHeight }}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            {edges.map((edge) => {
              const source = positions[edge.source_node_id];
              const target = positions[edge.target_node_id];
              if (!source || !target) return null;
              const x1 = source.x + NODE_WIDTH / 2; const y1 = source.y + NODE_HEIGHT / 2;
              const x2 = target.x + NODE_WIDTH / 2; const y2 = target.y + NODE_HEIGHT / 2;
              return <g key={edge.id} className="pointer-events-auto cursor-pointer" onClick={() => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={selectedEdgeId === edge.id ? "#4f46e5" : "#94a3b8"} strokeWidth={selectedEdgeId === edge.id ? 4 : 2} /><circle cx={(x1+x2)/2} cy={(y1+y2)/2} r="12" fill="white" stroke="#94a3b8" /><text x={(x1+x2)/2} y={(y1+y2)/2+4} textAnchor="middle" fontSize="10" fontWeight="700">{edge.confidence_score}</text></g>;
            })}
          </svg>
          {nodes.map((node) => {
            const position = positions[node.id] ?? { x: 0, y: 0 };
            return <button key={node.id} type="button" onPointerDown={(event) => beginDrag(event, node.id)} onClick={() => selectNode(node.id)} className={`absolute rounded-2xl border bg-white p-4 text-left shadow-lg transition ${selectedNodeId === node.id ? "border-indigo-500 ring-4 ring-indigo-100" : connectSource === node.id ? "border-amber-400 ring-4 ring-amber-100" : "border-slate-200"}`} style={{ left: position.x, top: position.y, width: NODE_WIDTH, minHeight: NODE_HEIGHT }}><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase text-indigo-700">{node.node_type.replace("_", " ")}</span><span className="text-[10px] font-black uppercase text-slate-400">{node.status}</span></div><h3 className="mt-3 font-black text-slate-950">{node.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{node.scripture_reference || node.subtitle || node.summary || node.node_key}</p></button>;
          })}
        </div>
      </section>

      <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Inspector</p>
        {selectedNode && <div className="mt-5 space-y-4"><h2 className="text-2xl font-black text-slate-950">Edit node</h2><Field label="Title"><input className={inputClass} value={selectedNode.title} onChange={(e) => setNodes((current) => current.map((node) => node.id === selectedNode.id ? { ...node, title: e.target.value } : node))} onBlur={() => void updateSelectedNode({ title: selectedNode.title })} /></Field><Field label="Summary"><textarea className={inputClass} rows={5} value={selectedNode.summary ?? ""} onChange={(e) => setNodes((current) => current.map((node) => node.id === selectedNode.id ? { ...node, summary: e.target.value } : node))} onBlur={() => void updateSelectedNode({ summary: selectedNode.summary })} /></Field><Field label="Status"><select className={inputClass} value={selectedNode.status} onChange={(e) => void updateSelectedNode({ status: e.target.value as NodeRow["status"] })}><option value="draft">Draft</option><option value="reviewed">Reviewed</option><option value="published">Published</option><option value="archived">Archived</option></select></Field></div>}
        {selectedEdge && <div className="mt-5 space-y-4"><h2 className="text-2xl font-black text-slate-950">Edit relationship</h2><Field label="Relationship"><select className={inputClass} value={selectedEdge.relationship_key} onChange={(e) => void updateSelectedEdge({ relationship_key: e.target.value })}>{relationships.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></Field><Field label="Confidence"><input className={inputClass} type="number" min={0} max={100} value={selectedEdge.confidence_score} onChange={(e) => void updateSelectedEdge({ confidence_score: Number(e.target.value) })} /></Field><Field label="Explanation"><textarea className={inputClass} rows={4} value={selectedEdge.explanation ?? ""} onChange={(e) => setEdges((current) => current.map((edge) => edge.id === selectedEdge.id ? { ...edge, explanation: e.target.value } : edge))} onBlur={() => void updateSelectedEdge({ explanation: selectedEdge.explanation })} /></Field><Field label="Evidence summary"><textarea className={inputClass} rows={4} value={selectedEdge.evidence_summary ?? ""} onChange={(e) => setEdges((current) => current.map((edge) => edge.id === selectedEdge.id ? { ...edge, evidence_summary: e.target.value } : edge))} onBlur={() => void updateSelectedEdge({ evidence_summary: selectedEdge.evidence_summary })} /></Field><Field label="Status"><select className={inputClass} value={selectedEdge.status} onChange={(e) => void updateSelectedEdge({ status: e.target.value as EdgeRow["status"] })}><option value="draft">Draft</option><option value="reviewed">Reviewed</option><option value="published">Published</option><option value="archived">Archived</option></select></Field></div>}
        {!selectedNode && !selectedEdge && <p className="mt-5 leading-7 text-slate-500">Select a node or relationship to edit it. Published relationships immediately become available to the learner graph.</p>}
        {(selectedNode || selectedEdge) && <button type="button" onClick={() => void deleteSelected()} className="mt-6 w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 font-black text-rose-700">Delete selected</button>}
        <p className="mt-5 text-sm font-bold text-slate-500" aria-live="polite">{message}</p>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="text-sm font-black text-slate-700">{label}</span><div className="mt-2">{children}</div></label>; }
function confidenceClass(score: number) { return score >= 95 ? "explicit" : score >= 85 ? "strong" : score >= 65 ? "supported" : score >= 40 ? "tentative" : "disputed"; }
const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
