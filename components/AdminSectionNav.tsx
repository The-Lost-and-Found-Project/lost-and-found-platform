"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNav = [
  { href: "/admin", label: "Command Center", exact: true },
  { href: "/admin/content", label: "Prayer & Community" },
  { href: "/admin/users", label: "People & Leadership" },
  { href: "/admin/studies", label: "Studies & Discipleship" },
  { href: "/admin/notifications", label: "Communication" },
  { href: "/admin/analytics", label: "Reports" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/live", label: "Live Operations" },
];

export default function AdminSectionNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Administration sections" className="-mx-1 flex gap-1 overflow-x-auto pb-3">
      {adminNav.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${active ? "bg-slate-950 text-white shadow-sm" : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-900"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
