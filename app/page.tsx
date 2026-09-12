import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ministryPortals } from "@/lib/ministry-hub";

const GIVE_URL = "https://www.zeffy.com/en-US/donation-form/donate-to-build-god-centered-marriages";

const compass = [
  { title: "I need prayer", detail: "Share what you are carrying or pray with someone else.", href: "/prayer", icon: "♡", tint: "from-rose-50 to-orange-50" },
  { title: "I want to grow", detail: "Open Scripture, build a rhythm, and take a practical next step.", href: "https://emmaus.lostandfoundproject.org", icon: "↗", tint: "from-blue-50 to-indigo-50", external: true },
  { title: "I need community", detail: "Find people, gatherings, encouragement, and a place to belong.", href: "/community", icon: "◎", tint: "from-emerald-50 to-teal-50" },
  { title: "I want to serve", detail: "Put faith into motion through meaningful opportunities.", href: "/volunteer", icon: "✦", tint: "from-amber-50 to-yellow-50" },
];

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="overflow-hidden">
      <section className="relative isolate min-h-[680px] overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
        <div className="lfp-grid absolute inset-0 -z-20" aria-hidden="true" />
        <div className="lfp-orb -right-24 top-4 -z-10 h-80 w-80 bg-blue-200/55" aria-hidden="true" />
        <div className="lfp-orb -left-28 top-72 -z-10 h-72 w-72 bg-emerald-100/70" aria-hidden="true" />
        <div className="lfp-shell grid gap-12 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/70 px-3.5 py-2 text-xs font-black uppercase tracking-[0.16em] text-blue-700 shadow-sm backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> The Lost and Found Project
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.055em] text-slate-950 sm:text-7xl">
              Faith was never meant to be <span className="lfp-gradient-text">lived alone.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600 sm:text-xl">A digital ministry built to help you pray, grow in Scripture, find real community, and put faith into action—wherever you are.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="lfp-button lfp-button-primary">Start your journey <span aria-hidden="true">→</span></Link>
              <Link href="#compass" className="lfp-button lfp-button-secondary">Find my next step</Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-bold text-slate-500">
              <span className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Free to join</span>
              <span className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Scripture-centered</span>
              <span className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Built for real life</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="lfp-glass relative rounded-[2.25rem] p-4 sm:p-5">
              <div className="rounded-[1.8rem] bg-slate-950 p-6 text-white shadow-2xl sm:p-7">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs font-black uppercase tracking-[0.16em] text-blue-300">Your day with L&F</p><p className="mt-1 text-2xl font-black">Stay connected to what matters.</p></div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-xl">✦</span>
                </div>
                <div className="mt-6 rounded-3xl bg-white/8 p-5 ring-1 ring-white/10">
                  <p className="text-xs font-bold text-slate-400">TODAY'S RHYTHM</p>
                  <p className="mt-2 text-lg font-black">Begin with the Word</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">Continue your study, reflect on one question, and carry one truth into today.</p>
                  <a href="https://emmaus.lostandfoundproject.org" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-blue-300">Open Emmaus <span>→</span></a>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-3xl bg-rose-400/10 p-4 ring-1 ring-rose-300/10"><span className="text-xl">♡</span><p className="mt-3 text-sm font-black">Carry a prayer</p><p className="mt-1 text-xs leading-5 text-slate-400">Show up for someone today.</p></div>
                  <div className="rounded-3xl bg-emerald-400/10 p-4 ring-1 ring-emerald-300/10"><span className="text-xl">◎</span><p className="mt-3 text-sm font-black">Find your people</p><p className="mt-1 text-xs leading-5 text-slate-400">See what is happening nearby.</p></div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 hidden rounded-3xl border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur-xl sm:block">
                <p className="text-xs font-black text-emerald-600">PRAYER PULSE</p><p className="mt-1 text-sm font-black text-slate-900">Someone just prayed.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="compass" className="lfp-shell py-14 sm:py-20">
        <div className="max-w-3xl">
          <p className="lfp-eyebrow">Ministry Compass</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-slate-950 sm:text-5xl">You don&apos;t need to know where to look. Start with where you are.</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">Choose what feels closest to your life right now. We&apos;ll point you toward a meaningful next step.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {compass.map((item) => {
            const classes = `group rounded-[1.7rem] border border-slate-200/80 bg-gradient-to-br ${item.tint} p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:shadow-xl`;
            const content = <><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl text-slate-900 shadow-sm">{item.icon}</span><h3 className="mt-7 text-xl font-black text-slate-950">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p><span className="mt-5 inline-flex text-sm font-black text-slate-900">Explore <span className="ml-2 transition group-hover:translate-x-1">→</span></span></>;
            return item.external ? <a key={item.title} href={item.href} className={classes}>{content}</a> : <Link key={item.title} href={item.href} className={classes}>{content}</Link>;
          })}
        </div>
      </section>

      <section className="lfp-shell py-14 sm:py-20">
        <div className="rounded-[2.25rem] bg-slate-950 p-7 text-white sm:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">One mission. Different spaces.</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-5xl">Find the place that helps you move forward.</h2><p className="mt-4 max-w-xl leading-7 text-slate-300">L&F is becoming one connected ministry ecosystem—not a collection of disconnected pages.</p></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {ministryPortals.map((ministry) => <Link href={`/ministries/${ministry.slug}`} key={ministry.slug} className="group rounded-[1.6rem] bg-white/[0.07] p-5 ring-1 ring-white/10 transition hover:bg-white/[0.12]"><span className="text-2xl">{ministry.icon}</span><p className="mt-5 text-xs font-black uppercase tracking-[0.14em] text-blue-300">{ministry.eyebrow}</p><h3 className="mt-1 text-xl font-black">{ministry.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{ministry.description}</p><span className="mt-5 inline-flex text-sm font-black">Enter <span className="ml-2 transition group-hover:translate-x-1">→</span></span></Link>)}
            </div>
          </div>
        </div>
      </section>

      <section className="lfp-shell py-14 sm:py-20">
        <div className="grid gap-5 lg:grid-cols-3">
          <article className="lg:col-span-2 rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-7 sm:p-9"><p className="lfp-eyebrow">Built around people</p><h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.035em] text-slate-950">Prayer can become praise. Praise can become testimony. Your story doesn&apos;t have to live in separate boxes.</h2><p className="mt-4 max-w-2xl leading-7 text-slate-600">We&apos;re building L&F so community life can follow the whole journey—from the moment someone asks for prayer to the moment they can tell what God did.</p><Link href="/signup" className="lfp-button lfp-button-primary mt-7">Join the community</Link></article>
          <article className="rounded-[2rem] bg-gradient-to-br from-emerald-100 to-teal-50 p-7 sm:p-9"><p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Coming into focus</p><h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-slate-950">A ministry hub that learns what helps.</h2><p className="mt-4 leading-7 text-slate-600">Save resources, follow your studies, carry prayers, find gatherings, and return to a home screen shaped around your next faithful step.</p></article>
        </div>
      </section>

      <section className="lfp-shell pb-24 pt-8">
        <div className="flex flex-col gap-6 rounded-[2rem] border border-slate-200 bg-white/80 p-7 shadow-sm backdrop-blur-xl sm:p-9 lg:flex-row lg:items-center lg:justify-between">
          <div><p className="lfp-eyebrow">Help make it possible</p><h2 className="mt-2 text-2xl font-black text-slate-950">Keep ministry accessible without putting participation behind a paywall.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Giving helps support responsible technology, ministry resources, and the work of The Lost and Found Project.</p></div>
          <div className="flex shrink-0 flex-wrap gap-3"><a href={GIVE_URL} target="_blank" rel="noopener noreferrer" className="lfp-button lfp-button-primary">Give securely</a><Link href="/about" className="lfp-button lfp-button-secondary">Our mission</Link></div>
        </div>
      </section>
    </main>
  );
}
