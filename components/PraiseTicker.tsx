"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CommunityDetailDialog from "./CommunityDetailDialog";
import CommunityTickerCard from "./CommunityTickerCard";
import TickerScroll from "./TickerScroll";

type PraiseReport = {
  id: string;
  content_text: string;
  created_at: string;
  love_count: number;
  is_own: boolean;
};

export default function PraiseTicker({
  emptyMessage,
  pageMode = false,
  showAll = false,
}: {
  emptyMessage?: string;
  pageMode?: boolean;
  showAll?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [reports, setReports] = useState<PraiseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lovedIds, setLovedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loveErrors, setLoveErrors] = useState<Record<string, string>>({});
  const inFlightIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    async function load() {
      const query = supabase
        .from("praise_wall_public")
        .select("id, content_text, created_at, love_count, is_own")
        .order("created_at", { ascending: false });
      const [{ data }, { data: authData }] = await Promise.all([
        showAll ? query : query.limit(12),
        showAll || pageMode ? supabase.auth.getUser() : Promise.resolve({ data: { user: null } }),
      ]);
      const nextReports = (data as PraiseReport[]) ?? [];
      if (!active) return;
      setReports(nextReports);

      if ((showAll || pageMode) && authData.user && nextReports.length > 0) {
        const { data: loves } = await supabase
          .from("praise_loves")
          .select("praise_report_id")
          .eq("user_id", authData.user.id)
          .in("praise_report_id", nextReports.map((report) => report.id));
        if (active) setLovedIds(new Set((loves ?? []).map((love) => love.praise_report_id)));
      }
      if (active) setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [pageMode, showAll, supabase]);

  async function toggleLove(reportId: string) {
    if (inFlightIds.current.has(reportId)) return;
    inFlightIds.current.add(reportId);
    setPendingIds((previous) => new Set(previous).add(reportId));
    setLoveErrors((previous) => {
      const next = { ...previous };
      delete next[reportId];
      return next;
    });

    try {
      const response = await fetch("/api/praise-loves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });
      const result = (await response.json().catch(() => ({}))) as { loved?: boolean; loveCount?: number | null; error?: string };
      if (!response.ok || typeof result.loved !== "boolean") throw new Error(result.error ?? "We could not update your Love.");

      setLovedIds((previous) => {
        const next = new Set(previous);
        if (result.loved) next.add(reportId);
        else next.delete(reportId);
        return next;
      });
      setReports((previous) => previous.map((report) => report.id === reportId
        ? { ...report, love_count: typeof result.loveCount === "number" ? result.loveCount : report.love_count }
        : report));
    } catch (error) {
      setLoveErrors((previous) => ({
        ...previous,
        [reportId]: error instanceof Error ? error.message : "We could not update your Love.",
      }));
    } finally {
      inFlightIds.current.delete(reportId);
      setPendingIds((previous) => {
        const next = new Set(previous);
        next.delete(reportId);
        return next;
      });
    }
  }

  if (loading) return null;
  if (reports.length === 0) {
    if (!emptyMessage) return null;
    return <div className="lfp-card p-8 text-center text-slate-600">{emptyMessage}</div>;
  }

  const selectedReport = reports.find((report) => report.id === selectedId) ?? null;
  const visibleReports = showAll ? reports : [...reports, ...reports];
  const cards = visibleReports.map((report, index) => (
    <CommunityTickerCard
      key={`${report.id}-${index}`}
      label="praise"
      content={report.content_text}
      icon="🙌"
      onOpen={() => setSelectedId(report.id)}
      meta={<>Shared anonymously · {report.love_count} {report.love_count === 1 ? "Love" : "Loves"}</>}
      isDuplicate={!showAll && index >= reports.length}
    />
  ));

  return (
    <>
      {showAll ? (
        <div className="space-y-4">{cards}</div>
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="community-praise-title">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="community-praise-title" className="text-xl font-black text-slate-950">Praise from our community</h2>
            {!pageMode ? <Link href="/praise" className="inline-flex min-h-11 items-center text-sm font-bold text-indigo-700 hover:text-indigo-600">Open Praise →</Link> : null}
          </div>
          <p className="mt-2 text-sm text-slate-500">Celebrate what God is doing. Open a two-line preview to read the full praise.</p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/70">
            <TickerScroll heightClass="h-64">{cards}</TickerScroll>
          </div>
        </section>
      )}

      {selectedReport ? (
        <CommunityDetailDialog
          eyebrow="Praise report"
          title="A reminder of God’s faithfulness"
          content={selectedReport.content_text}
          onClose={() => setSelectedId(null)}
          meta={<>Shared anonymously · {new Date(selectedReport.created_at).toLocaleDateString()}</>}
          actions={(showAll || pageMode) && selectedReport.is_own ? (
            <p className="text-sm font-bold text-slate-500">This is your praise report. Community reactions are for celebrating with other members.</p>
          ) : showAll || pageMode ? (
            <div>
              <button
                type="button"
                onClick={() => toggleLove(selectedReport.id)}
                disabled={pendingIds.has(selectedReport.id)}
                aria-pressed={lovedIds.has(selectedReport.id)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2 text-sm font-black transition disabled:opacity-60 ${lovedIds.has(selectedReport.id) ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700"}`}
              >
                <span aria-hidden="true">{lovedIds.has(selectedReport.id) ? "♥" : "♡"}</span>
                {pendingIds.has(selectedReport.id) ? "Updating..." : lovedIds.has(selectedReport.id) ? "Loved" : "Love"}
                <span className="font-semibold">{selectedReport.love_count}</span>
              </button>
              <p className="mt-2 text-xs font-bold text-slate-500">One Love per Community Member. Tap again to remove yours.</p>
              {loveErrors[selectedReport.id] ? <p role="alert" aria-live="polite" className="mt-2 text-sm text-rose-700">{loveErrors[selectedReport.id]}</p> : null}
            </div>
          ) : <Link href="/praise" className="lfp-button lfp-button-primary w-full sm:w-auto">Open Praise to respond</Link>}
        />
      ) : null}
    </>
  );
}
