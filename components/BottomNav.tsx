"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const memberItems = [
  { href: "/dashboard", label: "Home", icon: "⌂" },
  { href: "/prayer", label: "Prayer", icon: "♡" },
  { href: "/grow", label: "Grow", icon: "✦" },
  { href: "/community", label: "Community", icon: "◎" },
  { href: "/more", label: "More", icon: "•••" },
];

const adminItems = [
  { href: "/admin", label: "Requests", icon: "▤" },
  { href: "/admin/analytics", label: "Analytics", icon: "⌁" },
  { href: "/admin/users", label: "Users", icon: "◉" },
  { href: "/admin/applications", label: "Applications", icon: "✓" },
  { href: "/admin/content", label: "Content", icon: "▦" },
  { href: "/dashboard", label: "App", icon: "⌂" },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname.startsWith("/emmaus")) return null;

  const inAdmin = pathname.startsWith("/admin");
  const items = inAdmin ? adminItems : memberItems;

  return (
    <nav aria-label={inAdmin ? "Administration" : "Primary"} className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/94 px-2 pt-2 shadow-[0_-14px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
      <div className={`mx-auto ${inAdmin ? "flex max-w-4xl snap-x gap-1 overflow-x-auto" : "grid max-w-xl grid-cols-5 gap-1"}`}>
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 py-1.5 text-[11px] font-bold transition ${inAdmin ? "min-w-20 snap-start" : ""} ${active ? "bg-indigo-50 text-indigo-700 shadow-inner" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
              <span className={`flex h-7 min-w-7 items-center justify-center rounded-full text-lg leading-none ${active ? "bg-white text-indigo-700 shadow-sm" : ""}`} aria-hidden="true">{item.icon}</span>
              <span className="mt-1 whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
