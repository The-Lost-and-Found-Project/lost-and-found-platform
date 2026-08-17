"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import TickerScroll from "./TickerScroll";
import CommunityDetailDialog from "./CommunityDetailDialog";
import { CLOSED_PRAYER_STATUS_FILTER } from "@/lib/prayer-distribution";

type PrayerRequest = {
  id: string;
  request_text: string;
  created_at: string;
  prayer_count: number;
  status: string;
};

// Poll for newly submitted prayers so the ticker keeps growing over time.
const REFRESH_INTERVAL_MS = 60000;

export default function PrayerWallTicker() {
  const supabase = createClient();
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("prayer_wall_public")
        .select("id, request_text, created_at, prayer_count, status")
        .not("status", "in", CLOSED_PRAYER_STATUS_FILTER)
        .order("prayer_count", { ascending: true })
        .order("created_at", { ascending: true })
        .limit(12);

      if (active) {
        setRequests((data as PrayerRequest[]) ?? []);
        setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || requests.length === 0) {
    return null;
  }

  const scrollingRequests = [...requests, ...requests];
  const selectedRequest = requests.find((request) => request.id === selectedId) ?? null;

  return (
    <>
      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="community-prayers-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="community-prayers-title" className="text-xl font-black text-slate-950">
            Prayers from our community
          </h2>
          <Link href="/prayer" className="inline-flex min-h-11 items-center text-sm font-bold text-indigo-700 hover:text-indigo-600">
            Open Prayer →
          </Link>
        </div>
        <p className="mt-2 text-sm text-slate-500">Requests needing more community prayer move gently below. Open a two-line preview to read it fully.</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70">
          <TickerScroll heightClass="h-64">
          {scrollingRequests.map((request, index) => {
            const duplicate = index >= requests.length;
            return (
              <article
                key={`${request.id}-${index}`}
                aria-hidden={duplicate ? "true" : undefined}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
              >
                <button
                  type="button"
                  tabIndex={duplicate ? -1 : 0}
                  onClick={() => setSelectedId(request.id)}
                  className="min-h-24 w-full px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200"
                  aria-label="Open full prayer request"
                >
                  <span className="line-clamp-2 leading-6 text-slate-700">&ldquo;{request.request_text}&rdquo;</span>
                  <span className="mt-2 block text-xs font-bold text-indigo-700">Read full prayer →</span>
                </button>
              </article>
            );
          })}
          </TickerScroll>
        </div>
      </section>

      {selectedRequest ? (
        <CommunityDetailDialog
          eyebrow="Prayer request"
          title="A request from our community"
          content={selectedRequest.request_text}
          meta={<>Shared {new Date(selectedRequest.created_at).toLocaleDateString()}</>}
          onClose={() => setSelectedId(null)}
          actions={<Link href="/prayer" className="lfp-button lfp-button-primary w-full sm:w-auto">Open Prayer to respond</Link>}
        />
      ) : null}
    </>
  );
}
