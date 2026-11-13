"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNav = [
  { href: "/admin", label: "Command Center", description: "Today’s priorities", exact: true },
  { href: "/admin/content", label: "Prayer & Community", description: "Review and care" },
  { href: "/admin/users", label: "People & Leadership", description: "Members and roles" },
  { href: "/admin/studies", label: "Studies & Discipleship", description: "Studies and gatherings" },
  { href: "/admin/ministries", label: "Ministry Operations", description: "Events and publishing" },
  { href: "/admin/notifications", label: "Communication", description: "Announcements" },
  { href: "/admin/analytics", label: "Reports", description: "Trends and outcomes" },
  { href: "/admin/feedback", label: "Feedback", description: "Member input" },
  { href: "/admin/live", label: "Live Operations", description: "Streaming control" },
];

export default function AdminSectionNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Administration sections">
      <p className="px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Admin workspace</p>
      <div className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
        {adminNav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group rounded-xl border px-3 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${active ? "border-slate-950 bg-slate-950 text-white shadow-sm" : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-white"}`}
            >
              <span className="block text-sm font-black">{item.label}</span>
              <span className={`mt-0.5 block text-xs ${active ? "text-slate-300" : "text-slate-400 group-hover:text-slate-600"}`}>{item.description}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
