"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  description: string;
  approvedCount: number;
};

type Question = {
  id: string;
  question: string;
  choices: string[];
  correct: string;
  ref: string;
  note: string;
};

type BestScore = { score: number; totalQuestions: number };

type Props = {
  userId: string;
  categories: Category[];
  bestScores: Record<string, BestScore>;
};

type Screen = "categories" | "loading" | "quiz" | "results";

// A rotating accent palette so each category card/quiz header reads
// distinctly at a glance instead of every category looking identical.
const ACCENTS = [
  { text: "text-indigo-700", bar: "bg-indigo-600", border: "hover:border-indigo-200" },
  { text: "text-emerald-700", bar: "bg-emerald-600", border: "hover:border-emerald-200" },
  { text: "text-amber-700", bar: "bg-amber-600", border: "hover:border-amber-200" },
  { text: "text-rose-700", bar: "bg-rose-600", border: "hover:border-rose-200" },
  { text: "text-sky-700", bar: "bg-sky-600", border: "hover:border-sky-200" },
  { text: "text-violet-700", bar: "bg-violet-600", border: "hover:border-violet-200" },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Renders the Bible Trivia Challenge. Questions are now pulled live from
// Supabase (only admin-approved ones) via the get_quiz_questions() function,
// which does the random sampling server-side -- a fresh, randomly ordered
// set of questions (with shuffled answer choices) every time a member plays
// a category, instead of the same fixed 10 questions in the same order.
export default function TriviaClient({ userId, categories, bestScores: initialBestScores }: Props) {
  const [screen, setScreen] = useState<Screen>("categories");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bestScores, setBestScores] = useState(initialBestScores);
  const [loadError, setLoadError] = useState("");

  const categoryIndex = categories.findIndex((c) => c.id === categoryId);
  const category = categoryIndex >= 0 ? categories[categoryIndex] : null;
  const accent = ACCENTS[Math.max(categoryIndex, 0) % ACCENTS.length];
  const question: Question | null = questions[questionIndex] ?? null;

  async function startCategory(id: string) {
    setCategoryId(id);
    setLoadError("");
    setScreen("loading");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("get_quiz_questions", {
        p_category_id: id,
        p_limit: 10,
      });

      if (error) throw error;

      const fetched: Question[] = (data ?? []).map((row: any) => ({
        id: row.id,
        question: row.question,
        // Shuffle each question's answer order so the correct choice isn't
        // always sitting in the same position across attempts.
        choices: shuffle(row.choices as string[]),
        correct: row.correct,
        ref: row.ref,
        note: row.note,
      }));

      if (fetched.length === 0) {
        setLoadError(
          "No approved questions are available in this category yet. Check back soon!"
        );
        setScreen("categories");
        return;
      }

      setQuestions(fetched);
      setQuestionIndex(0);
      setScore(0);
      setSelectedChoice(null);
      setScreen("quiz");
    } catch {
      setLoadError("Couldn't load questions right now. Please try again.");
      setScreen("categories");
    }
  }

  function selectChoice(choice: string) {
    if (selectedChoice) return; // already answered this question
    setSelectedChoice(choice);
    if (question && choice === question.correct) {
      setScore((s) => s + 1);
    }
  }

  async function nextQuestion() {
    const isLast = questionIndex === questions.length - 1;
    if (isLast) {
      await saveAttempt();
      setScreen("results");
    } else {
      setQuestionIndex((i) => i + 1);
      setSelectedChoice(null);
    }
  }

  async function saveAttempt() {
    if (!category) return;
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from("quiz_attempts").insert({
        user_id: userId,
        category: category.id,
        score,
        total_questions: questions.length,
      });

      setBestScores((prev) => {
        const existing = prev[category.id];
        if (existing && existing.score >= score) return prev;
        return {
          ...prev,
          [category.id]: { score, totalQuestions: questions.length },
        };
      });
    } catch {
      // If the save fails, the member still sees their result on screen;
      // it just won't be reflected in their saved best score.
    } finally {
      setSaving(false);
    }
  }

  function backToCategories() {
    setScreen("categories");
    setCategoryId(null);
    setQuestions([]);
    setSelectedChoice(null);
  }

  if (screen === "categories" || !category) {
    return (
      <div className="mt-6">
        {loadError && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {loadError}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((c, i) => {
            const best = bestScores[c.id];
            const cAccent = ACCENTS[i % ACCENTS.length];
            const playable = c.approvedCount > 0;
            return (
              <button
                key={c.id}
                type="button"
                disabled={!playable}
                onClick={() => startCategory(c.id)}
                className={`rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition ${
                  playable
                    ? `${cAccent.border} hover:shadow-md`
                    : "cursor-not-allowed opacity-60"
                }`}
              >
                <h3 className="text-base font-semibold text-gray-900">{c.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{c.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  {playable ? (
                    <span className="text-xs text-gray-400">
                      {c.approvedCount} question{c.approvedCount === 1 ? "" : "s"} available
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                      Awaiting approval
                    </span>
                  )}
                  {best && (
                    <span className={`inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-semibold ${cAccent.text}`}>
                      Best: {best.score}/{best.totalQuestions}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (screen === "loading") {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-gray-500">Shuffling questions...</p>
      </div>
    );
  }

  if (screen === "quiz" && question) {
    const hasAnswered = selectedChoice !== null;
    const isLast = questionIndex === questions.length - 1;
    const progressPct = Math.round(((questionIndex + (hasAnswered ? 1 : 0)) / questions.length) * 100);

    return (
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={backToCategories}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            &larr; Categories
          </button>
          <span className="text-sm font-medium text-gray-500">
            Question {questionIndex + 1} of {questions.length} &middot; Score: {score}
          </span>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${accent.bar}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className={`text-xs font-semibold uppercase tracking-wide ${accent.text}`}>
            {category.name}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">
            {question.question}
          </h3>

          <div className="mt-4 space-y-2">
            {question.choices.map((choice) => {
              const isCorrect = choice === question.correct;
              const isSelected = choice === selectedChoice;

              let stateClasses = "border-gray-200 bg-white hover:border-indigo-200";
              if (hasAnswered && isCorrect) {
                stateClasses = "border-green-300 bg-green-50";
              } else if (hasAnswered && isSelected && !isCorrect) {
                stateClasses = "border-red-300 bg-red-50";
              }

              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => selectChoice(choice)}
                  disabled={hasAnswered}
                  className={`w-full rounded-md border px-4 py-3 text-left text-sm font-medium text-gray-800 transition ${stateClasses}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>

          {hasAnswered && (
            <div className="mt-4 rounded-md border-l-4 border-indigo-300 bg-indigo-50/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                {question.ref}
              </p>
              <p className="mt-1 text-sm text-gray-600">{question.note}</p>
            </div>
          )}

          {hasAnswered && (
            <button
              type="button"
              onClick={nextQuestion}
              disabled={saving}
              className={`mt-4 w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${accent.bar} hover:opacity-90`}
            >
              {isLast ? (saving ? "Saving..." : "See Results") : "Next Question"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Results screen
  const pct = questions.length > 0 ? score / questions.length : 0;
  const resultEmoji = pct === 1 ? "\u{1F3C6}" : pct >= 0.7 ? "\u{1F64C}" : "\u{1F4D6}";
  const resultMessage =
    pct === 1
      ? "Perfect score! Well done."
      : pct >= 0.7
      ? "Great job knowing God's Word."
      : "Keep studying and try again anytime.";

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
      <p className={`text-xs font-semibold uppercase tracking-wide ${accent.text}`}>
        {category.name}
      </p>
      <p className="mt-2 text-4xl">{resultEmoji}</p>
      <h3 className="mt-2 text-2xl font-bold text-gray-900">
        {score} / {questions.length}
      </h3>
      <p className="mt-1 text-sm text-gray-500">{resultMessage}</p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => startCategory(category.id)}
          className={`rounded-md px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 ${accent.bar}`}
        >
          Play Again
        </button>
        <button
          type="button"
          onClick={backToCategories}
          className="rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
        >
          Back to Categories
        </button>
      </div>
    </div>
  );
}
