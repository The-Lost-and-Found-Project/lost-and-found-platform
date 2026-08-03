import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const values = [
  {
    icon: "📖",
    title: "Rooted in Scripture",
    text: "We want every prayer, study, resource, and relationship to lead people back to the truth and transforming power of God’s Word.",
  },
  {
    icon: "♡",
    title: "Centered on People",
    text: "The platform exists to support real people through prayer, discipleship, encouragement, accountability, and compassionate care.",
  },
  {
    icon: "🧭",
    title: "Focused on the Next Step",
    text: "Growth often begins with one faithful response. We help members identify and take a clear next step in their walk with Christ.",
  },
  {
    icon: "🤝",
    title: "Built for Community",
    text: "Faith is personal, but it was never intended to be isolated. We are building pathways toward meaningful Christian relationships and service.",
  },
];

export default async function AboutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(124,58,237,0.34),transparent_34rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">About Us</p>
          <h1 className="mt-4 max-w-5xl text-4xl font-black tracking-tight sm:text-6xl">Helping people move from feeling lost to being found, known, and growing in Christ.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">The Lost and Found Project is a Christian nonprofit ministry creating practical pathways for prayer, discipleship, mentorship, stronger relationships, and meaningful community.</p>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="lfp-eyebrow">Our purpose</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">A ministry platform designed around transformation, not attention.</h2>
          </div>
          <div className="space-y-5 text-lg leading-8 text-slate-600">
            <p>We are building a place where people can bring honest prayer needs, discover Scripture more deeply, record evidence of God’s faithfulness, and connect with others who will walk beside them.</p>
            <p>The goal is not to keep people inside an app. The goal is to help them pray, grow, serve, and build healthier relationships in everyday life.</p>
          </div>
        </section>

        <section className="mt-14">
          <div className="max-w-3xl">
            <p className="lfp-eyebrow">What guides us</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Our ministry values</h2>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {values.map((value) => (
              <article key={value.title} className="lfp-card p-6 sm:p-7">
                <span className="text-3xl" aria-hidden="true">{value.icon}</span>
                <h3 className="mt-5 text-2xl font-black text-slate-950">{value.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{value.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-7 text-white shadow-2xl sm:p-10">
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">Take your next step</p>
              <h2 className="mt-3 text-3xl font-black">Pray, grow, serve, and stay connected.</h2>
              <p className="mt-3 max-w-2xl leading-7 text-indigo-100/80">Begin wherever you are. The platform will help you choose one meaningful next action rather than overwhelming you with everything at once.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard" className="lfp-button bg-white text-indigo-800 shadow-xl">Return Home</Link>
              <Link href="/feedback" className="lfp-button border border-white/25 bg-white/10 text-white">Contact the Team</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
