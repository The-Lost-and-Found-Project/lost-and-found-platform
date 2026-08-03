"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TimelineSignal = {
  id: string;
  type: "discovery" | "trail" | "workspace" | "journal" | "prayer" | "assessment";
  label: string;
  themes: string[];
  passage?: string;
  occurredAt: string;
  note?: string;
};

type MonthSummary = {
  key: string;
  label: string;
  signals: TimelineSignal[];
  themes: Array<[string, number]>;
  passages: string[];
  reflection: string;
};

const seedSignals: TimelineSignal[] = [
  {
    id: "jan-assessment",
    type: "assessment",
    label: "Completed Emmaus Assessment",
    themes: ["Observation", "Connections", "Theology"],
    occurredAt: "2026-01-12T15:00:00.000Z",
    note: "Emmaus identified strong observation skills and room to grow in historical context.",
  },
  {
    id: "jan-john",
    type: "discovery",
    label: "Studied The Eternal Word",
    themes: ["Jesus", "Identity", "Creation", "Revelation"],
    passage: "John 1:1",
    occurredAt: "2026-01-18T15:00:00.000Z",
  },
  {
    id: "feb-logos",
    type: "trail",
    label: "Followed The Word — Logos Rabbit Trail",
    themes: ["Jesus", "Creation", "Revelation", "Glory"],
    passage: "John 1:1–18",
    occurredAt: "2026-02-08T15:00:00.000Z",
  },
  {
    id: "feb-journal",
    type: "journal",
    label: "Journaled about trusting the eternal Christ",
    themes: ["Trust", "Jesus", "Application"],
    occurredAt: "2026-02-21T15:00:00.000Z",
    note: "The journal shifted from information about Christ to personal trust in Christ.",
  },
  {
    id: "mar-prayer",
    type: "prayer",
    label: "Prayed through fear and trust",
    themes: ["Fear", "Trust", "Prayer"],
    passage: "Psalm 27",
    occurredAt: "2026-03-11T15:00:00.000Z",
  },
  {
    id: "mar-waiting",
    type: "discovery",
    label: "Studied waiting in Psalm 27",
    themes: ["Waiting", "Trust", "Prayer"],
    passage: "Psalm 27",
    occurredAt: "2026-03-24T15:00:00.000Z",
  },
  {
    id: "apr-workspace",
    type: "workspace",
    label: "Compared John 1 with Genesis 1",
    themes: ["Creation", "Connections", "Jesus"],
    passage: "Genesis 1:1–3; John 1:1–3",
    occurredAt: "2026-04-07T15:00:00.000Z",
  },
  {
    id: "apr-obedience",
    type: "journal",
    label: "Journaled a concrete act of obedience",
    themes: ["Obedience", "Application", "Trust"],
    occurredAt: "2026-04-19T15:00:00.000Z",
  },
];

const broadThemeLibrary = [
  "Jesus",
  "Prayer",
  "Trust",
  "Creation",
  "Covenant",
  "Wisdom",
  "Justice",
  "Mission",
  "Holy Spirit",
  "Church",
  "Kingdom",
  "Suffering",
  "Worship",
  "Prophecy",
  "Obedience",
];

export default function EmmausTimelinePage() {
  const storageKey = "emmaus-timeline-v1";
  const [signals, setSignals] = useState<TimelineSignal[]>(seedSignals);
  const [view, setView] = useState<"seasons" | "themes" | "passages">("seasons");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      const journey = window.localStorage.getItem("emmaus-journey-engine-v1");
      if (stored) {
        setSignals(JSON.parse(stored) as TimelineSignal[]);
        return;
      }
      if (journey) {
        const journeySignals = JSON.parse(journey) as TimelineSignal[];
        if (Array.isArray(journeySignals) && journeySignals.length) {
          setSignals([...journeySignals, ...seedSignals].filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index));
        }
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(signals));
  }, [signals]);

  const months = useMemo(() => buildMonths(signals), [signals]);
  const themeTotals = useMemo(() => countThemes(signals), [signals]);
  const passageTotals = useMemo(() => countPassages(signals), [signals]);
  const exploredThemes = new Set(themeTotals.map(([theme]) => theme));
  const underexplored = broadThemeLibrary.filter((theme) => !exploredThemes.has(theme)).slice(0, 6);
  const dominant = themeTotals.slice(0, 4);

  function addCurrentSeason() {
    const now = new Date();
    const signal: TimelineSignal = {
      id: `reflection-${now.getTime()}`,
      type: "journal",
      label: "Added a timeline reflection",
      themes: ["Reflection", dominant[0]?.[0] ?? "Scripture"],
      occurredAt: now.toISOString(),
      note: "A new reflection was added to mark the current season of study.",
    };
    setSignals((current) => [signal, ...current]);
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
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">Timeline</h1>
              <p className="mt-4 text-lg leading-8 text-indigo-100/75">A visual record of where you have traveled through Scripture, which themes have shaped your study, and where your curiosity has not yet taken you.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/emmaus/journey" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">Journey Engine</Link>
              <Link href="/emmaus/discovery/demo" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">Continue Walking</Link>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-4">
            <Stat label="Recorded moments" value={String(signals.length)} />
            <Stat label="Study seasons" value={String(months.length)} />
            <Stat label="Themes explored" value={String(themeTotals.length)} />
            <Stat label="Most revisited" value={dominant[0]?.[0] ?? "Still forming"} />
          </div>
        </header>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {(["seasons", "themes", "passages"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setView(item)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${view === item ? "bg-amber-300 text-slate-950" : "border border-white/15 bg-white/[0.06] text-indigo-100"}`}>
              {item === "seasons" ? "Study Seasons" : item === "themes" ? "Theme Map" : "Passage History"}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
            {view === "seasons" && (
              <>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Study seasons</p>
                <h2 className="mt-2 text-3xl font-black">How your journey has moved over time</h2>
                <p className="mt-3 max-w-3xl leading-7 text-slate-600">Each summary is generated from the passages, themes, prayers, trails, and reflections recorded during that month.</p>

                <div className="mt-8 space-y-7 border-l-2 border-indigo-100 pl-6 sm:pl-8">
                  {months.map((month) => (
                    <article key={month.key} className="relative rounded-3xl border border-slate-200 p-5 sm:p-6">
                      <div className="absolute -left-[2.05rem] top-7 h-4 w-4 rounded-full border-4 border-white bg-indigo-600 sm:-left-[2.55rem]" />
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">{month.label}</p>
                          <h3 className="mt-2 text-2xl font-black">{month.reflection}</h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{month.signals.length} moment{month.signals.length === 1 ? "" : "s"}</span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {month.themes.slice(0, 5).map(([theme, count]) => <span key={theme} className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">{theme} · {count}</span>)}
                      </div>

                      <div className="mt-5 space-y-3">
                        {month.signals.map((signal) => (
                          <div key={signal.id} className="rounded-2xl bg-slate-50 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div><p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-700">{signal.type}</p><p className="mt-1 font-bold">{signal.label}</p>{signal.passage && <p className="mt-1 text-sm text-slate-500">{signal.passage}</p>}</div>
                              <span className="text-xs text-slate-400">{new Date(signal.occurredAt).toLocaleDateString()}</span>
                            </div>
                            {signal.note && <p className="mt-3 text-sm leading-6 text-slate-600">{signal.note}</p>}
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            {view === "themes" && (
              <>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Theme map</p>
                <h2 className="mt-2 text-3xl font-black">What has repeatedly drawn your attention</h2>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  {themeTotals.map(([theme, count]) => (
                    <div key={theme} className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex items-center justify-between gap-4"><h3 className="font-black">{theme}</h3><span className="text-sm font-bold text-indigo-700">{count}</span></div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, count * 22)}%` }} /></div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {view === "passages" && (
              <>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Passage history</p>
                <h2 className="mt-2 text-3xl font-black">The Scriptures you have revisited</h2>
                <div className="mt-7 space-y-3">
                  {passageTotals.map(([passage, count]) => (
                    <div key={passage} className="flex items-center justify-between rounded-2xl border border-slate-200 p-5">
                      <div><h3 className="font-black">{passage}</h3><p className="mt-1 text-sm text-slate-500">Studied across {count} recorded moment{count === 1 ? "" : "s"}</p></div>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">{count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Long-term reflection</p>
              <h2 className="mt-2 text-2xl font-black">What has shifted?</h2>
              <p className="mt-3 text-sm leading-6 text-indigo-100/65">Your recent history moved from Christ’s identity and creation toward trust, prayer, waiting, and obedience.</p>
              <button type="button" onClick={addCurrentSeason} className="mt-5 w-full rounded-full bg-amber-300 px-4 py-2.5 text-sm font-black text-slate-950">Mark This Season</button>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Underexplored areas</p>
              <h2 className="mt-2 text-2xl font-black">Places you have rarely visited</h2>
              <p className="mt-3 text-sm leading-6 text-indigo-100/65">These are invitations, not deficiencies. Emmaus uses them to widen your journey without interrupting your current thread.</p>
              <div className="mt-5 flex flex-wrap gap-2">{underexplored.map((theme) => <span key={theme} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs font-semibold text-indigo-100">{theme}</span>)}</div>
              <Link href="/emmaus/explore" className="mt-5 inline-flex text-sm font-bold text-amber-300">Explore a new area →</Link>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Guardrail</p>
              <h2 className="mt-2 text-2xl font-black">A record, not a verdict</h2>
              <p className="mt-3 text-sm leading-6 text-indigo-100/65">The Timeline reports study history. It does not claim to measure spiritual maturity, divine approval, or the complete work God is doing in a person.</p>
              <button type="button" onClick={reset} className="mt-5 w-full rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold">Reset demonstration</button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function buildMonths(signals: TimelineSignal[]): MonthSummary[] {
  const grouped = new Map<string, TimelineSignal[]>();
  signals.forEach((signal) => {
    const date = new Date(signal.occurredAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    grouped.set(key, [...(grouped.get(key) ?? []), signal]);
  });

  return [...grouped.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, monthSignals]) => {
      const date = new Date(`${key}-01T12:00:00`);
      const themes = countThemes(monthSignals);
      return {
        key,
        label: date.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
        signals: [...monthSignals].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)),
        themes,
        passages: [...new Set(monthSignals.map((signal) => signal.passage).filter(Boolean) as string[])],
        reflection: summarizeMonth(themes, monthSignals),
      };
    });
}

function countThemes(signals: TimelineSignal[]) {
  const counts = new Map<string, number>();
  signals.forEach((signal) => signal.themes.forEach((theme) => counts.set(theme, (counts.get(theme) ?? 0) + 1)));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function countPassages(signals: TimelineSignal[]) {
  const counts = new Map<string, number>();
  signals.forEach((signal) => {
    if (signal.passage) counts.set(signal.passage, (counts.get(signal.passage) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function summarizeMonth(themes: Array<[string, number]>, signals: TimelineSignal[]) {
  const first = themes[0]?.[0];
  const second = themes[1]?.[0];
  if (!first) return "A new season of study began.";
  if (signals.some((signal) => signal.type === "journal") && second) return `Your study of ${first} began moving toward personal response through ${second}.`;
  if (signals.some((signal) => signal.type === "prayer") && second) return `Your attention centered on ${first}, with prayer repeatedly connecting it to ${second}.`;
  if (second) return `You repeatedly explored ${first} and its connection to ${second}.`;
  return `${first} became the primary thread of this season.`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-sm text-indigo-100/55">{label}</p></div>;
}
