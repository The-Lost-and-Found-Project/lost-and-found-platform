import Link from "next/link";
import PrayerWallTicker from "@/components/PrayerWallTicker";

export default function PrayerWallPage() {
  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(79,70,229,0.34),transparent_32rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Community Prayer</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Carry one another before God.</h1>
              <p className="mt-5 text-lg leading-8 text-indigo-100/75">Share what is on your heart, pray with the community, and remember that no request has to be carried alone.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link href="/prayer/submit" className="lfp-button bg-amber-300 text-slate-950 shadow-xl hover:bg-amber-200">Submit a Prayer Request</Link>
              <Link href="/prayer/my-requests" className="lfp-button border border-white/20 bg-white/10 text-white">My Prayer Requests</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section>
          <div className="max-w-3xl">
            <p className="lfp-eyebrow">Prayer ticker</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Pray where support is needed</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">Requests with less prayer activity are gently brought forward. Open a two-line preview to read it fully and take a moment to pray.</p>
          </div>
          <div className="mt-7">
            <PrayerWallTicker showAll emptyMessage="No public prayer requests are waiting right now." />
          </div>
        </section>
      </div>
    </main>
  );
}
