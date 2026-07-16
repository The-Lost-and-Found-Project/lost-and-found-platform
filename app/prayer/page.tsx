"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type PrayerRequest = {
  id: string;
  created_at: string;
  display_name: string | null;
  request_text: string;
  category_id: string | null;
  prayer_count: number;
  status: string;
};

type Category = { id: string; name: string };

export default function PrayerWallPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [prayedIds, setPrayedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const { data: cats } = await supabase
        .from("prayer_categories")
        .select("id, name");

      const catMap: Record<string, string> = {};
      ((cats as Category[]) ?? []).forEach((c) => {
        catMap[c.id] = c.name;
      });
      setCategories(catMap);

      const { data: reqs } = await supabase
        .from("prayer_wall_public")
        .select(
          "id, created_at, display_name, request_text, category_id, prayer_count, status"
        )
        .order("created_at", { ascending: false });

      setRequests((reqs as PrayerRequest[]) ?? []);
      setLoading(false);
    }

    load();
  }, []);

  function getAnonKey() {
    let key = window.localStorage.getItem("lfp_anon_key");
    if (!key) {
      key = crypto.randomUUID();
      window.localStorage.setItem("lfp_anon_key", key);
    }
    return key;
  }

  async function handlePray(requestId: string) {
    if (prayedIds.has(requestId)) return;

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    const payload: {
      prayer_request_id: string;
      user_id?: string;
      anon_key?: string;
    } = {
      prayer_request_id: requestId,
    };

    if (user) {
      payload.user_id = user.id;
    } else {
      payload.anon_key = getAnonKey();
    }

    const { error } = await supabase.from("prayer_reactions").insert(payload);

    if (!error) {
      setPrayedIds((prev) => new Set(prev).add(requestId));
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, prayer_count: r.prayer_count + 1 } : r
        )
      );
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Community Prayer Wall
          </h1>
          <p className="mt-2 text-gray-600">
            Join us in praying for these requests from our community.
          </p>
        </div>
        <Link
          href="/prayer/submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
        >
          Submit a Prayer Request
        </Link>
      </div>

      <div className="mt-10 space-y-4">
        {loading && <p className="text-gray-500">Loading prayer requests...</p>}

        {!loading && requests.length === 0 && (
          <p className="text-gray-500">
            No prayer requests yet. Be the first to share one.
          </p>
        )}

        {requests.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-gray-900">{r.request_text}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span>{r.display_name ?? "Anonymous"}</span>
                  {r.category_id && categories[r.category_id] && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {categories[r.category_id]}
                    </span>
                  )}
                  {r.status === "Answered" && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Answered
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handlePray(r.id)}
                disabled={prayedIds.has(r.id)}
                className="shrink-0 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-400 disabled:opacity-50"
              >
                {prayedIds.has(r.id) ? "Prayed" : "I Prayed"} ({r.prayer_count})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
