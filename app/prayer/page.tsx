"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CLOSED_PRAYER_STATUS_FILTER, prayerSupportLabel } from "@/lib/prayer-distribution";
import CommunityDetailDialog from "@/components/CommunityDetailDialog";
import CommunityTickerCard from "@/components/CommunityTickerCard";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const inFlightIds = useRef<Set<string>>(new Set());
  const retryKeys = useRef<Map<string, string>>(new Map());
  const confirmationTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: cats } = await supabase.from("prayer_categories").select("id, name");
      const categoryMap: Record<string, string> = {};
      ((cats as Category[]) ?? []).forEach((category) => {
        categoryMap[category.id] = category.name;
      });
      setCategories(categoryMap);

      const { data: requestData } = await supabase
        .from("prayer_wall_public")
        .select("id, created_at, display_name, request_text, category_id, prayer_count, status")
        .not("status", "in", CLOSED_PRAYER_STATUS_FILTER)
        .order("prayer_count", { ascending: true })
        .order("created_at", { ascending: true });

      setRequests((requestData as PrayerRequest[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

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

  const selectedRequest = requests.find((request) => request.id === selectedId) ?? null;
  const selectedPrayerLabel = selectedRequest ? prayerSupportLabel(selectedRequest.prayer_count) : "";

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(79,70,229,0.34),transparent_32rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Community Prayer</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Carry one another before God.</h1>
              <p className="mt-5 text-lg leading-8 text-indigo-100/75">Share what is on your heart, pray with the community, and remember that no request has to be carried alone.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/prayer/submit" className="lfp-button bg-amber-300 text-slate-950 shadow-xl hover:bg-amber-200">Submit a Prayer Request</Link>
              <Link href="/prayer/my-requests" className="lfp-button border border-white/20 bg-white/10 text-white">My Prayer Requests</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section>
          <div className="max-w-3xl">
            <p className="lfp-eyebrow">Prayer wall</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Pray where support is needed</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">Requests with less prayer activity are gently brought forward. Open a two-line preview to read it fully and take a moment to pray.</p>
          </div>

          <div className="mt-7 space-y-4">
            {loading && <div className="lfp-card p-7 text-slate-500">Loading prayer requests...</div>}

            {!loading && requests.length === 0 && (
              <div className="lfp-card p-8 text-center">
                <span className="text-4xl" aria-hidden="true">🙏</span>
                <h3 className="mt-4 text-2xl font-black text-slate-950">The prayer wall is ready.</h3>
                <p className="mt-3 text-slate-600">Be the first person to share a request with the community.</p>
                <Link href="/prayer/submit" className="lfp-button lfp-button-primary mt-6">Submit a Prayer Request</Link>
              </div>
            )}

            {requests.map((request) => {
              const prayerLabel = prayerSupportLabel(request.prayer_count);

              return (
                <CommunityTickerCard
                  key={request.id}
                  label="prayer request"
                  content={request.request_text}
                  icon="🙏"
                  onOpen={() => setSelectedId(request.id)}
                  meta={<>{request.display_name ?? "Anonymous"} · {prayerLabel}</>}
                />
              );
            })}
          </div>
        </section>

      </div>

      {selectedRequest ? (
        <CommunityDetailDialog
          eyebrow="Prayer request"
          title={selectedRequest.display_name ?? "Anonymous request"}
          content={selectedRequest.request_text}
          onClose={() => setSelectedId(null)}
          meta={<>{selectedRequest.category_id && categories[selectedRequest.category_id] ? `${categories[selectedRequest.category_id]} · ` : ""}Shared {new Date(selectedRequest.created_at).toLocaleDateString()} · {selectedPrayerLabel}</>}
          actions={(
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
          )}
        />
      ) : null}
    </main>
  );
}
