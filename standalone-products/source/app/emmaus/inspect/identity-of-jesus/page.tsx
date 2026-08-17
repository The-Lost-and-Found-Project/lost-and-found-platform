"use client";

import Link from "next/link";
import { useState } from "react";
import { identityOfJesusPathway } from "@/lib/emmaus/pathways/identity-of-jesus";

export default function IdentityOfJesusInspectPage() {
  const [selectedId, setSelectedId] = useState(identityOfJesusPathway.passages[0].id);
  const selected = identityOfJesusPathway.passages.find((p) => p.id === selectedId) ?? identityOfJesusPathway.passages[0];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Pathway Inspection</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">{identityOfJesusPathway.title}</h1>
              <p className="mt-4 text-lg leading-8 text-indigo-100/75">{identityOfJesusPathway.purpose}</p>
            </div>
            <div className="flex gap-2">
              <Link href="/emmaus/questions" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">Question Atlas</Link>
              <Link href="/emmaus/journey-map" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">Journey Map</Link>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Cornerstone passages" value={String(identityOfJesusPathway.passages.length)} />
          <Stat label="Old Testament" value={String(identityOfJesusPathway.passages.filter((p) => p.testament === "Old").length)} />
          <Stat label="New Testament" value={String(identityOfJesusPathway.passages.filter((p) => p.testament === "New").length)} />
          <Stat label="Reviewed" value={String(identityOfJesusPathway.passages.filter((p) => p.reviewStatus === "reviewed").length)} />
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[390px_1fr]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Canonical flow</p>
            <div className="mt-4 space-y-3">
              {identityOfJesusPathway.passages.map((passage, index) => (
                <button key={passage.id} onClick={() => setSelectedId(passage.id)} className={`w-full rounded-2xl border p-4 text-left ${passage.id === selected.id ? "border-amber-300 bg-amber-300/10" : "border-white/10 bg-black/20"}`}>
                  <div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-black">{index + 1}</span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-indigo-300">{passage.role}</p><p className="mt-1 font-black">{passage.reference}</p><p className="mt-1 text-sm text-indigo-100/55">{passage.title}</p></div></div>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-6">
            <article className="rounded-[2rem] bg-white p-6 text-slate-900 shadow-2xl sm:p-9">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{selected.testament} Testament · {selected.role}</p><h2 className="mt-2 text-4xl font-black">{selected.reference}</h2><p className="mt-2 text-xl text-slate-600">{selected.title}</p></div>
                <span className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-800">{selected.reviewStatus}</span>
              </div>

              <div className="mt-7 rounded-3xl border border-indigo-200 bg-indigo-50 p-6">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-indigo-700">Central claim</p>
                <p className="mt-3 text-lg leading-8 text-indigo-950">{selected.centralClaim}</p>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <ListPanel title="Key observations" items={selected.observations} />
                <ListPanel title="Canonical connections" items={selected.connections} />
                <ListPanel title="Socratic questions" items={selected.questions} />
                <ListPanel title="Common misconceptions" items={selected.misconceptions} warning />
              </div>

              <div className="mt-8">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Formation outcomes</p>
                <div className="mt-4 flex flex-wrap gap-2">{selected.formation.map((item) => <span key={item} className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">{item}</span>)}</div>
              </div>
            </article>

            <div className="grid gap-6 lg:grid-cols-2">
              <PrayerCard title="Opening prayer" body={identityOfJesusPathway.openingPrayer} />
              <PrayerCard title="Closing prayer" body={identityOfJesusPathway.closingPrayer} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-sm text-indigo-100/55">{label}</p></div>; }
function ListPanel({ title, items, warning = false }: { title: string; items: string[]; warning?: boolean }) { return <div><p className={`text-xs font-black uppercase tracking-[0.14em] ${warning ? "text-rose-700" : "text-indigo-700"}`}>{title}</p><div className="mt-4 space-y-3">{items.map((item) => <div key={item} className={`rounded-2xl border p-4 leading-7 ${warning ? "border-rose-200 bg-rose-50 text-rose-950" : "border-slate-200 bg-slate-50 text-slate-700"}`}>{item}</div>)}</div></div>; }
function PrayerCard({ title, body }: { title: string; body: string }) { return <div className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-6 shadow-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">{title}</p><p className="mt-4 leading-8 text-amber-50/85">{body}</p></div>; }
