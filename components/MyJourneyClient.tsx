"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PrayerRequestSummary = {
  id: string;
  created_at: string;
  request_text: string;
  status: string;
  category_id: string | null;
  is_public: boolean;
  is_anonymous: boolean;
  moderation_status: string;
  answered: boolean;
  answered_update: string | null;
  archived: boolean;
};

type JourneyEntry = {
  id: string;
  entry_type: "bible_reading" | "prayer_answered" | "custom";
  title: string | null;
  notes: string | null;
  entry_date: string;
  created_at: string;
};

type Testimony = {
  content_text: string;
  created_at: string;
  updated_at: string;
} | null;

type Props = {
  email: string;
  dateOfSalvation: string;
  dateOfBaptism: string;
  requests: PrayerRequestSummary[];
  categoryMap: Record<string, string>;
  entries: JourneyEntry[];
  testimony: Testimony;
};

type TimelineKind =
  | "salvation"
  | "baptism"
  | "prayer"
  | "bible_reading"
  | "prayer_answered"
  | "custom"
  | "testimony";

type TimelineItem = {
  key: string;
  time: number;
  dateLabel: string;
  kind: TimelineKind;
  title: string;
  description?: string;
  meta?: string;
  requestId?: string;
  moderationStatus?: string;
  answered?: boolean;
  answeredUpdate?: string | null;
  archived?: boolean;
  link?: { href: string; label: string };
};

const ENTRY_TYPES: {
  value: JourneyEntry["entry_type"];
  label: string;
  placeholder: string;
}[] = [
  { value: "bible_reading", label: "Bible Reading", placeholder: "What passage did you read?" },
  { value: "prayer_answered", label: "Prayer Answered", placeholder: "What prayer was answered?" },
  { value: "custom", label: "Add Your Own", placeholder: "Give it a title" },
];

const KIND_STYLES: Record<TimelineKind, { dot: string; badge: string; label: string }> = {
  salvation: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700", label: "Salvation" },
  baptism: { dot: "bg-sky-500", badge: "bg-sky-50 text-sky-700", label: "Baptism" },
  prayer: { dot: "bg-indigo-500", badge: "bg-indigo-50 text-indigo-700", label: "Prayer Request" },
  bible_reading: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700", label: "Bible Reading" },
  prayer_answered: { dot: "bg-violet-500", badge: "bg-violet-50 text-violet-700", label: "Prayer Answered" },
  custom: { dot: "bg-gray-400", badge: "bg-gray-100 text-gray-700", label: "Note" },
  testimony: { dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700", label: "Testimony" },
};

function parseLocalDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatDateOnly(value: string) {
  const date = parseLocalDate(value);
  if (!date) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function todayInputValue() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function MyJourneyClient({
  email,
  dateOfSalvation,
  dateOfBaptism,
  requests: initialRequests,
  categoryMap,
  entries: initialEntries,
  testimony,
}: Props) {
  const supabase = createClient();
  const [entries, setEntries] = useState(initialEntries);
  const [requests, setRequests] = useState(initialRequests);
  const [showForm, setShowForm] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [entryType, setEntryType] = useState<JourneyEntry["entry_type"]>("bible_reading");
  const [entryDate, setEntryDate] = useState(todayInputValue());
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [editRequestText, setEditRequestText] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editIsAnonymous, setEditIsAnonymous] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [markAnsweredId, setMarkAnsweredId] = useState<string | null>(null);
  const [updateText, setUpdateText] = useState("");
  const [markAnsweredSaving, setMarkAnsweredSaving] = useState(false);
  const [markAnsweredError, setMarkAnsweredError] = useState("");

  const categoryOptions = useMemo(
    () => Object.entries(categoryMap).map(([id, name]) => ({ id, name })),
    [categoryMap]
  );

  const activeType = ENTRY_TYPES.find((t) => t.value === entryType)!;

  function toggleExpanded(key: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function openEditRequest(requestId: string) {
    const request = requests.find((r) => r.id === requestId);
    if (!request) return;
    setEditingRequestId(requestId);
    setEditRequestText(request.request_text);
    setEditCategoryId(request.category_id ?? "");
    setEditIsPublic(request.is_public);
    setEditIsAnonymous(request.is_anonymous);
    setEditError("");
  }

  function closeEditRequest() {
    setEditingRequestId(null);
  }

  async function handleSaveRequestEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRequestId) return;

    if (!editRequestText.trim()) {
      setEditError("Your prayer request can't be empty.");
      return;
    }

    setEditSaving(true);
    setEditError("");

    const { data, error: updateError } = await supabase
      .from("prayer_requests")
      .update({
        request_text: editRequestText.trim(),
        category_id: editCategoryId || null,
        is_public: editIsPublic,
        is_anonymous: editIsAnonymous,
      })
      .eq("id", editingRequestId)
      .select(
        "id, created_at, request_text, status, category_id, is_public, is_anonymous, moderation_status"
      )
      .single();

    setEditSaving(false);

    if (updateError || !data) {
      setEditError("Something went wrong saving your changes. Please try again.");
      return;
    }

    setRequests((prev) =>
      prev.map((r) => (r.id === editingRequestId ? (data as PrayerRequestSummary) : r))
    );
    setEditingRequestId(null);
  }

  function openMarkAnswered(requestId: string) {
    const request = requests.find((r) => r.id === requestId);
    setMarkAnsweredId(requestId);
    setUpdateText(request?.answered_update ?? "");
    setMarkAnsweredError("");
  }

  function closeMarkAnswered() {
    setMarkAnsweredId(null);
  }

  // Just posts a short update and marks the request answered — no full
  // praise report. A member can always go back later and share a full
  // praise report from the Praise Wall if they change their mind.
  async function handleSaveUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!markAnsweredId) return;

    setMarkAnsweredSaving(true);
    setMarkAnsweredError("");

    const { data, error: updateError } = await supabase
      .from("prayer_requests")
      .update({
        answered: true,
        answered_update: updateText.trim() || null,
      })
      .eq("id", markAnsweredId)
      .select(
        "id, created_at, request_text, status, category_id, is_public, is_anonymous, moderation_status, answered, answered_update, archived"
      )
      .single();

    setMarkAnsweredSaving(false);

    if (updateError || !data) {
      setMarkAnsweredError("Something went wrong saving that. Please try again.");
      return;
    }

    setRequests((prev) =>
      prev.map((r) => (r.id === markAnsweredId ? (data as PrayerRequestSummary) : r))
    );
    setMarkAnsweredId(null);
  }

  function openForm() {
    setEntryType("bible_reading");
    setEntryDate(todayInputValue());
    setTitle("");
    setNotes("");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  async function handleAddEntry(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (entryType === "custom" && !title.trim()) {
      setError("Please give your entry a title.");
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setError("You need to be signed in to add to your journey.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("journey_entries")
      .insert({
        user_id: user.id,
        entry_type: entryType,
        title: title.trim() || null,
        notes: notes.trim() || null,
        entry_date: entryDate,
      })
      .select("id, entry_type, title, notes, entry_date, created_at")
      .single();

    setSaving(false);

    if (insertError || !data) {
      setError("Something went wrong saving that entry. Please try again.");
      return;
    }

    setEntries((prev) => [data as JourneyEntry, ...prev]);
    setShowForm(false);
  }

  const timeline = useMemo(() => {
    const items: TimelineItem[] = [];

    if (dateOfSalvation) {
      const date = parseLocalDate(dateOfSalvation);
      items.push({
        key: "salvation",
        time: date ? date.getTime() : 0,
        dateLabel: formatDateOnly(dateOfSalvation),
        kind: "salvation",
        title: "Accepted Christ",
      });
    }

    if (dateOfBaptism) {
      const date = parseLocalDate(dateOfBaptism);
      items.push({
        key: "baptism",
        time: date ? date.getTime() : 0,
        dateLabel: formatDateOnly(dateOfBaptism),
        kind: "baptism",
        title: "Baptized",
      });
    }

    requests.forEach((r) => {
      items.push({
        key: `prayer-${r.id}`,
        time: new Date(r.created_at).getTime(),
        dateLabel: formatDateTime(r.created_at),
        kind: "prayer",
        title: r.category_id ? categoryMap[r.category_id] ?? "Prayer Request" : "Prayer Request",
        description: r.request_text,
        meta: r.status,
        requestId: r.id,
        moderationStatus: r.moderation_status,
        answered: r.answered,
        answeredUpdate: r.answered_update,
        archived: r.archived,
      });
    });

    entries.forEach((entry) => {
      const date = parseLocalDate(entry.entry_date);
      const typeInfo = ENTRY_TYPES.find((t) => t.value === entry.entry_type);
      items.push({
        key: `entry-${entry.id}`,
        time: date ? date.getTime() : new Date(entry.created_at).getTime(),
        dateLabel: formatDateOnly(entry.entry_date),
        kind: entry.entry_type,
        title: entry.title || typeInfo?.label || "Journey Entry",
        description: entry.notes ?? undefined,
      });
    });

    if (testimony) {
      items.push({
        key: "testimony",
        time: new Date(testimony.updated_at || testimony.created_at).getTime(),
        dateLabel: formatDateTime(testimony.updated_at || testimony.created_at),
        kind: "testimony",
        title: "My Testimony",
        description: testimony.content_text,
        link: { href: "/testimonies/submit", label: "Edit my testimony" },
      });
    }

    return items.sort((a, b) => b.time - a.time);
  }, [dateOfSalvation, dateOfBaptism, requests, categoryMap, entries, testimony]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Journey</h1>
          <p className="mt-2 text-gray-600">
            A timeline of your walk with God — milestones, prayers, and moments worth remembering.
          </p>
        </div>
        <button
          type="button"
          onClick={openForm}
          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add To My Journey
        </button>
      </div>

      <div className="mt-10">
        {timeline.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-gray-500">
            Nothing here yet. Add a Bible reading, an answered prayer, or your own note to start your
            timeline.
          </div>
        ) : (
          <ol className="relative border-l border-gray-200 pl-6">
            {timeline.map((item) => {
              const style = KIND_STYLES[item.kind];
              const hasDescription = Boolean(item.description);
              const expanded = expandedIds.has(item.key);
              return (
                <li key={item.key} className="relative mb-8 last:mb-0">
                  <span className={`absolute -left-[31px] mt-1.5 h-3 w-3 rounded-full ${style.dot}`} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>
                      {style.label}
                    </span>
                    <span className="text-xs text-gray-400">{item.dateLabel}</span>
                    {item.meta && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium capitalize text-gray-600">
                        {item.meta}
                      </span>
                    )}
                    {item.moderationStatus === "pending" && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        Pending review
                      </span>
                    )}
                    {item.moderationStatus === "rejected" && (
                      <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
                        Not published — please revise
                      </span>
                    )}
                    {item.answered && (
                      <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                        Answered
                      </span>
                    )}
                    {item.archived && (
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                        Archived
                      </span>
                    )}
                  </div>

                  {hasDescription ? (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(item.key)}
                      className="mt-1.5 flex w-full items-start gap-2 text-left"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`mt-1 h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${
                          expanded ? "rotate-90" : ""
                        }`}
                      >
                        <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <p
                          className={`mt-1 text-sm text-gray-600 ${
                            expanded ? "whitespace-pre-wrap" : "truncate"
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    </button>
                  ) : (
                    <h3 className="mt-1.5 font-semibold text-gray-900">{item.title}</h3>
                  )}

                  {expanded && item.answeredUpdate && (
                    <p className="mt-2 rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-800">
                      <span className="font-medium">Update: </span>
                      {item.answeredUpdate}
                    </p>
                  )}

                  {expanded && item.requestId && (
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <button
                        type="button"
                        onClick={() => openEditRequest(item.requestId!)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Edit this request
                      </button>
                      <button
                        type="button"
                        onClick={() => openMarkAnswered(item.requestId!)}
                        className="text-xs font-medium text-violet-600 hover:text-violet-500"
                      >
                        {item.answered ? "Add an update" : "Mark as answered"}
                      </button>
                      <a
                        href={`/praise/submit?prayer_request_id=${item.requestId}`}
                        className="text-xs font-medium text-amber-600 hover:text-amber-500"
                      >
                        Share a praise report
                      </a>
                    </div>
                  )}
                  {expanded && !item.requestId && item.link && (
                    <a
                      href={item.link.href}
                      className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      {item.link.label}
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={closeForm}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900">Add To My Journey</h2>

            <form onSubmit={handleAddEntry} className="mt-4 space-y-4">
              <div className="flex gap-2">
                {ENTRY_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setEntryType(type.value)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      entryType === type.value
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {entryType === "custom" ? "Title" : "Title (optional)"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={activeType.placeholder}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any thoughts you want to remember?"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingRequestId && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={closeEditRequest}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900">
              Edit Your Prayer Request
            </h2>

            <form onSubmit={handleSaveRequestEdit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Your Prayer Request
                </label>
                <textarea
                  value={editRequestText}
                  onChange={(e) => setEditRequestText(e.target.value)}
                  rows={4}
                  required
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">No category</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Allow this request to appear on the Public Prayer Wall
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={editIsAnonymous}
                  onChange={(e) => setEditIsAnonymous(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Hide my personal information (appear anonymously)
              </label>

              {editError && <p className="text-sm text-red-600">{editError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditRequest}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
                >
                  {editSaving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {markAnsweredId && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={closeMarkAnswered}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {requests.find((r) => r.id === markAnsweredId)?.answered
                ? "Add an Update"
                : "Mark as Answered"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Want to share the full story? You can{" "}
              <a
                href={`/praise/submit?prayer_request_id=${markAnsweredId}`}
                className="font-medium text-amber-600 hover:text-amber-500"
              >
                share a praise report
              </a>{" "}
              instead, or just leave a quick update below.
            </p>

            <form onSubmit={handleSaveUpdate} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Update (optional)
                </label>
                <textarea
                  value={updateText}
                  onChange={(e) => setUpdateText(e.target.value)}
                  rows={4}
                  placeholder="What happened? A short update is great — no need for details."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {markAnsweredError && (
                <p className="text-sm text-red-600">{markAnsweredError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeMarkAnswered}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={markAnsweredSaving}
                  className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-60"
                >
                  {markAnsweredSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <p className="mt-10 text-sm text-gray-400">Signed in as {email}.</p>
    </div>
  );
}
