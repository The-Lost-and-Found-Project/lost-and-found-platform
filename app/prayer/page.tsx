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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

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

      // Figure out which requests this visitor has already prayed for, so
      // the button can show a checkmark instead of "I Prayed" again.
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      let existing: { prayer_request_id: string }[] | null = null;
      if (user) {
        const { data } = await supabase
          .from("prayer_reactions")
          .select("prayer_request_id")
          .eq("user_id", user.id);
        existing = data;
      } else {
        const anonKey = window.localStorage.getItem("lfp_anon_key");
        if (anonKey) {
          const { data } = await supabase
            .from("prayer_reactions")
            .select("prayer_request_id")
            .eq("anon_key", anonKey);
          existing = data;
        }
      }

      if (existing && existing.length > 0) {
        setPrayedIds(
          (prev) =>
            new Set([...prev, ...existing!.map((r) => r.prayer_request_id)])
        );
      }
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

        {requests.map((r) => {
          const expanded = expandedIds.has(r.id);
          const snippet =
            r.request_text.length > 90
              ? `${r.request_text.slice(0, 90)}...`
              : r.request_text;

          return (
            <div
              key={r.id}
              className="rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex items-start gap-3 p-5">
                <button
                  type="button"
                  onClick={() => toggleExpanded(r.id)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                      expanded ? "rotate-90" : ""
                    }`}
                  >
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-medium text-gray-900">
                        {r.display_name ?? "Anonymous"}
                      </span>
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
                    <p className="mt-1 text-gray-900">
                      {expanded ? r.request_text : snippet}
                    </p>
                  </div>
                </button>

                {prayedIds.has(r.id) ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="h-4 w-4"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Prayed ({r.prayer_count})
                  </span>
                ) : (
                  <button
                    onClick={() => handlePray(r.id)}
                    className="shrink-0 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-400"
                  >
                    I Prayed ({r.prayer_count})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
