"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  encouragement_count: number;
  is_own: boolean;
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
  const [encouragedIds, setEncouragedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [encouragementErrors, setEncouragementErrors] = useState<Record<string, string>>({});
  const inFlightIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    async function load() {
      const baseQuery = supabase
        .from("testimonies_public")
        .select("id, faith_story, updated_at, user_id, display_name, encouragement_count, is_own")
        .order("updated_at", { ascending: false });
      const [{ data }, { data: authData }] = await Promise.all([
        showAll ? baseQuery : baseQuery.limit(3),
        showAll || pageMode ? supabase.auth.getUser() : Promise.resolve({ data: { user: null } }),
      ]);

      const nextTestimonies = (data as Testimony[]) ?? [];
      if (!active) return;
      setTestimonies(nextTestimonies);

      if ((showAll || pageMode) && authData.user && nextTestimonies.length > 0) {
        const { data: encouragements } = await supabase
          .from("testimony_encouragements")
          .select("testimony_id")
          .eq("user_id", authData.user.id)
          .in("testimony_id", nextTestimonies.map((testimony) => testimony.id));
        if (active) {
          setEncouragedIds(new Set((encouragements ?? []).map((reaction) => reaction.testimony_id)));
        }
      }
      if (active) setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [pageMode, showAll, supabase]);

  async function toggleEncouragement(testimonyId: string) {
    if (inFlightIds.current.has(testimonyId)) return;
    inFlightIds.current.add(testimonyId);
    setPendingIds((previous) => new Set(previous).add(testimonyId));
    setEncouragementErrors((previous) => {
      const next = { ...previous };
      delete next[testimonyId];
      return next;
    });

    try {
      const response = await fetch("/api/testimony-encouragements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testimonyId }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        encouraged?: boolean;
        encouragementCount?: number | null;
        error?: string;
      };
      if (!response.ok || typeof result.encouraged !== "boolean") {
        throw new Error(result.error ?? "We could not update your encouragement.");
      }

      setEncouragedIds((previous) => {
        const next = new Set(previous);
        if (result.encouraged) next.add(testimonyId);
        else next.delete(testimonyId);
        return next;
      });
      setTestimonies((previous) => previous.map((testimony) => testimony.id === testimonyId
        ? {
            ...testimony,
            encouragement_count: typeof result.encouragementCount === "number"
              ? result.encouragementCount
              : testimony.encouragement_count,
          }
        : testimony));
    } catch (error) {
      setEncouragementErrors((previous) => ({
        ...previous,
        [testimonyId]: error instanceof Error ? error.message : "We could not update your encouragement.",
      }));
    } finally {
      inFlightIds.current.delete(testimonyId);
      setPendingIds((previous) => {
        const next = new Set(previous);
        next.delete(testimonyId);
        return next;
      });
    }
  }

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
      meta={<>{testimony.display_name ?? "Anonymous"} · {testimony.encouragement_count} {testimony.encouragement_count === 1 ? "Encouragement" : "Encouragements"}</>}
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
          actions={(showAll || pageMode) && selectedTestimony.is_own ? (
            <p className="text-sm font-bold text-slate-500">This is your testimony. Community reactions are for encouraging other members.</p>
          ) : showAll || pageMode ? (
            <div>
              <button
                type="button"
                onClick={() => toggleEncouragement(selectedTestimony.id)}
                disabled={pendingIds.has(selectedTestimony.id)}
                aria-pressed={encouragedIds.has(selectedTestimony.id)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2 text-sm font-black transition disabled:opacity-60 ${encouragedIds.has(selectedTestimony.id) ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-800"}`}
              >
                <span aria-hidden="true">{encouragedIds.has(selectedTestimony.id) ? "♥" : "♡"}</span>
                {pendingIds.has(selectedTestimony.id) ? "Updating..." : encouragedIds.has(selectedTestimony.id) ? "Encouraged" : "This encouraged me"}
                <span className="font-semibold">{selectedTestimony.encouragement_count}</span>
              </button>
              <p className="mt-2 text-xs font-bold text-slate-500">One encouragement per Community Member. Tap again to remove yours.</p>
              {encouragementErrors[selectedTestimony.id] ? <p role="alert" aria-live="polite" className="mt-2 text-sm text-rose-700">{encouragementErrors[selectedTestimony.id]}</p> : null}
            </div>
          ) : <Link href="/testimonies" className="lfp-button lfp-button-primary w-full sm:w-auto">Open Testimonies to respond</Link>}
        />
      ) : null}
    </>
  );
}
