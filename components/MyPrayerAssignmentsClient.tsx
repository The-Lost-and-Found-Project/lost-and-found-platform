"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const STATUS_OPTIONS = [
  "New",
  "Assigned",
  "Being Prayed For",
  "Contacted",
  "Ongoing",
  "Follow-Up Needed",
];

type CategoryOption = { id: string; name: string };

type AssignedRequest = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  preferred_contact: string | null;
  contact_requested: boolean;
  category_id: string | null;
  request_text: string;
  is_public: boolean;
  is_anonymous: boolean;
  status: string;
  follow_up_needed: boolean;
  follow_up_date: string | null;
  answered: boolean;
  praise_report: string | null;
  prayer_count: number;
};

type Props = {
  requests: AssignedRequest[];
  categories: CategoryOption[];
};

// "New" = hasn't been touched yet since assignment. "Ongoing" = actively
// being worked (any status past New/Assigned). "Completed" is driven purely
// by the Answered Prayer action, not by the status dropdown, since that's
// the one unambiguous signal that the assignment is done.
function isNew(r: AssignedRequest): boolean {
  return !r.answered && (r.status === "New" || r.status === "Assigned");
}
function isOngoing(r: AssignedRequest): boolean {
  return !r.answered && !isNew(r);
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "new", label: "New assignments" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default function MyPrayerAssignmentsClient({
  requests: initialRequests,
  categories,
}: Props) {
  const supabase = createClient();
  const [requests, setRequests] = useState<AssignedRequest[]>(initialRequests);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerNote, setAnswerNote] = useState("");
  const [answerSaving, setAnswerSaving] = useState(false);

  const categoryMap: Record<string, string> = {};
  categories.forEach((c) => {
    categoryMap[c.id] = c.name;
  });

  const counts = {
    all: requests.length,
    new: requests.filter(isNew).length,
    ongoing: requests.filter(isOngoing).length,
    completed: requests.filter((r) => r.answered).length,
  };

  const visibleRequests = requests.filter((r) => {
    if (filter === "new") return isNew(r);
    if (filter === "ongoing") return isOngoing(r);
    if (filter === "completed") return r.answered;
    return true;
  });

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function updateRequest(id: string, changes: Partial<AssignedRequest>) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...changes } : r))
    );
    await supabase.from("prayer_requests").update(changes).eq("id", id);
  }

  function openAnsweredModal(id: string) {
    const request = requests.find((r) => r.id === id);
    setAnsweringId(id);
    setAnswerNote(request?.praise_report ?? "");
  }

  function closeAnsweredModal() {
    setAnsweringId(null);
    setAnswerNote("");
  }

  async function confirmAnswered() {
    if (!answeringId) return;
    setAnswerSaving(true);

    await updateRequest(answeringId, {
      answered: true,
      status: "Answered",
      praise_report: answerNote.trim() || null,
    });

    setAnswerSaving(false);
    setAnsweringId(null);
    setAnswerNote("");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">
        My Prayer Assignments
      </h1>
      <p className="mt-2 text-gray-600">
        The prayer requests currently assigned to you. Only you can see this
        list.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium shadow-sm transition ${
              filter === f.key
                ? "bg-indigo-600 text-white"
                : "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {visibleRequests.length === 0 && (
          <p className="text-gray-500">
            {filter === "all"
              ? "Nothing is assigned to you right now."
              : "No assignments match this filter."}
          </p>
        )}

        {visibleRequests.map((r) => {
          const expanded = expandedIds.has(r.id);
          const snippet =
            r.request_text.length > 90
              ? `${r.request_text.slice(0, 90)}...`
              : r.request_text;

          return (
            <div
              key={r.id}
              className={`rounded-lg border bg-white shadow-sm ${
                r.answered ? "border-emerald-200" : "border-gray-200"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleExpanded(r.id)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                    expanded ? "rotate-90" : ""
                  }`}
                >
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-sm font-medium text-gray-900">
                      {r.name}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {r.status}
                    </span>
                    {r.category_id && categoryMap[r.category_id] && (
                      <span className="text-xs text-gray-400">
                        {categoryMap[r.category_id]}
                      </span>
                    )}
                    {r.follow_up_needed && !r.answered && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                        Follow-up
                      </span>
                    )}
                    {r.answered && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                        Answered
                      </span>
                    )}
                  </div>
                  {!expanded && (
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {snippet}
                    </p>
                  )}
                </div>
              </button>

              {expanded && (
                <div className="border-t border-gray-100 px-5 pb-5 pt-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-900">{r.request_text}</p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span>{r.name}</span>
                        <a
                          href={`mailto:${r.email}`}
                          className="text-indigo-600 hover:text-indigo-500"
                        >
                          {r.email}
                        </a>
                        {r.phone && <span>{r.phone}</span>}
                        {r.category_id && categoryMap[r.category_id] && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {categoryMap[r.category_id]}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {r.is_public ? "Public" : "Private"}
                          {r.is_anonymous ? " · Anonymous on wall" : ""}
                        </span>
                        {r.contact_requested && (
                          <span className="text-xs text-amber-600">
                            Wants contact
                            {r.preferred_contact ? ` (${r.preferred_contact})` : ""}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {r.prayer_count} prayed
                        </span>
                      </div>

                      {r.answered && r.praise_report && (
                        <div className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                          {r.praise_report}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {!r.answered && (
                        <select
                          value={r.status}
                          onChange={(e) =>
                            updateRequest(r.id, { status: e.target.value })
                          }
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}

                      {!r.answered && (
                        <button
                          type="button"
                          onClick={() => openAnsweredModal(r.id)}
                          className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:from-emerald-500 hover:to-teal-500"
                        >
                          Answered Prayer
                        </button>
                      )}
                    </div>
                  </div>

                  {!r.answered && (
                    <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 text-sm">
                      <label className="flex items-center gap-2 text-gray-700">
                        <input
                          type="checkbox"
                          checked={r.follow_up_needed}
                          onChange={(e) =>
                            updateRequest(r.id, {
                              follow_up_needed: e.target.checked,
                            })
                          }
                          className="rounded border-gray-300"
                        />
                        Follow-up needed
                      </label>

                      {r.follow_up_needed && (
                        <input
                          type="date"
                          value={r.follow_up_date ?? ""}
                          onChange={(e) =>
                            updateRequest(r.id, {
                              follow_up_date: e.target.value || null,
                            })
                          }
                          className="rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm"
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {answeringId && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={closeAnsweredModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900">
              Mark this prayer as answered
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This moves the assignment to Completed. You can leave a quick
              note about how it went — totally optional.
            </p>

            <textarea
              value={answerNote}
              onChange={(e) => setAnswerNote(e.target.value)}
              rows={4}
              placeholder="Any update you'd like to remember (optional)..."
              className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeAnsweredModal}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAnswered}
                disabled={answerSaving}
                className="rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60"
              >
                {answerSaving ? "Saving..." : "Confirm Answered"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
