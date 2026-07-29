"use client";

import { useMemo, useState } from "react";

type Day = {
  day: number;
  title: string;
  verseRef: string;
  teaser: string;
  scripture: string;
  teachingPoint: string;
  story: string;
  application: string;
  reflectionQuestions: string[];
  prayer: string;
};

type Week = {
  id: string;
  week_number: number;
  title: string;
  days: Day[];
  status: "draft" | "pending" | "approved" | "rejected" | "published";
  source: "manual" | "ai";
  published_at: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type StatusFilter = Week["status"] | "all";

const STATUS_STYLES: Record<Week["status"], string> = {
  draft: "bg-gray-100 text-gray-600",
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-sky-50 text-sky-700",
  rejected: "bg-rose-50 text-rose-700",
  published: "bg-emerald-50 text-emerald-700",
};

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Small helper: keeps a day object's fields in sync while editing, without
// needing a separate editor component per field.
function updateDay(days: Day[], index: number, patch: Partial<Day>): Day[] {
  return days.map((d, i) => (i === index ? { ...d, ...patch } : d));
}

export default function AdminDevotionsClient({
  weeks: initialWeeks,
}: {
  weeks: Week[];
}) {
  const [weeks, setWeeks] = useState(initialWeeks);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { title: string; days: Day[] }>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const w of weeks) c[w.status] = (c[w.status] ?? 0) + 1;
    return c;
  }, [weeks]);

  const filteredWeeks = useMemo(() => {
    return weeks
      .filter((w) => statusFilter === "all" || w.status === statusFilter)
      .sort((a, b) => a.week_number - b.week_number);
  }, [weeks, statusFilter]);

  function toggleExpand(week: Week) {
    if (expandedId === week.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(week.id);
    setDrafts((prev) => ({
      ...prev,
      [week.id]: prev[week.id] ?? {
        title: week.title,
        days: week.days.map((d) => ({ ...d, reflectionQuestions: [...d.reflectionQuestions] })),
      },
    }));
  }

  async function patchWeek(id: string, body: Record<string, unknown>) {
    setError("");
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/devotions/weeks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const responseBody = await res.json();
      if (!res.ok) {
        setError(responseBody.error ?? "Something went wrong");
        return;
      }
      setWeeks((prev) => prev.map((w) => (w.id === id ? responseBody.week : w)));
    } catch {
      setError("Failed to save changes");
    } finally {
      setBusyId(null);
    }
  }

  async function saveContent(week: Week) {
    const draft = drafts[week.id];
    if (!draft) return;
    await patchWeek(week.id, { title: draft.title, days: draft.days });
  }

  async function setStatus(week: Week, status: Week["status"]) {
    await patchWeek(week.id, { status });
  }

  async function deleteWeek(week: Week) {
    if (!confirm(`Delete Week ${week.week_number}: "${week.title}"? This can't be undone.`)) {
      return;
    }
    setError("");
    setBusyId(week.id);
    try {
      const res = await fetch("/api/admin/devotions/weeks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: week.id }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong");
        return;
      }
      setWeeks((prev) => prev.filter((w) => w.id !== week.id));
    } catch {
      setError("Failed to delete week");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Daily Devotions — Review Queue</h1>
      <p className="mt-2 text-gray-600">
        Each week publishes automatically 7 days after the last one. As soon as a
        week goes live, the next one in line is sent to you here for review --
        edit anything you'd like, then approve it so it's ready for its turn.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {(["pending", "approved", "draft", "published", "rejected", "all"] as StatusFilter[]).map(
          (s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
                statusFilter === s
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s} {s !== "all" ? `(${counts[s] ?? 0})` : `(${weeks.length})`}
            </button>
          )
        )}
      </div>

      <div className="mt-6 space-y-4">
        {filteredWeeks.length === 0 && (
          <p className="text-sm text-gray-500">No weeks in this filter.</p>
        )}

        {filteredWeeks.map((week) => {
          const isOpen = expandedId === week.id;
          const draft = drafts[week.id];

          return (
            <div
              key={week.id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggleExpand(week)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      Week {week.week_number}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[week.status]}`}
                    >
                      {week.status}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-gray-400">
                      {week.source}
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-gray-900">{week.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {week.status === "published"
                      ? `Published ${fmt(week.published_at)}`
                      : `Created ${fmt(week.created_at)}`}
                    {week.reviewed_at ? ` · Reviewed ${fmt(week.reviewed_at)}` : ""}
                  </p>
                </div>

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {isOpen && draft && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Week Title
                  </label>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [week.id]: { ...draft, title: e.target.value },
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />

                  <div className="mt-5 space-y-5">
                    {draft.days.map((d, idx) => (
                      <div key={d.day} className="rounded-md border border-gray-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                          Day {d.day}
                        </p>

                        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Title</label>
                            <input
                              type="text"
                              value={d.title}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [week.id]: {
                                    ...draft,
                                    days: updateDay(draft.days, idx, { title: e.target.value }),
                                  },
                                }))
                              }
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500">
                              Verse Reference
                            </label>
                            <input
                              type="text"
                              value={d.verseRef}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [week.id]: {
                                    ...draft,
                                    days: updateDay(draft.days, idx, { verseRef: e.target.value }),
                                  },
                                }))
                              }
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        {(
                          [
                            ["teaser", "Teaser"],
                            ["scripture", "Scripture"],
                            ["teachingPoint", "Teaching Point"],
                            ["story", "Relatable Story"],
                            ["application", "Daily Application"],
                            ["prayer", "Prayer"],
                          ] as const
                        ).map(([field, label]) => (
                          <div key={field} className="mt-3">
                            <label className="block text-xs font-medium text-gray-500">
                              {label}
                            </label>
                            <textarea
                              value={d[field]}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [week.id]: {
                                    ...draft,
                                    days: updateDay(draft.days, idx, {
                                      [field]: e.target.value,
                                    } as Partial<Day>),
                                  },
                                }))
                              }
                              rows={field === "teaser" ? 2 : 3}
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>
                        ))}

                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-500">
                            Reflection Questions (one per line)
                          </label>
                          <textarea
                            value={d.reflectionQuestions.join("\n")}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [week.id]: {
                                  ...draft,
                                  days: updateDay(draft.days, idx, {
                                    reflectionQuestions: e.target.value
                                      .split("\n")
                                      .map((q) => q.trim())
                                      .filter(Boolean),
                                  }),
                                },
                              }))
                            }
                            rows={3}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === week.id}
                      onClick={() => saveContent(week)}
                      className="rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
                    >
                      Save Changes
                    </button>

                    {week.status === "draft" && (
                      <button
                        type="button"
                        disabled={busyId === week.id}
                        onClick={() => setStatus(week, "pending")}
                        className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                      >
                        Submit for Review
                      </button>
                    )}

                    {(week.status === "pending" || week.status === "rejected") && (
                      <button
                        type="button"
                        disabled={busyId === week.id}
                        onClick={() => setStatus(week, "approved")}
                        className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}

                    {week.status === "pending" && (
                      <button
                        type="button"
                        disabled={busyId === week.id}
                        onClick={() => setStatus(week, "rejected")}
                        className="rounded-full bg-rose-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-rose-500 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}

                    {week.status === "approved" && (
                      <button
                        type="button"
                        disabled={busyId === week.id}
                        onClick={() => setStatus(week, "pending")}
                        className="rounded-full bg-gray-200 px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-300 disabled:opacity-50"
                      >
                        Move Back to Pending
                      </button>
                    )}

                    {week.status !== "published" && (
                      <button
                        type="button"
                        disabled={busyId === week.id}
                        onClick={() => deleteWeek(week)}
                        className="ml-auto rounded-full border border-rose-200 px-4 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
