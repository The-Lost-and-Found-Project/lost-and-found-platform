"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
        .limit(3);

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

  return (
    <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="community-prayers-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="community-prayers-title" className="text-xl font-black text-slate-950">
          Prayers from our community
        </h2>
        <Link href="/prayer" className="text-sm font-bold text-indigo-700 hover:text-indigo-600">
          Open Prayer →
        </Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {requests.map((request) => {
          const excerpt = request.request_text.length > 150
            ? `${request.request_text.slice(0, 150).trim()}…`
            : request.request_text;
          return (
            <article key={request.id} className="rounded-2xl bg-slate-50 p-4">
              <p className="line-clamp-4 leading-6 text-slate-700">&ldquo;{excerpt}&rdquo;</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
