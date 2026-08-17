"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { questionAtlas, type QuestionAtlasEntry, type QuestionCategory } from "@/lib/emmaus/question-atlas";

const categories: Array<{ id: QuestionCategory | "All"; label: string; icon: string; prompt: string }> = [
  { id: "All", label: "All Questions", icon: "✦", prompt: "Explore every available biblical question journey." },
  { id: "God", label: "God", icon: "☀", prompt: "Who is God, and what is He like?" },
  { id: "Jesus", label: "Jesus", icon: "✝", prompt: "Who is Jesus, and why does He matter?" },
  { id: "Salvation", label: "Salvation", icon: "⌁", prompt: "How does God rescue and restore?" },
  { id: "Prayer", label: "Prayer", icon: "◌", prompt: "How do we speak with and listen to God?" },
  { id: "Faith", label: "Faith", icon: "◇", prompt: "What does trust in God actually require?" },
  { id: "Suffering", label: "Suffering", icon: "△", prompt: "Where is God when life hurts?" },
  { id: "Purpose", label: "Purpose", icon: "→", prompt: "Why are we here, and how should we live?" },
  { id: "Holy Spirit", label: "Holy Spirit", icon: "≈", prompt: "Who is the Spirit, and how does He work?" },
  { id: "Church", label: "Church", icon: "⌂", prompt: "What is the Church called to be?" },
  { id: "Hope", label: "Hope", icon: "✧", prompt: "What future has God promised?" },
];

export default function QuestionAtlasPage() {
  const [activeCategory, setActiveCategory] = useState<QuestionCategory | "All">("All");
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState(questionAtlas[0]?.slug ?? "");

  const visibleQuestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return questionAtlas.filter((entry) => {
      const categoryMatch = activeCategory === "All" || entry.category === activeCategory;
      const searchMatch = !normalized || [entry.question, entry.summary, entry.pathway, ...entry.primaryPassages, ...entry.supportingPassages]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
      return categoryMatch && searchMatch;
    });
  }, [activeCategory, query]);

  const selected = questionAtlas.find((entry) => entry.slug === selectedSlug) ?? visibleQuestions[0] ?? questionAtlas[0];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur">
          <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Emmaus Question Atlas</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">What are you seeking today?</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-indigo-100/75">Begin with a real question. Emmaus will guide you through Scripture, one passage and one discovery at a time, without replacing the biblical text with a quick answer.</p>
            </div>
            <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-200">Rules-first experience</p>
              <p className="mt-3 leading-7 text-amber-50/80">Every journey uses curated passages, reviewed questions, and predetermined study branches. AI is not required.</p>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
          <label className="block text-sm font-semibold text-indigo-100">
            Search questions, themes, or passages
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try: Jesus, sacrifice, John 1, salvation..."
              className="mt-2 w-full rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-indigo-100/30 focus:border-amber-300"
            />
          </label>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${activeCategory === category.id ? "bg-amber-300 text-slate-950" : "border border-white/15 bg-white/[0.04] text-indigo-100"}`}
              >
                {category.icon} {category.label}
              </button>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[390px_1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Question journeys</p>
                <p className="mt-2 text-sm text-indigo-100/50">{visibleQuestions.length} available</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {visibleQuestions.map((entry) => (
                <QuestionButton key={entry.slug} entry={entry} selected={entry.slug === selected?.slug} onSelect={() => setSelectedSlug(entry.slug)} />
              ))}
              {!visibleQuestions.length && (
                <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 text-sm leading-6 text-indigo-100/55">No published question journey matches these filters yet.</div>
              )}
            </div>
          </aside>

          {selected ? (
            <section className="space-y-6">
              <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="max-w-3xl">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{selected.category} · {selected.pathway}</p>
                    <h2 className="mt-3 text-4xl font-black sm:text-5xl">{selected.question}</h2>
                    <p className="mt-4 text-lg leading-8 text-slate-600">{selected.summary}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">Curated journey</span>
                </div>

                <div className="mt-8 rounded-3xl border border-indigo-200 bg-indigo-50 p-6">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Begin here</p>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black">{selected.discoveryStart}</h3>
                      <p className="mt-2 text-slate-600">The journey starts with observation, not a conclusion.</p>
                    </div>
                    <Link href={startHref(selected)} className="rounded-full bg-indigo-600 px-5 py-3 font-black text-white">Start Guided Discovery →</Link>
                  </div>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  <PassagePanel title="Primary passages" eyebrow="Core biblical evidence" passages={selected.primaryPassages} />
                  <PassagePanel title="Supporting passages" eyebrow="Additional context" passages={selected.supportingPassages} />
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-rose-700">Common misconceptions</p>
                    <div className="mt-4 space-y-3">
                      {selected.misconceptions.map((item) => <div key={item} className="rounded-2xl border border-rose-200 bg-rose-50 p-4 font-semibold leading-7 text-rose-950">{item}</div>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Related questions</p>
                    <div className="mt-4 space-y-3">
                      {selected.relatedQuestions.map((slug) => {
                        const related = questionAtlas.find((entry) => entry.slug === slug);
                        return related ? <button key={slug} type="button" onClick={() => setSelectedSlug(slug)} className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left font-semibold leading-7 text-emerald-950">{related.question}</button> : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <ActionCard title="Open Canon Lens" description="Examine the starting passage through Scripture, language, history, theology, and formation lenses." href="/emmaus/canon" />
                <ActionCard title="Explore the Atlas" description="See the passage and its connected biblical landscape visually." href="/emmaus/atlas" />
                <ActionCard title="Study Workspace" description="Slow down and record observations, questions, connections, and conclusions." href="/emmaus/workspace/john-1-1" />
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function QuestionButton({ entry, selected, onSelect }: { entry: QuestionAtlasEntry; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={`w-full rounded-2xl border p-4 text-left transition ${selected ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-black/20 hover:border-indigo-300/40"}`}>
      <p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-300">{entry.category}</p>
      <p className="mt-2 text-lg font-black">{entry.question}</p>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-indigo-100/55">{entry.summary}</p>
    </button>
  );
}

function PassagePanel({ title, eyebrow, passages }: { title: string; eyebrow: string; passages: string[] }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-black">{title}</h3>
      <div className="mt-4 flex flex-wrap gap-2">{passages.map((passage) => <span key={passage} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">{passage}</span>)}</div>
    </div>
  );
}

function ActionCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl transition hover:-translate-y-1 hover:border-amber-300/30">
      <p className="text-xl font-black">{title}</p>
      <p className="mt-3 text-sm leading-6 text-indigo-100/60">{description}</p>
      <p className="mt-5 text-sm font-black text-amber-300">Open →</p>
    </Link>
  );
}

function startHref(entry: QuestionAtlasEntry) {
  if (entry.discoveryStart === "John 1:1") return "/emmaus/workspace/john-1-1";
  return `/emmaus/explore?passage=${encodeURIComponent(entry.discoveryStart)}`;
}
