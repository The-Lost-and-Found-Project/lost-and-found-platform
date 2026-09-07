import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ministryPortals } from "@/lib/ministry-hub";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="lfp-page pb-24">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_75%_0%,rgba(124,58,237,0.34),transparent_32rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.18),transparent_26rem)]" />
        <div className="lfp-shell relative py-12 sm:py-16">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Gather Together</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">Events & Gatherings</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">A single calendar home for gatherings across The Lost and Found Project. Ministry-specific events can live in their portal while still being discoverable here.</p>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section className="rounded-[2rem] border border-indigo-200 bg-indigo-50/70 p-6 sm:p-8">
          <p className="lfp-eyebrow">Coming Up</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">The shared calendar is ready for real ministry schedules.</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-600">Rather than publishing invented dates, this area will surface approved gatherings as they are added. The structure is intentionally shared so members do not have to check several calendars.</p>
        </section>

        <section className="mt-12">
          <p className="lfp-eyebrow">Browse by Ministry</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Find the gathering that fits.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {ministryPortals.map((ministry) => (
              <Link key={ministry.slug} href={`/ministries/${ministry.slug}`} className="lfp-card group p-6 transition hover:border-indigo-200 hover:shadow-xl">
                <span className="text-2xl" aria-hidden="true">{ministry.icon}</span>
                <h3 className="mt-4 text-xl font-black text-slate-950">{ministry.title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{ministry.description}</p>
                <span className="mt-4 inline-flex font-black text-indigo-700">Open portal →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-2">
          <Link href="/ministries" className="rounded-[2rem] bg-slate-950 p-6 text-white sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">Ministry Hub</p>
            <h2 className="mt-2 text-2xl font-black">Explore every ministry.</h2>
            <p className="mt-3 leading-7 text-slate-300">Learn what each ministry is for and where you can participate.</p>
          </Link>
          <Link href="/prayer" className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Before we gather</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Pray with the community.</h2>
            <p className="mt-3 leading-7 text-slate-600">Carry real needs before God and stay connected between gatherings.</p>
          </Link>
        </section>
      </div>
    </main>
  );
}
