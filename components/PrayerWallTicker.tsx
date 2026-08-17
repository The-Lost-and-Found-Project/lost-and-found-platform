"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import TickerScroll from "./TickerScroll";
import CommunityDetailDialog from "./CommunityDetailDialog";
import CommunityTickerCard from "./CommunityTickerCard";
import { CLOSED_PRAYER_STATUS_FILTER, prayerSupportLabel } from "@/lib/prayer-distribution";

type PrayerRequest = {
  id: string;
  request_text: string;
  created_at: string;
  display_name: string | null;
  category_id: string | null;
  prayer_count: number;
  status: string;
  is_own: boolean;
};

type Category = { id: string; name: string };

export default function PrayerWallTicker({
  emptyMessage,
  pageMode = false,
  showAll = false,
}: {
  emptyMessage?: string;
  pageMode?: boolean;
  showAll?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [prayerErrors, setPrayerErrors] = useState<Record<string, string>>({});
  const inFlightIds = useRef<Set<string>>(new Set());
  const retryKeys = useRef<Map<string, string>>(new Map());
  const confirmationTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    let active = true;

    async function load() {
      const requestQuery = supabase
        .from("prayer_wall_public")
        .select("id, request_text, created_at, display_name, category_id, prayer_count, status, is_own")
        .not("status", "in", CLOSED_PRAYER_STATUS_FILTER)
        .order("prayer_count", { ascending: true })
        .order("created_at", { ascending: true });
      const [{ data }, categoryResult] = await Promise.all([
        showAll ? requestQuery : requestQuery.limit(12),
        showAll || pageMode ? supabase.from("prayer_categories").select("id, name") : Promise.resolve({ data: [] }),
      ]);

      if (active) {
        setRequests((data as PrayerRequest[]) ?? []);
        const categoryMap: Record<string, string> = {};
        ((categoryResult.data as Category[]) ?? []).forEach((category) => {
          categoryMap[category.id] = category.name;
        });
        setCategories(categoryMap);
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [pageMode, showAll, supabase]);

  useEffect(() => {
    const timers = confirmationTimers.current;
    return () => timers.forEach((timer) => clearTimeout(timer));
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
    setPendingIds((previous) => new Set(previous).add(requestId));
    setPrayerErrors((previous) => {
      const next = { ...previous };
      delete next[requestId];
      return next;
    });

    try {
      const clientRequestId = retryKeys.current.get(requestId) ?? crypto.randomUUID();
      retryKeys.current.set(requestId, clientRequestId);
      const response = await fetch("/api/prayer-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, clientRequestId, anonKey: getAnonKey() }),
      });
      const result = (await response.json()) as { prayerCount?: number | null; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Prayer activity request failed");

      setRequests((previous) => previous.map((request) => request.id === requestId
        ? { ...request, prayer_count: typeof result.prayerCount === "number" ? result.prayerCount : request.prayer_count + 1 }
        : request));
      retryKeys.current.delete(requestId);
      setConfirmedIds((previous) => new Set(previous).add(requestId));
      const existingTimer = confirmationTimers.current.get(requestId);
      if (existingTimer) clearTimeout(existingTimer);
      confirmationTimers.current.set(requestId, setTimeout(() => {
        setConfirmedIds((previous) => {
          const next = new Set(previous);
          next.delete(requestId);
          return next;
        });
        confirmationTimers.current.delete(requestId);
      }, 1800));
    } catch (error) {
      console.error("Failed to record prayer activity:", error);
      setPrayerErrors((previous) => ({ ...previous, [requestId]: "We couldn't record your prayer. Please try again." }));
    } finally {
      inFlightIds.current.delete(requestId);
      setPendingIds((previous) => {
        const next = new Set(previous);
        next.delete(requestId);
        return next;
      });
    }
  }

  if (loading) {
    return null;
  }

  if (requests.length === 0) {
    if (!emptyMessage) return null;
    return <div className="lfp-card p-8 text-center text-slate-600">{emptyMessage}</div>;
  }

  const visibleRequests = showAll ? requests : [...requests, ...requests];
  const selectedRequest = requests.find((request) => request.id === selectedId) ?? null;
  const selectedPrayerLabel = selectedRequest ? prayerSupportLabel(selectedRequest.prayer_count) : "";

  const cards = visibleRequests.map((request, index) => {
    const duplicate = !showAll && index >= requests.length;
    return (
      <CommunityTickerCard
        key={`${request.id}-${index}`}
        label="prayer request"
        content={request.request_text}
        icon="🙏"
        meta={<>{request.display_name ?? "Anonymous"} · {prayerSupportLabel(request.prayer_count)}</>}
        onOpen={() => setSelectedId(request.id)}
        isDuplicate={duplicate}
      />
    );
  });

  return (
    <>
      {showAll ? (
        <div className="space-y-4">{cards}</div>
      ) : (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="community-prayers-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="community-prayers-title" className="text-xl font-black text-slate-950">
            Prayers from our community
          </h2>
          {!pageMode ? (
            <Link href="/prayer" className="inline-flex min-h-11 items-center text-sm font-bold text-indigo-700 hover:text-indigo-600">
              Open Prayer →
            </Link>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-slate-500">Requests needing more community prayer move gently below. Open a two-line preview to read it fully.</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70">
          <TickerScroll heightClass="h-64">{cards}</TickerScroll>
        </div>
      </section>
      )}

      {selectedRequest ? (
        <CommunityDetailDialog
          eyebrow="Prayer request"
          title={selectedRequest.display_name ?? "Anonymous request"}
          content={selectedRequest.request_text}
          meta={<>{selectedRequest.category_id && categories[selectedRequest.category_id] ? `${categories[selectedRequest.category_id]} · ` : ""}Shared {new Date(selectedRequest.created_at).toLocaleDateString()} · {selectedPrayerLabel}</>}
          onClose={() => setSelectedId(null)}
          actions={(showAll || pageMode) && selectedRequest.is_own ? (
            <p className="text-sm font-bold text-slate-500">This is your prayer request. Community reactions are for supporting other members.</p>
          ) : showAll || pageMode ? (
            <div>
              <button
                type="button"
                onClick={() => handlePray(selectedRequest.id)}
                disabled={pendingIds.has(selectedRequest.id)}
                aria-label={`${confirmedIds.has(selectedRequest.id) ? "Prayer recorded for" : "Pray for"} ${selectedRequest.display_name ?? "this request"}. ${selectedPrayerLabel}`}
                className={`lfp-button w-full sm:w-auto ${confirmedIds.has(selectedRequest.id) ? "bg-emerald-100 text-emerald-800" : "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg"}`}
              >
                {pendingIds.has(selectedRequest.id) ? "Recording..." : confirmedIds.has(selectedRequest.id) ? "Prayer recorded 🙏" : "I Prayed"}
              </button>
              <p className="mt-2 text-xs font-bold text-slate-500">{selectedPrayerLabel}. You can pray again whenever you return.</p>
              {prayerErrors[selectedRequest.id] ? <p role="alert" aria-live="polite" className="mt-2 text-sm text-rose-700">{prayerErrors[selectedRequest.id]}</p> : null}
              <span className="sr-only" role="status" aria-live="polite">{confirmedIds.has(selectedRequest.id) ? `Prayer recorded. ${selectedPrayerLabel}.` : ""}</span>
            </div>
          ) : <Link href="/prayer" className="lfp-button lfp-button-primary w-full sm:w-auto">Open Prayer to respond</Link>}
        />
      ) : null}
    </>
  );
}
