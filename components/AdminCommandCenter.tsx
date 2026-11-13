"use client";

import Link from "next/link";

type AdminModule = { href: string; title: string; description: string; icon: string };
type AdminStats = { openPrayerRequests: number; moderationAttention: number; answeredPrayers: number; notificationIssues: number };

export default function AdminCommandCenter({ modules, stats }: { modules: AdminModule[]; stats: AdminStats }) {
  const signals = [
    { label: "Open prayer care", value: stats.openPrayerRequests, href: "/admin/content", action: "Open care queue", tone: stats.openPrayerRequests > 0 ? "text-amber-700" : "text-slate-950" },
    { label: "Community review", value: stats.moderationAttention, href: "/admin/content", action: "Review submissions", tone: stats.moderationAttention > 0 ? "text-rose-700" : "text-slate-950" },
    { label: "Delivery issues", value: stats.notificationIssues, href: "/admin/notifications", action: "Check delivery", tone: stats.notificationIssues > 0 ? "text-amber-700" : "text-slate-950" },
    { label: "Answered prayers", value: stats.answeredPrayers, href: "/admin/analytics", action: "View outcomes", tone: "text-slate-950" },
  ];

  return (
    <section className="space-y-8" aria-labelledby="admin-tools-heading">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-700">Today at L&amp;F</p>
        <h1 id="admin-tools-heading" className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Ministry operations</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">A focused view of what needs attention and where to work next.</p>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-labelledby="signals-heading">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700">Priority signals</p>
            <h2 id="signals-heading" className="mt-1 text-xl font-black text-slate-950">Needs attention</h2>
          </div>
          <Link href="/help/manual/admin" className="text-sm font-black text-indigo-700 hover:text-indigo-900">Open admin guide →</Link>
        </div>
        <div className="divide-y divide-slate-200">
          {signals.map((signal) => (
            <Link key={signal.label} href={signal.href} className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-slate-50">
              <span className={`w-12 text-2xl font-black ${signal.tone}`}>{signal.value}</span>
              <span className="min-w-40 flex-1">
                <span className="block font-black text-slate-950">{signal.label}</span>
                <span className="mt-0.5 block text-sm text-slate-500">{signal.action}</span>
              </span>
              <span className="font-black text-indigo-700" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="workspaces-heading">
        <div className="border-b border-slate-200 pb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-700">Workspaces</p>
          <h2 id="workspaces-heading" className="mt-1 text-xl font-black text-slate-950">Choose a place to work</h2>
        </div>
        <div className="divide-y divide-slate-200 border-b border-slate-200">
          {modules.map((module) => (
            <Link key={module.href} href={module.href} className="group flex items-center gap-4 py-4 transition hover:bg-white">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg" aria-hidden="true">{module.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-black text-slate-950 group-hover:text-indigo-800">{module.title}</span>
                <span className="mt-1 block text-sm leading-5 text-slate-600">{module.description}</span>
              </span>
              <span className="shrink-0 font-black text-indigo-700" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
