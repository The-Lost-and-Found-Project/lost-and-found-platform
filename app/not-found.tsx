import Link from "next/link";

export default function NotFound() {
  return (
    <main className="lfp-page flex min-h-[70vh] items-center">
      <div className="lfp-shell w-full py-16">
        <section className="lfp-card mx-auto max-w-2xl p-7 text-center sm:p-10">
          <p className="lfp-eyebrow">The Lost and Found Project</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">We could not find that page.</h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">The link may be old, the resource may no longer be published, or the address may have changed. Your account and progress are not affected.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/discover" className="lfp-button lfp-button-primary">Go to Discover</Link>
            <Link href="/dashboard" className="lfp-button lfp-button-secondary">Go to Home</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
