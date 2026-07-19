"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TickerScroll from "./TickerScroll";

type Testimony = {
  id: string;
  faith_story: string;
  updated_at: string;
  user_id: string;
  display_name: string | null;
};

// Poll for newly saved testimonies so the ticker keeps growing over time.
const REFRESH_INTERVAL_MS = 30000;

export default function TestimonyTicker({
  emptyMessage,
}: {
  // When provided, an empty testimony list renders this message instead of
  // nothing. Leave unset for places (like the landing page) where the
  // ticker should just quietly disappear if there's nothing to show yet.
  emptyMessage?: string;
}) {
  const supabase = createClient();
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("testimonies_public")
        .select("id, faith_story, updated_at, user_id, display_name")
        .order("updated_at", { ascending: false })
        .limit(30);

      if (active) {
        setTestimonies((data as Testimony[]) ?? []);
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

  if (loading) {
    return null;
  }

  if (testimonies.length === 0) {
    if (!emptyMessage) return null;
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  // Duplicated so the auto-scroll can loop seamlessly.
  const items = [...testimonies, ...testimonies];

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Testimonies From Our Community
        </h2>
      </div>

      <TickerScroll>
        {items.map((t, i) => {
          const key = `${t.id}-${i}`;

          return (
            <div key={key} className="rounded-md bg-gray-50 px-4 py-3">
              <p className="text-xs font-semibold text-gray-900">
                {t.display_name ?? "Anonymous"}
              </p>
              <p className="mt-1 italic text-gray-700">
                &ldquo;{t.faith_story}&rdquo;
              </p>
            </div>
          );
        })}
      </TickerScroll>
    </div>
  );
}
