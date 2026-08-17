"use client";

import { useMemo, useState } from "react";
import { needsPrayerExposure } from "@/lib/prayer-distribution";

const STATUS_OPTIONS = ["Submitted", "Reviewed", "Resolved", "Closed", "Escalated", "Withdrawn"];

type CategoryOption = { id: string; name: string };
type AdminRequest = {
  id: string;
  user_id: string | null;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  category_id: string | null;
  request_text: string;
  is_public: boolean;
  is_anonymous: boolean;
  status: string;
  answered: boolean;
  praise_report: string | null;
  prayer_count: number;
  flagged: boolean;
  flag_reason: string | null;
  moderation_status: string;
};

function needsAttention(request: AdminRequest) {
  return request.moderation_status === "pending"
    || request.status === "Submitted"
    || request.status === "Escalated"
    || needsPrayerExposure(request);
}

export default function AdminPrayerDashboardClient({
  requests: initialRequests,
  categories,
}: {
  requests: AdminRequest[];
  categories: CategoryOption[];
  isAdmin?: boolean;
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [attentionOnly, setAttentionOnly] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [editIsAnonymous, setEditIsAnonymous] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  );

  async function updateRequest(id: string, changes: Partial<AdminRequest>) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch("/api/admin/prayer-requests/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, changes }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.request) {
        setError(result.error ?? "The request could not be updated.");
        return false;
      }
      setRequests((current) => current.map((request) => request.id === id
        ? { ...request, ...result.request }
        : request));
      return true;
    } catch {
      setError("The request could not be updated.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function beginEdit(request: AdminRequest) {
    setEditingId(request.id);
    setEditText(request.request_text);
    setEditCategoryId(request.category_id ?? "");
    setEditIsPublic(request.is_public);
    setEditIsAnonymous(request.is_anonymous);
  }

  async function deleteRequest(id: string) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch("/api/admin/prayer-requests/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) setError(result.error ?? "The request could not be deleted.");
      else setRequests((current) => current.filter((request) => request.id !== id));
    } catch {
      setError("The request could not be deleted.");
    } finally {
      setBusyId(null);
      setConfirmingDeleteId(null);
    }
  }

  const visibleRequests = requests
    .filter((request) => !attentionOnly || needsAttention(request))
    .filter((request) => statusFilter === "All" || request.status === statusFilter);
  const attentionCount = requests.filter(needsAttention).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Prayer moderation</p>
        <h3 className="mt-2 text-2xl font-black text-slate-950">Review community requests</h3>
        <p className="mt-2 text-slate-600">Protect privacy and safety, approve public requests, and record answered prayer. Requests are not assigned to individual members.</p>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-5">
        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Request queue">
          <button type="button" aria-pressed={attentionOnly} onClick={() => setAttentionOnly(true)} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-bold ${attentionOnly ? "bg-indigo-600 text-white" : "text-slate-700"}`}>Attention ({attentionCount})</button>
          <button type="button" aria-pressed={!attentionOnly} onClick={() => setAttentionOnly(false)} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-bold ${!attentionOnly ? "bg-indigo-600 text-white" : "text-slate-700"}`}>All ({requests.length})</button>
        </div>
        <label htmlFor="admin-status-filter" className="text-xs font-bold uppercase tracking-wide text-slate-500">Status
          <select id="admin-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 block min-h-11 rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-800">
            <option value="All">All statuses</option>
            {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800" role="alert">{error}</p>}
      <p className="mt-4 text-sm text-slate-500" role="status">Showing {visibleRequests.length} request{visibleRequests.length === 1 ? "" : "s"}.</p>

      <div className="mt-4 space-y-3">
        {visibleRequests.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">Nothing needs attention right now.</p>}
        {visibleRequests.map((request) => {
          const expanded = expandedIds.has(request.id);
          const editing = editingId === request.id;
          const busy = busyId === request.id;
          const category = request.category_id ? categoryNames.get(request.category_id) : undefined;
          const underexposed = needsPrayerExposure(request);
          return (
            <article key={request.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${request.moderation_status === "pending" || underexposed ? "border-amber-300" : "border-slate-200"}`}>
              <button type="button" onClick={() => toggleExpanded(request.id)} aria-expanded={expanded} aria-controls={`prayer-request-${request.id}`} className="flex min-h-14 w-full items-start gap-3 px-5 py-4 text-left">
                <span className={`mt-0.5 text-xl font-black text-indigo-600 transition ${expanded ? "rotate-90" : ""}`} aria-hidden="true">›</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-black text-slate-950">{request.name}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">{request.status}</span>
                    {request.moderation_status === "pending" && <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">Needs review</span>}
                    {underexposed && <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-bold text-indigo-800">Needs prayer exposure</span>}
                    {request.answered && <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">Answered</span>}
                  </span>
                  {!expanded && <span className="mt-2 block truncate text-sm text-slate-500">{request.request_text}</span>}
                </span>
              </button>

              {expanded && (
                <div id={`prayer-request-${request.id}`} className="border-t border-slate-100 px-5 py-5">
                  {editing ? (
                    <div className="space-y-4">
                      <textarea value={editText} onChange={(event) => setEditText(event.target.value)} rows={5} className="block w-full rounded-xl border border-slate-300 px-3 py-2" />
                      <select value={editCategoryId} onChange={(event) => setEditCategoryId(event.target.value)} className="min-h-11 rounded-xl border border-slate-300 px-3 py-2">
                        {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                      <div className="flex flex-wrap gap-5">
                        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={editIsPublic} onChange={(event) => setEditIsPublic(event.target.checked)} /> Public</label>
                        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={editIsAnonymous} onChange={(event) => setEditIsAnonymous(event.target.checked)} /> Anonymous</label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={busy} onClick={async () => { if (await updateRequest(request.id, { request_text: editText.trim(), category_id: editCategoryId, is_public: editIsPublic, is_anonymous: editIsAnonymous })) setEditingId(null); }} className="lfp-button lfp-button-primary">{busy ? "Saving..." : "Save"}</button>
                        <button type="button" onClick={() => setEditingId(null)} className="lfp-button border border-slate-300 bg-white text-slate-800">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap text-lg leading-8 text-slate-800">{request.request_text}</p>
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                        <a href={`mailto:${request.email}`} className="text-indigo-700">{request.email}</a>
                        {request.phone && <span>{request.phone}</span>}
                        {category && <span>{category}</span>}
                        <span>{request.is_public ? "Prayer Wall" : "Private"}{request.is_anonymous ? " · Anonymous" : ""}</span>
                        <span>{request.prayer_count} prayers</span>
                      </div>
                    </>
                  )}

                  {!editing && (
                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                      <button type="button" onClick={() => beginEdit(request)} className="lfp-button border border-slate-300 bg-white text-slate-800">Edit</button>
                      {request.moderation_status === "pending" ? (
                        <>
                          <button type="button" disabled={busy} onClick={() => updateRequest(request.id, { moderation_status: "approved", flagged: false, flag_reason: null, status: "Reviewed" })} className="lfp-button bg-emerald-600 text-white">Approve</button>
                          <button type="button" disabled={busy} onClick={() => updateRequest(request.id, { moderation_status: "rejected", is_public: false })} className="lfp-button bg-rose-600 text-white">Deny</button>
                        </>
                      ) : (
                        <button type="button" disabled={busy} onClick={() => updateRequest(request.id, { flagged: true, moderation_status: "pending", flag_reason: "Manually flagged by admin for review." })} className="lfp-button border border-amber-300 bg-amber-50 text-amber-800">Flag for review</button>
                      )}
                      <select aria-label={`Status for ${request.name}'s prayer request`} value={request.status} disabled={busy} onChange={(event) => updateRequest(request.id, { status: event.target.value, answered: event.target.value === "Resolved" ? true : request.answered })} className="min-h-11 rounded-xl border border-slate-300 px-3 py-2 text-sm">
                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                      {confirmingDeleteId === request.id ? (
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-bold text-rose-700">Delete permanently?</span>
                          <button type="button" disabled={busy} onClick={() => deleteRequest(request.id)} className="lfp-button bg-rose-600 text-white">Confirm</button>
                          <button type="button" onClick={() => setConfirmingDeleteId(null)} className="lfp-button border border-slate-300 bg-white text-slate-800">Cancel</button>
                        </span>
                      ) : <button type="button" onClick={() => setConfirmingDeleteId(request.id)} className="lfp-button border border-rose-200 bg-rose-50 text-rose-800">Delete</button>}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
