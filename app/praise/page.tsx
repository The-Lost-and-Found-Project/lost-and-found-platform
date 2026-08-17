import Link from "next/link";
import PraiseTicker from "@/components/PraiseTicker";

export default function PraiseWallPage() {
  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(245,190,67,0.22),transparent_30rem),radial-gradient(circle_at_10%_100%,rgba(124,58,237,0.28),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Praise Reports</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Remember what God has done.</h1>
              <p className="mt-5 text-lg leading-8 text-indigo-100/75">Celebrate answered prayer, unexpected provision, restored hope, and the quiet ways God has shown His faithfulness.</p>
            </div>
            <Link href="/praise/submit" className="lfp-button bg-amber-300 text-slate-950 shadow-xl hover:bg-amber-200">Share a Praise</Link>
          </div>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section>
          <div className="max-w-3xl">
            <p className="lfp-eyebrow">Praise ticker</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Recent reminders of God&apos;s faithfulness</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">Scan the two-line previews, then open a praise to read the complete story. Love is one acknowledgement per Community Member and can be removed.</p>
          </div>
          <div className="mt-7">
            <PraiseTicker showAll emptyMessage="No praise reports have been published yet. Your praise could be the first." />
          </div>
        </section>
      </div>
    </main>
  );
}
