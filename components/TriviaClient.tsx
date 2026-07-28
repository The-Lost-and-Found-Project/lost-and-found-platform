"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { triviaCategories, type TriviaQuestion } from "@/lib/trivia-data";

type BestScore = { score: number; totalQuestions: number };

type Props = {
  userId: string;
  bestScores: Record<string, BestScore>;
};

type Screen = "categories" | "quiz" | "results";

// Renders the Bible Trivia Challenge — originally a custom embed on the
// Hostinger marketing site. Moved in-app so it lives behind sign-in
// alongside the rest of the community content, matching the app's design
// system (indigo/violet accents, white cards) instead of the marketing
// site's separate widget styling. Each attempt is saved to the member's
// account via the quiz_attempts table so best scores persist per category.
export default function TriviaClient({ userId, bestScores: initialBestScores }: Props) {
  const [screen, setScreen] = useState<Screen>("categories");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [bestScores, setBestScores] = useState(initialBestScores);

  const category = triviaCategories.find((c) => c.id === categoryId) ?? null;
  const question: TriviaQuestion | null = category
    ? category.questions[questionIndex]
    : null;

  function startCategory(id: string) {
    setCategoryId(id);
    setQuestionIndex(0);
    setScore(0);
    setSelectedChoice(null);
    setScreen("quiz");
  }

  function selectChoice(choice: string) {
    if (selectedChoice) return; // already answered this question
    setSelectedChoice(choice);
    if (question && choice === question.correct) {
      setScore((s) => s + 1);
    }
  }

  async function nextQuestion() {
    if (!category) return;
    const isLast = questionIndex === category.questions.length - 1;
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
        total_questions: category.questions.length,
      });

      setBestScores((prev) => {
        const existing = prev[category.id];
        if (existing && existing.score >= score) return prev;
        return {
          ...prev,
          [category.id]: { score, totalQuestions: category.questions.length },
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
    setSelectedChoice(null);
  }

  if (screen === "categories" || !category) {
    return (
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {triviaCategories.map((c) => {
          const best = bestScores[c.id];
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => startCategory(c.id)}
              className="rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <h3 className="text-base font-semibold text-gray-900">{c.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{c.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {c.questions.length} questions
                </span>
                {best && (
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    Best: {best.score}/{best.totalQuestions}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (screen === "quiz" && question) {
    const hasAnswered = selectedChoice !== null;
    const isLast = questionIndex === category.questions.length - 1;

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
            Question {questionIndex + 1} of {category.questions.length} &middot; Score: {score}
          </span>
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
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
              className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {isLast ? (saving ? "Saving..." : "See Results") : "Next Question"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Results screen
  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
        {category.name}
      </p>
      <h3 className="mt-2 text-2xl font-bold text-gray-900">
        {score} / {category.questions.length}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {score === category.questions.length
          ? "Perfect score! Well done."
          : score >= category.questions.length * 0.7
          ? "Great job knowing God's Word."
          : "Keep studying and try again anytime."}
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => startCategory(category.id)}
          className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
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
