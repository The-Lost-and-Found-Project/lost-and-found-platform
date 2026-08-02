"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Translation = "KJV" | "WEB";
type GraphNode = {
  id: string;
  reference_label: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  text_content: string;
  summary: string;
};
type GraphEdge = {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_type: string;
  summary: string;
  discovery_question: string;
};
type ConnectedNode = { node: GraphNode; edge: GraphEdge };

type ScriptureGraphExplorerProps = {
  initialReference?: string;
  initialTranslation?: Translation;
};

export default function ScriptureGraphExplorer({
  initialReference = "John 1:1",
  initialTranslation = "KJV",
}: ScriptureGraphExplorerProps) {
  const supabase = useMemo(() => createClient(), []);
  const [reference, setReference] = useState(initialReference);
  const [translation, setTranslation] = useState<Translation>(initialTranslation);
  const [center, setCenter] = useState<GraphNode | null>(null);
  const [connections, setConnections] = useState<ConnectedNode[]>([]);
  const [history, setHistory] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Enter a verse that already exists in the Scripture Graph.");

  async function loadByReference(nextReference: string, pushHistory = true) {
    const parsed = parseReference(nextReference);
    if (!parsed) {
      setMessage("Use a reference such as John 1:1.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data: node, error: nodeError } = await supabase
      .from("emmaus_scripture_nodes")
      .select("id, reference_label, book, chapter, verse_start, verse_end, text_content, summary")
      .ilike("book", parsed.book)
      .eq("chapter", parsed.chapter)
      .eq("verse_start", parsed.verse)
      .neq("status", "archived")
      .maybeSingle();

    if (nodeError || !node) {
      setCenter(null);
      setConnections([]);
      setMessage(nodeError?.message ?? "That verse is not in the Scripture Graph yet.");
      setLoading(false);
      return;
    }

    const graphNode = node as GraphNode;
    if (pushHistory && center && center.id !== graphNode.id) {
      setHistory((current) => [...current.slice(-9), center]);
    }

    const { data: edges, error: edgeError } = await supabase
      .from("emmaus_scripture_edges")
      .select("id, source_node_id, target_node_id, relationship_type, summary, discovery_question")
      .or(`source_node_id.eq.${graphNode.id},target_node_id.eq.${graphNode.id}`)
      .neq("status", "archived");

    if (edgeError) {
      setCenter(graphNode);
      setConnections([]);
      setMessage(edgeError.message);
      setLoading(false);
      return;
    }

    const graphEdges = (edges ?? []) as GraphEdge[];
    const relatedIds = graphEdges.map((edge) => edge.source_node_id === graphNode.id ? edge.target_node_id : edge.source_node_id);
    let connected: ConnectedNode[] = [];

    if (relatedIds.length) {
      const { data: relatedNodes, error: relatedError } = await supabase
        .from("emmaus_scripture_nodes")
        .select("id, reference_label, book, chapter, verse_start, verse_end, text_content, summary")
        .in("id", relatedIds)
        .neq("status", "archived");

      if (relatedError) {
        setCenter(graphNode);
        setConnections([]);
        setMessage(relatedError.message);
        setLoading(false);
        return;
      }

      const byId = new Map(((relatedNodes ?? []) as GraphNode[]).map((item) => [item.id, item]));
      connected = graphEdges.flatMap((edge) => {
        const id = edge.source_node_id === graphNode.id ? edge.target_node_id : edge.source_node_id;
        const related = byId.get(id);
        return related ? [{ node: related, edge }] : [];
      });
    }

    setCenter(graphNode);
    setConnections(connected);
    setReference(graphNode.reference_label);
    setMessage(connected.length ? "" : "No connections have been added for this verse yet.");
    setLoading(false);
  }

  useEffect(() => {
    loadByReference(initialReference, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goBack() {
    const previous = history[history.length - 1];
    if (!previous) return;
    setHistory((current) => current.slice(0, -1));
    loadByReference(previous.reference_label, false);
  }

  const readerHref = center
    ? `/emmaus/admin/bible?book=${encodeURIComponent(center.book)}&chapter=${center.chapter}&translation=${translation}&verse=${center.verse_start}`
    : "/emmaus/admin/bible";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">Emmaus Scripture Graph</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-950">Explore Connections</h1>
          <p className="mt-2 text-gray-600">Recenter the graph by choosing any connected passage.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={goBack} disabled={!history.length} className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-40">Back</button>
          <Link href={readerHref} className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white">Open in Bible</Link>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_auto]">
        <input value={reference} onChange={(event) => setReference(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") loadByReference(reference); }} placeholder="John 1:1" className={inputClass} />
        <select value={translation} onChange={(event) => setTranslation(event.target.value as Translation)} className={inputClass}><option value="KJV">KJV</option><option value="WEB">WEB</option></select>
        <button type="button" onClick={() => loadByReference(reference)} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white">Explore</button>
      </div>

      <section className="overflow-x-auto rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-amber-50 p-6 shadow-sm sm:p-10">
        {loading && <p className="text-center text-gray-500">Loading Scripture Graph...</p>}
        {!loading && !center && <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">{message}</div>}
        {!loading && center && (
          <div className="min-w-[760px]">
            <div className="mx-auto w-72 rounded-3xl border-2 border-indigo-500 bg-white p-6 text-center shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">Center verse</p>
              <h2 className="mt-2 text-2xl font-bold text-gray-950">{center.reference_label}</h2>
              {center.text_content && <p className="mt-3 text-sm leading-6 text-gray-700">{center.text_content}</p>}
            </div>

            <div className="mx-auto h-12 w-px bg-indigo-300" />
            <div className="mx-auto h-px w-[88%] bg-indigo-300" />

            <div className="grid grid-cols-3 gap-5">
              {connections.map(({ node, edge }) => (
                <div key={edge.id} className="relative pt-12">
                  <div className="absolute left-1/2 top-0 h-12 w-px bg-indigo-300" />
                  <button type="button" onClick={() => loadByReference(node.reference_label)} className="h-full w-full rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-400 hover:shadow-lg">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold capitalize text-amber-800">{edge.relationship_type}</span>
                    <h3 className="mt-3 text-lg font-bold text-gray-950">{node.reference_label}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">{edge.summary || node.summary || node.text_content || "Explore this connected passage."}</p>
                    {edge.discovery_question && <p className="mt-4 text-sm font-semibold text-indigo-700">{edge.discovery_question}</p>}
                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Recenter graph →</p>
                  </button>
                </div>
              ))}
              {!connections.length && <div className="col-span-3 mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">{message}</div>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function parseReference(value: string): { book: string; chapter: number; verse: number } | null {
  const match = value.trim().match(/^(.+?)\s+(\d+):(\d+)(?:[-–]\d+)?$/);
  if (!match) return null;
  const chapter = Number(match[2]);
  const verse = Number(match[3]);
  if (!Number.isInteger(chapter) || !Number.isInteger(verse) || chapter < 1 || verse < 1) return null;
  return { book: match[1].trim(), chapter, verse };
}

const inputClass = "w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
