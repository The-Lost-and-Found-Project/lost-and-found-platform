"use client";

import { useEffect, useMemo, useState } from "react";

type Relationship = "Theme" | "Prophecy" | "Fulfillment" | "Parallel" | "Contrast" | "Character" | "Promise";
type ThreadNode = { id: string; reference: string; summary: string; relationship: Relationship; question: string };

const storageKey = "emmaus-thread-graph-draft";
const relationships: Relationship[] = ["Theme", "Prophecy", "Fulfillment", "Parallel", "Contrast", "Character", "Promise"];

export default function ThreadGraphBuilder() {
  const [anchor, setAnchor] = useState("John 1:1");
  const [nodes, setNodes] = useState<ThreadNode[]>([
    { id: cryptoId(), reference: "Genesis 1:1", summary: "Creation begins with God speaking.", relationship: "Theme", question: "What does John add to Genesis by identifying the Word?" },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { anchor?: string; nodes?: ThreadNode[] };
      if (parsed.anchor) setAnchor(parsed.anchor);
      if (Array.isArray(parsed.nodes)) setNodes(parsed.nodes);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ anchor, nodes }));
  }, [anchor, nodes]);

  const completeCount = useMemo(() => nodes.filter((node) => node.reference.trim() && node.question.trim()).length, [nodes]);
  const selected = nodes.find((node) => node.id === selectedId) ?? null;

  function addNode() {
    const node: ThreadNode = { id: cryptoId(), reference: "", summary: "", relationship: "Theme", question: "" };
    setNodes((current) => [...current, node]);
    setSelectedId(node.id);
  }

  function updateNode(id: string, patch: Partial<ThreadNode>) {
    setNodes((current) => current.map((node) => node.id === id ? { ...node, ...patch } : node));
  }

  function removeNode(id: string) {
    setNodes((current) => current.filter((node) => node.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">Emmaus Founder Tool</p>
            <h1 className="mt-1 text-3xl font-bold text-gray-950">Scripture Thread Graph</h1>
            <p className="mt-2 text-gray-600">Build the biblical connections users will discover one step at a time.</p>
          </div>
          <button type="button" onClick={addNode} className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white">Add connection</button>
        </div>

        <label className="mt-7 block max-w-md">
          <span className="text-sm font-semibold text-gray-800">Anchor passage</span>
          <input value={anchor} onChange={(event) => setAnchor(event.target.value)} className={inputClass} />
        </label>

        <div className="mt-8 overflow-x-auto pb-4">
          <div className="min-w-[720px] rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-amber-50 p-8">
            <div className="mx-auto flex w-56 items-center justify-center rounded-2xl border-2 border-indigo-500 bg-white px-5 py-5 text-center shadow-md">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Anchor</p><p className="mt-1 text-xl font-bold text-gray-950">{anchor || "Choose passage"}</p></div>
            </div>

            <div className="mx-auto h-10 w-px bg-indigo-300" />
            <div className="mx-auto h-px w-[82%] bg-indigo-300" />

            <div className="grid grid-cols-3 gap-5">
              {nodes.map((node, index) => (
                <div key={node.id} className="relative pt-10">
                  <div className="absolute left-1/2 top-0 h-10 w-px bg-indigo-300" />
                  <button type="button" onClick={() => setSelectedId(node.id)} className={`h-full w-full rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${selectedId === node.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white"}`}>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{node.relationship}</span>
                    <h2 className="mt-3 text-lg font-bold text-gray-950">{node.reference || `Connection ${index + 1}`}</h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">{node.summary || "Add a short explanation of this connection."}</p>
                    <p className="mt-4 text-xs font-semibold text-indigo-700">Edit connection →</p>
                  </button>
                </div>
              ))}
              {!nodes.length && <div className="col-span-3 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">Add the first Scripture connection.</div>}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>{completeCount} complete connection{completeCount === 1 ? "" : "s"}</span>
          <span>Draft saves automatically on this device</span>
        </div>
      </section>

      <aside className="self-start rounded-3xl border border-gray-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-gray-950">Edit connection</h2><button type="button" onClick={() => removeNode(selected.id)} className="text-sm font-semibold text-red-600">Remove</button></div>
            <Field label="Connected passage"><input value={selected.reference} onChange={(event) => updateNode(selected.id, { reference: event.target.value })} placeholder="Colossians 1:15–17" className={inputClass} /></Field>
            <Field label="Relationship"><select value={selected.relationship} onChange={(event) => updateNode(selected.id, { relationship: event.target.value as Relationship })} className={inputClass}>{relationships.map((relationship) => <option key={relationship}>{relationship}</option>)}</select></Field>
            <Field label="Connection summary"><textarea value={selected.summary} onChange={(event) => updateNode(selected.id, { summary: event.target.value })} rows={4} placeholder="Explain what connects these passages without giving away the discovery." className={inputClass} /></Field>
            <Field label="Discovery question"><textarea value={selected.question} onChange={(event) => updateNode(selected.id, { question: event.target.value })} rows={5} placeholder="What should the learner notice or wrestle with?" className={inputClass} /></Field>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold text-amber-900">Learner view</p><p className="mt-2 text-sm leading-6 text-gray-700">{selected.question || "Your discovery question will appear here."}</p></div>
          </div>
        ) : (
          <div className="py-12 text-center"><div className="text-4xl" aria-hidden="true">🧵</div><h2 className="mt-4 text-xl font-bold text-gray-950">Select a connection</h2><p className="mt-2 text-sm leading-6 text-gray-600">Choose a card in the graph or add a new connection to begin editing.</p></div>
        )}
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-semibold text-gray-800">{label}</span><div className="mt-2">{children}</div></label>;
}

function cryptoId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

const inputClass = "mt-2 w-full rounded-xl border border-gray-300 px-3 py-2.5 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
