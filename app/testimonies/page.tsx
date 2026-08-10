"use client";

import Link from "next/link";
import TestimonyTicker from "@/components/TestimonyTicker";

export default function TestimonyBoardPage() {
  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(124,58,237,0.3),transparent_32rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.18),transparent_26rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Testimonies</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Your story may be the hope someone else needs.</h1>
              <p className="mt-5 text-lg leading-8 text-indigo-100/75">Read stories of redemption, healing, perseverance, restored relationships, and the steady faithfulness of God.</p>
            </div>
            <Link href="/testimonies/submit" className="lfp-button bg-amber-300 text-slate-950 shadow-xl hover:bg-amber-200">Share Your Story</Link>
          </div>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section>
          <div className="max-w-3xl">
            <p className="lfp-eyebrow">Community stories</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Stories of grace from our community</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">Take your time. These are not status updates; they are records of God's faithfulness in real lives.</p>
          </div>
          <div className="mt-7">
            <TestimonyTicker emptyMessage="No testimonies have been published yet. Your story could be the first." />
          </div>
        </section>
      </div>
    </main>
  );
}
