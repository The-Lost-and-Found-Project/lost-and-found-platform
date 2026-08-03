"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const steps = [
  {
    label: "Start",
    eyebrow: "Rabbit Trail",
    title: "Why does John call Jesus ‘the Word’?",
    body: "This trail follows the title ‘the Word’ through creation, revelation, incarnation, and glory. Read each passage before opening the clue.",
    reference: "John 1:1",
    text: "In the beginning was the Word, and the Word was with God, and the Word was God.",
    clue: "John chose a title before he used the name Jesus. Ask what a word does: it reveals what is otherwise unseen or unspoken.",
    question: "Before moving on, write two reasons ‘the Word’ could be an appropriate title for Jesus.",
  },
  {
    label: "Creation",
    eyebrow: "Connection 1",
    title: "God creates through speech",
    reference: "Genesis 1:1–3",
    text: "In the beginning God created the heaven and the earth... And God said, Let there be light: and there was light.",
    clue: "Genesis presents divine speech as active and effective. God speaks, and reality responds.",
    question: "How does Genesis 1 help you understand John’s claim that all things were made through the Word?",
  },
  {
    label: "Revelation",
    eyebrow: "Connection 2",
    title: "God has spoken through His Son",
    reference: "Hebrews 1:1–3",
    text: "God... hath in these last days spoken unto us by his Son... by whom also he made the worlds; who being the brightness of his glory, and the express image of his person...",
    clue: "Hebrews joins two ideas: the Son reveals God and the Son participated in creation.",
    question: "What does this passage add to the idea that Jesus is God’s Word rather than merely a messenger carrying words?",
  },
  {
    label: "Image",
    eyebrow: "Connection 3",
    title: "The invisible God made known",
    reference: "Colossians 1:15–17",
    text: "Who is the image of the invisible God... For by him were all things created... and by him all things consist.",
    clue: "An image makes something visible. Paul connects Christ’s revelation of God with His authority over creation.",
    question: "How are ‘Word’ and ‘image’ similar ways of describing what Jesus reveals about God?",
  },
  {
    label: "Incarnation",
    eyebrow: "Connection 4",
    title: "The Word became flesh",
    reference: "John 1:14, 18",
    text: "And the Word was made flesh, and dwelt among us... No man hath seen God at any time; the only begotten Son... he hath declared him.",
    clue: "John eventually identifies the Word through incarnation: the eternal revealer entered human history and made God known.",
    question: "Why is the incarnation essential to John’s use of ‘the Word’? What could humanity know because the Word became flesh?",
  },
  {
    label: "Glory",
    eyebrow: "Connection 5",
    title: "The title returns at the end",
    reference: "Revelation 19:13, 16",
    text: "And he was clothed with a vesture dipped in blood: and his name is called The Word of God... KING OF KINGS, AND LORD OF LORDS.",
    clue: "The title is not limited to Jesus’ earthly ministry. Revelation uses it for the victorious, reigning Christ.",
    question: "How does Revelation expand your understanding of the Word from revelation and creation to judgment and kingship?",
  },
  {
    label: "Return",
    eyebrow: "Return to the Discovery",
    title: "Read John 1:1 again",
    body: "You now have a wider biblical frame. Do not repeat information; identify what changed in the way you read the verse.",
    reference: "John 1:1",
    text: "In the beginning was the Word, and the Word was with God, and the Word was God.",
    clue: "A strong Rabbit Trail returns you to the original passage with better questions and clearer observations.",
    question: "What do you now see in John 1:1 that you did not see before following this trail?",
  },
];

export default function LogosRabbitTrailPage() {
  const [index, setIndex] = useState(0);
  const [showClue, setShowClue] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const storageKey = "emmaus-rabbit-trail:logos-v1";
  const step = steps[index];
  const progress = Math.round(((index + 1) / steps.length) * 100);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { index?: number; answers?: Record<number, string> };
      if (Number.isInteger(parsed.index)) setIndex(Math.min(Math.max(parsed.index ?? 0, 0), steps.length - 1));
      if (parsed.answers) setAnswers(parsed.answers);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ index, answers }));
  }, [index, answers]);

  const answeredCount = useMemo(() => Object.values(answers).filter((answer) => answer.trim().length > 0).length, [answers]);

  function move(nextIndex: number) {
    setIndex(Math.min(Math.max(nextIndex, 0), steps.length - 1));
    setShowClue(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Emmaus Rabbit Trail</p>
              <h1 className="mt-2 text-3xl font-black">The Word — Logos</h1>
              <p className="mt-2 text-indigo-100/70">Follow the title through Scripture, then return to John 1:1.</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100">{index + 1} / {steps.length}</span>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{ width: `${progress}%` }} /></div>
          <div className="mt-3 flex justify-between text-xs text-indigo-100/60"><span>{step.label}</span><span>{answeredCount} reflection{answeredCount === 1 ? "" : "s"} saved</span></div>
        </header>

        <section className="mt-6 rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-700">{step.eyebrow}</p>
          <h2 className="mt-2 text-3xl font-black">{step.title}</h2>
          {step.body && <p className="mt-3 leading-7 text-slate-600">{step.body}</p>}

          <div className="mt-7 rounded-3xl bg-stone-50 p-5 sm:p-7">
            <p className="text-sm font-bold text-indigo-700">{step.reference}</p>
            <p className="mt-3 text-lg leading-9 text-slate-800">{step.text}</p>
          </div>

          <button type="button" onClick={() => setShowClue((value) => !value)} className="mt-5 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900">
            {showClue ? "Hide clue" : "Open clue"} 🧩
          </button>

          {showClue && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Something to notice</p><p className="mt-2 leading-7 text-slate-700">{step.clue}</p></div>}

          <div className="mt-7">
            <label className="text-sm font-black uppercase tracking-[0.14em] text-slate-700">Probe the connection</label>
            <p className="mt-2 text-lg font-semibold leading-8 text-slate-900">{step.question}</p>
            <textarea value={answers[index] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [index]: event.target.value }))} rows={8} placeholder="Write what the passages require you to conclude..." className="mt-4 w-full rounded-2xl border border-slate-300 p-4 leading-7 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" />
            <p className="mt-2 text-right text-xs text-slate-400">Saved automatically on this device</p>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
            <button type="button" disabled={index === 0} onClick={() => move(index - 1)} className="rounded-full border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 disabled:opacity-40">Back</button>
            {index < steps.length - 1 ? (
              <button type="button" onClick={() => move(index + 1)} className="rounded-full bg-indigo-600 px-6 py-2.5 font-bold text-white">Follow the Trail →</button>
            ) : (
              <Link href="/emmaus/discovery/demo" className="rounded-full bg-indigo-600 px-6 py-2.5 font-bold text-white">Return to My Discovery</Link>
            )}
          </div>
        </section>

        <div className="mt-5 text-center"><Link href="/emmaus/discovery/demo" className="text-sm font-semibold text-indigo-200 underline underline-offset-4">Leave trail and return to the Discovery</Link></div>
      </div>
    </main>
  );
}
