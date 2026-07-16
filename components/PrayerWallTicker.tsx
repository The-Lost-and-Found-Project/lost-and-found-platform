"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type PrayerRequest = {
  id: string;
  request_text: string;
  display_name: string | null;
};

export default function PrayerWallTicker() {
  const supabase = createClient();
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("prayer_wall_public")
        .select("id, request_text, display_name")
        .order("created_at", { ascending: false })
        .limit(15);

      if (active) {
        setRequests((data as PrayerRequest[]) ?? []);
        setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || requests.length === 0) {
    return null;
  }

  const items = [...requests, ...requests];

  return (
    <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white py-4 shadow-sm">
      <div className="flex items-center justify-between px-5">
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

      <div className="lfp-ticker-mask relative mt-3 overflow-hidden">
        <div className="lfp-ticker-track flex w-max items-center gap-12 px-5">
          {items.map((r, i) => (
            <span
              key={`${r.id}-${i}`}
              className="whitespace-nowrap italic text-gray-700"
            >
              &ldquo;{r.request_text}&rdquo;
              <span className="ml-2 not-italic text-gray-400">
                &mdash; {r.display_name?.trim() || "Anonymous"}
              </span>
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        .lfp-ticker-track {
          animation: lfp-ticker-scroll 40s linear infinite;
        }
        .lfp-ticker-mask:hover .lfp-ticker-track {
          animation-play-state: paused;
        }
        @keyframes lfp-ticker-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
