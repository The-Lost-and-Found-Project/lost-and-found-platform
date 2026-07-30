"use client";

import { useEffect, useRef, useState } from "react";
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
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [prayerErrors, setPrayerErrors] = useState<Record<string, string>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const inFlightIds = useRef<Set<string>>(new Set());
  const retryKeys = useRef<Map<string, string>>(new Map());
  const confirmationTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

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
      const supabase = createClient();
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

  useEffect(() => {
    const timers = confirmationTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
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
    if (inFlightIds.current.has(requestId)) return;

    inFlightIds.current.add(requestId);
    setPendingIds((prev) => new Set(prev).add(requestId));
    setPrayerErrors((prev) => {
      const next = { ...prev };
      delete next[requestId];
      return next;
    });

    try {
      const clientRequestId =
        retryKeys.current.get(requestId) ?? crypto.randomUUID();
      retryKeys.current.set(requestId, clientRequestId);

      const response = await fetch("/api/prayer-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          clientRequestId,
          anonKey: getAnonKey(),
        }),
      });

      const result = (await response.json()) as {
        prayerCount?: number | null;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Prayer activity request failed");
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId
            ? {
                ...r,
                prayer_count:
                  typeof result.prayerCount === "number"
                    ? result.prayerCount
                    : r.prayer_count + 1,
              }
            : r
        )
      );
      retryKeys.current.delete(requestId);

      setConfirmedIds((prev) => new Set(prev).add(requestId));
      const existingTimer = confirmationTimers.current.get(requestId);
      if (existingTimer) clearTimeout(existingTimer);
      confirmationTimers.current.set(
        requestId,
        setTimeout(() => {
          setConfirmedIds((prev) => {
            const next = new Set(prev);
            next.delete(requestId);
            return next;
          });
          confirmationTimers.current.delete(requestId);
        }, 1800)
      );
    } catch (error) {
      console.error("Failed to record prayer activity:", error);
      setPrayerErrors((prev) => ({
        ...prev,
        [requestId]: "We couldn't record your prayer. Please try again.",
      }));
    } finally {
      inFlightIds.current.delete(requestId);
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
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
          const pending = pendingIds.has(r.id);
          const confirmed = confirmedIds.has(r.id);
          const prayerLabel = `${r.prayer_count} ${
            r.prayer_count === 1 ? "prayer" : "prayers"
          }`;
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

                <div className="shrink-0 text-right">
                  <button
                    onClick={() => handlePray(r.id)}
                    disabled={pending}
                    aria-label={`${
                      confirmed ? "Prayer recorded for" : "Pray for"
                    } ${r.display_name ?? "this request"}. ${prayerLabel}`}
                    className={`min-h-11 rounded-md px-4 py-2 text-sm font-medium shadow-sm disabled:cursor-wait disabled:opacity-70 ${
                      confirmed
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-500 text-white hover:bg-amber-400"
                    }`}
                  >
                    {pending
                      ? "Recording..."
                      : confirmed
                        ? "Prayer recorded"
                        : "Pray"}
                  </button>
                  <p className="mt-1 text-xs text-gray-600">{prayerLabel}</p>
                  {prayerErrors[r.id] && (
                    <p
                      role="alert"
                      aria-live="polite"
                      className="mt-2 max-w-48 text-sm text-red-700"
                    >
                      {prayerErrors[r.id]}
                    </p>
                  )}
                  <span className="sr-only" role="status" aria-live="polite">
                    {confirmed ? `Prayer recorded. ${prayerLabel}.` : ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
