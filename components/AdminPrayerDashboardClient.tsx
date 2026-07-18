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
  "Answered",
  "Closed",
];

type CareTeamMember = { id: string; full_name: string | null; email: string | null };
type CategoryOption = { id: string; name: string };

type AdminRequest = {
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
  assigned_to: string | null;
  follow_up_needed: boolean;
  follow_up_date: string | null;
  answered: boolean;
  praise_report: string | null;
  prayer_count: number;
  flagged: boolean;
  flag_reason: string | null;
  moderation_status: string;
};

type Props = {
  requests: AdminRequest[];
  categories: CategoryOption[];
  careTeam: CareTeamMember[];
  isAdmin?: boolean;
};

export default function AdminPrayerDashboardClient({
  requests: initialRequests,
  categories,
  careTeam,
  isAdmin,
}: Props) {
  const supabase = createClient();
  const [requests, setRequests] = useState<AdminRequest[]>(initialRequests);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editIsAnonymous, setEditIsAnonymous] = useState(false);

  const categoryMap: Record<string, string> = {};
  categories.forEach((c) => {
    categoryMap[c.id] = c.name;
  });

  const pendingCount = requests.filter(
    (r) => r.moderation_status === "pending"
  ).length;

  async function updateRequest(id: string, changes: Partial<AdminRequest>) {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...changes } : r))
    );

    await supabase.from("prayer_requests").update(changes).eq("id", id);
  }

  async function assignRequest(request: AdminRequest, assigneeId: string) {
    await updateRequest(request.id, { assigned_to: assigneeId || null });

    if (!assigneeId) return;

    const assignee = careTeam.find((m) => m.id === assigneeId);
    if (!assignee?.email) return;

    // Fire-and-forget: the in-app notification is already handled by a DB
    // trigger. This email gives the assignee the full submission so they can
    // reach out directly if needed.
    fetch("/api/notify-assignment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assigneeEmail: assignee.email,
        assigneeName: assignee.full_name,
        name: request.name,
        email: request.email,
        phone: request.phone,
        preferredContact: request.preferred_contact,
        categoryName: request.category_id
          ? categoryMap[request.category_id]
          : null,
        requestText: request.request_text,
        isPublic: request.is_public,
        isAnonymous: request.is_anonymous,
        contactRequested: request.contact_requested,
      }),
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
      body: JSON.stringify({ email: request.email, name: request.name }),
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
  }

  function cancelEdit() {
    setEditingId(null);
  }

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
    .filter((r) => (flaggedOnly ? r.moderation_status === "pending" : true));

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prayer Care Admin</h1>
          <p className="mt-2 text-gray-600">
            Manage incoming prayer requests, assignments, and follow-up.
          </p>
        </div>
        {isAdmin && (
          <a
            href="/admin/users"
            className="shrink-0 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            Manage Users
          </a>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-gray-700">
          Filter by status
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm"
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
            onClick={() => setFlaggedOnly((v) => !v)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium shadow-sm transition ${
              flaggedOnly
                ? "bg-amber-500 text-white"
                : "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            Flagged for review{pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {visibleRequests.length === 0 && (
          <p className="text-gray-500">
            No prayer requests match this filter.
          </p>
        )}

        {visibleRequests.map((r) => (
          <div
            key={r.id}
            className={`rounded-lg border bg-white p-5 shadow-sm ${
              r.moderation_status === "pending"
                ? "border-amber-300 ring-1 ring-amber-100"
                : r.moderation_status === "rejected"
                ? "border-red-200"
                : "border-gray-200"
            }`}
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
                    <textarea
                      rows={4}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={editCategoryId}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm"
                      >
                        <option value="">No category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1.5 text-xs text-gray-700">
                        <input
                          type="checkbox"
                          checked={editIsPublic}
                          onChange={(e) => setEditIsPublic(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        Public
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-gray-700">
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
                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-500"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
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
                      onClick={() => startEdit(r)}
                      className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    {r.moderation_status === "pending" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => approveRequest(r.id)}
                          className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-emerald-500"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => denyRequest(r)}
                          className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-red-500"
                        >
                          Deny
                        </button>
                      </>
                    ) : (
                      !r.flagged && (
                        <button
                          type="button"
                          onClick={() => manualFlag(r.id)}
                          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 shadow-sm hover:bg-amber-100"
                        >
                          Flag for review
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
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

                <select
                  value={r.assigned_to ?? ""}
                  onChange={(e) => assignRequest(r, e.target.value)}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm"
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

              <label className="flex items-center gap-2 text-gray-700">
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
                <label className="block text-xs font-medium text-gray-500">
                  Praise report
                </label>
                <textarea
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
        ))}
      </div>
    </div>
  );
}
