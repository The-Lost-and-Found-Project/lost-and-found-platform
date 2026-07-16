"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type PrayerRequest = {
  id: string;
  request_text: string;
  display_name: string | null;
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
        .select("id, request_text, display_name, created_at")
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

  // Duplicated so the animation can loop seamlessly from bottom to top.
  const items = [...requests, ...requests];

  return (
    <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Prayers From Our Community
        </h2>
        <Link
          href="/prayer"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          View Prayer Wall
        </Link>
      </div>

      <div className="lfp-ticker-mask relative h-80 overflow-hidden">
        <div className="lfp-ticker-track flex flex-col gap-4 px-5 py-4">
          {items.map((r, i) => (
            <div
              key={`${r.id}-${i}`}
              className="rounded-md bg-gray-50 px-4 py-3"
            >
              <p className="italic text-gray-700">&ldquo;{r.request_text}&rdquo;</p>
              <p className="mt-1 text-xs text-gray-400">
                &mdash; {r.display_name?.trim() || "Anonymous"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .lfp-ticker-track {
          animation: lfp-ticker-scroll-up 60s linear infinite;
        }
        .lfp-ticker-mask:hover .lfp-ticker-track {
          animation-play-state: paused;
        }
        @keyframes lfp-ticker-scroll-up {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </div>
  );
}
