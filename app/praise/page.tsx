"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import CommunityDetailDialog from "@/components/CommunityDetailDialog";
import CommunityTickerCard from "@/components/CommunityTickerCard";

type PraiseReport = {
  id: string;
  content_text: string;
  created_at: string;
  love_count: number;
};

export default function PraiseWallPage() {
  const supabase = useMemo(() => createClient(), []);
  const [reports, setReports] = useState<PraiseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lovedIds, setLovedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loveErrors, setLoveErrors] = useState<Record<string, string>>({});
  const inFlightIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const [{ data }, { data: authData }] = await Promise.all([
        supabase
          .from("praise_wall_public")
          .select("id, content_text, created_at, love_count")
          .order("created_at", { ascending: false }),
        supabase.auth.getUser(),
      ]);
      const nextReports = (data as PraiseReport[]) ?? [];
      setReports(nextReports);

      if (authData.user && nextReports.length > 0) {
        const { data: loves } = await supabase
          .from("praise_loves")
          .select("praise_report_id")
          .eq("user_id", authData.user.id)
          .in("praise_report_id", nextReports.map((report) => report.id));
        setLovedIds(new Set((loves ?? []).map((love) => love.praise_report_id)));
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

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
      const result = (await response.json().catch(() => ({}))) as {
        loved?: boolean;
        loveCount?: number | null;
        error?: string;
      };
      if (!response.ok || typeof result.loved !== "boolean") {
        throw new Error(result.error ?? "We could not update your Love.");
      }

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

  const selectedReport = reports.find((report) => report.id === selectedId) ?? null;

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(245,190,67,0.22),transparent_30rem),radial-gradient(circle_at_10%_100%,rgba(124,58,237,0.28),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Praise Reports</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Remember what God has done.</h1>
              <p className="mt-5 text-lg leading-8 text-indigo-100/75">Celebrate answered prayer, unexpected provision, restored hope, and the quiet ways God has shown His faithfulness.</p>
            </div>
            <Link href="/praise/submit" className="lfp-button bg-amber-300 text-slate-950 shadow-xl hover:bg-amber-200">Share a Praise</Link>
          </div>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section>
          <div className="max-w-3xl">
            <p className="lfp-eyebrow">Community praise</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Recent reminders of God&apos;s faithfulness</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">Scan the two-line previews, then open a praise to read the complete story. Love is one acknowledgement per Community Member and can be removed.</p>
          </div>

          <div className="mt-7 space-y-4">
            {loading && <div className="lfp-card p-7 text-slate-500">Loading praise reports...</div>}
            {!loading && reports.length === 0 && (
              <div className="lfp-card p-8 text-center">
                <span className="text-4xl" aria-hidden="true">🙌</span>
                <h3 className="mt-4 text-2xl font-black text-slate-950">The praise ticker is ready.</h3>
                <p className="mt-3 text-slate-600">Be the first person to share what God has done.</p>
                <Link href="/praise/submit" className="lfp-button lfp-button-primary mt-6">Share a Praise</Link>
              </div>
            )}

            {reports.map((report) => {
              return (
                <CommunityTickerCard
                  key={report.id}
                  label="praise"
                  content={report.content_text}
                  icon="🙌"
                  onOpen={() => setSelectedId(report.id)}
                  meta={<>Shared anonymously · {report.love_count} {report.love_count === 1 ? "Love" : "Loves"}</>}
                />
              );
            })}
          </div>
        </section>
      </div>

      {selectedReport ? (
        <CommunityDetailDialog
          eyebrow="Praise report"
          title="A reminder of God’s faithfulness"
          content={selectedReport.content_text}
          onClose={() => setSelectedId(null)}
          meta={<>Shared anonymously · {new Date(selectedReport.created_at).toLocaleDateString()}</>}
          actions={(
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
          )}
        />
      ) : null}
    </main>
  );
}
