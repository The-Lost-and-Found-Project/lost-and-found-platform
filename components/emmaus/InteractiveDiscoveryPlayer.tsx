"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { EmmausDiscoveryContent } from "@/lib/emmaus/content-packs/john-1";

type Props = {
  packId: string;
  packTitle: string;
  discovery: EmmausDiscoveryContent;
};

type Step = {
  id: string;
  label: string;
  prompt: string;
  kind: "response" | "prayer" | "summary";
};

type SaveState = "loading" | "saved" | "saving" | "error";

export default function InteractiveDiscoveryPlayer({ packId, packTitle, discovery }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const steps = useMemo<Step[]>(() => [
    { id: "opening-prayer", label: "Prepare", prompt: discovery.openingPrayer, kind: "prayer" },
    { id: "opening-question", label: "Observe", prompt: discovery.openingQuestion, kind: "response" },
    ...discovery.probingQuestions.map((prompt, index) => ({ id: `probe-${index}`, label: `Explore ${index + 1}`, prompt, kind: "response" as const })),
    { id: "application", label: "Apply", prompt: discovery.applicationPrompt, kind: "response" },
    { id: "journal", label: "Journal", prompt: discovery.journalPrompt, kind: "response" },
    { id: "closing-prayer", label: "Pray", prompt: discovery.closingPrayer, kind: "prayer" },
    { id: "complete", label: "Complete", prompt: "Review what you discovered and name the clearest next step you will carry forward.", kind: "summary" },
  ], [discovery]);

  const [stepIndex, setStepIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [revealedClues, setRevealedClues] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const hydrated = useRef(false);

  const step = steps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);
  const response = responses[step.id] ?? "";
  const canContinue = step.kind !== "response" || response.trim().length >= 3;

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user || cancelled) {
        setSaveState("error");
        hydrated.current = true;
        return;
      }

      setUserId(user.id);
      const { data, error } = await supabase
        .from("emmaus_discovery_progress")
        .select("current_step, responses, revealed_clues, is_completed")
        .eq("user_id", user.id)
        .eq("pack_id", packId)
        .eq("discovery_id", discovery.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Failed to load Emmaus progress:", error);
        setSaveState("error");
        hydrated.current = true;
        return;
      }

      if (data) {
        const safeStep = Math.min(Math.max(data.current_step ?? 0, 0), steps.length - 1);
        setStepIndex(safeStep);
        setResponses((data.responses as Record<string, string>) ?? {});
        setRevealedClues(Math.min(data.revealed_clues ?? 0, discovery.clues.length));
        setCompleted(Boolean(data.is_completed));
      }

      setSaveState("saved");
      hydrated.current = true;
    }

    loadProgress();
    return () => {
      cancelled = true;
    };
  }, [discovery.clues.length, discovery.id, packId, steps.length, supabase]);

  useEffect(() => {
    if (!hydrated.current || !userId) return;

    const timer = window.setTimeout(async () => {
      setSaveState("saving");
      const { error } = await supabase
        .from("emmaus_discovery_progress")
        .upsert({
          user_id: userId,
          pack_id: packId,
          discovery_id: discovery.id,
          current_step: stepIndex,
          responses,
          revealed_clues: revealedClues,
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
        }, { onConflict: "user_id,pack_id,discovery_id" });

      if (error) {
        console.error("Failed to save Emmaus progress:", error);
        setSaveState("error");
      } else {
        setSaveState("saved");
      }
    }, 650);

    return () => window.clearTimeout(timer);
  }, [completed, discovery.id, packId, responses, revealedClues, stepIndex, supabase, userId]);

  function next() {
    if (!canContinue) return;
    if (stepIndex === steps.length - 1) {
      setCompleted(true);
      return;
    }
    setStepIndex((current) => current + 1);
    setRevealedClues(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previous() {
    setStepIndex((current) => Math.max(0, current - 1));
    setRevealedClues(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function restartDiscovery() {
    setCompleted(false);
    setStepIndex(0);
    setResponses({});
    setRevealedClues(0);

    if (userId) {
      await supabase
        .from("emmaus_discovery_progress")
        .update({
          current_step: 0,
          responses: {},
          revealed_clues: 0,
          is_completed: false,
          completed_at: null,
        })
        .eq("user_id", userId)
        .eq("pack_id", packId)
        .eq("discovery_id", discovery.id);
    }
  }

  if (saveState === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-amber-300" />
          <p className="mt-5 font-black">Loading your discovery...</p>
        </div>
      </main>
    );
  }

  if (completed) {
    const answered = Object.values(responses).filter((value) => value.trim()).length;
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-12 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/15 text-4xl ring-1 ring-emerald-300/30" aria-hidden="true">✓</span>
          <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-amber-300">Discovery Complete</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">You slowed down and discovered.</h1>
          <p className="mt-5 text-lg leading-8 text-indigo-100/75">You completed {discovery.title} and recorded {answered} written responses. Your progress has been saved.</p>

          <div className="mt-9 grid gap-4 text-left sm:grid-cols-2">
            <SummaryCard title="Application" text={responses.application || discovery.applicationPrompt} />
            <SummaryCard title="Journal" text={responses.journal || discovery.journalPrompt} />
          </div>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href={`/emmaus/content/${packId}`} className="rounded-full bg-white px-5 py-3 font-black text-indigo-800 shadow-xl">Return to Pack</Link>
            <button type="button" onClick={restartDiscovery} className="rounded-full border border-white/25 bg-white/10 px-5 py-3 font-black text-white">Review Again</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-indigo-50/60 pb-28 lg:pb-12">
      <header className="border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link href={`/emmaus/content/${packId}`} className="text-sm font-black text-indigo-700">← Exit Discovery</Link>
          <div className="min-w-0 text-right">
            <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-slate-400">{packTitle}</p>
            <p className="truncate font-black text-slate-950">{discovery.passage}</p>
            <p className={`mt-1 text-xs font-bold ${saveState === "error" ? "text-rose-600" : "text-slate-400"}`} aria-live="polite">
              {saveState === "saving" ? "Saving..." : saveState === "error" ? "Progress could not be saved" : "Progress saved"}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">{step.label}</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{discovery.title}</h1>
              <p className="mt-3 text-lg leading-8 text-indigo-100/70">{discovery.subtitle}</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-black text-indigo-100">{stepIndex + 1} / {steps.length}</span>
          </div>
          <div className="mt-8 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </section>

        <section className="mt-7 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
          {step.kind === "prayer" ? (
            <div className="text-center">
              <span className="text-4xl" aria-hidden="true">🙏</span>
              <p className="mx-auto mt-6 max-w-3xl text-xl italic leading-9 text-slate-700">{step.prompt}</p>
              <p className="mt-5 text-sm font-semibold text-slate-500">Read this prayer slowly, or pray it in your own words.</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Discovery Prompt</p>
              <h2 className="mt-3 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">{step.prompt}</h2>

              {step.kind === "response" && (
                <div className="mt-7">
                  <label htmlFor="discovery-response" className="block text-sm font-black text-slate-700">Your discovery</label>
                  <textarea
                    id="discovery-response"
                    rows={7}
                    value={response}
                    onChange={(event) => setResponses((current) => ({ ...current, [step.id]: event.target.value }))}
                    placeholder="Write what you observe, conclude, question, or plan to do..."
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-4 leading-7 text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              )}

              {step.kind === "summary" && (
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <SummaryCard title="Application" text={responses.application || "No application response recorded yet."} />
                  <SummaryCard title="Journal" text={responses.journal || "No journal response recorded yet."} />
                </div>
              )}
            </>
          )}

          {step.kind === "response" && discovery.clues.length > 0 && (
            <div className="mt-7 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => setRevealedClues((count) => Math.min(discovery.clues.length, count + 1))}
                disabled={revealedClues >= discovery.clues.length}
                className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-black text-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {revealedClues >= discovery.clues.length ? "All clues revealed" : "Need a clue?"}
              </button>
              {revealedClues > 0 && (
                <div className="mt-4 space-y-3">
                  {discovery.clues.slice(0, revealedClues).map((clue, index) => (
                    <div key={clue} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
                      <p className="text-xs font-black uppercase tracking-[0.12em]">Clue {index + 1}</p>
                      <p className="mt-1 leading-7">{clue}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <div className="mt-7 flex items-center justify-between gap-4">
          <button type="button" onClick={previous} disabled={stepIndex === 0} className="rounded-full border border-slate-300 bg-white px-5 py-3 font-black text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
          <button type="button" onClick={next} disabled={!canContinue} className="rounded-full bg-indigo-600 px-6 py-3 font-black text-white shadow-xl transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">
            {stepIndex === steps.length - 1 ? "Complete Discovery" : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{title}</p><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">{text}</p></div>;
}
