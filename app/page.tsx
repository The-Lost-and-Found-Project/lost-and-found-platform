import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ministryPortals } from "@/lib/ministry-hub";

const GIVE_URL = "https://www.zeffy.com/en-US/donation-form/donate-to-build-god-centered-marriages";

const pathways = [
  { title: "Pray", description: "Bring needs before God and help carry the needs of others.", icon: "♡" },
  { title: "Grow", description: "Build a deeper, durable faith through Scripture and discipleship.", icon: "◇" },
  { title: "Gather", description: "Move from isolation toward genuine Christian community.", icon: "◫" },
  { title: "Serve", description: "Use what God has given you for the good of people around you.", icon: "✦" },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.34),transparent_34rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-20 sm:py-28">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">The Lost and Found Project</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">Helping people move from lost to found, known, and growing in Christ.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-indigo-100/80">A Christian nonprofit creating practical pathways for prayer, discipleship, stronger relationships, meaningful community, and service.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="lfp-button bg-amber-300 text-slate-950 shadow-xl hover:bg-amber-200">Join the Community</Link>
              <Link href="/login" className="lfp-button border border-white/20 bg-white/10 text-white">Member Sign In</Link>
              <a href={GIVE_URL} target="_blank" rel="noopener noreferrer" className="lfp-button border border-white/20 bg-white/10 text-white">Give</a>
            </div>
          </div>
        </div>
      </section>

      <div className="lfp-shell py-12 sm:py-16">
        <section aria-labelledby="pathways-title">
          <p className="lfp-eyebrow">Practical Faith</p>
          <h2 id="pathways-title" className="mt-2 max-w-4xl text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Ministry should help people take a next step, not just give them more information.</h2>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pathways.map((pathway) => <article key={pathway.title} className="lfp-card p-6"><span className="text-2xl text-indigo-700" aria-hidden="true">{pathway.icon}</span><h3 className="mt-4 text-xl font-black text-slate-950">{pathway.title}</h3><p className="mt-2 leading-7 text-slate-600">{pathway.description}</p></article>)}
          </div>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div><p className="lfp-eyebrow">Our Ministry Family</p><h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Different doors. One mission.</h2><p className="mt-4 text-lg leading-8 text-slate-600">The L&F app serves as the ministry hub, giving members one home for community life while each ministry has room for its own purpose, gatherings, resources, and discipleship.</p></div>
          <div className="grid gap-4 sm:grid-cols-3">
            {ministryPortals.map((ministry) => <article key={ministry.slug} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"><span className="text-2xl" aria-hidden="true">{ministry.icon}</span><p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-indigo-700">{ministry.eyebrow}</p><h3 className="mt-1 text-xl font-black text-slate-950">{ministry.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{ministry.description}</p></article>)}
          </div>
        </section>

        <section className="mt-16 rounded-[2rem] bg-slate-950 p-7 text-white sm:p-10">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-300">The Community App</p>
          <h2 className="mt-2 text-3xl font-black">Ministry that stays with you between gatherings.</h2>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-300">Members can share prayer needs, celebrate praise, tell testimonies, discover ministries, find gatherings, and stay connected from one simple hub.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Link href="/signup" className="lfp-button bg-amber-300 text-slate-950">Create a Free Account</Link><Link href="/login" className="lfp-button border border-white/20 bg-white/10 text-white">Sign In</Link></div>
        </section>

        <section className="mt-14 rounded-[2rem] border border-amber-200 bg-amber-50/70 p-7 shadow-sm sm:p-10">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Support the mission</p><h2 className="mt-2 text-3xl font-black text-slate-950">Help build practical pathways for people to find hope and grow in Christ.</h2><p className="mt-3 max-w-3xl leading-7 text-slate-600">Donations help cover responsible technology and ministry resources. Giving is always optional, and community participation remains free.</p></div><a href={GIVE_URL} target="_blank" rel="noopener noreferrer" className="lfp-button bg-slate-950 text-white lg:justify-self-end">Give Securely</a></div>
        </section>
      </div>
    </main>
  );
}
