import Link from "next/link";

const futureApps = [
  {
    name: "Emmaus",
    purpose: "Scripture Discovery",
    icon: "📖",
    description: "A guided discipleship experience for reading Scripture carefully, making discoveries, and putting truth into practice.",
  },
  {
    name: "Bible Trivia",
    purpose: "Learn Through Challenge",
    icon: "🧠",
    description: "A focused Bible-learning app with questions, categories, progress, and the score history already preserved from the Community App.",
  },
  {
    name: "Devotions",
    purpose: "Daily Formation",
    icon: "🌅",
    description: "Scripture-centered devotional teaching, reflection, prayer, and audio designed for a dedicated daily experience.",
  },
];

export default function FutureAppsPage() {
  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(124,58,237,0.32),transparent_32rem),radial-gradient(circle_at_8%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Future L&amp;F Apps</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Focused tools for the next step of faith.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">The Community App stays centered on Prayer, Praise, and Testimonies. These learning experiences are being prepared as separate apps so each one can serve its purpose well.</p>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section aria-labelledby="future-apps-title">
          <div className="max-w-3xl">
            <p className="lfp-eyebrow">In development</p>
            <h2 id="future-apps-title" className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">What is coming from The Lost and Found Project</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">These products are moving, not being discontinued. Existing content and member progress remain protected while dedicated launch experiences are prepared.</p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {futureApps.map((app) => (
              <article key={app.name} className="lfp-card p-6 sm:p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl ring-1 ring-indigo-100" aria-hidden="true">{app.icon}</span>
                <span className="mt-5 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-900">Separate app · Coming later</span>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-indigo-700">{app.purpose}</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">{app.name}</h3>
                <p className="mt-3 leading-7 text-slate-600">{app.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-[2rem] border border-indigo-100 bg-indigo-50/70 p-7 sm:p-9">
          <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="lfp-eyebrow">Launch updates</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">Return here as each app becomes ready.</h2>
              <p className="mt-2 max-w-2xl leading-7 text-slate-600">Secure launch links will appear on this page. Until then, no unfinished product is exposed inside the Community App.</p>
            </div>
            <Link href="/" className="lfp-button lfp-button-primary">Community App Home</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
