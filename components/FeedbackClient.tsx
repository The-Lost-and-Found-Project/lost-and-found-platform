"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FeedbackClient({
  defaultName,
  defaultEmail,
}: {
  defaultName: string;
  defaultEmail: string;
}) {
  const supabase = createClient();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setError("You need to be signed in to send feedback.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("feedback_messages")
      .insert({
        user_id: user.id,
        name: defaultName || null,
        email: defaultEmail || null,
        message,
      });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Thank you</h1>
        <p className="mt-4 text-gray-600">
          Thanks for taking the time to share your feedback. It goes straight
          to our team &mdash; we read every message, though we may not be able
          to reply to each one individually.
        </p>
        <a
          href="/settings"
          className="mt-6 inline-block text-indigo-600 hover:text-indigo-500"
        >
          Back to Settings
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Send Feedback</h1>
      <p className="mt-2 text-gray-600">
        You&apos;re one of a small group helping us test The Lost and Found
        Project. Run into a bug, have an idea, or just want to tell us what&apos;s
        working (or not)? Let us know below &mdash; this goes directly to our
        team.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Your Feedback
          </label>
          <textarea
            required
            rows={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's on your mind?"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
          />
        </div>

        <p className="text-sm text-gray-500">
          This is a one-way message to our team &mdash; we won&apos;t reply
          here, but if you&apos;d like a response, feel free to include the
          best way to reach you.
        </p>

        <p className="text-sm text-red-600">{error}</p>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Send Feedback"}
        </button>
      </form>
    </div>
  );
}
