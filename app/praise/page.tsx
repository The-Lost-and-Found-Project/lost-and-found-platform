"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [lovedIds, setLovedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [loveErrors, setLoveErrors] = useState<Record<string, string>>({});
  const inFlightIds = useRef<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
            <p className="mt-3 text-lg leading-8 text-slate-600">Open a praise to read the complete story. Love is one acknowledgement per Community Member and can be removed.</p>
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
              const expanded = expandedIds.has(report.id);
              const loved = lovedIds.has(report.id);
              const pending = pendingIds.has(report.id);
              const snippet = report.content_text.length > 150 ? `${report.content_text.slice(0, 150)}...` : report.content_text;

              return (
                <article key={report.id} className="lfp-card p-6 sm:p-7">
                  <button type="button" onClick={() => toggleExpanded(report.id)} aria-expanded={expanded} className="group block w-full text-left">
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-xl ring-1 ring-amber-100" aria-hidden="true">✦</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <p className="whitespace-pre-wrap text-lg leading-8 text-slate-800">{expanded ? report.content_text : snippet}</p>
                          <span className={`mt-1 shrink-0 text-xl font-black text-indigo-600 transition ${expanded ? "rotate-90" : "group-hover:translate-x-1"}`} aria-hidden="true">›</span>
                        </div>
                        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                          <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Shared anonymously</p>
                          <p className="text-xs font-semibold text-slate-400">{new Date(report.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </button>

                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => toggleLove(report.id)}
                      disabled={pending}
                      aria-pressed={loved}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition disabled:opacity-60 ${loved ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700"}`}
                    >
                      <span aria-hidden="true">{loved ? "♥" : "♡"}</span>
                      {pending ? "Updating..." : loved ? "Loved" : "Love"}
                      <span className="font-semibold">{report.love_count}</span>
                    </button>
                    {loveErrors[report.id] && <p role="alert" aria-live="polite" className="mt-2 text-sm text-rose-700">{loveErrors[report.id]}</p>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
