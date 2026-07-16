"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PrayerRequestSummary = {
  id: string;
  created_at: string;
  request_text: string;
  status: string;
  category_id: string | null;
};

type Props = {
  email: string;
  initialFullName: string;
  initialFaithStory: string;
  initialFavoriteScripture: string;
  requests: PrayerRequestSummary[];
  categoryMap: Record<string, string>;
};

export default function MyJourneyClient({
  email,
  initialFullName,
  initialFaithStory,
  initialFavoriteScripture,
  requests,
  categoryMap,
}: Props) {
  const supabase = createClient();
  const [fullName, setFullName] = useState(initialFullName);
  const [faithStory, setFaithStory] = useState(initialFaithStory);
  const [favoriteScripture, setFavoriteScripture] = useState(
    initialFavoriteScripture
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          faith_story: faithStory,
          favorite_scripture: favoriteScripture,
        })
        .eq("id", user.id);
    }

    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">My Journey</h1>
      <p className="mt-2 text-gray-600">
        A personal look at your prayer requests and the ways God is moving in
        your life.
      </p>

      <div className="mt-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          My Faith Journey Profile
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Share a bit about your faith story below — this will appear on your
          profile so our community can celebrate what God is doing in your
          life.
        </p>

        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Favorite Bible Verse
            </label>
            <input
              type="text"
              placeholder="e.g. Philippians 4:13"
              value={favoriteScripture}
              onChange={(e) => setFavoriteScripture(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              My Faith Journey
            </label>
            <textarea
              rows={4}
              placeholder="Share your testimony — how you came to faith, or a moment God has shown up in your life."
              value={faithStory}
              onChange={(e) => setFaithStory(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm sm:text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-400 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {saved && <span className="text-sm text-green-600">Saved.</span>}
          </div>
        </form>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900">
          Prayer Requests You&apos;ve Submitted
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Every request you&apos;ve shared with us, all in one place.
        </p>

        <div className="mt-4 space-y-3">
          {requests.length === 0 && (
            <p className="text-gray-500">
              You haven&apos;t submitted any prayer requests yet. Once you do,
              you&apos;ll be able to track them here as part of your journey.
            </p>
          )}

          {requests.map((r) => (
            <div
              key={r.id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-gray-900">{r.request_text}</p>
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {r.status}
                </span>
              </div>
              {r.category_id && categoryMap[r.category_id] && (
                <p className="mt-1 text-xs text-gray-500">
                  {categoryMap[r.category_id]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-10 text-sm text-gray-400">Signed in as {email}.</p>
    </div>
  );
}
