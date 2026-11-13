import Link from "next/link";
import AdminSectionNav from "@/components/AdminSectionNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="lfp-shell flex flex-wrap items-center justify-between gap-3 py-4">
          <Link href="/admin" className="group">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Administration</p>
            <p className="mt-1 text-base font-black text-slate-950 group-hover:text-indigo-700">Ministry control center</p>
          </Link>
          <Link href="/dashboard" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:border-indigo-300 hover:bg-indigo-50">
            Return to member app
          </Link>
        </div>
      </header>
      <div className="lfp-shell grid gap-6 py-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-5 lg:self-start">
          <AdminSectionNav />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
