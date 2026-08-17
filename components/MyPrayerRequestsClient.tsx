"use client";

import { useMemo, useState } from "react";

type PrayerRequest = {
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
  prayer_count: number;
};

type Category = { id: string; name: string };

export default function MyPrayerRequestsClient({
  requests: initialRequests,
  categories,
}: {
  requests: PrayerRequest[];
  categories: Category[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [requestText, setRequestText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [answeredId, setAnsweredId] = useState<string | null>(null);
  const [answeredUpdate, setAnsweredUpdate] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories]
  );

  function beginEdit(request: PrayerRequest) {
    setEditingId(request.id);
    setRequestText(request.request_text);
    setCategoryId(request.category_id ?? "");
    setIsPublic(request.is_public);
    setIsAnonymous(request.is_anonymous);
    setError("");
  }

  async function updateRequest(
    requestId: string,
    action: "edit" | "resolve" | "withdraw",
    details: Record<string, unknown> = {}
  ) {
    setBusyId(requestId);
    setError("");
    try {
      const response = await fetch("/api/prayer-requests/mine/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, ...details }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.request) {
        setError(result.error ?? "We could not save that change. Please try again.");
        return;
      }
      setRequests((current) => current.map((request) => request.id === requestId
        ? { ...request, ...result.request }
        : request));
      setEditingId(null);
      setAnsweredId(null);
    } catch {
      setError("We could not save that change. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  const visibleRequests = requests.filter((request) => !request.archived);

  if (visibleRequests.length === 0) {
    return (
      <section className="lfp-card p-8 text-center">
        <span className="text-4xl" aria-hidden="true">🙏</span>
        <h2 className="mt-4 text-2xl font-black text-slate-950">You have no active prayer requests.</h2>
        <p className="mt-3 text-slate-600">When you share one, you will be able to review it here.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="my-prayer-requests-title">
      <div className="max-w-3xl">
        <p className="lfp-eyebrow">Your requests</p>
        <h2 id="my-prayer-requests-title" className="mt-2 text-3xl font-black text-slate-950">A clear record of what you shared</h2>
      </div>
      {error && <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800" role="alert">{error}</p>}
      <div className="mt-7 space-y-4">
        {visibleRequests.map((request) => {
          const editing = editingId === request.id;
          const resolving = answeredId === request.id;
          const busy = busyId === request.id;
          const category = request.category_id ? categoryNames.get(request.category_id) : undefined;
          return (
            <article key={request.id} className="lfp-card p-6 sm:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{request.answered || request.status === "Resolved" ? "Answered" : request.moderation_status === "pending" ? "Under review" : "Active"}</span>
                {category && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{category}</span>}
                <span className="text-xs font-semibold text-slate-400">{request.prayer_count} {request.prayer_count === 1 ? "prayer" : "prayers"}</span>
              </div>

              {editing ? (
                <div className="mt-5 space-y-4">
                  <label className="block text-sm font-bold text-slate-800">Prayer request
                    <textarea value={requestText} onChange={(event) => setRequestText(event.target.value)} rows={5} maxLength={5000} className="mt-2 block w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" />
                  </label>
                  <label className="block text-sm font-bold text-slate-800">Category
                    <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-2 block min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal">
                      {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <div className="flex flex-wrap gap-5">
                    <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} /> Share on Prayer Wall</label>
                    <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} /> Show as anonymous</label>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" disabled={busy} onClick={() => updateRequest(request.id, "edit", { requestText, categoryId, isPublic, isAnonymous })} className="lfp-button lfp-button-primary">{busy ? "Saving..." : "Save Changes"}</button>
                    <button type="button" disabled={busy} onClick={() => setEditingId(null)} className="lfp-button border border-slate-300 bg-white text-slate-800">Cancel</button>
                  </div>
                </div>
              ) : resolving ? (
                <div className="mt-5">
                  <label className="block text-sm font-bold text-slate-800">Optional answered-prayer update
                    <textarea value={answeredUpdate} onChange={(event) => setAnsweredUpdate(event.target.value)} rows={3} maxLength={2000} className="mt-2 block w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" />
                  </label>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" disabled={busy} onClick={() => updateRequest(request.id, "resolve", { answeredUpdate })} className="lfp-button bg-emerald-600 text-white">{busy ? "Saving..." : "Mark Answered"}</button>
                    <button type="button" disabled={busy} onClick={() => setAnsweredId(null)} className="lfp-button border border-slate-300 bg-white text-slate-800">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-5 whitespace-pre-wrap text-lg leading-8 text-slate-800">{request.request_text}</p>
                  {request.answered_update && <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-emerald-900"><span className="font-black">Update:</span> {request.answered_update}</p>}
                  <p className="mt-4 text-xs font-semibold text-slate-400">Shared {new Date(request.created_at).toLocaleDateString()} · {request.is_public ? "Prayer Wall" : "Private"}{request.is_anonymous ? " · Anonymous" : ""}</p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {!request.answered && <button type="button" onClick={() => beginEdit(request)} className="lfp-button border border-slate-300 bg-white text-slate-800">Edit</button>}
                    {!request.answered && <button type="button" onClick={() => { setAnsweredId(request.id); setAnsweredUpdate(request.answered_update ?? ""); }} className="lfp-button bg-emerald-600 text-white">Mark Answered</button>}
                    <button type="button" disabled={busy} onClick={() => { if (window.confirm("Remove this request from your active list and the Prayer Wall?")) updateRequest(request.id, "withdraw"); }} className="lfp-button border border-rose-200 bg-rose-50 text-rose-800">{busy ? "Removing..." : "Remove"}</button>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
