"use client";

import { useState } from "react";
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
  const [filter, setFilter] = useState<"All" | "new" | "reviewed" | "archived">(
    "All"
  );

  const newCount = messages.filter((m) => m.status === "new").length;

  const visibleMessages = messages.filter((m) =>
    filter === "All" ? true : m.status === filter
  );

  async function updateStatus(id: string, status: string) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );

    await supabase.from("feedback_messages").update({ status }).eq("id", id);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beta Feedback</h1>
          <p className="mt-2 text-gray-600">
            One-way feedback messages from beta testers.
            {newCount > 0 && (
              <span className="ml-1 font-medium text-indigo-600">
                {newCount} new
              </span>
            )}
          </p>
        </div>
        <a
          href="/admin"
          className="shrink-0 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          Back to Admin
        </a>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-gray-700">
          Filter by status
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm"
        >
          <option value="All">All</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {visibleMessages.length === 0 && (
          <p className="text-gray-500">No feedback messages here.</p>
        )}

        {visibleMessages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg border p-5 shadow-sm ${
              m.status === "new"
                ? "border-indigo-200 bg-indigo-50/40"
                : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="text-xs text-gray-500">
                {new Date(m.created_at).toLocaleString()}
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

            <p className="mt-3 whitespace-pre-wrap text-gray-900">
              {m.message}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {m.status !== "reviewed" && (
                <button
                  onClick={() => updateStatus(m.id, "reviewed")}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Mark Reviewed
                </button>
              )}
              {m.status !== "archived" && (
                <button
                  onClick={() => updateStatus(m.id, "archived")}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Archive
                </button>
              )}
              {m.status !== "new" && (
                <button
                  onClick={() => updateStatus(m.id, "new")}
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
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
