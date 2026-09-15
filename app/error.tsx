"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorState({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("L&F route error", error);
  }, [error]);

  return (
    <main className="lfp-page flex min-h-[70vh] items-center">
      <div className="lfp-shell w-full py-16">
        <section className="lfp-card mx-auto max-w-2xl p-7 text-center sm:p-10">
          <p className="lfp-eyebrow">Something did not load</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">This part of L&F hit a problem.</h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">You can try the page again. If the problem continues, return home and your saved account data and progress will remain intact.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={reset} className="lfp-button lfp-button-primary">Try again</button>
            <Link href="/dashboard" className="lfp-button lfp-button-secondary">Go to Home</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
