"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import TickerScroll from "./TickerScroll";

type PrayerRequest = {
  id: string;
  request_text: string;
  created_at: string;
};

// Poll for newly submitted prayers so the ticker keeps growing over time.
const REFRESH_INTERVAL_MS = 30000;

export default function PrayerWallTicker() {
  const supabase = createClient();
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("prayer_wall_public")
        .select("id, request_text, created_at")
        .order("created_at", { ascending: false })
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

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="community-prayers-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="community-prayers-title" className="text-xl font-black text-slate-950">
          Prayers from our community
        </h2>
        <Link href="/prayer" className="inline-flex min-h-11 items-center text-sm font-bold text-indigo-700 hover:text-indigo-600">
          Open Prayer Wall →
        </Link>
      </div>
      <p className="mt-2 text-sm text-slate-500">Recent approved prayers move gently below. Swipe or scroll to browse; movement pauses while you interact.</p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70">
        <TickerScroll heightClass="h-64">
        {scrollingRequests.map((request, index) => {
          const excerpt = request.request_text.length > 180
            ? `${request.request_text.slice(0, 180).trim()}…`
            : request.request_text;
          return (
            <article
              key={`${request.id}-${index}`}
              aria-hidden={index >= requests.length ? "true" : undefined}
              className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
            >
              <p className="line-clamp-3 leading-6 text-slate-700">&ldquo;{excerpt}&rdquo;</p>
            </article>
          );
        })}
        </TickerScroll>
      </div>
    </section>
  );
}
