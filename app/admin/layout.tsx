import Link from "next/link";

const adminNav = [
  { href: "/admin", label: "Command Center", exact: true },
  { href: "/admin/content", label: "Prayer & Community" },
  { href: "/admin/users", label: "People & Leadership" },
  { href: "/admin/studies", label: "Studies & Discipleship" },
  { href: "/admin/notifications", label: "Communication" },
  { href: "/admin/analytics", label: "Reports" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white/95 shadow-sm">
        <div className="lfp-shell">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Administration</p>
              <p className="mt-1 text-sm font-black text-slate-950">Ministry command center</p>
            </div>
            <Link href="/dashboard" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:border-indigo-300 hover:bg-indigo-50">
              Return to member app
            </Link>
          </div>
          <nav aria-label="Administration sections" className="-mx-1 flex gap-1 overflow-x-auto pb-3">
            {adminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
