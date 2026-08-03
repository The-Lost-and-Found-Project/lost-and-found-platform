"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type JourneySignal = {
  id: string;
  type: "discovery" | "trail" | "workspace" | "journal" | "prayer";
  label: string;
  themes: string[];
  passage?: string;
  occurredAt: string;
};

type Recommendation = {
  title: string;
  reason: string;
  href: string;
  themes: string[];
  kind: "Discovery" | "Rabbit Trail" | "Workspace" | "Reflection";
};

const seedSignals: JourneySignal[] = [
  {
    id: "john-discovery",
    type: "discovery",
    label: "Studied The Eternal Word",
    themes: ["Jesus", "Identity", "Creation", "Revelation"],
    passage: "John 1:1",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: "logos-trail",
    type: "trail",
    label: "Followed The Word — Logos",
    themes: ["Jesus", "Creation", "Revelation", "Glory"],
    passage: "John 1:1–18",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: "john-workspace",
    type: "workspace",
    label: "Observed John 1:1 in the Verse Workspace",
    themes: ["Jesus", "Trinity", "Identity"],
    passage: "John 1:1",
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "john-journal",
    type: "journal",
    label: "Journaled about trusting the eternal Christ",
    themes: ["Trust", "Jesus", "Application"],
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

const recommendationLibrary: Recommendation[] = [
  {
    title: "Christ Before All Things",
    reason: "Continue the creation and identity thread through Colossians 1:15–17.",
    href: "/emmaus/workspace/john-1-1",
    themes: ["Jesus", "Creation", "Identity"],
    kind: "Workspace",
  },
  {
    title: "The Word — Logos",
    reason: "Trace revelation, creation, incarnation, and glory through the approved Rabbit Trail.",
    href: "/emmaus/trails/logos",
    themes: ["Jesus", "Creation", "Revelation", "Glory"],
    kind: "Rabbit Trail",
  },
  {
    title: "The Eternal Word",
    reason: "Return to John 1:1 and follow a different curiosity path.",
    href: "/emmaus/discovery/demo",
    themes: ["Jesus", "Trinity", "Identity"],
    kind: "Discovery",
  },
  {
    title: "Where Trust Meets Truth",
    reason: "Reflect on how a high view of Christ should reshape fear, obedience, and prayer.",
    href: "/emmaus/profile/learning",
    themes: ["Trust", "Application", "Prayer"],
    kind: "Reflection",
  },
];

export default function JourneyEnginePage() {
  const storageKey = "emmaus-journey-engine-v1";
  const [signals, setSignals] = useState<JourneySignal[]>(seedSignals);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setSignals(JSON.parse(raw) as JourneySignal[]);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(signals));
    setSaved(true);
    const timer = window.setTimeout(() => setSaved(false), 900);
    return () => window.clearTimeout(timer);
  }, [signals]);

  const themeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    signals.forEach((signal) => signal.themes.forEach((theme) => counts.set(theme, (counts.get(theme) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [signals]);

  const dominantThemes = themeCounts.slice(0, 4).map(([theme]) => theme);

  const recommendations = useMemo(() => {
    return recommendationLibrary
      .map((item) => ({
        ...item,
        score: item.themes.reduce((sum, theme) => sum + (themeCounts.find(([name]) => name === theme)?.[1] ?? 0), 0),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [themeCounts]);

  function addSignal(signal: JourneySignal) {
    setSignals((current) => current.some((item) => item.id === signal.id) ? current : [signal, ...current]);
  }

  function reset() {
    setSignals(seedSignals);
    window.localStorage.removeItem(storageKey);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Your Emmaus Journey</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">Journey Engine</h1>
              <p className="mt-4 text-lg leading-8 text-indigo-100/75">Emmaus notices recurring themes in your real study history and recommends the next faithful step—not simply the next available lesson.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/emmaus/profile/learning" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">Learning Profile</Link>
              <Link href="/emmaus/discovery/demo" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">Continue Walking</Link>
            </div>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Stat label="Study signals" value={String(signals.length)} />
            <Stat label="Recurring themes" value={String(themeCounts.length)} />
            <Stat label="Current thread" value={dominantThemes[0] ?? "Still forming"} />
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">What Emmaus is noticing</p>
            <h2 className="mt-2 text-3xl font-black">Your current study thread</h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">This is pattern recognition, not spiritual diagnosis. Recommendations come only from themes you have repeatedly chosen, studied, journaled, or prayed through.</p>

            <div className="mt-7 flex flex-wrap gap-3">
              {themeCounts.slice(0, 8).map(([theme, count]) => (
                <div key={theme} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                  {theme} <span className="ml-2 text-indigo-600">{count}</span>
                </div>
              ))}
            </div>

            <div className="mt-9 border-t border-slate-200 pt-7">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Recommended next steps</p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {recommendations.map((item) => (
                  <Link key={item.title} href={item.href} className="rounded-3xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{item.kind}</p>
                    <h3 className="mt-3 text-xl font-black">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.reason}</p>
                    <p className="mt-5 text-sm font-bold text-indigo-700">Continue this thread →</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-9 border-t border-slate-200 pt-7">
              <div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-black">Recent journey evidence</h2><span className="text-xs text-slate-400">{saved ? "Saved" : "Autosave"}</span></div>
              <div className="mt-5 space-y-4">
                {signals.map((signal) => (
                  <div key={signal.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-700">{signal.type.replace("_", " ")}</p><p className="mt-1 font-black">{signal.label}</p>{signal.passage && <p className="mt-1 text-sm text-slate-500">{signal.passage}</p>}</div>
                      <p className="text-xs text-slate-400">{new Date(signal.occurredAt).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">{signal.themes.map((theme) => <span key={theme} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{theme}</span>)}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Pattern test</p>
              <h2 className="mt-2 text-2xl font-black">Add a new signal</h2>
              <p className="mt-3 text-sm leading-6 text-indigo-100/65">Use these sample actions to see recommendations change as a learner’s journey changes.</p>
              <div className="mt-5 space-y-3">
                <SignalButton label="Prayed through fear and trust" used={signals.some((item) => item.id === "fear-prayer")} onClick={() => addSignal({ id: "fear-prayer", type: "prayer", label: "Prayed through fear and trust", themes: ["Fear", "Trust", "Prayer"], occurredAt: new Date().toISOString() })} />
                <SignalButton label="Studied waiting in Psalm 27" used={signals.some((item) => item.id === "waiting-psalm" )} onClick={() => addSignal({ id: "waiting-psalm", type: "discovery", label: "Studied waiting in Psalm 27", themes: ["Waiting", "Trust", "Prayer"], passage: "Psalm 27", occurredAt: new Date().toISOString() })} />
                <SignalButton label="Journaled about obedience" used={signals.some((item) => item.id === "obedience-journal")} onClick={() => addSignal({ id: "obedience-journal", type: "journal", label: "Journaled about obedience", themes: ["Obedience", "Application", "Trust"], occurredAt: new Date().toISOString() })} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Guardrail</p>
              <h2 className="mt-2 text-2xl font-black">What this engine will not claim</h2>
              <p className="mt-3 text-sm leading-6 text-indigo-100/65">It does not claim to know God’s private message to someone, measure spiritual maturity, or replace pastoral wisdom. It only surfaces patterns from the learner’s own choices.</p>
              <button type="button" onClick={reset} className="mt-6 w-full rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold">Reset demonstration</button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-sm text-indigo-100/55">{label}</p></div>;
}

function SignalButton({ label, used, onClick }: { label: string; used: boolean; onClick: () => void }) {
  return <button type="button" disabled={used} onClick={onClick} className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-amber-300/40 disabled:opacity-45"><p className="font-semibold">{label}</p><p className="mt-2 text-xs text-indigo-100/50">{used ? "Already applied" : "Add to journey →"}</p></button>;
}
