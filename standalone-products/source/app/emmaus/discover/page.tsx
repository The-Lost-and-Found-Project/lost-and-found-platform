import Link from "next/link";
import { emmausContentPacks } from "@/lib/emmaus/content-packs/registry";

export default function EmmausDiscoverPage() {
  const discoveries = emmausContentPacks.flatMap((pack) =>
    pack.discoveries.map((discovery) => ({ pack, discovery }))
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 pb-28 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Discover</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Choose the question that draws you closer.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Every path begins with Scripture, makes room for honest questions, and ends with a concrete response and prayer.</p>
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {discoveries.map(({ pack, discovery }) => (
            <Link key={discovery.id} href={`/emmaus/content/${pack.id}/discovery/${discovery.id}`} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-xl transition hover:-translate-y-1 hover:border-amber-300/40 hover:bg-white/10 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">{discovery.passage}</p>
              <h2 className="mt-3 text-3xl font-black">{discovery.title}</h2>
              <p className="mt-3 leading-7 text-indigo-100/70">{discovery.openingQuestion}</p>
              <p className="mt-6 text-sm font-black text-amber-300">Begin discovery →</p>
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] border border-indigo-300/20 bg-indigo-300/10 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-200">Prayer in context</p>
          <h2 className="mt-2 text-2xl font-black">Need prayer as you walk?</h2>
          <p className="mt-3 max-w-2xl leading-7 text-indigo-100/70">Use the main Prayer experience to share a request or pray with the community without creating a second, disconnected prayer workflow.</p>
          <Link href="/emmaus/prayer" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-black text-indigo-800">Open Prayer</Link>
        </section>
      </div>
    </main>
  );
}
