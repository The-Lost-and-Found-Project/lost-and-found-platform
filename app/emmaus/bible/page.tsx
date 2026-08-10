import Link from "next/link";
import { emmausContentPacks } from "@/lib/emmaus/content-packs/registry";

export default function EmmausBiblePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-indigo-50/60 pb-28">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Emmaus Bible</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Read Scripture. Follow the text.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Choose a reviewed passage collection, then move into a guided discovery when you are ready.</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-2">
          {emmausContentPacks.map((pack) => (
            <article key={pack.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{pack.book} {pack.chapter}</p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">{pack.title}</h2>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black capitalize text-emerald-800">{pack.status}</span>
              </div>
              <p className="mt-4 leading-7 text-slate-600">{pack.description}</p>
              <div className="mt-6 space-y-3">
                {pack.discoveries.map((discovery) => (
                  <Link key={discovery.id} href={`/emmaus/content/${pack.id}/discovery/${discovery.id}`} className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-indigo-300 hover:bg-indigo-50">
                    <p className="text-xs font-black uppercase tracking-wide text-indigo-700">{discovery.passage}</p>
                    <h3 className="mt-1 font-black text-slate-950">{discovery.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{discovery.subtitle}</p>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
