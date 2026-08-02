"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Verse = {
  number: number;
  text: string;
  canonicalKey: string;
  reference: string;
};

type GraphNode = {
  id: string;
  reference_label: string;
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

type Connection = {
  edge: GraphEdge;
  node: GraphNode;
};

type VerseInsightPanelProps = {
  verse: Verse;
  book: string;
  chapter: number;
  translation?: "KJV" | "WEB";
  onClose: () => void;
};

export default function VerseInsightPanel({
  verse,
  book,
  chapter,
  translation = "KJV",
  onClose,
}: VerseInsightPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadConnections() {
      setLoading(true);
      setMessage("");

      const { data: node, error: nodeError } = await supabase
        .from("emmaus_scripture_nodes")
        .select("id, reference_label, text_content, summary")
        .ilike("book", book)
        .eq("chapter", chapter)
        .eq("verse_start", verse.number)
        .maybeSingle();

      if (cancelled) return;
      if (nodeError) {
        setMessage(nodeError.message);
        setLoading(false);
        return;
      }

      if (!node) {
        setMessage("This verse has not been added to the Scripture Graph yet.");
        setLoading(false);
        return;
      }

      const { data: edges, error: edgeError } = await supabase
        .from("emmaus_scripture_edges")
        .select("id, source_node_id, target_node_id, relationship_type, summary, discovery_question")
        .or(`source_node_id.eq.${node.id},target_node_id.eq.${node.id}`)
        .neq("status", "archived");

      if (cancelled) return;
      if (edgeError) {
        setMessage(edgeError.message);
        setLoading(false);
        return;
      }

      const graphEdges = (edges ?? []) as GraphEdge[];
      const relatedIds = graphEdges.map((edge) => edge.source_node_id === node.id ? edge.target_node_id : edge.source_node_id);

      if (!relatedIds.length) {
        setMessage("No Scripture connections have been published for this verse yet.");
        setLoading(false);
        return;
      }

      const { data: relatedNodes, error: relatedError } = await supabase
        .from("emmaus_scripture_nodes")
        .select("id, reference_label, text_content, summary")
        .in("id", relatedIds);

      if (cancelled) return;
      if (relatedError) {
        setMessage(relatedError.message);
        setLoading(false);
        return;
      }

      const nodesById = new Map(((relatedNodes ?? []) as GraphNode[]).map((item) => [item.id, item]));
      setConnections(graphEdges.flatMap((edge) => {
        const relatedId = edge.source_node_id === node.id ? edge.target_node_id : edge.source_node_id;
        const relatedNode = nodesById.get(relatedId);
        return relatedNode ? [{ edge, node: relatedNode }] : [];
      }));
      setLoading(false);
    }

    loadConnections();
    return () => {
      cancelled = true;
    };
  }, [book, chapter, supabase, verse.number]);

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-gray-950/35" role="dialog" aria-modal="true" aria-label={`${verse.reference} insights`}>
      <button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close verse insights" />
      <aside className="relative h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">Verse Insights</p>
            <h2 className="mt-1 text-3xl font-bold text-gray-950">{verse.reference}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700">Close</button>
        </div>

        <blockquote className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-lg leading-8 text-gray-800">
          {verse.text}
        </blockquote>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-gray-950">Scripture Connections</h3>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">{connections.length}</span>
          </div>

          {loading && <p className="mt-4 text-sm text-gray-500">Loading the Scripture Graph...</p>}
          {!loading && message && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-gray-700">{message}</div>}

          <div className="mt-4 space-y-4">
            {connections.map(({ edge, node }) => {
              const target = parseReference(node.reference_label);
              const targetHref = target
                ? `/emmaus/admin/import?book=${encodeURIComponent(target.book)}&chapter=${target.chapter}&translation=${translation}`
                : null;

              return (
                <article key={edge.id} className="rounded-2xl border border-gray-200 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-800">{edge.relationship_type}</span>
                    <h4 className="font-bold text-gray-950">{node.reference_label}</h4>
                  </div>
                  {node.text_content && <p className="mt-3 text-sm leading-6 text-gray-700">{node.text_content}</p>}
                  {(edge.summary || node.summary) && <p className="mt-3 text-sm leading-6 text-gray-600">{edge.summary || node.summary}</p>}
                  {edge.discovery_question && (
                    <div className="mt-4 rounded-xl bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Discovery question</p>
                      <p className="mt-1 text-sm leading-6 text-gray-700">{edge.discovery_question}</p>
                    </div>
                  )}
                  {targetHref && (
                    <Link href={targetHref} className="mt-4 inline-flex rounded-full border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700">
                      Open connected passage →
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 p-4"><p className="font-semibold text-gray-950">Original Language</p><p className="mt-1 text-sm text-gray-500">Lexical data will connect here in a future build.</p></div>
          <div className="rounded-2xl border border-gray-200 p-4"><p className="font-semibold text-gray-950">Personal Notes</p><p className="mt-1 text-sm text-gray-500">Private verse notes will connect here in a future build.</p></div>
        </section>
      </aside>
    </div>
  );
}

function parseReference(reference: string): { book: string; chapter: number } | null {
  const match = reference.trim().match(/^(.+?)\s+(\d+)(?::\d+(?:[-–]\d+)?)?$/);
  if (!match) return null;
  const chapter = Number(match[2]);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 150) return null;
  return { book: match[1].trim(), chapter };
}
