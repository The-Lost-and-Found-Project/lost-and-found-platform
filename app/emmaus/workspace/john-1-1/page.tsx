"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getConnectedKnowledge, getKnowledgeNode } from "@/lib/emmaus/knowledge-graph";

type Tab = "observe" | "connections" | "trails" | "words" | "questions" | "journal";

const tabs: Array<{ key: Tab; label: string; icon: string }> = [
  { key: "observe", label: "Observe", icon: "👀" },
  { key: "connections", label: "Connections", icon: "🔗" },
  { key: "trails", label: "Rabbit Trails", icon: "🧭" },
  { key: "words", label: "Words", icon: "🔤" },
  { key: "questions", label: "Questions", icon: "❓" },
  { key: "journal", label: "Journal", icon: "📝" },
];

export default function JohnOneOneWorkspacePage() {
  const [activeTab, setActiveTab] = useState<Tab>("observe");
  const [notes, setNotes] = useState({ observe: "", questions: "", journal: "" });
  const node = getKnowledgeNode("verse-john-1-1");
  const connected = getConnectedKnowledge("verse-john-1-1");
  const storageKey = "emmaus-workspace:john-1-1";

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setNotes((current) => ({ ...current, ...JSON.parse(saved) }));
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(notes));
  }, [notes]);

  const answered = useMemo(() => Object.values(notes).filter((value) => value.trim().length > 0).length, [notes]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Emmaus Verse Workspace</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">John 1:1</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-indigo-100/75">Stay with one verse long enough to notice its claims, follow its connections, and record what changes in the way you read it.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/emmaus/discovery/demo" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white">Return to Discovery</Link>
              <Link href="/emmaus/explore" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">Open Explorer</Link>
            </div>
          </div>
          <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5 sm:p-7">
            <p className="text-sm font-semibold text-amber-300">KJV</p>
            <p className="mt-3 text-2xl leading-10 text-white">In the beginning was the Word, and the Word was with God, and the Word was God.</p>
          </div>
        </header>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key ? "bg-amber-300 text-slate-950" : "border border-white/15 bg-white/[0.06] text-indigo-100"}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <section className="mt-6 rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
          {activeTab === "observe" && (
            <WorkspacePanel eyebrow="Observe" title="What does the verse actually say?" description="Record details before interpretation. Look for repetition, time language, identity claims, and relationships.">
              <Clue>Three uses of the word “was” appear before the verse ends. What does each one contribute?</Clue>
              <textarea value={notes.observe} onChange={(event) => setNotes((current) => ({ ...current, observe: event.target.value }))} rows={12} placeholder="List your observations one by one..." className={textareaClass} />
            </WorkspacePanel>
          )}

          {activeTab === "connections" && (
            <WorkspacePanel eyebrow="Connections" title="Where does this verse lead?" description="These are curated relationships from the Emmaus Knowledge Graph.">
              <div className="grid gap-4 md:grid-cols-2">
                {connected.map(({ node: connectedNode, edge }) => (
                  <div key={`${edge.from}-${edge.to}`} className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{edge.relationship}</p>
                    <h3 className="mt-2 text-xl font-black">{connectedNode.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{edge.explanation}</p>
                    {connectedNode.href && <Link href={connectedNode.href} className="mt-4 inline-flex text-sm font-bold text-indigo-700">Follow connection →</Link>}
                  </div>
                ))}
              </div>
            </WorkspacePanel>
          )}

          {activeTab === "trails" && (
            <WorkspacePanel eyebrow="Rabbit Trails" title="Follow one idea without losing your place" description="These trails return you to John 1:1 with sharper observations.">
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">Available now</p>
                <h3 className="mt-2 text-2xl font-black">The Word — Logos</h3>
                <p className="mt-3 leading-7 text-slate-700">Trace the title through Genesis, Hebrews, Colossians, John, and Revelation.</p>
                <Link href="/emmaus/trails/logos" className="mt-5 inline-flex rounded-full bg-indigo-600 px-5 py-2.5 font-bold text-white">Begin Rabbit Trail →</Link>
              </div>
            </WorkspacePanel>
          )}

          {activeTab === "words" && (
            <WorkspacePanel eyebrow="Original Words" title="Look beneath the English carefully" description="Word studies should clarify the text, not overpower it.">
              <div className="grid gap-4 md:grid-cols-2">
                <WordCard word="Logos" language="Greek" meaning="word, message, expression, reason" question="Why might John use a title connected to revelation and expression?" />
                <WordCard word="Archē" language="Greek" meaning="beginning, origin, first principle" question="How does this word frame the Word in relation to time and creation?" />
              </div>
            </WorkspacePanel>
          )}

          {activeTab === "questions" && (
            <WorkspacePanel eyebrow="Questions" title="What are you still wondering?" description="Emmaus should preserve questions, not rush past them.">
              <div className="grid gap-3 sm:grid-cols-2">
                {["Why does John echo Genesis?", "Why say ‘Word’ instead of Jesus?", "How can the Word be with God and be God?", "What does this verse require me to believe about Jesus?"].map((question) => <button key={question} type="button" onClick={() => setNotes((current) => ({ ...current, questions: current.questions ? `${current.questions}\n${question}` : question }))} className="rounded-2xl border border-slate-200 p-4 text-left font-semibold hover:border-indigo-300 hover:bg-indigo-50">{question}</button>)}
              </div>
              <textarea value={notes.questions} onChange={(event) => setNotes((current) => ({ ...current, questions: event.target.value }))} rows={10} placeholder="Write every question the verse raises..." className={`${textareaClass} mt-5`} />
            </WorkspacePanel>
          )}

          {activeTab === "journal" && (
            <WorkspacePanel eyebrow="Journal" title="What changed in the way you read this verse?" description="Capture conclusions, tensions, and next steps in your own words.">
              <textarea value={notes.journal} onChange={(event) => setNotes((current) => ({ ...current, journal: event.target.value }))} rows={14} placeholder="Today I noticed... I now understand... I still want to explore..." className={textareaClass} />
              <p className="mt-3 text-sm text-slate-500">{answered} workspace section{answered === 1 ? "" : "s"} contain saved notes.</p>
            </WorkspacePanel>
          )}
        </section>

        <footer className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5 text-center text-indigo-100/70">
          <p>{node?.description}</p>
        </footer>
      </div>
    </main>
  );
}

function WorkspacePanel({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <div><p className="text-sm font-black uppercase tracking-[0.16em] text-indigo-700">{eyebrow}</p><h2 className="mt-2 text-3xl font-black">{title}</h2><p className="mt-3 max-w-3xl leading-7 text-slate-600">{description}</p><div className="mt-7">{children}</div></div>;
}

function Clue({ children }: { children: React.ReactNode }) {
  return <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">🧩 Something to notice</p><p className="mt-2 leading-7 text-slate-700">{children}</p></div>;
}

function WordCard({ word, language, meaning, question }: { word: string; language: string; meaning: string; question: string }) {
  return <div className="rounded-2xl border border-slate-200 p-5"><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{language}</p><h3 className="mt-2 text-2xl font-black">{word}</h3><p className="mt-2 text-sm font-semibold text-slate-500">{meaning}</p><p className="mt-4 leading-7 text-slate-700">{question}</p></div>;
}

const textareaClass = "w-full rounded-2xl border border-slate-300 p-4 text-base leading-7 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
