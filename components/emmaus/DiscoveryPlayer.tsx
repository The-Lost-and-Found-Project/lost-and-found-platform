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

type StepKey = "welcome" | "prayer" | "read" | "observe" | "curiosity" | "probe" | "connect" | "apply" | "journal" | "closingPrayer" | "continue";
type ResponseKey = "observe" | "probe" | "connect" | "apply" | "journal";
type Responses = Record<ResponseKey, string>;

type CuriosityPath = {
  id: string;
  label: string;
  clue: string;
  probe: string;
  connection: string;
};

const steps: Array<{ key: StepKey; label: string }> = [
  { key: "welcome", label: "Begin" },
  { key: "prayer", label: "Pause" },
  { key: "read", label: "Read" },
  { key: "observe", label: "Observe" },
  { key: "curiosity", label: "Wonder" },
  { key: "probe", label: "Explore" },
  { key: "connect", label: "Connect" },
  { key: "apply", label: "Respond" },
  { key: "journal", label: "Remember" },
  { key: "closingPrayer", label: "Pray" },
  { key: "continue", label: "Continue" },
];

const fallbackPassage = [
  { verse: 1, text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
  { verse: 2, text: "The same was in the beginning with God." },
  { verse: 3, text: "All things were made by him; and without him was not any thing made that was made." },
  { verse: 4, text: "In him was life; and the life was the light of men." },
  { verse: 5, text: "And the light shineth in darkness; and the darkness comprehended it not." },
];

const curiosityPaths: CuriosityPath[] = [
  {
    id: "beginning",
    label: "In the beginning",
    clue: "John opens with the same three words that begin Genesis. That is unlikely to be accidental.",
    probe: "What does John communicate about Jesus by placing Him before creation itself? What would change if the Word began to exist later?",
    connection: "Read Genesis 1:1–3 beside John 1:1–3. List every parallel you notice before explaining any of them.",
  },
  {
    id: "word",
    label: "The Word",
    clue: "John could have written the name Jesus immediately, but he chose a title that carried meaning in both Jewish and Greek thought.",
    probe: "Why might 'the Word' be an appropriate title for the One who reveals God? What does a word do that silence cannot?",
    connection: "Compare John 1:1–3 with Hebrews 1:1–3 and Colossians 1:15–17. What shared claims are made about Christ?",
  },
  {
    id: "with-god",
    label: "With God",
    clue: "John distinguishes the Word from God while placing the Word in eternal relationship with God.",
    probe: "What does the phrase 'with God' require you to hold together about distinction, relationship, and eternity?",
    connection: "Read John 17:5 and John 17:24. What do those verses add to the phrase 'with God' in John 1:1?",
  },
  {
    id: "was-god",
    label: "Was God",
    clue: "John does not say the Word merely resembled God or represented God. His statement is direct.",
    probe: "How does 'the Word was God' shape the way you understand Jesus throughout the rest of John's Gospel?",
    connection: "Compare John 1:1 with John 20:28. How do the opening and closing sections of the Gospel reinforce one another?",
  },
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
  const [selectedPathId, setSelectedPathId] = useState(curiosityPaths[0].id);
  const [responses, setResponses] = useState<Responses>({ observe: "", probe: "", connect: "", apply: "", journal: "" });
  const [startedAt] = useState(() => Date.now());
  const storageKey = useMemo(() => `emmaus-player-v2:${slugify(title)}:${reference}`, [title, reference]);
  const current = steps[stepIndex];
  const selectedPath = curiosityPaths.find((path) => path.id === selectedPathId) ?? curiosityPaths[0];
  const progress = Math.round((stepIndex / (steps.length - 1)) * 100);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { stepIndex?: number; selectedPathId?: string; responses?: Partial<Responses> };
      if (Number.isInteger(parsed.stepIndex)) setStepIndex(Math.min(Math.max(parsed.stepIndex ?? 0, 0), steps.length - 1));
      if (parsed.selectedPathId && curiosityPaths.some((path) => path.id === parsed.selectedPathId)) setSelectedPathId(parsed.selectedPathId);
      if (parsed.responses) setResponses((currentResponses) => ({ ...currentResponses, ...parsed.responses }));
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ stepIndex, selectedPathId, responses }));
  }, [responses, selectedPathId, stepIndex, storageKey]);

  function updateResponse(key: ResponseKey, value: string) {
    setResponses((currentResponses) => ({ ...currentResponses, [key]: value }));
  }

  function move(direction: 1 | -1) {
    setStepIndex((index) => Math.min(Math.max(index + direction, 0), steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function restart() {
    setStepIndex(0);
    setSelectedPathId(curiosityPaths[0].id);
    setResponses({ observe: "", probe: "", connect: "", apply: "", journal: "" });
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
            <span>{progress}% through this walk</span>
          </div>
        </header>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-2xl sm:p-10">
          {current.key === "welcome" && (
            <div className="py-7 text-center sm:py-12">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Walk with Christ through His Word</p>
              <h2 className="mt-4 text-4xl font-black">Slow down. One verse may be enough.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">This is not a devotional checklist. You will observe closely, choose what makes you curious, follow a connection, and return to the text with sharper questions.</p>
              <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                <Stat label="Passage" value={reference} />
                <Stat label="Expected" value="20–35 min" />
                <Stat label="Depth" value="Branching study" />
              </div>
              <button type="button" onClick={() => move(1)} className="mt-10 rounded-full bg-indigo-600 px-7 py-3 font-bold text-white shadow-lg">Begin This Walk</button>
            </div>
          )}

          {current.key === "prayer" && (
            <StepLayout eyebrow="Pause" title="Begin with prayer" description="Study begins with dependence, not performance.">
              <PrayerCard>Father, thank You for giving us Your Word. Quiet the distractions around me and within me. Open my eyes to see what You have revealed, give me wisdom to understand it faithfully, and shape my heart to receive it humbly. Help me not simply gain knowledge, but know You more deeply and walk more closely with Christ. In Jesus' name, Amen.</PrayerCard>
            </StepLayout>
          )}

          {current.key === "read" && (
            <StepLayout eyebrow="Read" title="Read before reaching for an explanation" description="Read the passage twice. On the second reading, pay special attention to verse 1.">
              <div className="space-y-4 rounded-3xl bg-stone-50 p-5 sm:p-7">
                {passage.map((item) => <p key={item.verse} className="text-lg leading-9 text-slate-800"><sup className="mr-2 font-black text-indigo-700">{item.verse}</sup>{item.text}</p>)}
              </div>
              <ClueCard title="Look carefully">John makes several major claims before introducing Jesus by name. Do not rush past the wording.</ClueCard>
            </StepLayout>
          )}

          {current.key === "observe" && (
            <PromptStep eyebrow="Observe" title="Stay inside the text" prompt={prompts.observe || "List at least five observations from verse 1 alone. Notice repeated words, time language, relationships, and claims. Do not explain them yet."} value={responses.observe} onChange={(value) => updateResponse("observe", value)} placeholder="1. The verse begins...\n2. The word 'was' appears..." />
          )}

          {current.key === "curiosity" && (
            <StepLayout eyebrow="Wonder" title="Choose what you want to investigate" description="Your choice changes the next set of questions. You can return later and follow another path.">
              <div className="grid gap-3 sm:grid-cols-2">
                {curiosityPaths.map((path) => (
                  <button key={path.id} type="button" onClick={() => setSelectedPathId(path.id)} className={`rounded-2xl border p-5 text-left transition ${selectedPathId === path.id ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300"}`}>
                    <p className="font-black text-slate-950">{path.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{path.clue}</p>
                  </button>
                ))}
              </div>
              <ClueCard title="A clue, not an answer">{selectedPath.clue}</ClueCard>
            </StepLayout>
          )}

          {current.key === "probe" && (
            <PromptStep eyebrow="Explore" title={`Probe: ${selectedPath.label}`} prompt={prompts.wonder || selectedPath.probe} value={responses.probe} onChange={(value) => updateResponse("probe", value)} placeholder="Work through the wording carefully. Explain what the phrase requires you to conclude..." />
          )}

          {current.key === "connect" && (
            <PromptStep eyebrow="Connect" title="Let Scripture interpret Scripture" prompt={selectedPath.connection} value={responses.connect} onChange={(value) => updateResponse("connect", value)} placeholder="Passage 1 shows... Passage 2 adds... The connection appears to be..." />
          )}

          {current.key === "apply" && (
            <PromptStep eyebrow="Respond" title="Move from conclusion to conviction" prompt={prompts.reflect || "What does this path reveal about Jesus? Identify one belief, fear, priority, or habit that should change if this is true."} value={responses.apply} onChange={(value) => updateResponse("apply", value)} placeholder="Because Jesus is..., I need to..." />
          )}

          {current.key === "journal" && (
            <PromptStep eyebrow="Remember" title="Capture the discovery in your own words" prompt="Summarize the strongest conclusion you reached, the Scripture that supports it, and one question you still want to pursue." value={responses.journal} onChange={(value) => updateResponse("journal", value)} placeholder="Today I discovered... The clearest evidence was... I still want to understand..." />
          )}

          {current.key === "closingPrayer" && (
            <StepLayout eyebrow="Pray" title="Ask God to make truth visible in your life" description="Information is not the destination. Faithful response is.">
              <PrayerCard>Father, thank You for meeting with me through Your Word today. Do not allow this truth to remain only in my mind; plant it deeply in my heart. Show me where You are calling me to trust, obey, forgive, serve, or grow. Give me courage to live what I have discovered and wisdom to share it faithfully. Continue shaping me into the image of Christ. In Jesus' name, Amen.</PrayerCard>
            </StepLayout>
          )}

          {current.key === "continue" && (
            <div className="py-6 text-center sm:py-10">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">This walk continues</p>
              <h2 className="mt-3 text-4xl font-black">Where will your curiosity lead next?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">You spent approximately {elapsedMinutes} minute{elapsedMinutes === 1 ? "" : "s"} investigating <strong>{selectedPath.label}</strong>. Return to John 1:1 and follow another path, or continue exploring Scripture.</p>
              <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                <Stat label="Primary growth" value="Observation" />
                <Stat label="Path followed" value={selectedPath.label} />
                <Stat label="Next posture" value="Continue walking" />
              </div>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => { setStepIndex(4); setResponses((value) => ({ ...value, probe: "", connect: "" })); }} className="rounded-full border border-indigo-300 px-5 py-2.5 font-semibold text-indigo-700">Follow Another Path</button>
                <Link href="/emmaus/admin/bible" className="rounded-full bg-indigo-600 px-6 py-2.5 font-bold text-white">Continue Exploring Scripture</Link>
                <button type="button" onClick={restart} className="rounded-full border border-slate-300 px-5 py-2.5 font-semibold text-slate-600">Restart This Walk</button>
              </div>
            </div>
          )}

          {current.key !== "welcome" && current.key !== "continue" && (
            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-6">
              <button type="button" onClick={() => move(-1)} className="rounded-full border border-slate-300 px-5 py-2.5 font-semibold text-slate-700">Back</button>
              <button type="button" onClick={() => move(1)} className="rounded-full bg-indigo-600 px-6 py-2.5 font-bold text-white">{current.key === "closingPrayer" ? "Continue Walking" : "Continue"}</button>
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
  return <StepLayout eyebrow={eyebrow} title={title} description={prompt}><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={12} className="w-full rounded-2xl border border-slate-300 p-4 text-base leading-7 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /><p className="mt-2 text-right text-xs text-slate-400">Saved automatically on this device</p></StepLayout>;
}

function ClueCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">🧩 {title}</p><p className="mt-2 leading-7 text-slate-700">{children}</p></div>;
}

function PrayerCard({ children }: { children: React.ReactNode }) {
  return <blockquote className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 text-lg leading-8 text-slate-700">{children}</blockquote>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="font-black text-slate-900">{value}</p><p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{label}</p></div>;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
