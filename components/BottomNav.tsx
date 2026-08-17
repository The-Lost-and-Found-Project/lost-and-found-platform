"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const memberItems = [
  { href: "/dashboard", label: "Home", shortLabel: "Home", icon: "⌂" },
  { href: "/prayer", label: "Prayer", shortLabel: "Prayer", icon: "♡" },
  { href: "/praise", label: "Praise", shortLabel: "Praise", icon: "✦" },
  { href: "/testimonies", label: "Testimonies", shortLabel: "Stories", icon: "◎" },
  { href: "/notifications", label: "Notifications", shortLabel: "Alerts", icon: "♢" },
];

const adminItems = [
  { href: "/admin", label: "Requests", shortLabel: "Requests", icon: "▤" },
  { href: "/admin/analytics", label: "Analytics", shortLabel: "Stats", icon: "⌁" },
  { href: "/admin/users", label: "Users", shortLabel: "Users", icon: "◉" },
  { href: "/admin/applications", label: "Applications", shortLabel: "Apply", icon: "✓" },
  { href: "/admin/content", label: "Content", shortLabel: "Content", icon: "▦" },
  { href: "/dashboard", label: "App", shortLabel: "App", icon: "⌂" },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (
    pathname === "/" ||
    pathname === "/share" ||
    pathname === "/login" ||
    pathname === "/signup"
  ) {
    return null;
  }

  const inAdmin = pathname.startsWith("/admin");
  const items = inAdmin ? adminItems : memberItems;

  return (
    <nav
      aria-label={inAdmin ? "Administration" : "Primary"}
      className="fixed bottom-0 left-0 right-0 z-[90] isolate w-full border-t border-slate-200 bg-white px-2 pt-2 shadow-[0_-14px_40px_rgba(15,23,42,0.16)]"
      style={{
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        transform: "translate3d(0,0,0)",
        WebkitTransform: "translate3d(0,0,0)",
      }}
    >
      <div
        className={`mx-auto ${
          inAdmin
            ? "grid max-w-4xl grid-cols-6 gap-0.5 sm:gap-1"
            : "grid max-w-xl grid-cols-5 gap-1"
        }`}
      >
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 py-1.5 text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 ${
                inAdmin ? "min-w-0 px-0.5 text-[9px] sm:px-2 sm:text-[11px]" : ""
              } ${
                active
                  ? "bg-indigo-50 text-indigo-700 shadow-inner"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <span
                className={`flex h-7 min-w-7 items-center justify-center rounded-full text-lg leading-none ${
                  active ? "bg-white text-indigo-700 shadow-sm" : ""
                }`}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              {inAdmin ? (
                <>
                  <span className="mt-1 whitespace-nowrap sm:hidden">{item.shortLabel}</span>
                  <span className="mt-1 hidden whitespace-nowrap sm:inline">{item.label}</span>
                </>
              ) : (
                <span className="mt-1 whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
