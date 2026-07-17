"use client";

import { useEffect, useState } from "react";
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
        .limit(30);

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

  // Duplicated so the auto-scroll can loop seamlessly.
  const items = [...requests, ...requests];

  return (
    <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Prayers From Our Community
        </h2>
      </div>

      <TickerScroll>
        {items.map((r, i) => (
          <div key={`${r.id}-${i}`} className="rounded-md bg-gray-50 px-4 py-3">
            <p className="italic text-gray-700">&ldquo;{r.request_text}&rdquo;</p>
          </div>
        ))}
      </TickerScroll>
    </div>
  );
}
