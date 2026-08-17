import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const communityPaths = [
  {
    href: "/prayer",
    icon: "🙏",
    title: "Prayer",
    description: "Bring a need before God and pray with someone in the community.",
    action: "Open Prayer",
  },
  {
    href: "/praise",
    icon: "🙌",
    title: "Praise",
    description: "Celebrate answered prayer and the ways God is showing His faithfulness.",
    action: "Open Praise",
  },
  {
    href: "/testimonies",
    icon: "✝️",
    title: "Testimonies",
    description: "Read stories of grace, restoration, perseverance, and hope.",
    action: "Read Testimonies",
  },
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
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">The Lost and Found Project</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">You don&apos;t have to carry it alone.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-indigo-100/80">A Christian community where people bring needs before God, celebrate His faithfulness, and share stories that help others find hope.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="lfp-button bg-amber-300 text-slate-950 shadow-xl hover:bg-amber-200">Join the Community</Link>
              <Link href="/login" className="lfp-button border border-white/20 bg-white/10 text-white">Sign In</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="lfp-shell py-12 sm:py-16">
        <section aria-labelledby="three-ways-title">
          <div className="mx-auto max-w-3xl text-center">
            <p className="lfp-eyebrow">Pray. Praise. Testify.</p>
            <h2 id="three-ways-title" className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Three ways to walk with the community</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">Each community page brings its stories, actions, and two-line ticker together in one place.</p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 md:items-start xl:grid-cols-3">
            {communityPaths.map((path) => (
              <Link key={path.href} href={path.href} className="group lfp-card flex h-full flex-col p-6 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-2xl ring-1 ring-indigo-100" aria-hidden="true">{path.icon}</span>
                <h3 className="mt-5 text-2xl font-black text-slate-950">{path.title}</h3>
                <p className="mt-2 flex-1 leading-7 text-slate-600">{path.description}</p>
                <span className="mt-5 font-black text-indigo-700 group-hover:text-indigo-600">{path.action} →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-[2rem] border border-indigo-100 bg-indigo-50/70 p-7 text-center shadow-sm sm:p-10">
          <h2 className="text-2xl font-black text-slate-950">There is a place for you here.</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600">Create a free Community Member account to submit prayer requests, pray with others, share praise, and tell your testimony.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="lfp-button lfp-button-primary">Create Account</Link>
            <Link href="/login" className="lfp-button border border-slate-200 bg-white text-slate-800">Sign In</Link>
            <Link href="/apps" className="lfp-button border border-indigo-200 bg-white text-indigo-800">Explore Future Apps</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
