import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MinistryCompassClient from "@/components/MinistryCompassClient";

export default async function CompassPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <main className="lfp-page pb-24">
    <section className="relative overflow-hidden border-b border-white/70">
      <div aria-hidden className="lfp-grid absolute inset-0" />
      <div aria-hidden className="lfp-orb -right-28 top-0 h-80 w-80 bg-violet-200/45" />
      <div className="lfp-shell relative py-12 sm:py-16">
        <p className="lfp-eyebrow">Ministry Compass</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-[-0.045em] text-slate-950 sm:text-6xl">You do not need the whole map. You need a faithful <span className="lfp-gradient-text">next step.</span></h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">Ministry Compass helps narrow the possibilities based on what you need, how you prefer to engage, and what kind of step feels realistic right now. It does not diagnose your spiritual life or replace prayer, wisdom, Scripture, pastoral care, or trusted relationships.</p>
      </div>
    </section>

    <div className="lfp-shell py-10 sm:py-14">
      <MinistryCompassClient />

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <div className="lfp-card p-6"><p className="text-[11px] font-black uppercase tracking-[.16em] text-blue-700">Transparent</p><h2 className="mt-2 text-xl font-black text-slate-950">No hidden spiritual scoring.</h2><p className="mt-2 leading-7 text-slate-600">Your suggestion is based only on the choices you make in the Compass. There is no secret maturity score and no claim of divine direction.</p></div>
        <div className="lfp-card p-6"><p className="text-[11px] font-black uppercase tracking-[.16em] text-blue-700">Flexible</p><h2 className="mt-2 text-xl font-black text-slate-950">A recommendation, not a lock-in.</h2><p className="mt-2 leading-7 text-slate-600">You can ignore the suggestion, start over, or explore another part of L&F at any time. The point is to reduce friction, not control your path.</p></div>
        <div className="lfp-card p-6"><p className="text-[11px] font-black uppercase tracking-[.16em] text-blue-700">Connected</p><h2 className="mt-2 text-xl font-black text-slate-950">Built into the ministry ecosystem.</h2><p className="mt-2 leading-7 text-slate-600">Compass recommendations lead into My Path, Discover, Prayer, Community, ministries, Learning Lab, and Emmaus rather than creating another disconnected program.</p></div>
      </section>
    </div>
  </main>;
}
