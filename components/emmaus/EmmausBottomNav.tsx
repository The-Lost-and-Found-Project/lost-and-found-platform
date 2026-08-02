"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/emmaus/walk", label: "Walk", icon: "🏠" },
  { href: "/emmaus/admin/bible", label: "Bible", icon: "📖" },
  { href: "/emmaus/admin/graph", label: "Explore", icon: "🔍" },
  { href: "/prayer", label: "Prayer", icon: "🙏" },
  { href: "/profile", label: "Me", icon: "👤" },
];

export default function EmmausBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[70] border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden" aria-label="Emmaus navigation">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 flex-col items-center justify-center rounded-2xl px-2 py-1.5 text-xs font-semibold transition ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
            >
              <span className="text-xl leading-none" aria-hidden="true">{item.icon}</span>
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
