"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type PraiseReport = {
  id: string;
  content_text: string;
  created_at: string;
};

export default function PraiseWallPage() {
  const supabase = createClient();
  const [reports, setReports] = useState<PraiseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
      const { data } = await supabase
        .from("praise_wall_public")
        .select("id, content_text, created_at")
        .order("created_at", { ascending: false });

      setReports((data as PraiseReport[]) ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

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
            <Link href="/praise/submit" className="lfp-button bg-amber-300 text-slate-950 shadow-xl hover:bg-amber-200">Share a Praise Report</Link>
          </div>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section className="grid gap-5 md:grid-cols-3">
          <PraiseValue icon="🙌" title="Celebrate" text="Give God glory for what He has done and let gratitude become part of the community rhythm." />
          <PraiseValue icon="♡" title="Encourage" text="Someone else may be waiting for the hope your answered prayer can provide." />
          <PraiseValue icon="🕊" title="Share safely" text="Published praise reports remain anonymous, preserving privacy while still celebrating God's faithfulness." />
        </section>

        <section className="mt-14">
          <div className="max-w-3xl">
            <p className="lfp-eyebrow">Community praise</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Recent reminders of God's faithfulness</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">Tap a report to read the complete story. Every report is shared anonymously.</p>
          </div>

          <div className="mt-7 space-y-4">
            {loading && (
              <div className="lfp-card p-7 text-slate-500">Loading praise reports...</div>
            )}

            {!loading && reports.length === 0 && (
              <div className="lfp-card p-8 text-center">
                <span className="text-4xl" aria-hidden="true">🙌</span>
                <h3 className="mt-4 text-2xl font-black text-slate-950">The praise wall is ready.</h3>
                <p className="mt-3 text-slate-600">Be the first person to share what God has done.</p>
                <Link href="/praise/submit" className="lfp-button lfp-button-primary mt-6">Share a Praise Report</Link>
              </div>
            )}

            {reports.map((report) => {
              const expanded = expandedIds.has(report.id);
              const snippet = report.content_text.length > 150
                ? `${report.content_text.slice(0, 150)}...`
                : report.content_text;

              return (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => toggleExpanded(report.id)}
                  aria-expanded={expanded}
                  className="lfp-card group block w-full p-6 text-left sm:p-7"
                >
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
              );
            })}
          </div>
        </section>

        <section className="mt-14 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-7 text-white shadow-2xl sm:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Mark the moment</p>
              <h2 className="mt-3 text-3xl font-black">Has God answered a prayer?</h2>
              <p className="mt-3 max-w-2xl leading-7 text-indigo-100/80">Share the praise while protecting your privacy. Your report may strengthen someone who is still waiting.</p>
            </div>
            <Link href="/praise/submit" className="lfp-button bg-white text-indigo-800 shadow-xl">Share Your Praise</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function PraiseValue({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <article className="lfp-card p-6"><span className="text-3xl" aria-hidden="true">{icon}</span><h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2><p className="mt-3 leading-7 text-slate-600">{text}</p></article>;
}
