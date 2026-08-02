"use client";

import { useEffect, useState } from "react";

const steps = ["Read", "Observe", "Wonder", "Explore", "Reflect", "Pray"] as const;
type Step = (typeof steps)[number];

const passage = [
  [1, "In the beginning was the Word, and the Word was with God, and the Word was God."],
  [2, "The same was in the beginning with God."],
  [3, "All things were made by him; and without him was not any thing made that was made."],
  [4, "In him was life; and the life was the light of men."],
  [5, "And the light shineth in darkness; and the darkness comprehended it not."],
  [6, "There was a man sent from God, whose name was John."],
  [7, "The same came for a witness, to bear witness of the Light, that all men through him might believe."],
  [8, "He was not that Light, but was sent to bear witness of that Light."],
  [9, "That was the true Light, which lighteth every man that cometh into the world."],
  [10, "He was in the world, and the world was made by him, and the world knew him not."],
  [11, "He came unto his own, and his own received him not."],
  [12, "But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name:"],
  [13, "Which were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God."],
  [14, "And the Word was made flesh, and dwelt among us, and we beheld his glory, the glory as of the only begotten of the Father, full of grace and truth."],
  [15, "John bare witness of him, and cried, saying, This was he of whom I spake, He that cometh after me is preferred before me: for he was before me."],
  [16, "And of his fulness have all we received, and grace for grace."],
  [17, "For the law was given by Moses, but grace and truth came by Jesus Christ."],
  [18, "No man hath seen God at any time; the only begotten Son, which is in the bosom of the Father, he hath declared him."],
] as const;

const storageKey = "emmaus-john-1-alpha";

export default function JohnOneDiscoveryPage() {
  const [step, setStep] = useState<Step>("Read");
  const [observation, setObservation] = useState("");
  const [wonder, setWonder] = useState("");
  const [reflection, setReflection] = useState("");
  const [prayer, setPrayer] = useState("");
  const [threadOpen, setThreadOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setStep(data.step ?? "Read");
        setObservation(data.observation ?? "");
        setWonder(data.wonder ?? "");
        setReflection(data.reflection ?? "");
        setPrayer(data.prayer ?? "");
        setThreadOpen(Boolean(data.threadOpen));
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ step, observation, wonder, reflection, prayer, threadOpen })
    );
  }, [loaded, observation, prayer, reflection, step, threadOpen, wonder]);

  const current = steps.indexOf(step);
  const progress = [observation, wonder, reflection, prayer].filter((item) => item.trim()).length + (threadOpen ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-indigo-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-700">Emmaus Alpha</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-950">John 1:1–18</h1>
            <p className="mt-2 text-gray-600">The Word, the Light, and the God who came near.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Progress</p>
            <p className="text-2xl font-bold text-gray-950">{progress}/5</p>
            <p className="text-xs text-gray-500">Saves on this device</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {steps.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStep(item)}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${step === item ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          {step === "Read" && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">Read</p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-950">Listen before you explain</h2>
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">KJV · Public domain</span>
              </div>
              <div className="mt-6 space-y-4 text-lg leading-8 text-gray-800">
                {passage.map(([verse, text]) => (
                  <p key={verse}><sup className="mr-2 font-bold text-indigo-700">{verse}</sup>{text}</p>
                ))}
              </div>
            </div>
          )}

          {step === "Observe" && (
            <Prompt
              eyebrow="Observe"
              title="What do you actually see?"
              prompt="Which repeated words, contrasts, claims, or images stand out before you consult any explanation?"
              value={observation}
              onChange={setObservation}
              placeholder="I notice that John repeats..."
            />
          )}

          {step === "Wonder" && (
            <Prompt
              eyebrow="Wonder"
              title="Let the text create questions"
              prompt="Why does John begin with “In the beginning,” and why does he call Jesus “the Word” before naming Him?"
              value={wonder}
              onChange={setWonder}
              placeholder="I wonder whether John wants readers to connect this with..."
            />
          )}

          {step === "Explore" && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">Explore</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-950">Follow your first Thread</h2>
              <p className="mt-3 max-w-2xl leading-7 text-gray-600">Compare John’s opening words with Genesis. Look for shared vocabulary, shared ideas, and what John adds.</p>
              <button
                type="button"
                onClick={() => setThreadOpen((open) => !open)}
                className="mt-6 w-full rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left transition hover:border-amber-300 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Thread 001</p>
                    <h3 className="mt-1 text-lg font-bold text-gray-950">John 1:1 ⇄ Genesis 1:1</h3>
                    <p className="mt-2 text-sm text-gray-600">Tap to {threadOpen ? "close" : "open"} the connection.</p>
                  </div>
                  <span className="text-2xl" aria-hidden="true">🧵</span>
                </div>
              </button>
              {threadOpen && (
                <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                  <p className="font-semibold text-gray-950">Genesis 1:1</p>
                  <p className="mt-2 text-lg text-gray-800">“In the beginning God created the heaven and the earth.”</p>
                  <div className="mt-5 rounded-xl bg-white p-4">
                    <p className="text-sm font-semibold text-indigo-800">Discovery question</p>
                    <p className="mt-1 text-gray-700">What does John add by placing “the Word” in the beginning with God?</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "Reflect" && (
            <Prompt
              eyebrow="Reflect"
              title="Name the discovery"
              prompt="What have you discovered about Jesus in this passage that deserves more attention in your life?"
              value={reflection}
              onChange={setReflection}
              placeholder="Today I saw that Jesus..."
            />
          )}

          {step === "Pray" && (
            <Prompt
              eyebrow="Pray"
              title="Turn discovery into prayer"
              prompt="Praise God for who Jesus is, confess where darkness remains, and ask for grace to walk in His light."
              value={prayer}
              onChange={setPrayer}
              placeholder="Jesus, thank You that..."
            />
          )}
        </section>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => setStep(steps[current - 1])}
            className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            type="button"
            disabled={current === steps.length - 1}
            onClick={() => setStep(steps[current + 1])}
            className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}

function Prompt({ eyebrow, title, prompt, value, placeholder, onChange }: {
  eyebrow: string;
  title: string;
  prompt: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold text-gray-950">{title}</h2>
      <p className="mt-3 max-w-2xl leading-7 text-gray-600">{prompt}</p>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={8}
        className="mt-6 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 shadow-inner outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
      />
    </div>
  );
}
