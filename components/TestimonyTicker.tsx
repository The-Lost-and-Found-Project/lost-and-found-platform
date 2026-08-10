"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
        .limit(3);

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

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="community-testimonies-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="community-testimonies-title" className="text-xl font-black text-slate-950">
          Testimonies from our community
        </h2>
        <Link href="/testimonies" className="text-sm font-bold text-indigo-700 hover:text-indigo-600">
          Read testimonies →
        </Link>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {testimonies.map((testimony) => {
          const excerpt = testimony.faith_story.length > 180
            ? `${testimony.faith_story.slice(0, 180).trim()}…`
            : testimony.faith_story;
          return (
            <article key={testimony.id} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {testimony.display_name ?? "Anonymous"}
              </p>
              <p className="mt-2 line-clamp-5 leading-6 text-slate-700">
                &ldquo;{excerpt}&rdquo;
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
