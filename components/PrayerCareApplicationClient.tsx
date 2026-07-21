"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ExistingApplication = {
  id: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
} | null;

export default function PrayerCareApplicationClient({
  currentRole,
  existingApplication,
}: {
  currentRole: string;
  existingApplication: ExistingApplication;
}) {
  const supabase = createClient();

  const [reason, setReason] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const alreadyOnTeam = ["admin", "prayer_team", "pastor"].includes(
    currentRole
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!reason.trim()) {
      setError("Please share a bit about why you'd like to join.");
      return;
    }

    setSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setError("You need to be signed in to apply.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("prayer_care_applications")
      .insert({
        user_id: user.id,
        reason,
        experience: experience.trim() || null,
        availability: availability.trim() || null,
      });

    if (insertError) {
      setError(
        insertError.message.includes("duplicate") ||
          insertError.message.includes("one_pending")
          ? "You already have an application under review."
          : insertError.message
      );
      setSubmitting(false);
      return;
    }

    // Let admins know a new application came in. Fire-and-forget so a slow
    // or failed notification never blocks the confirmation the applicant is
    // waiting on.
    fetch("/api/notify-prayer-care-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }).catch((err) => {
      console.error("Failed to send new-application admin notification:", err);
    });

    setSubmitted(true);
    setSubmitting(false);
  }

  if (alreadyOnTeam) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">
          You&rsquo;re already serving on the team
        </h1>
        <p className="mt-4 text-gray-600">
          You&rsquo;re already part of the Prayer Care Team &mdash; thank you
          for serving! You can jump into the Prayer Care Admin Dashboard any
          time.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-block text-indigo-600 hover:text-indigo-500"
        >
          Go to the Prayer Care Admin Dashboard
        </Link>
      </div>
    );
  }

  if (submitted || existingApplication?.status === "pending") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Application submitted
        </h1>
        <p className="mt-4 text-gray-600">
          Thank you for applying to join the Prayer Care Team. Our admins
          will review your application and follow up soon &mdash;
          you&rsquo;ll get a notification here as soon as there&rsquo;s an
          update.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block text-indigo-600 hover:text-indigo-500"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Apply for the Prayer Care Team
      </h1>
      <p className="mt-2 text-gray-600">
        Thank you for your interest in serving! Take a look at what the role
        involves, then tell us a bit about yourself below.
      </p>

      {existingApplication?.status === "denied" && (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">About your previous application</p>
          <p className="mt-1">
            {existingApplication.review_note ??
              "We weren't able to bring you onto the team at that time."}
          </p>
          <p className="mt-2">
            You&rsquo;re welcome to apply again below &mdash; circumstances
            change, and we&rsquo;d love to hear from you.
          </p>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-sm font-semibold text-gray-900">
          What Prayer Care Team members do
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li>
            &bull; Pray for prayer requests submitted through the app, and
            follow up personally with members who ask to be contacted.
          </li>
          <li>
            &bull; Keep everything shared with you private and handled with
            care.
          </li>
          <li>
            &bull; Respond to new requests with compassion, without judgment.
          </li>
          <li>
            &bull; Serve at whatever pace fits your season of life &mdash;
            this isn&rsquo;t a huge time commitment, just a willing heart.
          </li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Why would you like to join the Prayer Care Team?
          </label>
          <textarea
            required
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Share your heart for this, or what draws you to it..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Relevant experience{" "}
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            rows={4}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Any ministry, counseling, or pastoral care experience..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Availability{" "}
            <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            placeholder="Days/times you're generally available to pray with or follow up with people..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
