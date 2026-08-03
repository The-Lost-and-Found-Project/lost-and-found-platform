import Link from "next/link";
import BibleBrowser from "@/components/emmaus/BibleBrowser";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { emmausContentPacks } from "@/lib/emmaus/content-packs/registry";

export default async function EmmausBibleBrowserPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-indigo-50/50 pb-28 lg:pb-12">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="mb-10 overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Emmaus Bible Library</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Inspect complete discovery packs and the Scripture graph behind them.</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-indigo-100/70">These reviewed packs are private to the founder environment. Open a pack to inspect every discovery, question, rabbit trail, prayer, and group guide.</p>
        </section>

        <section className="mb-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Registered content</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Discovery packs</h2>
            </div>
            <p className="text-sm font-bold text-slate-500">{emmausContentPacks.length} packs • {emmausContentPacks.reduce((sum, pack) => sum + pack.discoveries.length, 0)} discoveries</p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {emmausContentPacks.map((pack) => (
              <Link key={pack.id} href={`/emmaus/content/${pack.id}`} className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-2xl sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{pack.status}</span>
                  <span className="text-xl font-black text-indigo-700 transition group-hover:translate-x-1">→</span>
                </div>
                <h3 className="mt-5 text-3xl font-black tracking-tight text-slate-950">{pack.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{pack.description}</p>
                <div className="mt-6 flex flex-wrap gap-2 text-sm font-bold text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">{pack.discoveries.length} discoveries</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">{pack.rabbitTrails.length} rabbit trails</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5">{pack.groupGuide.sessionMinutes} min group guide</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Scripture browser</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Explore the Bible structure</h2>
          </div>
          <BibleBrowser />
        </section>
      </div>
    </main>
  );
}
