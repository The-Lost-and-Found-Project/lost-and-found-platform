"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type FeedbackMessage = {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  message: string;
  status: string;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  reviewed: "Reviewed",
  archived: "Archived",
};

export default function AdminFeedbackClient({
  messages: initialMessages,
}: {
  messages: FeedbackMessage[];
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<FeedbackMessage[]>(initialMessages);
  // Defaults to "new" so admins land on the unread queue first, instead of
  // the full All list (which buries new feedback under everything already
  // reviewed/archived).
  const [filter, setFilter] = useState<"All" | "new" | "reviewed" | "archived">(
    "new"
  );

  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const search = query.trim().toLocaleLowerCase();

  const newCount = messages.filter((m) => m.status === "new").length;

  const visibleMessages = messages.filter((m) =>
    (filter === "All" || m.status === filter) &&
    (!search || [m.name, m.email, m.message].some((value) => value?.toLocaleLowerCase().includes(search)))
  );

  async function updateStatus(id: string, status: string) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const { data, error: saveError } = await supabase
        .from("feedback_messages")
        .update({ status })
        .eq("id", id)
        .select("id, status")
        .single();
      if (saveError || !data || data.id !== id || data.status !== status) {
        setError("The feedback status could not be saved. Your message is unchanged. Try again.");
        return;
      }
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, status: data.status } : m));
      setNotice(`Feedback marked ${STATUS_LABELS[status]?.toLowerCase() ?? status}.`);
    } catch {
      setError("The feedback status could not be saved. Check your connection and try again.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 pb-28 sm:px-6">
      <header className="rounded-3xl bg-gradient-to-br from-slate-950 to-indigo-950 p-6 text-white shadow-lg sm:p-8">
        <p className="text-xs font-black uppercase tracking-widest text-amber-300">Member listening</p>
        <h1 className="mt-2 text-3xl font-black">Feedback Inbox</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Review member feedback, track what needs attention, and archive messages when follow-up is complete. Status changes do not send a reply.</p>
        <dl className="mt-6 grid grid-cols-3 gap-3">
          {[{ label: "New", count: newCount }, { label: "Reviewed", count: messages.filter(m => m.status === "reviewed").length }, { label: "Archived", count: messages.filter(m => m.status === "archived").length }].map(item => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-4">
              <dt className="text-xs text-slate-300">{item.label}</dt>
              <dd className="mt-1 text-2xl font-black">{item.count}</dd>
            </div>
          ))}
        </dl>
      </header>
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</p>}
      <p role="status" className="mt-3 text-sm font-bold text-emerald-800">{notice}</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label
          htmlFor="feedback-status-filter"
          className="text-sm font-medium text-gray-700"
        >
          Filter by status
        </label>
        <select
          id="feedback-status-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="min-h-11 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
        >
          <option value="All">All</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="archived">Archived</option>
        </select>
        <div className="min-w-0 flex-1 sm:ml-3">
          <label htmlFor="feedback-search" className="block text-sm font-medium text-gray-700">Search feedback</label>
          <input id="feedback-search" type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Name, email, or message" className="mt-1 min-h-11 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" />
        </div>
      </div>
      <p role="status" className="mt-4 text-sm text-slate-600">Showing {visibleMessages.length} of {messages.length} messages</p>
      <div aria-busy={busy} className="mt-6 space-y-4">
        {visibleMessages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6">
            <h2 className="font-black text-slate-900">{messages.length === 0 ? "No feedback yet" : "No matching feedback"}</h2>
            <p className="mt-2 text-sm text-slate-600">{messages.length === 0 ? "Member messages will appear here when submitted." : "Choose another status or clear your search to see other messages."}</p>
            {(search || filter !== "All") && messages.length > 0 && <button type="button" onClick={() => { setQuery(""); setFilter("All"); }} className="mt-3 min-h-11 rounded-xl border px-3 py-2 text-sm font-bold">Show all feedback</button>}
          </div>
        )}

        {visibleMessages.map((m) => (
          <div
            key={m.id}
            className={`rounded-2xl border p-5 shadow-sm ${
              m.status === "new"
                ? "border-indigo-200 bg-indigo-50/40"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 break-words text-xs text-gray-500">
                {new Date(m.created_at).toLocaleString("en-US", { timeZone: "America/New_York", timeZoneName: "short" })}
                {(m.name || m.email) && (
                  <span>
                    {" "}
                    &middot; {m.name || "Unnamed"}
                    {m.email ? ` (${m.email})` : ""}
                  </span>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  m.status === "new"
                    ? "bg-indigo-100 text-indigo-700"
                    : m.status === "reviewed"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {STATUS_LABELS[m.status] ?? m.status}
              </span>
            </div>

            <p className="mt-3 whitespace-pre-wrap break-words text-gray-900">
              {m.message}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {m.status !== "reviewed" && (
                <button
                  type="button"
                  aria-label={`Mark feedback from ${m.name || m.email || "anonymous user"} reviewed`}
                  disabled={busy}
                  onClick={() => updateStatus(m.id, "reviewed")}
                  className="min-h-11 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Mark Reviewed
                </button>
              )}
              {m.status !== "archived" && (
                <button
                  type="button"
                  aria-label={`Archive feedback from ${m.name || m.email || "anonymous user"}`}
                  disabled={busy}
                  onClick={() => updateStatus(m.id, "archived")}
                  className="min-h-11 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Archive
                </button>
              )}
              {m.status !== "new" && (
                <button
                  type="button"
                  aria-label={`Mark feedback from ${m.name || m.email || "anonymous user"} unread`}
                  disabled={busy}
                  onClick={() => updateStatus(m.id, "new")}
                  className="min-h-11 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Mark Unread
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
