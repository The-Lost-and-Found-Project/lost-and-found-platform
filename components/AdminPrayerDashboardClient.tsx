"use client";

import { useState } from "react";

const STATUS_OPTIONS = [
  "New",
  "Assigned",
  "Being Prayed For",
  "Contacted",
  "Ongoing",
  "Follow-Up Needed",
  "Answered",
  "Closed",
];

type CareTeamMember = { id: string; full_name: string | null; email: string | null };
type CategoryOption = { id: string; name: string };

type AdminRequest = {
  id: string;
  user_id: string | null;
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
  assigned_to: string | null;
  follow_up_needed: boolean;
  follow_up_date: string | null;
  answered: boolean;
  praise_report: string | null;
  prayer_count: number;
  flagged: boolean;
  flag_reason: string | null;
  moderation_status: string;
  last_action_at: string;
};

type Props = {
  requests: AdminRequest[];
  categories: CategoryOption[];
  careTeam: CareTeamMember[];
  isAdmin?: boolean;
  currentUserId: string;
};

// A request "needs attention" if it's sitting in moderation, has no one
// assigned to it, or is marked as needing follow-up but hasn't been marked
// answered yet. This is the default view so admins land on their to-do list
// instead of the full firehose of every request ever submitted.
function needsAttention(r: AdminRequest): boolean {
  return (
    r.moderation_status === "pending" ||
    !r.assigned_to ||
    (r.follow_up_needed && !r.answered)
  );
}

// Whole days since the assigned prayer partner last checked off an action
// item (or since the request was created/assigned, if none yet). Floors
// rather than rounds so "0 days" reads as today, not tomorrow.
function daysSinceLastAction(r: AdminRequest): number {
  const last = new Date(r.last_action_at).getTime();
  const diffMs = Date.now() - last;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export default function AdminPrayerDashboardClient({
  requests: initialRequests,
  categories,
  careTeam,
  isAdmin,
  currentUserId,
}: Props) {
  const [requests, setRequests] = useState<AdminRequest[]>(initialRequests);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [attentionOnly, setAttentionOnly] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editIsAnonymous, setEditIsAnonymous] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categoryMap: Record<string, string> = {};
  categories.forEach((c) => {
    categoryMap[c.id] = c.name;
  });

  const pendingCount = requests.filter(
    (r) => r.moderation_status === "pending"
  ).length;
  const attentionCount = requests.filter(needsAttention).length;

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

  // Every moderation action (approve/deny/flag/assign/edit/answer) goes
  // through this one authenticated, server-checked route rather than
  // writing to Supabase directly from the browser with the anon key — the
  // server re-verifies the caller is an admin before making any change, and
  // reconciles local state with whatever the server actually applied
  // (important for edits, since re-saving request_text can flip
  // flagged/moderation_status server-side via a DB trigger).
  async function updateRequest(id: string, changes: Partial<AdminRequest>) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...changes } : r))
    );
    try {
      const res = await fetch("/api/admin/prayer-requests/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, changes }),
      });
      if (res.ok) {
        const { request: updated } = await res.json();
        if (updated) {
          setRequests((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
          );
        }
      } else {
        console.error("Failed to update prayer request:", await res.text());
      }
    } catch (err) {
      console.error("Failed to update prayer request:", err);
    }
  }

  async function assignRequest(request: AdminRequest, assigneeId: string) {
    await updateRequest(request.id, { assigned_to: assigneeId || null });
    if (!assigneeId) return;

    // Fire-and-forget: the in-app notification is already handled by a DB
    // trigger. This email gives the assignee the full submission so they
    // can reach out directly if needed. The route looks everything up
    // itself server-side from requestId, so no submission details need to
    // travel through the browser to get there.
    fetch("/api/notify-assignment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: request.id }),
    }).catch((err) => {
      console.error("Failed to send assignment notification:", err);
    });
  }

  function updatePraiseReportLocal(id: string, value: string) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, praise_report: value } : r))
    );
  }

  async function approveRequest(id: string) {
    await updateRequest(id, {
      moderation_status: "approved",
      flagged: false,
      flag_reason: null,
    });
  }

  async function denyRequest(request: AdminRequest) {
    await updateRequest(request.id, { moderation_status: "rejected" });

    if (!request.email) return;
    fetch("/api/notify-content-denied", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: request.email,
        name: request.name,
        userId: request.user_id,
      }),
    }).catch((err) => {
      console.error("Failed to send content-denied notification:", err);
    });
  }

  async function manualFlag(id: string) {
    await updateRequest(id, {
      flagged: true,
      moderation_status: "pending",
      flag_reason: "Manually flagged by admin for review.",
    });
  }

  function startEdit(request: AdminRequest) {
    setEditingId(request.id);
    setEditText(request.request_text);
    setEditCategoryId(request.category_id ?? "");
    setEditIsPublic(request.is_public);
    setEditIsAnonymous(request.is_anonymous);
    setExpandedIds((prev) => new Set(prev).add(request.id));
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleDeleteRequest(id: string) {
    setDeletingId(id);
    const res = await fetch("/api/admin/prayer-requests/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id }),
    });
    setDeletingId(null);
    setConfirmingDeleteId(null);
    if (res.ok) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Something went wrong deleting this request.");
    }
  }

  // Editing request_text re-runs the moderation trigger server-side (it can
  // flip flagged/moderation_status/flag_reason in either direction), so
  // this relies on updateRequest reconciling with the server's response
  // rather than trusting the fields we sent.
  async function saveEdit(id: string) {
    await updateRequest(id, {
      request_text: editText,
      category_id: editCategoryId || null,
      is_public: editIsPublic,
      is_anonymous: editIsAnonymous,
    });
    setEditingId(null);
  }

  const visibleRequests = requests
    .filter((r) => (statusFilter === "All" ? true : r.status === statusFilter))
    .filter((r) => (flaggedOnly ? r.moderation_status === "pending" : true))
    .filter((r) => (attentionOnly ? needsAttention(r) : true));

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prayer Care Admin</h1>
          <p className="mt-2 text-gray-600">
            Manage incoming prayer requests, assignments, and follow-up.
          </p>
        </div>
      </div>

      <>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-pressed={attentionOnly}
            onClick={() => setAttentionOnly((v) => !v)}
            className={`min-h-11 rounded-full px-3 py-2 text-sm font-medium shadow-sm transition ${
              attentionOnly
                ? "bg-indigo-600 text-white"
                : "border border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            Needs attention{attentionOnly ? ` (${attentionCount})` : ""}
          </button>
          {!attentionOnly && (
            <span className="text-xs text-gray-400">
              Showing all requests — {attentionCount} need attention
            </span>
          )}

          <label
            htmlFor="admin-status-filter"
            className="ml-2 text-sm font-medium text-gray-700"
          >
            Filter by status
          </label>
          <select
            id="admin-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-11 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
          >
            <option value="All">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {isAdmin && (
            <button
              type="button"
              aria-pressed={flaggedOnly}
              onClick={() => setFlaggedOnly((v) => !v)}
              className={`min-h-11 rounded-full px-3 py-2 text-sm font-medium shadow-sm transition ${
                flaggedOnly
                  ? "bg-amber-500 text-white"
                  : "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              Flagged for review{pendingCount > 0 ? ` (${pendingCount})` : ""}
            </button>
          )}
        </div>

        <div className="mt-6 space-y-3">
          {visibleRequests.length === 0 && (
            <p className="text-gray-500">
              {attentionOnly
                ? "Nothing needs attention right now. Nice."
                : "No prayer requests match this filter."}
            </p>
          )}

          {visibleRequests.map((r) => {
            const expanded = expandedIds.has(r.id);
            const assignee = careTeam.find((m) => m.id === r.assigned_to);
            const isMine = r.assigned_to === currentUserId;
            const snippet =
              r.request_text.length > 90
                ? `${r.request_text.slice(0, 90)}...`
                : r.request_text;

            return (
              <div
                key={r.id}
                className={`rounded-lg border bg-white shadow-sm ${
                  r.moderation_status === "pending"
                    ? "border-amber-300 ring-1 ring-amber-100"
                    : r.moderation_status === "rejected"
                    ? "border-red-200"
                    : isMine
                    ? "border-emerald-300 ring-1 ring-emerald-100"
                    : "border-gray-200"
                }`}
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`prayer-request-${r.id}`}
                  onClick={() => toggleExpanded(r.id)}
                  className="flex min-h-11 w-full items-start gap-3 px-4 py-3 text-left"
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
                      {r.moderation_status === "pending" && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Needs review
                        </span>
                      )}
                      {r.moderation_status === "rejected" && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                          Denied
                        </span>
                      )}
                      {!r.assigned_to ? (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-500">
                          Unassigned
                        </span>
                      ) : (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            isMine
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          Assigned to {assignee?.full_name ?? "Unknown"}
                          {isMine ? " (you)" : ""}
                        </span>
                      )}
                      {r.assigned_to && !r.answered && (() => {
                        const days = daysSinceLastAction(r);
                        return (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              days >= 7
                                ? "bg-red-50 text-red-600"
                                : days >= 3
                                ? "bg-amber-50 text-amber-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {days === 0
                              ? "Action taken today"
                              : `${days} day${days === 1 ? "" : "s"} since last action`}
                          </span>
                        );
                      })()}
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
                  <div
                    id={`prayer-request-${r.id}`}
                    className="border-t border-gray-100 px-5 pb-5 pt-4"
                  >
                    {r.moderation_status === "pending" && (
                      <div className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                        Flagged for review{r.flag_reason ? `: ${r.flag_reason}` : ""}
                      </div>
                    )}
                    {r.moderation_status === "rejected" && (
                      <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                        Denied &mdash; hidden from the public Prayer Wall.
                      </div>
                    )}

                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        {editingId === r.id ? (
                          <div className="space-y-3">
                            <label
                              htmlFor={`request-text-${r.id}`}
                              className="block text-xs font-medium text-gray-700"
                            >
                              Prayer request
                            </label>
                            <textarea
                              id={`request-text-${r.id}`}
                              rows={4}
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
                            />
                            <div className="flex flex-wrap items-center gap-3">
                              <select
                                aria-label={`Category for ${r.name}'s prayer request`}
                                value={editCategoryId}
                                onChange={(e) => setEditCategoryId(e.target.value)}
                                className="min-h-11 rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm"
                              >
                                <option value="">No category</option>
                                {categories.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                              <label className="flex min-h-11 items-center gap-1.5 text-xs text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={editIsPublic}
                                  onChange={(e) => setEditIsPublic(e.target.checked)}
                                  className="rounded border-gray-300"
                                />
                                Public
                              </label>
                              <label className="flex min-h-11 items-center gap-1.5 text-xs text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={editIsAnonymous}
                                  onChange={(e) =>
                                    setEditIsAnonymous(e.target.checked)
                                  }
                                  className="rounded border-gray-300"
                                />
                                Anonymous on wall
                              </label>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => saveEdit(r.id)}
                                className="min-h-11 rounded-md bg-indigo-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-500"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="min-h-11 rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-900">{r.request_text}</p>
                        )}

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

                        {isAdmin && editingId !== r.id && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              aria-label={`Edit ${r.name}'s prayer request`}
                              onClick={() => startEdit(r)}
                              className="min-h-11 rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                              Edit
                            </button>
                            {r.moderation_status === "pending" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => approveRequest(r.id)}
                                  className="min-h-11 rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-emerald-500"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => denyRequest(r)}
                                  className="min-h-11 rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-red-500"
                                >
                                  Deny
                                </button>
                              </>
                            ) : (
                              !r.flagged && (
                                <button
                                  type="button"
                                  onClick={() => manualFlag(r.id)}
                                  className="min-h-11 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 shadow-sm hover:bg-amber-100"
                                >
                                  Flag for review
                                </button>
                              )
                            )}
                            {confirmingDeleteId === r.id ? (
                              <span className="flex items-center gap-2 text-xs">
                                <span className="font-medium text-red-600">
                                  Delete this request?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRequest(r.id)}
                                  disabled={deletingId === r.id}
                                  className="min-h-11 rounded-md bg-red-600 px-3 py-2 font-medium text-white shadow-sm hover:bg-red-500 disabled:opacity-60"
                                >
                                  {deletingId === r.id ? "Deleting…" : "Confirm"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmingDeleteId(null)}
                                  className="min-h-11 rounded-md border border-gray-300 px-3 py-2 font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <button
                                type="button"
                                aria-label={`Delete ${r.name}'s prayer request`}
                                onClick={() => setConfirmingDeleteId(r.id)}
                                className="min-h-11 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 shadow-sm hover:bg-red-100"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <select
                          aria-label={`Status for ${r.name}'s prayer request`}
                          value={r.status}
                          onChange={(e) =>
                            updateRequest(r.id, { status: e.target.value })
                          }
                          className="min-h-11 rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label={`Assignee for ${r.name}'s prayer request`}
                          value={r.assigned_to ?? ""}
                          onChange={(e) => assignRequest(r, e.target.value)}
                          className="min-h-11 rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm"
                        >
                          <option value="">Unassigned</option>
                          {careTeam.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.full_name ?? "Unnamed"}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 text-sm">
                      <label className="flex min-h-11 items-center gap-2 text-gray-700">
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
                          aria-label={`Follow-up date for ${r.name}'s prayer request`}
                          type="date"
                          value={r.follow_up_date ?? ""}
                          onChange={(e) =>
                            updateRequest(r.id, {
                              follow_up_date: e.target.value || null,
                            })
                          }
                          className="min-h-11 rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm"
                        />
                      )}
                      <label className="flex min-h-11 items-center gap-2 text-gray-700">
                        <input
                          type="checkbox"
                          checked={r.answered}
                          onChange={(e) =>
                            updateRequest(r.id, {
                              answered: e.target.checked,
                              status: e.target.checked ? "Answered" : r.status,
                            })
                          }
                          className="rounded border-gray-300"
                        />
                        Answered
                      </label>
                    </div>

                    {r.answered && (
                      <div className="mt-3">
                        <label
                          htmlFor={`praise-report-${r.id}`}
                          className="block text-xs font-medium text-gray-500"
                        >
                          Praise report
                        </label>
                        <textarea
                          id={`praise-report-${r.id}`}
                          rows={2}
                          value={r.praise_report ?? ""}
                          onChange={(e) =>
                            updatePraiseReportLocal(r.id, e.target.value)
                          }
                          onBlur={(e) =>
                            updateRequest(r.id, { praise_report: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    </div>
  );
}
