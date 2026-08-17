"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Learner = {
  id: string;
  name: string;
  currentPassage: string;
  currentThread: string[];
  strengths: string[];
  growthAreas: string[];
  unresolvedQuestions: string[];
  prayerConnections: string[];
  difficultMoves: string[];
  recentEvidence: Array<{ type: string; label: string; date: string }>;
};

const learners: Learner[] = [
  {
    id: "learner-1",
    name: "Jordan",
    currentPassage: "John 1:1",
    currentThread: ["Jesus", "Identity", "Creation", "Trust"],
    strengths: ["Careful observation", "Honest questions", "Personal application"],
    growthAreas: ["Historical context", "Testing conclusions with multiple passages"],
    unresolvedQuestions: [
      "How can the Word be with God and also be God?",
      "Why does John use Logos instead of naming Jesus immediately?",
    ],
    prayerConnections: [
      "Wants to trust Christ more consistently during uncertainty.",
      "Asked for prayer about fear of making the wrong decision.",
    ],
    difficultMoves: ["Connect", "Test"],
    recentEvidence: [
      { type: "Workspace", label: "Recorded five observations from John 1:1", date: "Today" },
      { type: "Rabbit Trail", label: "Completed The Word — Logos", date: "2 days ago" },
      { type: "Journal", label: "Connected Christ's identity with personal trust", date: "4 days ago" },
    ],
  },
  {
    id: "learner-2",
    name: "Avery",
    currentPassage: "Psalm 27",
    currentThread: ["Prayer", "Waiting", "Fear", "Trust"],
    strengths: ["Prayerful reflection", "Consistency", "Emotional honesty"],
    growthAreas: ["Observation before application", "Biblical connections"],
    unresolvedQuestions: ["What does biblical waiting require beyond patience?"],
    prayerConnections: ["Praying for peace while waiting on an answer."],
    difficultMoves: ["Observe"],
    recentEvidence: [
      { type: "Discovery", label: "Studied waiting in Psalm 27", date: "Yesterday" },
      { type: "Prayer", label: "Prayed through fear and trust", date: "3 days ago" },
    ],
  },
];

export default function MentorWorkspacePage() {
  const [selectedId, setSelectedId] = useState(learners[0].id);
  const [mentorNote, setMentorNote] = useState("");
  const [intervention, setIntervention] = useState("conversation");
  const learner = learners.find((item) => item.id === selectedId) ?? learners[0];

  const suggestedQuestions = useMemo(() => {
    const move = learner.difficultMoves[0];
    if (move === "Observe") return [
      `Before explaining ${learner.currentPassage}, what words or repetitions do you notice?`,
      "Which detail in the text are you most tempted to skip past?",
    ];
    if (move === "Connect") return [
      `Which other passage would help test your reading of ${learner.currentPassage}?`,
      "What does the second passage add, and what does it not prove by itself?",
    ];
    return [
      "Which exact words in the passage support your conclusion?",
      "What alternative reading should we test before settling on an interpretation?",
    ];
  }, [learner]);

  function saveMentorPlan() {
    window.localStorage.setItem(`emmaus-mentor-plan:${learner.id}`, JSON.stringify({
      learnerId: learner.id,
      intervention,
      mentorNote,
      suggestedQuestions,
      savedAt: new Date().toISOString(),
    }));
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Emmaus Mentor Workspace</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">Shepherd the journey, not the score.</h1>
              <p className="mt-4 text-lg leading-8 text-indigo-100/75">See where a learner is engaging Scripture well, where they are getting stuck, and where a conversation may be wiser than assigning more content.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/emmaus/journey" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">Journey Engine</Link>
              <Link href="/emmaus/profile/learning" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">Learning Profile</Link>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[330px_1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Learners</p>
            <div className="mt-4 space-y-3">
              {learners.map((item) => (
                <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-full rounded-2xl border p-4 text-left ${item.id === learner.id ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-black/20"}`}>
                  <p className="font-black">{item.name}</p>
                  <p className="mt-1 text-sm text-indigo-100/60">{item.currentPassage}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{item.currentThread.slice(0, 3).map((theme) => <span key={theme} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-indigo-100/70">{theme}</span>)}</div>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Current learner</p><h2 className="mt-2 text-4xl font-black">{learner.name}</h2><p className="mt-2 text-lg text-slate-600">Currently studying {learner.currentPassage}</p></div>
                <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700">Current thread: {learner.currentThread.join(" · ")}</span>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <Insight title="Current strengths" items={learner.strengths} tone="success" />
                <Insight title="Growth invitations" items={learner.growthAreas} tone="warning" />
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-2">
                <Panel title="Unresolved questions" eyebrow="Listen closely">
                  {learner.unresolvedQuestions.map((question) => <div key={question} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 leading-7">{question}</div>)}
                </Panel>
                <Panel title="Prayer connections" eyebrow="Pray with context">
                  {learner.prayerConnections.map((item) => <div key={item} className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 leading-7 text-indigo-950">{item}</div>)}
                </Panel>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Suggested mentor intervention</p>
                <h2 className="mt-2 text-3xl font-black">Choose relationship before assignment.</h2>
                <p className="mt-3 leading-7 text-slate-600">Emmaus detected recurring difficulty with <strong>{learner.difficultMoves.join(" and ")}</strong>. A guided conversation may be more helpful than adding another Discovery immediately.</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[{ id: "conversation", label: "Have a conversation" }, { id: "study", label: "Study together" }, { id: "assign", label: "Recommend next walk" }].map((option) => <button key={option.id} type="button" onClick={() => setIntervention(option.id)} className={`rounded-2xl border p-4 text-left font-bold ${intervention === option.id ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200"}`}>{option.label}</button>)}
                </div>

                <div className="mt-7">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-indigo-700">Questions to ask</p>
                  <div className="mt-3 space-y-3">{suggestedQuestions.map((question) => <div key={question} className="rounded-2xl border border-slate-200 p-4 font-semibold leading-7">{question}</div>)}</div>
                </div>

                <label className="mt-7 block text-sm font-black text-slate-700">Mentor note<textarea value={mentorNote} onChange={(event) => setMentorNote(event.target.value)} rows={7} placeholder="Record what to ask, what to pray about, and what not to rush..." className="mt-2 w-full rounded-2xl border border-slate-300 p-4 font-normal leading-7 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label>
                <button type="button" onClick={saveMentorPlan} className="mt-5 rounded-full bg-indigo-600 px-6 py-3 font-black text-white">Save Mentor Plan</button>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Recent evidence</p>
                <h2 className="mt-2 text-2xl font-black">What shaped this recommendation</h2>
                <div className="mt-5 space-y-4">{learner.recentEvidence.map((item) => <div key={`${item.type}-${item.label}`} className="border-l-2 border-indigo-400/40 pl-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-300">{item.type}</p><p className="mt-1 font-semibold">{item.label}</p><p className="mt-1 text-xs text-indigo-100/45">{item.date}</p></div>)}</div>

                <div className="mt-7 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-200">Mentor guardrail</p>
                  <p className="mt-3 text-sm leading-6 text-amber-50/75">This workspace surfaces study patterns. It does not expose private journals without permission, diagnose spiritual maturity, or replace prayerful human discernment.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Insight({ title, items, tone }: { title: string; items: string[]; tone: "success" | "warning" }) {
  const classes = tone === "success" ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50";
  return <div className={`rounded-3xl border p-5 ${classes}`}><h3 className="text-xl font-black">{title}</h3><div className="mt-4 space-y-3">{items.map((item) => <p key={item} className="rounded-2xl bg-white/70 p-4 text-sm font-semibold leading-6">{item}</p>)}</div></div>;
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return <div><p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{eyebrow}</p><h3 className="mt-2 text-2xl font-black">{title}</h3><div className="mt-4 space-y-3">{children}</div></div>;
}
