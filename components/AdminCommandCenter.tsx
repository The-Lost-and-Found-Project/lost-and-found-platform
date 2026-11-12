"use client";

import Link from "next/link";

type AdminModule = {
  href: string;
  title: string;
  description: string;
  icon: string;
};

const groups = [
  {
    title: "Prayer & Community",
    description: "Care for people and protect the public ministry space.",
    hrefs: ["/admin/content"],
  },
  {
    title: "People & Leadership",
    description: "Manage access, roles, supervision, and ministry operations.",
    hrefs: ["/admin/users", "/admin/ministries"],
  },
  {
    title: "Studies & Discipleship",
    description: "Build, publish, schedule, and host Bible studies.",
    hrefs: ["/admin/studies", "/admin/creator"],
  },
  {
    title: "Communication & Insight",
    description: "Keep members informed and watch ministry health.",
    hrefs: ["/admin/notifications", "/admin/analytics"],
  },
];

const quickActions = [
  { href: "#prayer-review", label: "Review prayer requests", note: "Start with the people who need care." },
  { href: "/admin/studies", label: "Open live studies", note: "Schedule or enter a study room." },
  { href: "/admin/users", label: "Find a member", note: "Search access, roles, and leadership." },
  { href: "/admin/notifications", label: "Send an update", note: "Reach the right ministry audience." },
];

export default function AdminCommandCenter({ modules }: { modules: AdminModule[] }) {
  const byHref = new Map(modules.map((module) => [module.href, module]));

  return (
    <section className="mt-8" aria-labelledby="admin-tools-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="lfp-eyebrow">Command center</p>
          <h2 id="admin-tools-heading" className="mt-2 text-3xl font-black">Choose the work in front of you</h2>
          <p className="mt-3 max-w-2xl text-slate-600">Routine ministry work stays visible. Specialized tools stay grouped so the dashboard remains calm.</p>
        </div>
        <Link href="/help/manual/admin" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800">Open admin guide</Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href} className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50">
            <span className="block font-black text-indigo-950">{action.label} →</span>
            <span className="mt-1 block text-sm leading-6 text-indigo-900/70">{action.note}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <section key={group.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-black text-slate-950">{group.title}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{group.description}</p>
            <div className="mt-4 grid gap-2">
              {group.hrefs.map((href) => {
                const module = byHref.get(href);
                if (!module) return null;
                return (
                  <Link key={module.href} href={module.href} className="flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-indigo-300 hover:bg-indigo-50/50">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg shadow-sm" aria-hidden="true">{module.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-black text-slate-950">{module.title}</span>
                      <span className="mt-0.5 block text-sm leading-5 text-slate-600">{module.description}</span>
                    </span>
                    <span className="font-black text-indigo-700" aria-hidden="true">→</span>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
