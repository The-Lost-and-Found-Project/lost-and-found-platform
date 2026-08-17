"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CommunityDetailDialog from "./CommunityDetailDialog";
import CommunityTickerCard from "./CommunityTickerCard";
import TickerScroll from "./TickerScroll";

type Testimony = {
  id: string;
  faith_story: string;
  updated_at: string;
  user_id: string;
  display_name: string | null;
};

export default function TestimonyTicker({
  emptyMessage,
  pageMode = false,
  showAll = false,
}: {
  // When provided, an empty testimony list renders this message instead of
  // nothing. Leave unset for places (like the landing page) where the
  // ticker should just quietly disappear if there's nothing to show yet.
  emptyMessage?: string;
  pageMode?: boolean;
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
    return () => {
      active = false;
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
  const visibleTestimonies = showAll ? testimonies : [...testimonies, ...testimonies];
  const cards = visibleTestimonies.map((testimony, index) => (
    <CommunityTickerCard
      key={`${testimony.id}-${index}`}
      label="testimony"
      content={testimony.faith_story}
      icon="✝️"
      onOpen={() => setSelectedId(testimony.id)}
      meta={testimony.display_name ?? "Anonymous"}
      isDuplicate={!showAll && index >= testimonies.length}
    />
  ));

  return (
    <>
      {showAll ? (
        <div className="space-y-4">{cards}</div>
      ) : (
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="community-testimonies-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="community-testimonies-title" className="text-xl font-black text-slate-950">
            Testimonies from our community
          </h2>
          {!pageMode ? (
            <Link href="/testimonies" className="inline-flex min-h-11 items-center text-sm font-bold text-indigo-700 hover:text-indigo-600">
              Read testimonies →
            </Link>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-slate-500">Scan the two-line previews, then open a story to read it in full.</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70">
          <TickerScroll heightClass="h-64">{cards}</TickerScroll>
        </div>
      </section>
      )}

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
