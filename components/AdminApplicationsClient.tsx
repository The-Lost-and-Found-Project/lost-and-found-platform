"use client";

import { useState } from "react";
import ExpandableText from "@/components/ExpandableText";

type Applicant = {
  full_name: string | null;
  email: string | null;
  created_at: string;
} | null;

type Application = {
  id: string;
  user_id: string;
  reason: string;
  experience: string | null;
  availability: string | null;
  status: string;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  applicant: Applicant;
};

export default function AdminApplicationsClient({
  applications: initialApplications,
}: {
  applications: Application[];
}) {
  const [applications, setApplications] = useState(initialApplications);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [denyNoteFor, setDenyNoteFor] = useState<string | null>(null);
  const [denyNote, setDenyNote] = useState("");
  const [error, setError] = useState("");
  const [showReviewed, setShowReviewed] = useState(false);

  const pending = applications.filter((a) => a.status === "pending");
  const reviewed = applications.filter((a) => a.status !== "pending");

  async function decide(
    applicationId: string,
    decision: "approved" | "denied",
    reviewNote?: string
  ) {
    setError("");
    setPendingId(applicationId);

    try {
      const res = await fetch("/api/admin/applications/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, decision, reviewNote }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body?.error ?? "Failed to update application");
        return;
      }

      setApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId
            ? {
                ...a,
                status: decision,
                review_note: reviewNote ?? null,
                reviewed_at: new Date().toISOString(),
              }
            : a
        )
      );
      setDenyNoteFor(null);
      setDenyNote("");
    } catch {
      setError("Failed to update application");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Prayer Care Applications
          </h1>
          <p className="mt-2 text-gray-600">
            Review member applications to join the Prayer Care Team.
            Approving one updates their role automatically.
          </p>
        </div>
        <a
          href="/admin"
          className="shrink-0 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to Prayer Care Admin
        </a>
      </div>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {pending.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-500">
            No pending applications right now.
          </p>
        ) : (
          pending.map((app) => {
            const isPending = pendingId === app.id;
            const isDenying = denyNoteFor === app.id;
            return (
              <div
                key={app.id}
                className="rounded-lg border border-indigo-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {app.applicant?.full_name ?? "Unnamed member"}
                    </p>
                    {app.applicant?.email && (
                      <a
                        href={`mailto:${app.applicant.email}`}
                        className="text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        {app.applicant.email}
                      </a>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400">
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    Pending
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">
                      Why they want to join
                    </p>
                    <ExpandableText
                      text={app.reason}
                      className="mt-1 text-gray-600"
                    />
                  </div>
                  {app.experience && (
                    <div>
                      <p className="font-medium text-gray-700">Experience</p>
                      <ExpandableText
                        text={app.experience}
                        className="mt-1 text-gray-600"
                      />
                    </div>
                  )}
                  {app.availability && (
                    <div>
                      <p className="font-medium text-gray-700">
                        Availability
                      </p>
                      <ExpandableText
                        text={app.availability}
                        className="mt-1 text-gray-600"
                      />
                    </div>
                  )}
                </div>

                {isDenying ? (
                  <div className="mt-4 space-y-2">
                    <textarea
                      rows={2}
                      value={denyNote}
                      onChange={(e) => setDenyNote(e.target.value)}
                      placeholder="Optional note to include for the applicant..."
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => decide(app.id, "denied", denyNote.trim() || undefined)}
                        className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                      >
                        {isPending ? "Submitting..." : "Confirm Deny"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDenyNoteFor(null);
                          setDenyNote("");
                        }}
                        className="rounded-full border border-gray-200 px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => decide(app.id, "approved")}
                      className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {isPending ? "Submitting..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setDenyNoteFor(app.id)}
                      className="rounded-full border border-red-200 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Deny
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {reviewed.length > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowReviewed((v) => !v)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            {showReviewed ? "Hide" : "Show"} reviewed applications (
            {reviewed.length})
          </button>

          {showReviewed && (
            <div className="mt-4 space-y-3">
              {reviewed.map((app) => (
                <div
                  key={app.id}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-700">
                      {app.applicant?.full_name ?? "Unnamed member"}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        app.status === "approved"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {app.status === "approved" ? "Approved" : "Denied"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Reviewed{" "}
                    {app.reviewed_at
                      ? new Date(app.reviewed_at).toLocaleDateString()
                      : ""}
                  </p>
                  {app.review_note && (
                    <p className="mt-2 text-sm text-gray-600">
                      {app.review_note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
