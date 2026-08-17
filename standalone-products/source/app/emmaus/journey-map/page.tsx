"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const nodes = [
  { id: "q-who-is-jesus", label: "Who is Jesus?", type: "question", x: 12, y: 48, status: "complete", detail: "Your starting question." },
  { id: "john-1-1", label: "John 1:1", type: "passage", x: 32, y: 30, status: "complete", detail: "The eternal Word." },
  { id: "genesis-1", label: "Genesis 1:1–3", type: "passage", x: 54, y: 18, status: "available", detail: "Creation echo." },
  { id: "logos", label: "Logos", type: "word", x: 53, y: 47, status: "complete", detail: "Original-language trail." },
  { id: "deity", label: "Deity of Christ", type: "theme", x: 73, y: 32, status: "available", detail: "Theological synthesis." },
  { id: "incarnation", label: "John 1:14", type: "passage", x: 72, y: 62, status: "locked", detail: "The Word became flesh." },
  { id: "worship", label: "Worship and Trust", type: "formation", x: 90, y: 48, status: "locked", detail: "Respond to what you discovered." },
];

const links = [
  ["q-who-is-jesus", "john-1-1"],
  ["john-1-1", "genesis-1"],
  ["john-1-1", "logos"],
  ["logos", "deity"],
  ["john-1-1", "incarnation"],
  ["deity", "worship"],
  ["incarnation", "worship"],
];

export default function JourneyMapPage() {
  const [selectedId, setSelectedId] = useState("john-1-1");
  const selected = nodes.find((node) => node.id === selectedId) ?? nodes[0];
  const completed = nodes.filter((node) => node.status === "complete").length;
  const available = nodes.filter((node) => node.status === "available").length;

  const positionedLinks = useMemo(() => links.map(([fromId, toId]) => {
    const from = nodes.find((node) => node.id === fromId)!;
    const to = nodes.find((node) => node.id === toId)!;
    const x1 = from.x;
    const y1 = from.y;
    const x2 = to.x;
    const y2 = to.y;
    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    return { fromId, toId, x1, y1, length, angle };
  }), []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Emmaus Journey Map</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">See the shape of your understanding.</h1>
              <p className="mt-4 text-lg leading-8 text-indigo-100/75">Track questions, passages, words, themes, and formation steps as one connected journey through Scripture.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/emmaus/questions" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">Question Atlas</Link>
              <Link href="/emmaus/inspect/john-1-1" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">Inspect John 1:1</Link>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Completed locations" value={String(completed)} />
          <Stat label="Available next" value={String(available)} />
          <Stat label="Questions explored" value="1" />
          <Stat label="Themes forming" value="2" />
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_350px]">
          <section className="rounded-[2rem] border border-white/10 bg-black/20 p-4 shadow-2xl sm:p-6">
            <div className="relative min-h-[680px] overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.12),rgba(79,70,229,0.08)_40%,rgba(15,23,42,0.35)_75%)]">
              {positionedLinks.map((link) => (
                <div key={`${link.fromId}-${link.toId}`} className="absolute h-px origin-left bg-indigo-300/25" style={{ left: `${link.x1}%`, top: `${link.y1}%`, width: `${link.length}%`, transform: `rotate(${link.angle}deg)` }} />
              ))}

              {nodes.map((node) => {
                const active = node.id === selected.id;
                const classes = node.status === "complete"
                  ? "border-emerald-300/50 bg-emerald-950/90"
                  : node.status === "available"
                    ? "border-amber-300/50 bg-amber-950/90"
                    : "border-white/10 bg-slate-950/75 opacity-60";
                return (
                  <button key={node.id} type="button" onClick={() => setSelectedId(node.id)} className={`absolute w-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-3 text-left shadow-xl transition hover:scale-105 ${classes} ${active ? "ring-2 ring-white" : ""}`} style={{ left: `${node.x}%`, top: `${node.y}%` }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-300">{node.type}</p>
                    <p className="mt-1 text-sm font-black">{node.label}</p>
                    <p className="mt-1 text-[10px] capitalize text-indigo-100/50">{node.status}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Selected location</p>
              <h2 className="mt-2 text-3xl font-black">{selected.label}</h2>
              <p className="mt-3 leading-7 text-slate-600">{selected.detail}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Meta label="Type" value={selected.type} />
                <Meta label="Status" value={selected.status} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Recommended next step</p>
              <h3 className="mt-2 text-2xl font-black">Genesis 1:1–3</h3>
              <p className="mt-3 text-sm leading-6 text-indigo-100/65">Compare John's opening with the creation account and ask what John expects you to recognize.</p>
              <Link href="/emmaus/explore?passage=Genesis%201%3A1-3" className="mt-5 block rounded-full bg-amber-300 px-4 py-2.5 text-center text-sm font-black text-slate-950">Continue Journey</Link>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Map legend</p>
              <div className="mt-4 space-y-3 text-sm text-indigo-100/65">
                <p><span className="mr-2 inline-block h-3 w-3 rounded-full bg-emerald-400" />Completed</p>
                <p><span className="mr-2 inline-block h-3 w-3 rounded-full bg-amber-400" />Available</p>
                <p><span className="mr-2 inline-block h-3 w-3 rounded-full bg-slate-500" />Locked until prerequisite work is complete</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-sm text-indigo-100/55">{label}</p></div>; }
function Meta({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><p className="mt-1 text-sm font-black capitalize">{value}</p></div>; }
