"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestimonySubmitClient() {
  const supabase = createClient();
  const [contentText, setContentText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Members can only ever have one testimony. If they already have one on
    // file, load it into the form so submitting again edits it in place
    // instead of creating a duplicate.
    async function loadExisting() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        setLoadingExisting(false);
        return;
      }

      const [{ data: profile }, { data: existing }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        supabase
          .from("testimonies")
          .select("id, content_text, is_anonymous")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

      if (profile?.full_name) setDisplayName(profile.full_name);

      if (existing) {
        setExistingId(existing.id);
        setContentText(existing.content_text);
        setIsAnonymous(existing.is_anonymous);
      }

      setLoadingExisting(false);
    }
    loadExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setError("You need to be signed in to share a testimony.");
      setSubmitting(false);
      return;
    }

    const { error: saveError } = existingId
      ? await supabase
          .from("testimonies")
          .update({
            content_text: contentText,
            is_anonymous: isAnonymous,
          })
          .eq("id", existingId)
      : await supabase.from("testimonies").insert({
          user_id: user.id,
          content_text: contentText,
          is_anonymous: isAnonymous,
        });

    if (saveError) {
      setError(saveError.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (loadingExisting) {
    return null;
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">Thank you</h1>
        <p className="mt-4 text-gray-600">
          Thank you for sharing what God has done in your life. Your
          testimony will appear on the Testimony Board once it&apos;s been
          reviewed.
        </p>
        <a
          href="/testimonies"
          className="mt-6 inline-block text-indigo-600 hover:text-indigo-500"
        >
          Back to the Testimony Board
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {existingId ? "Update Your Testimony" : "Share Your Testimony"}
      </h1>
      <p className="mt-2 text-gray-600">
        Tell us how God is working in your life. Your testimony will be
        shared on the Testimony Board under your name, unless you choose to
        post it anonymously below.
      </p>
      {existingId && (
        <p className="mt-2 text-sm text-amber-600">
          You&apos;ve already shared a testimony. Everyone gets just one, so
          saving here will update it rather than add a new one.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Your Testimony
          </label>
          <textarea
            required
            rows={8}
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            placeholder="Share what God has done in your life..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Out of respect for others&apos; privacy, please avoid including
            other people&apos;s full names or personal details without their
            permission.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="rounded border-gray-300"
          />
          Post this anonymously (hide my name)
        </label>
        {!isAnonymous && (
          <p className="-mt-3 text-xs text-gray-500">
            This will be shared as{" "}
            <span className="font-medium text-gray-700">
              {displayName || "your name"}
            </span>
            .
          </p>
        )}

        <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs leading-relaxed text-gray-500">
          <p>
            To keep this a safe space, submissions may not include
            harassment, threats, or aggressive language; sexual content or
            advances; hate speech; or other abusive language. Testimonies are
            reviewed and may be held for review or declined at our discretion
            if they don&apos;t meet these guidelines.
          </p>
        </div>

        <p className="text-sm text-red-600">{error}</p>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-400 disabled:opacity-50"
        >
          {submitting
            ? "Saving..."
            : existingId
            ? "Update My Testimony"
            : "Share My Testimony"}
        </button>
      </form>
    </div>
  );
}
