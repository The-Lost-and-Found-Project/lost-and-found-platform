"use client";

import Link from "next/link";

type AdminModule = {
  href: string;
  title: string;
  description: string;
  icon: string;
};

type AdminStats = {
  openPrayerRequests: number;
  moderationAttention: number;
  answeredPrayers: number;
  notificationIssues: number;
};

const primaryHrefs = new Set([
  "/admin/analytics",
  "/admin/studies",
  "/admin/content",
  "/admin/users",
  "/admin/ministries",
  "/admin/notifications",
]);

function ActionLink({ href, children, tone = "light" }: { href: string; children: React.ReactNode; tone?: "light" | "dark" | "accent" }) {
  const tones = {
    light: "border-slate-200 bg-white text-indigo-800 hover:border-indigo-300 hover:bg-indigo-50",
    dark: "border-white/20 bg-white/10 text-white hover:bg-white/15",
    accent: "border-amber-300 bg-amber-300 text-slate-950 hover:bg-amber-200",
  };
  return <Link href={href} className={`inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-black transition ${tones[tone]}`}>{children}</Link>;
}

export default function AdminCommandCenter({ modules, stats }: { modules: AdminModule[]; stats: AdminStats }) {
  const specializedModules = modules.filter((module) => !primaryHrefs.has(module.href));

  return (
    <section className="mt-8 space-y-6" aria-labelledby="admin-tools-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="lfp-eyebrow">Command center</p>
          <h2 id="admin-tools-heading" className="mt-2 text-3xl font-black">Oversee the mission from one place</h2>
          <p className="mt-3 max-w-2xl text-slate-600">Live signals, care work, studies, and follow-up stay visible without repeating the same action in multiple places.</p>
        </div>
        <ActionLink href="/help/manual/admin">Open admin guide</ActionLink>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl" aria-labelledby="live-pulse-heading">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Live pulse</p>
              <h3 id="live-pulse-heading" className="mt-2 text-2xl font-black">Community activity at a glance</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100/70">A quick read on the ministry signals that should shape today’s work.</p>
            </div>
            <ActionLink href="/admin/analytics" tone="dark">Open analytics →</ActionLink>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <PulseMetric value={stats.openPrayerRequests} label="Open prayer" />
            <PulseMetric value={stats.moderationAttention} label="Needs review" />
            <PulseMetric value={stats.answeredPrayers} label="Answered" />
            <PulseMetric value={stats.notificationIssues} label="Delivery issues" />
          </div>
        </section>

        <section className="rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-amber-50 p-6 shadow-xl" aria-labelledby="video-console-heading">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Streaming</p>
              <h3 id="video-console-heading" className="mt-2 text-2xl font-black text-slate-950">Video study console</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Schedule a room, enter the study, and publish an encouragement or Scripture update while the conversation is live.</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">Interactive</span>
          </div>
          <div className="mt-6 rounded-2xl border border-indigo-100 bg-white/80 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-xl" aria-hidden="true">▣</span>
              <div>
                <p className="font-black text-slate-950">Live studies & publishing</p>
                <p className="mt-1 text-sm text-slate-600">One console for the room, the feed, and the next action.</p>
              </div>
            </div>
            <ActionLink href="/admin/studies" tone="accent">Open video study console →</ActionLink>
          </div>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MissionCard href="/admin/content" icon="🙏" title="Prayer care" description="Review care signals and protect the community space." action="Open prayer care →" />
        <MissionCard href="/admin/users" icon="👥" title="Member follow-up" description="Find people, roles, access, and leadership assignments." action="Open member follow-up →" />
        <MissionCard href="/admin/ministries" icon="▦" title="Upcoming ministry" description="Keep gatherings, studies, and service opportunities moving." action="Open ministry operations →" />
        <MissionCard href="/admin/notifications" icon="📣" title="Announcements" description="Reach the right ministry audience with one clear update." action="Open announcements →" />
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="specialized-tools-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Specialized tools</p>
            <h3 id="specialized-tools-heading" className="mt-2 text-2xl font-black text-slate-950">Open a focused workspace when needed</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">These tools remain available without duplicating the primary mission actions above.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {specializedModules.map((module) => (
            <Link key={module.href} href={module.href} className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/50">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm" aria-hidden="true">{module.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-black text-slate-950">{module.title}</span>
                <span className="mt-1 block text-sm leading-5 text-slate-600">{module.description}</span>
              </span>
              <span className="font-black text-indigo-700" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}

function PulseMetric({ value, label }: { value: number; label: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.08] p-4"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-xs text-indigo-100/70">{label}</p></div>;
}

function MissionCard({ href, icon, title, description, action }: { href: string; icon: string; title: string; description: string; action: string }) {
  return <Link href={href} className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-xl" aria-hidden="true">{icon}</div><h3 className="mt-4 text-xl font-black text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p><span className="mt-5 inline-flex text-sm font-black text-indigo-700 group-hover:text-indigo-900">{action}</span></Link>;
}
