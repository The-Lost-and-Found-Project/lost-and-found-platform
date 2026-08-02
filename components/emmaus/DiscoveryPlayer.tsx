"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DiscoveryPlayerProps = {
  title?: string;
  subtitle?: string;
  reference?: string;
  translation?: string;
  passage?: Array<{ verse: number; text: string }>;
  prompts?: {
    observe?: string;
    wonder?: string;
    reflect?: string;
    pray?: string;
  };
};

type StepKey = "opening" | "scripture" | "observe" | "wonder" | "reflect" | "pray" | "journal" | "complete";

type Responses = Record<"observe" | "wonder" | "reflect" | "pray" | "journal", string>;

const steps: Array<{ key: StepKey; label: string }> = [
  { key: "opening", label: "Begin" },
  { key: "scripture", label: "Scripture" },
  { key: "observe", label: "Observe" },
  { key: "wonder", label: "Wonder" },
  { key: "reflect", label: "Apply" },
  { key: "pray", label: "Pray" },
  { key: "journal", label: "Journal" },
  { key: "complete", label: "Complete" },
];

const fallbackPassage = [
  { verse: 1, text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
  { verse: 2, text: "The same was in the beginning with God." },
  { verse: 3, text: "All things were made by him; and without him was not any thing made that was made." },
  { verse: 4, text: "In him was life; and the life was the light of men." },
  { verse: 5, text: "And the light shineth in darkness; and the darkness comprehended it not." },
];

export default function DiscoveryPlayer({
  title = "The Eternal Word",
  subtitle = "A guided discovery through John 1",
  reference = "John 1:1–5",
  translation = "KJV",
  passage = fallbackPassage,
  prompts = {},
}: DiscoveryPlayerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [responses, setResponses] = useState<Responses>({ observe: "", wonder: "", reflect: "", pray: "", journal: "" });
  const [startedAt] = useState(() => Date.now());
  const storageKey = useMemo(() => `emmaus-player:${slugify(title)}:${reference}`, [title, reference]);
  const current = steps[stepIndex];
  const progress = Math.round((stepIndex / (steps.length - 1)) * 100);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { stepIndex?: number; responses?: Partial<Responses> };
      if (Number.isInteger(parsed.stepIndex)) setStepIndex(Math.min(Math.max(parsed.stepIndex ?? 0, 0), steps.length - 1));
      if (parsed.responses) setResponses((currentResponses) => ({ ...currentResponses, ...parsed.responses }));
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ stepIndex, responses }));
  }, [responses, stepIndex, storageKey]);

  function updateResponse(key: keyof Responses, value: string) {
    setResponses((currentResponses) => ({ ...currentResponses, [key]: value }));
  }

  function next() {
    setStepIndex((index) => Math.min(index + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previous() {
    setStepIndex((index) => Math.max(index - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restart() {
    setStepIndex(0);
    setResponses({ observe: "", wonder: "", reflect: "", pray: "", journal: "" });
    window.localStorage.removeItem(storageKey);
  }

  const elapsedMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">Emmaus Discovery</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">{title}</h1>
              <p className="mt-2 text-indigo-100/70">{subtitle}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right">
              <p className="font-bold">{reference}</p>
              <p className="text-xs text-indigo-100/60">{translation}</p>
            </div>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-indigo-100/60">
            <span>{current.label}</span>
            <span>{progress}% complete</span>
          </div>
        </header>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-2xl sm:p-10">
          {current.key === "opening" && (
            <div className="py-8 text-center sm:py-14">
              <div className="text-5xl" aria-hidden="true">🕊️</div>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Today’s journey</p>
              <h2 className="mt-3 text-4xl font-black">{title}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">Read slowly. Notice before interpreting. Answer honestly. The goal is discovery, not speed.</p>
              <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
                <Stat label="Passage" value={reference} />
                <Stat label="Estimated" value="10–15 min" />
                <Stat label="Format" value="Guided" />
              </div>
              <button type="button" onClick={next} className="mt-10 rounded-full bg-indigo-600 px-7 py-3 font-bold text-white shadow-lg transition hover:bg-indigo-500">Begin Discovery</button>
            </div>
          )}

          {current.key === "scripture" && (
            <StepLayout eyebrow="Read" title="Sit with the Scripture" description="Read the passage more than once. Tap nothing. Resist rushing to an answer.">
              <div className="space-y-4 rounded-3xl bg-stone-50 p-5 sm:p-7">
                {passage.map((item) => (
                  <p key={item.verse} className="text-lg leading-9 text-slate-800"><sup className="mr-2 font-black text-indigo-700">{item.verse}</sup>{item.text}</p>
                ))}
              </div>
            </StepLayout>
          )}

          {current.key === "observe" && (
            <PromptStep
              eyebrow="Observe"
              title="What do you notice?"
              prompt={prompts.observe || "What words, phrases, contrasts, or repeated ideas stand out in this passage?"}
              value={responses.observe}
              onChange={(value) => updateResponse("observe", value)}
              placeholder="Write only what you can see in the text..."
            />
          )}

          {current.key === "wonder" && (
            <PromptStep
              eyebrow="Wonder"
              title="What questions does the text raise?"
              prompt={prompts.wonder || "Why might the writer begin this way? What do you want to understand more deeply?"}
              value={responses.wonder}
              onChange={(value) => updateResponse("wonder", value)}
              placeholder="Write your questions without trying to solve them yet..."
            />
          )}

          {current.key === "reflect" && (
            <PromptStep
              eyebrow="Apply"
              title="What changes if this is true?"
              prompt={prompts.reflect || "What does this passage reveal about God, and where should it reshape your thinking, choices, or relationships?"}
              value={responses.reflect}
              onChange={(value) => updateResponse("reflect", value)}
              placeholder="Make the application specific and personal..."
            />
          )}

          {current.key === "pray" && (
            <PromptStep
              eyebrow="Pray"
              title="Turn discovery into conversation"
              prompt={prompts.pray || "Respond to God with praise, confession, thanksgiving, and a specific request."}
              value={responses.pray}
              onChange={(value) => updateResponse("pray", value)}
              placeholder="God, today I see..."
            />
          )}

          {current.key === "journal" && (
            <PromptStep
              eyebrow="Journal"
              title="Capture what you do not want to forget"
              prompt="In one paragraph, summarize what you discovered and what you will carry into today."
              value={responses.journal}
              onChange={(value) => updateResponse("journal", value)}
              placeholder="Today God showed me..."
            />
          )}

          {current.key === "complete" && (
            <div className="py-6 text-center sm:py-12">
              <div className="text-6xl" aria-hidden="true">✨</div>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Discovery complete</p>
              <h2 className="mt-3 text-4xl font-black">You stayed with the Word.</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-slate-600">Your responses are saved locally on this device. Account-based progress and XP will connect in a later build.</p>
              <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
                <Stat label="XP earned" value="25" />
                <Stat label="Steps" value="7" />
                <Stat label="Time" value={`${elapsedMinutes} min`} />
              </div>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={restart} className="rounded-full border border-slate-300 px-5 py-2.5 font-semibold text-slate-700">Restart</button>
                <Link href="/emmaus/admin/bible" className="rounded-full bg-indigo-600 px-6 py-2.5 font-bold text-white">Continue exploring Scripture</Link>
              </div>
            </div>
          )}

          {current.key !== "opening" && current.key !== "complete" && (
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-6">
              <button type="button" onClick={previous} className="rounded-full border border-slate-300 px-5 py-2.5 font-semibold text-slate-700">Back</button>
              <button type="button" onClick={next} className="rounded-full bg-indigo-600 px-6 py-2.5 font-bold text-white">Continue</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StepLayout({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">{eyebrow}</p><h2 className="mt-2 text-3xl font-black">{title}</h2><p className="mt-3 max-w-2xl leading-7 text-slate-600">{description}</p><div className="mt-7">{children}</div></div>;
}

function PromptStep({ eyebrow, title, prompt, value, onChange, placeholder }: { eyebrow: string; title: string; prompt: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <StepLayout eyebrow={eyebrow} title={title} description={prompt}><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={11} className="w-full rounded-2xl border border-slate-300 p-4 text-base leading-7 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /><p className="mt-2 text-right text-xs text-slate-400">Saved automatically on this device</p></StepLayout>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="font-black text-slate-900">{value}</p><p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{label}</p></div>;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
