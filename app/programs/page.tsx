import Link from "next/link";

const communityPrograms = [
  { href: "/prayer", title: "Prayer", description: "Share a request and pray with the community." },
  { href: "/praise", title: "Praise", description: "Celebrate answered prayer and what God is doing." },
  { href: "/testimonies", title: "Testimonies", description: "Read and share stories of God at work." },
  { href: "/prayer/my-requests", title: "My Prayer Requests", description: "Review, update, or resolve requests you shared." },
];

const separateProducts = [
  { title: "EMAS / Emmaus", description: "Scripture discovery and guided discipleship are moving to a dedicated app." },
  { title: "Bible Trivia", description: "Questions, categories, and score history are preserved for a dedicated app." },
  { title: "Devotions", description: "Devotional weeks and audio are preserved for a dedicated app." },
];

export default function ProgramsPage() {
  return (
    <main className="lfp-page pb-24">
      <section className="bg-slate-950 text-white">
        <div className="lfp-shell py-12 sm:py-16">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Programs</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">One focused Community App.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Prayer, praise, testimonies, notifications, and member connection remain here. Our learning products are being prepared as separate experiences.</p>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section>
          <p className="lfp-eyebrow">Available here</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Community ministries</h2>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            {communityPrograms.map((program) => (
              <Link key={program.href} href={program.href} className="lfp-card group p-6 transition hover:border-indigo-200 hover:shadow-xl">
                <h3 className="text-xl font-black text-slate-950">{program.title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{program.description}</p>
                <span className="mt-4 inline-flex font-black text-indigo-700">Open <span className="ml-1 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
        </section>

        <section id="separate-products" className="mt-14 scroll-mt-24 rounded-[2rem] border border-amber-200 bg-amber-50 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Moving, not discontinued</p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">Products becoming separate apps</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">Their content and member progress are safely preserved. Links will be added when each dedicated app is ready.</p>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {separateProducts.map((product) => (
              <article key={product.title} className="rounded-2xl border border-amber-200 bg-white p-5">
                <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-900">Separate app</span>
                <h3 className="mt-4 text-xl font-black text-slate-950">{product.title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{product.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
