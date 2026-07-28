"use client";

import { useState } from "react";
import Link from "next/link";

type Author = { full_name: string | null; email: string | null } | null;

type Testimony = {
  id: string;
  content_text: string;
  is_anonymous: boolean;
  user_id: string;
  created_at: string;
  author: Author;
};

type PraiseReport = {
  id: string;
  content_text: string;
  user_id: string;
  prayer_request_id: string | null;
  created_at: string;
  author: Author;
};

type Props = {
  testimonies: Testimony[];
  praiseReports: PraiseReport[];
};

function authorLabel(author: Author, isAnonymous?: boolean) {
  if (isAnonymous) return "Anonymous";
  return author?.full_name || author?.email || "Unknown member";
}

export default function AdminContentClient({
  testimonies: initialTestimonies,
  praiseReports: initialPraiseReports,
}: Props) {
  const [testimonies, setTestimonies] = useState(initialTestimonies);
  const [praiseReports, setPraiseReports] = useState(initialPraiseReports);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleDeleteTestimony(id: string) {
    setError("");
    setPendingId(id);
    try {
      const res = await fetch("/api/admin/testimonies/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testimonyId: id }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Failed to delete testimony");
      } else {
        setTestimonies((prev) => prev.filter((t) => t.id !== id));
      }
    } catch {
      setError("Failed to delete testimony");
    } finally {
      setPendingId(null);
      setConfirmingId(null);
    }
  }

  async function handleDeletePraiseReport(id: string) {
    setError("");
    setPendingId(id);
    try {
      const res = await fetch("/api/admin/praise-reports/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ praiseReportId: id }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error ?? "Failed to delete praise report");
      } else {
        setPraiseReports((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      setError("Failed to delete praise report");
    } finally {
      setPendingId(null);
      setConfirmingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 pb-28 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Manage Content</h1>
        <Link
          href="/admin"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to Requests
        </Link>
      </div>
      <p className="mt-2 text-gray-600">
        Remove testimonies or praise reports that shouldn&apos;t stay public
        — spam, inappropriate content, or on a member&apos;s request.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          Testimonies ({testimonies.length})
        </h2>
        <div className="mt-3 space-y-3">
          {testimonies.length === 0 && (
            <p className="text-sm text-gray-500">No testimonies yet.</p>
          )}
          {testimonies.map((t) => {
            const isConfirming = confirmingId === t.id;
            const isPending = pendingId === t.id;
            return (
              <div
                key={t.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {authorLabel(t.author, t.is_anonymous)}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                      {t.content_text}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {isConfirming ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Delete?</span>
                        <button
                          onClick={() => handleDeleteTestimony(t.id)}
                          disabled={isPending}
                          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
                        >
                          {isPending ? "..." : "Yes"}
                        </button>
                        <button
                          onClick={() => setConfirmingId(null)}
                          className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingId(t.id)}
                        className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">
          Praise Reports ({praiseReports.length})
        </h2>
        <div className="mt-3 space-y-3">
          {praiseReports.length === 0 && (
            <p className="text-sm text-gray-500">No praise reports yet.</p>
          )}
          {praiseReports.map((p) => {
            const isConfirming = confirmingId === p.id;
            const isPending = pendingId === p.id;
            return (
              <div
                key={p.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {authorLabel(p.author)}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                      {p.content_text}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {isConfirming ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Delete?</span>
                        <button
                          onClick={() => handleDeletePraiseReport(p.id)}
                          disabled={isPending}
                          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
                        >
                          {isPending ? "..." : "Yes"}
                        </button>
                        <button
                          onClick={() => setConfirmingId(null)}
                          className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmingId(p.id)}
                        className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
