"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  buildUniverseBridges,
  buildUniverseNodes,
  getKnowledgeLayer,
  knowledgeLayers,
  type KnowledgeLayerId,
} from "@/lib/emmaus/knowledge-universe";

const layerIcons: Record<KnowledgeLayerId, string> = {
  canon: "📖",
  language: "🔤",
  "historical-world": "🏺",
  theology: "🕊️",
  narrative: "🧵",
  discipleship: "🧭",
  "church-history": "🏛️",
  contributor: "📝",
};

const passageText = "In the beginning was the Word, and the Word was with God, and the Word was God.";

export default function CanonLensPage() {
  const [activeLayer, setActiveLayer] = useState<KnowledgeLayerId>("canon");
  const [sourceNodeId] = useState("verse-john-1-1");

  const universeNodes = useMemo(() => buildUniverseNodes(), []);
  const universeBridges = useMemo(() => buildUniverseBridges(), []);
  const layer = getKnowledgeLayer(activeLayer)!;

  const sourceVariants = universeNodes.filter((node) => node.sourceNodeId === sourceNodeId);
  const activeSource = sourceVariants.find((node) => node.layerId === activeLayer) ?? sourceVariants[0];

  const connected = universeBridges
    .filter((bridge) => bridge.fromNodeId === activeSource?.id || bridge.toNodeId === activeSource?.id)
    .map((bridge) => {
      const targetId = bridge.fromNodeId === activeSource?.id ? bridge.toNodeId : bridge.fromNodeId;
      return { bridge, node: universeNodes.find((node) => node.id === targetId) };
    })
    .filter((item) => item.node && item.node.layerId === activeLayer);

  const fallbackNodes = universeNodes
    .filter((node) => node.layerId === activeLayer && node.sourceNodeId !== sourceNodeId)
    .slice(0, 6);

  const displayNodes = connected.length ? connected.map((item) => item.node!) : fallbackNodes;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Emmaus Canon Lens</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">Keep Scripture at the center.</h1>
              <p className="mt-4 text-lg leading-8 text-indigo-100/75">Move through language, history, theology, narrative, formation, and interpretation without confusing any supporting layer with the biblical text itself.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/emmaus/explore" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">Knowledge Explorer</Link>
              <Link href="/emmaus/workspace/john-1-1" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">Verse Workspace</Link>
            </div>
          </div>

          <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs font-black uppercase tracking-[0.14em] text-amber-300">Primary source</p><h2 className="mt-1 text-3xl font-black">John 1:1</h2></div>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100">KJV</span>
            </div>
            <p className="mt-4 text-2xl leading-10 text-white">{passageText}</p>
          </div>
        </header>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {knowledgeLayers.map((item) => (
            <button key={item.id} type="button" onClick={() => setActiveLayer(item.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${activeLayer === item.id ? "bg-amber-300 text-slate-950" : "border border-white/15 bg-white/[0.06] text-indigo-100"}`}>
              {layerIcons[item.id]} {item.learnerLabel}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
          <aside className="self-start rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur xl:sticky xl:top-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Active lens</p>
            <div className="mt-3 flex items-center gap-3"><span className="text-4xl">{layerIcons[activeLayer]}</span><div><h2 className="text-2xl font-black">{layer.name}</h2><p className="text-sm text-indigo-100/55">{layer.authorityLevel.replaceAll("-", " ")}</p></div></div>
            <p className="mt-5 text-sm leading-6 text-indigo-100/70">{layer.description}</p>

            <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-200">Boundary</p>
              <p className="mt-3 text-sm leading-6 text-amber-50/75">{layer.boundaryStatement}</p>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-300">Layer contents</p>
              <div className="mt-3 flex flex-wrap gap-2">{layer.allowedNodeTypes.map((type) => <span key={type} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-indigo-100/70">{type}</span>)}</div>
            </div>
          </aside>

          <section className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{layer.learnerLabel}</p>
                <h2 className="mt-2 text-4xl font-black">John 1:1 through this lens</h2>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">Supporting material is organized around the passage while keeping its authority level visible.</p>
              </div>
              <span className={`rounded-full px-4 py-2 text-sm font-black ${activeLayer === "canon" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{activeLayer === "canon" ? "Primary authority" : "Supporting layer"}</span>
            </div>

            {activeLayer === "canon" && (
              <div className="mt-7 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">Text first</p>
                <h3 className="mt-2 text-2xl font-black">Observe before opening another lens</h3>
                <p className="mt-3 leading-7 text-slate-700">What does John explicitly claim about the Word's existence, relationship to God, and identity?</p>
              </div>
            )}

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {displayNodes.length ? displayNodes.map((node) => (
                <article key={node.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-700">{node.layerId.replaceAll("-", " ")}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${node.status === "approved" ? "bg-emerald-100 text-emerald-800" : node.status === "reviewed" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{node.status}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-black">{node.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{node.description}</p>
                  {node.provenance.length > 0 && <div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Provenance</p><p className="mt-2 text-sm text-slate-600">{node.provenance.join(" · ")}</p></div>}
                </article>
              )) : <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500">No reviewed material has been mapped to this lens yet.</div>}
            </div>

            <div className="mt-9 border-t border-slate-200 pt-7">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Cross-layer guidance</p>
              <h3 className="mt-2 text-2xl font-black">How this lens relates to Scripture</h3>
              <div className="mt-4 space-y-3">
                {universeBridges.filter((bridge) => bridge.fromLayer === "canon" && bridge.toLayer === activeLayer).slice(0, 4).map((bridge) => (
                  <div key={bridge.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3"><p className="font-black">{bridge.relationship}</p><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{bridge.confidence}</span></div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{bridge.explanation}</p>
                    <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">{bridge.boundaryNote}</p>
                  </div>
                ))}
                {activeLayer === "canon" && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">All other lenses must remain accountable to the text shown above.</div>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
