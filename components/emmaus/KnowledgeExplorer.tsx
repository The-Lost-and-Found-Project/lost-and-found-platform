"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  getConnectedKnowledge,
  getKnowledgeNode,
  knowledgeNodes,
  searchKnowledge,
  type KnowledgeNode,
  type KnowledgeNodeType,
} from "@/lib/emmaus/knowledge-graph";

const typeLabels: Record<KnowledgeNodeType, string> = {
  verse: "Verse",
  passage: "Passage",
  chapter: "Chapter",
  concept: "Concept",
  doctrine: "Doctrine",
  person: "Person",
  place: "Place",
  event: "Event",
  theme: "Theme",
  covenant: "Covenant",
  prophecy: "Prophecy",
  book: "Book",
  word: "Word Study",
  trail: "Rabbit Trail",
};

const typeIcons: Record<KnowledgeNodeType, string> = {
  verse: "📖",
  passage: "📜",
  chapter: "📑",
  concept: "🧠",
  doctrine: "✦",
  person: "👤",
  place: "📍",
  event: "◆",
  theme: "🌱",
  covenant: "🤝",
  prophecy: "🕯️",
  book: "📚",
  word: "🔤",
  trail: "🧭",
};

export default function KnowledgeExplorer() {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<KnowledgeNodeType | "all">("all");
  const [selectedId, setSelectedId] = useState("verse-john-1-1");
  const selectedNode = getKnowledgeNode(selectedId) ?? knowledgeNodes[0];
  const connected = getConnectedKnowledge(selectedNode.id);

  const results = useMemo(() => {
    return searchKnowledge(query).filter((node) => activeType === "all" || node.type === activeType);
  }, [activeType, query]);

  function chooseNode(node: KnowledgeNode) {
    setSelectedId(node.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Emmaus Explore</p>
          <h1 className="mt-3 text-4xl font-black sm:text-6xl">Follow the connections.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-indigo-100/75">
            Begin with a verse, person, theme, or word study. Emmaus will show what Scripture connects to next.
          </p>
          <div className="mt-7 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search John 1, creation, light, Trinity, Logos..."
              className="w-full rounded-2xl border border-white/15 bg-black/20 px-5 py-4 text-white outline-none placeholder:text-indigo-100/40 focus:border-amber-300"
            />
            <Link href="/emmaus/walk" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-center font-semibold text-white">
              Return to Walk
            </Link>
          </div>
        </header>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {(["all", "verse", "person", "theme", "concept", "word", "trail"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${activeType === type ? "bg-amber-300 text-slate-950" : "border border-white/15 bg-white/[0.06] text-indigo-100"}`}
            >
              {type === "all" ? "All Connections" : typeLabels[type]}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-white p-5 text-slate-900 shadow-2xl sm:p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Starting points</p>
                <h2 className="mt-1 text-2xl font-black">Explore the graph</h2>
              </div>
              <span className="text-sm text-slate-400">{results.length}</span>
            </div>
            <div className="mt-5 max-h-[42rem] space-y-2 overflow-auto pr-1">
              {results.map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => chooseNode(node)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${selectedNode.id === node.id ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl" aria-hidden="true">{typeIcons[node.type]}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-700">{typeLabels[node.type]}</p>
                      <p className="mt-1 font-black text-slate-950">{node.label}</p>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{node.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="max-w-3xl">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-indigo-700">{typeIcons[selectedNode.type]} {typeLabels[selectedNode.type]}</p>
                <h2 className="mt-2 text-4xl font-black">{selectedNode.label}</h2>
                {selectedNode.reference && <p className="mt-2 font-semibold text-amber-700">{selectedNode.reference}</p>}
                <p className="mt-4 text-lg leading-8 text-slate-600">{selectedNode.description}</p>
              </div>
              {selectedNode.href && (
                <Link href={selectedNode.href} className="rounded-full bg-indigo-600 px-5 py-2.5 font-bold text-white shadow-lg">
                  Open this path →
                </Link>
              )}
            </div>

            {selectedNode.tags && selectedNode.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {selectedNode.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{tag}</span>)}
              </div>
            )}

            <div className="mt-9 border-t border-slate-200 pt-7">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Connected paths</p>
                  <h3 className="mt-2 text-2xl font-black">Where could you walk next?</h3>
                </div>
                <span className="text-sm text-slate-400">{connected.length} connection{connected.length === 1 ? "" : "s"}</span>
              </div>

              {connected.length > 0 ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {connected.map(({ node, edge, direction }) => (
                    <button key={`${edge.from}-${edge.to}`} type="button" onClick={() => chooseNode(node)} className="group rounded-2xl border border-slate-200 p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-3xl" aria-hidden="true">{typeIcons[node.type]}</span>
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{direction === "outgoing" ? edge.relationship : `linked by ${edge.relationship}`}</span>
                      </div>
                      <h4 className="mt-4 text-xl font-black text-slate-950">{node.label}</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{edge.explanation}</p>
                      <p className="mt-4 text-sm font-bold text-indigo-700">Follow connection →</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
                  This node has no mapped connections yet. The graph will expand as Emmaus content grows.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
