"use client";

import { useState } from "react";
export default function PraiseSubmitClient({
  prayerRequestId,
}: {
  prayerRequestId?: string | null;
}) {
  const [contentText, setContentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const response = await fetch("/api/praise-reports/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentText,
        prayerRequestId: prayerRequestId || null,
      }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(result.error ?? "Something went wrong sharing your praise report.");
      setSubmitting(false);
      return;
    }

    // Care team + admins now find out about this automatically — the
    // notify_new_praise_report_trigger DB trigger creates in-app
    // notifications for them (and, via the notification-created webhook,
    // a push notification too) the moment this row is inserted / approved.
    // The old instant admin email for this was retired in favor of the
    // weekly digest (see app/api/cron/weekly-digest/route.ts), which now
    // includes a "New Praise Reports" section.

    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Thank you</h1>
        <p className="mt-4 text-gray-600">
          Thank you for sharing your praise report. It will appear on the
          Praise Wall once it&apos;s been reviewed.
        </p>
        <a
          href="/praise"
          className="mt-6 inline-block text-indigo-600 hover:text-indigo-500"
        >
          Back to the Praise Wall
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Share a Praise Report
      </h1>
      <p className="mt-2 text-gray-600">
        {prayerRequestId
          ? "So glad to hear it! Tell us how this prayer was answered."
          : "Tell us how God has answered prayer or shown up in your life."}{" "}
        Your praise report will be shared on the Praise Wall completely
        anonymously &mdash; no name or personal information is ever attached.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Your Praise Report
          </label>
          <textarea
            required
            rows={8}
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            placeholder="Share how God answered prayer or showed up in your life..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Out of respect for others&apos; privacy, please avoid including
            other people&apos;s full names or personal details without their
            permission.
          </p>
        </div>

        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">
          <p>
            To keep this a safe space, submissions may not include
            harassment, threats, or aggressive language; sexual content or
            advances; hate speech; or other abusive language. Praise reports
            are reviewed and may be held for review or declined at our
            discretion if they don&apos;t meet these guidelines.
          </p>
        </div>

        <p className="text-sm text-red-600">{error}</p>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-400 disabled:opacity-50"
        >
          {submitting ? "Sharing..." : "Share My Praise Report"}
        </button>
      </form>
    </div>
  );
}
