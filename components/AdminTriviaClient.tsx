"use client";

import { useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
};

type Question = {
  id: string;
  category_id: string;
  question: string;
  choices: string[];
  correct: string;
  ref: string;
  note: string;
  status: "approved" | "pending" | "rejected";
  source: "manual" | "ai";
  created_at: string;
};

type StatusFilter = "pending" | "approved" | "rejected" | "all";

const EMPTY_QUESTION_FORM = {
  categoryId: "",
  question: "",
  choice1: "",
  choice2: "",
  choice3: "",
  choice4: "",
  correctIndex: 0,
  ref: "",
  note: "",
};

const EMPTY_CATEGORY_FORM = {
  id: "",
  name: "",
  description: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminTriviaClient({
  categories: initialCategories,
  questions: initialQuestions,
}: {
  categories: Category[];
  questions: Question[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [questions, setQuestions] = useState(initialQuestions);
  const [error, setError] = useState("");

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY_FORM);
  const [savingCategory, setSavingCategory] = useState(false);

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION_FORM);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const categoryById = useMemo(() => {
    const map: Record<string, Category> = {};
    categories.forEach((c) => (map[c.id] = c));
    return map;
  }, [categories]);

  const counts = useMemo(() => {
    const byCategory: Record<string, Record<string, number>> = {};
    for (const q of questions) {
      byCategory[q.category_id] ??= { approved: 0, pending: 0, rejected: 0 };
      byCategory[q.category_id][q.status] =
        (byCategory[q.category_id][q.status] ?? 0) + 1;
    }
    return byCategory;
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedCategoryId !== "all" && q.category_id !== selectedCategoryId)
        return false;
      if (statusFilter !== "all" && q.status !== statusFilter) return false;
      return true;
    });
  }, [questions, selectedCategoryId, statusFilter]);

  const pendingIdsInView = filteredQuestions
    .filter((q) => q.status === "pending")
    .map((q) => q.id);

  function startEditCategory(category: Category) {
    setCategoryForm({
      id: category.id,
      name: category.name,
      description: category.description,
      sortOrder: category.sort_order,
      isActive: category.is_active,
    });
    setShowCategoryForm(true);
  }

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSavingCategory(true);
    try {
      const res = await fetch("/api/admin/trivia/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: categoryForm.id || undefined,
          name: categoryForm.name,
          description: categoryForm.description,
          sortOrder: Number(categoryForm.sortOrder) || 0,
          isActive: categoryForm.isActive,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Failed to save category");
        return;
      }
      setCategories((prev) => {
        const exists = prev.some((c) => c.id === body.category.id);
        const next = exists
          ? prev.map((c) => (c.id === body.category.id ? body.category : c))
          : [...prev, body.category];
        return next.sort((a, b) => a.sort_order - b.sort_order);
      });
      setShowCategoryForm(false);
      setCategoryForm(EMPTY_CATEGORY_FORM);
    } catch {
      setError("Failed to save category");
    } finally {
      setSavingCategory(false);
    }
  }

  function startEditQuestion(q: Question) {
    const choices = [...q.choices];
    while (choices.length < 4) choices.push("");
    setQuestionForm({
      categoryId: q.category_id,
      question: q.question,
      choice1: choices[0] ?? "",
      choice2: choices[1] ?? "",
      choice3: choices[2] ?? "",
      choice4: choices[3] ?? "",
      correctIndex: Math.max(0, choices.findIndex((c) => c === q.correct)),
      ref: q.ref,
      note: q.note,
    });
    setBusyId(q.id);
    setShowQuestionForm(true);
  }

  function startNewQuestion() {
    setBusyId(null);
    setQuestionForm({
      ...EMPTY_QUESTION_FORM,
      categoryId:
        selectedCategoryId !== "all" ? selectedCategoryId : categories[0]?.id ?? "",
    });
    setShowQuestionForm(true);
  }

  async function saveQuestion(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const choices = [
      questionForm.choice1,
      questionForm.choice2,
      questionForm.choice3,
      questionForm.choice4,
    ].map((c) => c.trim());

    if (choices.some((c) => !c)) {
      setError("All four answer choices are required");
      return;
    }

    const correct = choices[questionForm.correctIndex];
    const payload = {
      categoryId: questionForm.categoryId,
      question: questionForm.question.trim(),
      choices,
      correct,
      ref: questionForm.ref.trim(),
      note: questionForm.note.trim(),
    };

    setSavingQuestion(true);
    try {
      const editingId = busyId;
      const res = await fetch("/api/admin/trivia/questions", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Failed to save question");
        return;
      }
      setQuestions((prev) => {
        const exists = prev.some((q) => q.id === body.question.id);
        return exists
          ? prev.map((q) => (q.id === body.question.id ? body.question : q))
          : [body.question, ...prev];
      });
      setShowQuestionForm(false);
      setQuestionForm(EMPTY_QUESTION_FORM);
      setBusyId(null);
    } catch {
      setError("Failed to save question");
    } finally {
      setSavingQuestion(false);
    }
  }

  async function setStatus(id: string, status: "approved" | "pending" | "rejected") {
    setError("");
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/trivia/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Failed to update question");
        return;
      }
      setQuestions((prev) => prev.map((q) => (q.id === id ? body.question : q)));
    } catch {
      setError("Failed to update question");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question? This cannot be undone.")) return;
    setError("");
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/trivia/questions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Failed to delete question");
        return;
      }
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch {
      setError("Failed to delete question");
    } finally {
      setBusyId(null);
    }
  }

  async function bulkApprove() {
    if (pendingIdsInView.length === 0) return;
    setError("");
    setBulkBusy(true);
    try {
      const res = await fetch("/api/admin/trivia/questions/bulk-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: pendingIdsInView }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Failed to bulk approve");
        return;
      }
      const approvedSet = new Set(pendingIdsInView);
      setQuestions((prev) =>
        prev.map((q) =>
          approvedSet.has(q.id)
            ? { ...q, status: "approved" as const }
            : q
        )
      );
    } catch {
      setError("Failed to bulk approve");
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bible Trivia Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage categories and review questions before they appear in the
            live quiz. New AI-authored questions land here as{" "}
            <span className="font-medium text-amber-700">Pending</span> until
            approved.
          </p>
        </div>
        <a
          href="/admin"
          className="shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to Prayer Care Admin
        </a>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Categories */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
          <button
            type="button"
            onClick={() => {
              setCategoryForm({
                ...EMPTY_CATEGORY_FORM,
                sortOrder: categories.length,
              });
              setShowCategoryForm(true);
            }}
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
          >
            + Add Category
          </button>
        </div>

        {showCategoryForm && (
          <form
            onSubmit={saveCategory}
            className="mt-4 space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-700">Name</label>
                <input
                  required
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={categoryForm.sortOrder}
                  onChange={(e) =>
                    setCategoryForm((f) => ({
                      ...f,
                      sortOrder: Number(e.target.value),
                    }))
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Description
              </label>
              <textarea
                required
                rows={2}
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm((f) => ({ ...f, description: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={categoryForm.isActive}
                onChange={(e) =>
                  setCategoryForm((f) => ({ ...f, isActive: e.target.checked }))
                }
              />
              Active (visible in the live quiz)
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingCategory}
                className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {savingCategory ? "Saving..." : categoryForm.id ? "Save Changes" : "Create Category"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryForm(false);
                  setCategoryForm(EMPTY_CATEGORY_FORM);
                }}
                className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {categories.map((c) => {
            const c1 = counts[c.id] ?? {};
            return (
              <div
                key={c.id}
                className={`rounded-lg border p-4 shadow-sm ${
                  c.is_active
                    ? "border-gray-200 bg-white"
                    : "border-gray-200 bg-gray-50 opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{c.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEditCategory(c)}
                    className="shrink-0 text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Edit
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                    {c1.approved ?? 0} approved
                  </span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                    {c1.pending ?? 0} pending
                  </span>
                  {(c1.rejected ?? 0) > 0 && (
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 font-medium text-gray-600">
                      {c1.rejected} rejected
                    </span>
                  )}
                  {!c.is_active && (
                    <span className="rounded-full bg-gray-300 px-2 py-0.5 font-medium text-gray-700">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Questions */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
          <button
            type="button"
            onClick={startNewQuestion}
            className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
          >
            + Add Question
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex rounded-full border border-gray-200 bg-gray-50 p-0.5 text-sm">
            {(["pending", "approved", "rejected", "all"] as StatusFilter[]).map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full px-3 py-1 font-medium capitalize transition ${
                    statusFilter === s
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {s}
                </button>
              )
            )}
          </div>

          {statusFilter === "pending" && pendingIdsInView.length > 1 && (
            <button
              type="button"
              onClick={bulkApprove}
              disabled={bulkBusy}
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
            >
              {bulkBusy
                ? "Approving..."
                : `Approve all ${pendingIdsInView.length} pending`}
            </button>
          )}
        </div>

        {showQuestionForm && (
          <form
            onSubmit={saveQuestion}
            className="mt-4 space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4"
          >
            <div>
              <label className="text-xs font-medium text-gray-700">Category</label>
              <select
                required
                value={questionForm.categoryId}
                onChange={(e) =>
                  setQuestionForm((f) => ({ ...f, categoryId: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
              >
                <option value="" disabled>
                  Choose a category...
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Question</label>
              <textarea
                required
                rows={2}
                value={questionForm.question}
                onChange={(e) =>
                  setQuestionForm((f) => ({ ...f, question: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {(["choice1", "choice2", "choice3", "choice4"] as const).map(
                (key, i) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctIndex"
                      checked={questionForm.correctIndex === i}
                      onChange={() =>
                        setQuestionForm((f) => ({ ...f, correctIndex: i }))
                      }
                      title="Mark as correct answer"
                    />
                    <input
                      required
                      value={questionForm[key]}
                      onChange={(e) =>
                        setQuestionForm((f) => ({ ...f, [key]: e.target.value }))
                      }
                      placeholder={`Choice ${i + 1}`}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
                    />
                  </label>
                )
              )}
            </div>
            <p className="text-xs text-gray-500">
              Select the radio button next to the correct answer.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Scripture Reference
                </label>
                <input
                  required
                  value={questionForm.ref}
                  onChange={(e) =>
                    setQuestionForm((f) => ({ ...f, ref: e.target.value }))
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">
                Explanatory Note
              </label>
              <textarea
                required
                rows={2}
                value={questionForm.note}
                onChange={(e) =>
                  setQuestionForm((f) => ({ ...f, note: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={savingQuestion}
                className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {savingQuestion
                  ? "Saving..."
                  : busyId
                  ? "Save Changes"
                  : "Create Question"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowQuestionForm(false);
                  setQuestionForm(EMPTY_QUESTION_FORM);
                  setBusyId(null);
                }}
                className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 space-y-3">
          {filteredQuestions.length === 0 ? (
            <p className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-500">
              No questions match this filter.
            </p>
          ) : (
            filteredQuestions.map((q) => {
              const isBusy = busyId === q.id;
              return (
                <div
                  key={q.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        {categoryById[q.category_id]?.name ?? q.category_id}
                      </p>
                      <p className="mt-1 font-medium text-gray-900">
                        {q.question}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          q.status === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : q.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {q.status}
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {q.source === "ai" ? "AI" : "Manual"}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                    {q.choices.map((choice) => (
                      <li
                        key={choice}
                        className={`rounded-md border px-3 py-1.5 ${
                          choice === q.correct
                            ? "border-green-300 bg-green-50 text-green-800"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {choice}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-2 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{q.ref}</span>{" "}
                    &mdash; {q.note}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {q.status !== "approved" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setStatus(q.id, "approved")}
                        className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {q.status !== "rejected" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setStatus(q.id, "rejected")}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                    {q.status !== "pending" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setStatus(q.id, "pending")}
                        className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Revert to Pending
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => startEditQuestion(q)}
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => deleteQuestion(q.id)}
                      className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
