"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Dimension = "literacy" | "observation" | "connections" | "context" | "theology" | "application";
type SignalType = "assessment" | "discovery" | "rabbit_trail" | "workspace" | "journal";

type DimensionScore = {
  score: number;
  confidence: number;
  evidence: number;
  trend: number;
};

type LearningSignal = {
  id: string;
  type: SignalType;
  label: string;
  occurredAt: string;
  impacts: Partial<Record<Dimension, number>>;
};

type LearningProfile = {
  dimensions: Record<Dimension, DimensionScore>;
  signals: LearningSignal[];
  recommendedDepth: "Foundational" | "Growing" | "Deep";
  updatedAt: string;
};

const labels: Record<Dimension, string> = {
  literacy: "Bible Familiarity",
  observation: "Observation",
  connections: "Biblical Connections",
  context: "Historical Context",
  theology: "Theological Understanding",
  application: "Application",
};

const defaultProfile: LearningProfile = {
  dimensions: {
    literacy: { score: 62, confidence: 55, evidence: 2, trend: 0 },
    observation: { score: 74, confidence: 68, evidence: 3, trend: 4 },
    connections: { score: 58, confidence: 52, evidence: 2, trend: 2 },
    context: { score: 42, confidence: 40, evidence: 1, trend: 0 },
    theology: { score: 70, confidence: 63, evidence: 2, trend: 3 },
    application: { score: 66, confidence: 61, evidence: 2, trend: 1 },
  },
  signals: [],
  recommendedDepth: "Growing",
  updatedAt: new Date().toISOString(),
};

const demonstrationSignals: LearningSignal[] = [
  {
    id: "john-observation",
    type: "workspace",
    label: "Recorded five observations from John 1:1",
    occurredAt: new Date().toISOString(),
    impacts: { observation: 5, theology: 1 },
  },
  {
    id: "logos-trail",
    type: "rabbit_trail",
    label: "Completed The Word — Logos Rabbit Trail",
    occurredAt: new Date().toISOString(),
    impacts: { connections: 5, theology: 3, context: 1 },
  },
  {
    id: "john-journal",
    type: "journal",
    label: "Journaled a specific response to Christ's eternal identity",
    occurredAt: new Date().toISOString(),
    impacts: { application: 4, theology: 1 },
  },
];

export default function LearningProfilePage() {
  const storageKey = "emmaus-living-learning-profile-v1";
  const [profile, setProfile] = useState<LearningProfile>(defaultProfile);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      const assessment = window.localStorage.getItem("emmaus-assessment-profile");
      if (saved) {
        setProfile(JSON.parse(saved) as LearningProfile);
        return;
      }
      if (assessment) {
        const parsed = JSON.parse(assessment) as { profile?: Array<{ dimension: Dimension; score: number; confidenceScore?: number }>; recommendedDepth?: LearningProfile["recommendedDepth"] };
        if (parsed.profile) {
          setProfile((current) => ({
            ...current,
            recommendedDepth: parsed.recommendedDepth ?? current.recommendedDepth,
            dimensions: parsed.profile.reduce((acc, item) => {
              acc[item.dimension] = {
                score: item.score,
                confidence: Math.round((item.confidenceScore ?? 1) * 50),
                evidence: 1,
                trend: 0,
              };
              return acc;
            }, { ...current.dimensions }),
          }));
        }
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(profile));
  }, [profile]);

  const ordered = useMemo(() => {
    return (Object.keys(profile.dimensions) as Dimension[])
      .map((dimension) => ({ dimension, ...profile.dimensions[dimension] }))
      .sort((a, b) => b.score - a.score);
  }, [profile]);

  const strengths = ordered.slice(0, 2);
  const growth = [...ordered].reverse().slice(0, 2);
  const average = Math.round(ordered.reduce((sum, item) => sum + item.score, 0) / ordered.length);

  function applySignal(signal: LearningSignal) {
    setProfile((current) => {
      if (current.signals.some((item) => item.id === signal.id)) return current;
      const nextDimensions = { ...current.dimensions };
      (Object.entries(signal.impacts) as Array<[Dimension, number]>).forEach(([dimension, impact]) => {
        const before = nextDimensions[dimension];
        const nextScore = Math.min(100, Math.round((before.score * before.evidence + Math.min(100, before.score + impact * 4)) / (before.evidence + 1)));
        nextDimensions[dimension] = {
          score: nextScore,
          confidence: Math.min(100, before.confidence + impact * 2),
          evidence: before.evidence + 1,
          trend: nextScore - before.score,
        };
      });
      const nextAverage = Object.values(nextDimensions).reduce((sum, item) => sum + item.score, 0) / Object.keys(nextDimensions).length;
      return {
        dimensions: nextDimensions,
        signals: [signal, ...current.signals].slice(0, 20),
        recommendedDepth: nextAverage >= 78 ? "Deep" : nextAverage >= 52 ? "Growing" : "Foundational",
        updatedAt: new Date().toISOString(),
      };
    });
    setMessage("Learning profile updated from new study evidence.");
    window.setTimeout(() => setMessage(""), 2200);
  }

  function resetProfile() {
    setProfile(defaultProfile);
    window.localStorage.removeItem(storageKey);
    setMessage("Profile reset to demonstration data.");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Your Emmaus Journey</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">Living Learning Profile</h1>
              <p className="mt-4 text-lg leading-8 text-indigo-100/75">A changing picture of how you engage Scripture. It guides Emmaus without ranking your spiritual maturity.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/emmaus/assessment" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">Retake Assessment</Link>
              <Link href="/emmaus/discovery/demo" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">Continue Walking</Link>
            </div>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Stat label="Recommended depth" value={profile.recommendedDepth} />
            <Stat label="Profile average" value={`${average}%`} />
            <Stat label="Study evidence" value={`${Object.values(profile.dimensions).reduce((sum, item) => sum + item.evidence, 0)} signals`} />
          </div>
        </header>

        {message && <div className="mt-5 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-center font-semibold text-emerald-200">{message}</div>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Current profile</p>
            <h2 className="mt-2 text-3xl font-black">How Emmaus currently understands your study needs</h2>

            <div className="mt-7 space-y-5">
              {ordered.map((item) => (
                <div key={item.dimension} className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div><h3 className="font-black">{labels[item.dimension]}</h3><p className="mt-1 text-sm text-slate-500">{describe(item.score)} · {item.evidence} evidence point{item.evidence === 1 ? "" : "s"}</p></div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.trend > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{item.trend > 0 ? `+${item.trend}` : "Stable"}</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${item.score}%` }} /></div>
                  <div className="mt-3 flex justify-between text-xs text-slate-500"><span>Demonstrated understanding: {item.score}%</span><span>Confidence: {item.confidence}%</span></div>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <ProfileGroup title="Current strengths" items={strengths} />
              <ProfileGroup title="Growth invitations" items={growth} />
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Demonstrate adaptation</p>
              <h2 className="mt-2 text-2xl font-black">Add study evidence</h2>
              <p className="mt-3 text-sm leading-6 text-indigo-100/65">These sample signals model how completed Discoveries, Rabbit Trails, workspaces, and journals will update the profile.</p>
              <div className="mt-5 space-y-3">
                {demonstrationSignals.map((signal) => {
                  const used = profile.signals.some((item) => item.id === signal.id);
                  return <button key={signal.id} type="button" disabled={used} onClick={() => applySignal(signal)} className="w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-amber-300/40 disabled:opacity-45"><p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-300">{signal.type.replace("_", " ")}</p><p className="mt-2 font-semibold">{signal.label}</p><p className="mt-2 text-xs text-indigo-100/50">{used ? "Already applied" : "Apply to profile →"}</p></button>;
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Recent evidence</p>
              <h2 className="mt-2 text-2xl font-black">What shaped this profile</h2>
              <div className="mt-5 space-y-4">
                {profile.signals.length ? profile.signals.map((signal) => <div key={signal.id} className="border-l-2 border-indigo-400/40 pl-4"><p className="font-semibold">{signal.label}</p><p className="mt-1 text-xs text-indigo-100/45">{new Date(signal.occurredAt).toLocaleString()}</p></div>) : <p className="text-sm leading-6 text-indigo-100/60">Complete the assessment or add study evidence to begin building your history.</p>}
              </div>
              <button type="button" onClick={resetProfile} className="mt-6 w-full rounded-full border border-white/20 px-4 py-2.5 text-sm font-semibold">Reset demonstration</button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function describe(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 55) return "Growing";
  return "Developing";
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-sm text-indigo-100/55">{label}</p></div>;
}

function ProfileGroup({ title, items }: { title: string; items: Array<{ dimension: Dimension; score: number }> }) {
  return <div className="rounded-3xl border border-slate-200 p-5"><h3 className="text-xl font-black">{title}</h3><div className="mt-4 space-y-3">{items.map((item) => <div key={item.dimension} className="rounded-2xl bg-slate-50 p-4"><p className="font-bold">{labels[item.dimension]}</p><p className="mt-1 text-sm text-slate-500">{describe(item.score)}</p></div>)}</div></div>;
}
