"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  buildUniverseBridges,
  buildUniverseNodes,
  getKnowledgeLayer,
  knowledgeLayers,
  type KnowledgeLayerId,
  type UniverseNode,
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

const layerRing: Record<KnowledgeLayerId, number> = {
  canon: 0,
  language: 1,
  "historical-world": 1,
  theology: 2,
  narrative: 2,
  discipleship: 3,
  "church-history": 3,
  contributor: 4,
};

export default function EmmausAtlasPage() {
  const [activeLayer, setActiveLayer] = useState<KnowledgeLayerId | "all">("all");
  const [selectedId, setSelectedId] = useState("canon:verse-john-1-1");
  const [showReviewed, setShowReviewed] = useState(true);

  const nodes = useMemo(() => buildUniverseNodes(), []);
  const bridges = useMemo(() => buildUniverseBridges(), []);
  const selected = nodes.find((node) => node.id === selectedId) ?? nodes.find((node) => node.sourceNodeId === "verse-john-1-1") ?? nodes[0];

  const visibleNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (!showReviewed && node.status !== "approved") return false;
      if (activeLayer !== "all" && node.layerId !== activeLayer) return false;
      return true;
    });
  }, [activeLayer, nodes, showReviewed]);

  const selectedBridges = bridges.filter((bridge) => bridge.fromNodeId === selected?.id || bridge.toNodeId === selected?.id);
  const connectedNodes = selectedBridges
    .map((bridge) => nodes.find((node) => node.id === (bridge.fromNodeId === selected?.id ? bridge.toNodeId : bridge.fromNodeId)))
    .filter(Boolean) as UniverseNode[];

  const mapNodes = visibleNodes
    .filter((node) => node.id === selected?.id || connectedNodes.some((connected) => connected.id === node.id) || node.sourceNodeId === "verse-john-1-1")
    .slice(0, 20);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Emmaus Atlas</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">See Scripture as an interconnected landscape.</h1>
              <p className="mt-4 text-lg leading-8 text-indigo-100/75">Begin with the biblical text, expand outward through carefully labeled knowledge layers, and return to the center at any time.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/emmaus/canon" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">Canon Lens</Link>
              <Link href="/emmaus/workspace/john-1-1" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">Verse Workspace</Link>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-[2rem] border border-amber-300/30 bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 p-1 shadow-2xl">
          <div className="rounded-[1.8rem] bg-slate-950/95 p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Center passage</p>
                <h2 className="mt-2 text-4xl font-black">John 1:1</h2>
                <p className="mt-4 max-w-3xl text-xl leading-9 text-indigo-100/85">In the beginning was the Word, and the Word was with God, and the Word was God.</p>
              </div>
              <button type="button" onClick={() => setSelectedId("canon:verse-john-1-1")} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold">Return to center</button>
            </div>
          </div>
        </section>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          <button type="button" onClick={() => setActiveLayer("all")} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${activeLayer === "all" ? "bg-amber-300 text-slate-950" : "border border-white/15 bg-white/[0.06] text-indigo-100"}`}>All layers</button>
          {knowledgeLayers.map((layer) => (
            <button key={layer.id} type="button" onClick={() => setActiveLayer(layer.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${activeLayer === layer.id ? "bg-amber-300 text-slate-950" : "border border-white/15 bg-white/[0.06] text-indigo-100"}`}>
              {layerIcons[layer.id]} {layer.learnerLabel}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="rounded-[2rem] border border-white/10 bg-black/20 p-4 shadow-2xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Visual map</p>
                <h2 className="mt-2 text-2xl font-black">Expand from the text</h2>
              </div>
              <label className="flex items-center gap-2 text-sm text-indigo-100/70"><input type="checkbox" checked={showReviewed} onChange={(event) => setShowReviewed(event.target.checked)} /> Include reviewed material</label>
            </div>

            <div className="relative mt-6 min-h-[680px] overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.16),rgba(79,70,229,0.10)_35%,rgba(15,23,42,0.3)_70%)]">
              {[1, 2, 3, 4].map((ring) => (
                <div key={ring} className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-white/10" style={{ width: `${ring * 22}%`, height: `${ring * 22}%`, transform: "translate(-50%, -50%)" }} />
              ))}

              {mapNodes.map((node, index) => {
                const total = Math.max(1, mapNodes.filter((item) => layerRing[item.layerId] === layerRing[node.layerId]).length);
                const peerIndex = mapNodes.filter((item) => layerRing[item.layerId] === layerRing[node.layerId]).findIndex((item) => item.id === node.id);
                const ring = layerRing[node.layerId];
                const angle = total === 1 ? -90 : (360 / total) * peerIndex - 90;
                const radius = ring === 0 ? 0 : 11 + ring * 9;
                const x = 50 + Math.cos((angle * Math.PI) / 180) * radius;
                const y = 50 + Math.sin((angle * Math.PI) / 180) * radius;
                const selectedNode = node.id === selected?.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedId(node.id)}
                    className={`absolute w-32 -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-3 text-left shadow-xl transition hover:z-20 hover:scale-105 sm:w-40 ${selectedNode ? "z-10 border-amber-300 bg-amber-300 text-slate-950" : node.layerId === "canon" ? "border-emerald-300/50 bg-emerald-950/90 text-white" : "border-white/15 bg-slate-950/90 text-white"}`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <p className={`text-[10px] font-black uppercase tracking-[0.12em] ${selectedNode ? "text-slate-700" : "text-indigo-300"}`}>{layerIcons[node.layerId]} {node.layerId.replaceAll("-", " ")}</p>
                    <p className="mt-1 line-clamp-2 text-sm font-black">{node.label}</p>
                    <p className={`mt-1 text-[10px] ${selectedNode ? "text-slate-700" : "text-indigo-100/50"}`}>{node.status}</p>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-center text-sm text-indigo-100/50">The center represents Scripture. Outer rings represent supporting knowledge with visibly different authority levels.</p>
          </section>

          <aside className="space-y-5">
            <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Selected location</p><h2 className="mt-2 text-2xl font-black">{selected?.label}</h2></div>
                <span className="text-3xl">{selected ? layerIcons[selected.layerId] : "📍"}</span>
              </div>
              <p className="mt-4 leading-7 text-slate-600">{selected?.description}</p>

              {selected && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">Authority boundary</p>
                  <p className="mt-2 text-sm leading-6 text-amber-950">{getKnowledgeLayer(selected.layerId)?.boundaryStatement}</p>
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Meta label="Layer" value={selected?.layerId.replaceAll("-", " ") ?? "—"} />
                <Meta label="Status" value={selected?.status ?? "—"} />
              </div>

              {selected?.provenance.length ? (
                <div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Provenance</p><p className="mt-2 text-sm leading-6 text-slate-600">{selected.provenance.join(" · ")}</p></div>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Why it is connected</p>
              <div className="mt-4 space-y-3">
                {selectedBridges.length ? selectedBridges.slice(0, 5).map((bridge) => (
                  <div key={bridge.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3"><p className="font-bold">{bridge.relationship}</p><span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-indigo-100/70">{bridge.confidence}</span></div>
                    <p className="mt-2 text-sm leading-6 text-indigo-100/65">{bridge.explanation}</p>
                    <p className="mt-3 text-xs leading-5 text-amber-200/75">{bridge.boundaryNote}</p>
                  </div>
                )) : <p className="text-sm text-indigo-100/55">No cross-layer relationship is currently mapped from this location.</p>}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Continue from here</p>
              <div className="mt-4 grid gap-2">
                <Link href="/emmaus/canon" className="rounded-full bg-amber-300 px-4 py-2.5 text-center text-sm font-black text-slate-950">Open Canon Lens</Link>
                <Link href="/emmaus/explore" className="rounded-full border border-white/20 px-4 py-2.5 text-center text-sm font-semibold">Open Knowledge Explorer</Link>
                <Link href="/emmaus/trails/logos" className="rounded-full border border-white/20 px-4 py-2.5 text-center text-sm font-semibold">Follow Logos Rabbit Trail</Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 text-sm font-bold capitalize">{value}</p></div>;
}
