"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CommunityDetailDialog from "./CommunityDetailDialog";
import CommunityTickerCard from "./CommunityTickerCard";

type Testimony = {
  id: string;
  faith_story: string;
  updated_at: string;
  user_id: string;
  display_name: string | null;
};

// Poll for newly saved testimonies so the ticker keeps growing over time.
const REFRESH_INTERVAL_MS = 60000;

export default function TestimonyTicker({
  emptyMessage,
  showAll = false,
}: {
  // When provided, an empty testimony list renders this message instead of
  // nothing. Leave unset for places (like the landing page) where the
  // ticker should just quietly disappear if there's nothing to show yet.
  emptyMessage?: string;
  showAll?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const baseQuery = supabase
        .from("testimonies_public")
        .select("id, faith_story, updated_at, user_id, display_name")
        .order("updated_at", { ascending: false });
      const { data } = showAll ? await baseQuery : await baseQuery.limit(3);

      if (active) {
        setTestimonies((data as Testimony[]) ?? []);
        setLoading(false);
      }
    }

    load();
    const interval = showAll ? null : setInterval(load, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [showAll, supabase]);

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

  const selectedTestimony = testimonies.find((testimony) => testimony.id === selectedId) ?? null;

  return (
    <>
      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="community-testimonies-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="community-testimonies-title" className="text-xl font-black text-slate-950">
            Testimonies from our community
          </h2>
          <Link href="/testimonies" className="inline-flex min-h-11 items-center text-sm font-bold text-indigo-700 hover:text-indigo-600">
            Read testimonies →
          </Link>
        </div>
        <p className="mt-2 text-sm text-slate-500">Scan the two-line previews, then open a story to read it in full.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {testimonies.map((testimony) => (
            <CommunityTickerCard
              key={testimony.id}
              label="testimony"
              content={testimony.faith_story}
              icon="✝️"
              onOpen={() => setSelectedId(testimony.id)}
              meta={testimony.display_name ?? "Anonymous"}
            />
          ))}
        </div>
      </section>

      {selectedTestimony ? (
        <CommunityDetailDialog
          eyebrow="Testimony"
          title={selectedTestimony.display_name ?? "Anonymous testimony"}
          content={selectedTestimony.faith_story}
          meta={<>Updated {new Date(selectedTestimony.updated_at).toLocaleDateString()}</>}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
    </>
  );
}
