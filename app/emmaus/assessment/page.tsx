"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Dimension = "literacy" | "observation" | "connections" | "context" | "theology" | "application";
type AnswerMap = Record<string, number>;

type Question = {
  id: string;
  section: string;
  prompt: string;
  dimension: Dimension;
  options: Array<{ label: string; value: number; confidenceLabel?: string }>;
};

const questions: Question[] = [
  {
    id: "walk-frequency",
    section: "Your Walk",
    prompt: "How often do you intentionally spend time studying Scripture?",
    dimension: "application",
    options: [
      { label: "Rarely", value: 0 },
      { label: "A few times each month", value: 1 },
      { label: "Most weeks", value: 2 },
      { label: "Several times each week", value: 3 },
    ],
  },
  {
    id: "bible-navigation",
    section: "Bible Foundations",
    prompt: "How comfortable are you locating books, chapters, and verses without help?",
    dimension: "literacy",
    options: [
      { label: "I usually need help", value: 0 },
      { label: "I know the major books", value: 1 },
      { label: "I can navigate most of the Bible", value: 2 },
      { label: "I navigate Scripture confidently", value: 3 },
    ],
  },
  {
    id: "sermon-mount",
    section: "Bible Foundations",
    prompt: "Which Gospel contains the Sermon on the Mount?",
    dimension: "literacy",
    options: [
      { label: "Matthew", value: 3, confidenceLabel: "Correct" },
      { label: "Mark", value: 0 },
      { label: "Luke only", value: 1 },
      { label: "John", value: 0 },
    ],
  },
  {
    id: "john-observe",
    section: "Observation",
    prompt: "In John 1:1, which observation should come before interpretation?",
    dimension: "observation",
    options: [
      { label: "The word ‘was’ appears three times", value: 3 },
      { label: "John is proving one denomination is correct", value: 0 },
      { label: "The verse is mainly about personal success", value: 0 },
      { label: "The passage is too mysterious to study", value: 0 },
    ],
  },
  {
    id: "genesis-john",
    section: "Connections",
    prompt: "Why might John begin with the words ‘In the beginning’?",
    dimension: "connections",
    options: [
      { label: "To echo Genesis and place the Word before creation", value: 3 },
      { label: "Because every ancient book began that way", value: 0 },
      { label: "To introduce John the Baptist", value: 0 },
      { label: "Only to mark the first day of Jesus’ ministry", value: 1 },
    ],
  },
  {
    id: "samaria-context",
    section: "Historical Context",
    prompt: "Why is Jesus speaking with a Samaritan woman culturally significant?",
    dimension: "context",
    options: [
      { label: "Jewish-Samaritan hostility and social boundaries made the encounter unexpected", value: 3 },
      { label: "Samaritans were Roman officials", value: 0 },
      { label: "Women were forbidden to speak outdoors", value: 0 },
      { label: "Samaria was outside the biblical world", value: 0 },
    ],
  },
  {
    id: "hebrews-priesthood",
    section: "Biblical Connections",
    prompt: "Which New Testament book develops Old Testament priesthood and sacrifice most extensively?",
    dimension: "connections",
    options: [
      { label: "Hebrews", value: 3 },
      { label: "Philemon", value: 0 },
      { label: "2 John", value: 0 },
      { label: "Acts", value: 1 },
    ],
  },
  {
    id: "john-theology",
    section: "Interpretation",
    prompt: "What must John 1:1 hold together about the Word?",
    dimension: "theology",
    options: [
      { label: "The Word is personally distinct from God and fully divine", value: 3 },
      { label: "The Word is merely a created messenger", value: 0 },
      { label: "The Word is only a poetic symbol with no identity", value: 0 },
      { label: "The verse says nothing meaningful about Jesus", value: 0 },
    ],
  },
  {
    id: "application-response",
    section: "Application",
    prompt: "After discovering a biblical truth, what is the strongest next step?",
    dimension: "application",
    options: [
      { label: "Pray, identify a faithful response, and act on it", value: 3 },
      { label: "Move on immediately to collect more information", value: 0 },
      { label: "Assume knowledge automatically produces obedience", value: 0 },
      { label: "Wait until someone else applies it first", value: 0 },
    ],
  },
];

const dimensionLabels: Record<Dimension, string> = {
  literacy: "Bible Familiarity",
  observation: "Observation",
  connections: "Biblical Connections",
  context: "Historical Context",
  theology: "Theological Understanding",
  application: "Application",
};

export default function EmmausAssessmentPage() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [complete, setComplete] = useState(false);
  const question = questions[index];
  const progress = Math.round(((index + 1) / questions.length) * 100);

  const profile = useMemo(() => {
    const totals: Record<Dimension, { earned: number; possible: number; confidence: number; count: number }> = {
      literacy: { earned: 0, possible: 0, confidence: 0, count: 0 },
      observation: { earned: 0, possible: 0, confidence: 0, count: 0 },
      connections: { earned: 0, possible: 0, confidence: 0, count: 0 },
      context: { earned: 0, possible: 0, confidence: 0, count: 0 },
      theology: { earned: 0, possible: 0, confidence: 0, count: 0 },
      application: { earned: 0, possible: 0, confidence: 0, count: 0 },
    };

    questions.forEach((item) => {
      totals[item.dimension].earned += answers[item.id] ?? 0;
      totals[item.dimension].possible += 3;
      totals[item.dimension].confidence += confidence[item.id] ?? 1;
      totals[item.dimension].count += 1;
    });

    return (Object.keys(totals) as Dimension[]).map((dimension) => {
      const item = totals[dimension];
      const score = item.possible ? Math.round((item.earned / item.possible) * 100) : 0;
      const confidenceScore = item.count ? item.confidence / item.count : 1;
      return { dimension, score, confidenceScore, label: describeScore(score) };
    });
  }, [answers, confidence]);

  const recommendedDepth = useMemo(() => {
    const average = profile.reduce((sum, item) => sum + item.score, 0) / profile.length;
    if (average >= 82) return "Deep";
    if (average >= 58) return "Growing";
    return "Foundational";
  }, [profile]);

  function selectAnswer(value: number) {
    setAnswers((current) => ({ ...current, [question.id]: value }));
  }

  function next() {
    if (answers[question.id] === undefined) return;
    if (index === questions.length - 1) {
      setComplete(true);
      window.localStorage.setItem("emmaus-assessment-profile", JSON.stringify({ profile, recommendedDepth, completedAt: new Date().toISOString() }));
      return;
    }
    setIndex((current) => current + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (complete) {
    const strengths = [...profile].sort((a, b) => b.score - a.score).slice(0, 2);
    const growth = [...profile].sort((a, b) => a.score - b.score).slice(0, 2);

    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <section className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Your Emmaus Starting Point</p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">Your journey has a clearer starting point.</h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">This is not a grade or a spiritual ranking. It is a working profile Emmaus can refine as you study.</p>

            <div className="mt-7 rounded-3xl border border-amber-200 bg-amber-50 p-6">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">Recommended starting depth</p>
              <p className="mt-2 text-3xl font-black">{recommendedDepth}</p>
              <p className="mt-2 leading-7 text-slate-700">You can enter deeper material at any time and revisit weaker areas whenever needed.</p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <ResultGroup title="Current strengths" items={strengths} />
              <ResultGroup title="Growth opportunities" items={growth} />
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-black">Your learning profile</h2>
              <div className="mt-4 space-y-4">
                {profile.map((item) => (
                  <div key={item.dimension}>
                    <div className="flex justify-between gap-4 text-sm"><span className="font-bold">{dimensionLabels[item.dimension]}</span><span className="text-slate-500">{item.label}</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600" style={{ width: `${item.score}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/emmaus/discovery/demo" className="rounded-full bg-indigo-600 px-6 py-3 font-black text-white">Begin Recommended Walk →</Link>
              <Link href="/emmaus/explore" className="rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-700">Explore Freely</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Discover Your Starting Point</p>
          <h1 className="mt-3 text-4xl font-black">Emmaus Assessment</h1>
          <p className="mt-3 leading-7 text-indigo-100/70">A brief placement experience designed to challenge mature learners without discouraging those still building foundations.</p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${progress}%` }} /></div>
          <div className="mt-3 flex justify-between text-xs text-indigo-100/50"><span>{question.section}</span><span>{index + 1} of {questions.length}</span></div>
        </header>

        <section className="mt-6 rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{question.section}</p>
          <h2 className="mt-3 text-3xl font-black">{question.prompt}</h2>

          <div className="mt-7 grid gap-3">
            {question.options.map((option) => (
              <button key={option.label} type="button" onClick={() => selectAnswer(option.value)} className={`rounded-2xl border p-4 text-left font-semibold transition ${answers[question.id] === option.value ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"}`}>{option.label}</button>
            ))}
          </div>

          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-black">How confident are you?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[{ label: "Guessing", value: 0 }, { label: "Somewhat confident", value: 1 }, { label: "Very confident", value: 2 }].map((item) => <button key={item.label} type="button" onClick={() => setConfidence((current) => ({ ...current, [question.id]: item.value }))} className={`rounded-full px-4 py-2 text-sm font-semibold ${confidence[question.id] === item.value ? "bg-amber-300 text-slate-950" : "border border-slate-300 bg-white text-slate-700"}`}>{item.label}</button>)}
            </div>
          </div>

          <div className="mt-8 flex justify-between gap-3 border-t border-slate-200 pt-6">
            <button type="button" disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))} className="rounded-full border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 disabled:opacity-40">Back</button>
            <button type="button" disabled={answers[question.id] === undefined} onClick={next} className="rounded-full bg-indigo-600 px-6 py-2.5 font-black text-white disabled:opacity-40">{index === questions.length - 1 ? "View My Starting Point" : "Continue"}</button>
          </div>
        </section>
      </div>
    </main>
  );
}

function describeScore(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 55) return "Growing";
  return "Developing";
}

function ResultGroup({ title, items }: { title: string; items: Array<{ dimension: Dimension; label: string }> }) {
  return <div className="rounded-3xl border border-slate-200 p-5"><h3 className="text-xl font-black">{title}</h3><div className="mt-4 space-y-3">{items.map((item) => <div key={item.dimension} className="rounded-2xl bg-slate-50 p-4"><p className="font-bold">{dimensionLabels[item.dimension]}</p><p className="mt-1 text-sm text-slate-500">{item.label}</p></div>)}</div></div>;
}
