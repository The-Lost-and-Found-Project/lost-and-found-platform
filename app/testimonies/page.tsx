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
        <section className="grid gap-5 md:grid-cols-3">
          <ValueCard icon="✦" title="God receives the glory" text="Every testimony points beyond the person to the One who redeems, restores, and sustains." />
          <ValueCard icon="♡" title="People receive hope" text="Honest stories remind others that they are not alone and that God is still at work." />
          <ValueCard icon="🛡" title="Stories are reviewed" text="Shared testimonies continue through the existing privacy and approval process before publication." />
        </section>

        <section className="mt-14">
          <div className="max-w-3xl">
            <p className="lfp-eyebrow">Community stories</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Stories of grace from our community</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">Take your time. These are not status updates; they are records of God's faithfulness in real lives.</p>
          </div>
          <div className="mt-7 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-2xl sm:p-8">
            <TestimonyTicker emptyMessage="No testimonies have been published yet. Your story could be the first." />
          </div>
        </section>

        <section className="mt-14 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-7 text-white shadow-2xl sm:p-10">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Tell it faithfully</p>
              <h2 className="mt-3 text-3xl font-black">What has God brought you through?</h2>
              <p className="mt-3 max-w-2xl leading-7 text-indigo-100/80">You do not need a dramatic story. A testimony can be rescue, endurance, provision, conviction, reconciliation, or quiet faithfulness.</p>
            </div>
            <Link href="/testimonies/submit" className="lfp-button bg-white text-indigo-800 shadow-xl">Share Your Testimony</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function ValueCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <article className="lfp-card p-6"><span className="text-3xl" aria-hidden="true">{icon}</span><h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2><p className="mt-3 leading-7 text-slate-600">{text}</p></article>;
}
