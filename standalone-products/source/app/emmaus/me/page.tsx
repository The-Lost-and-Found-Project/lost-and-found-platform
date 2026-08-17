import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EmmausMePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: progress }] = await Promise.all([
    supabase.from("profiles").select("full_name, role, is_active").eq("id", user.id).single(),
    supabase.from("emmaus_discovery_progress").select("id, is_completed").eq("user_id", user.id),
  ]);

  const rows = progress ?? [];
  const completed = rows.filter((row) => row.is_completed).length;
  const inProgress = rows.length - completed;
  const firstName = profile?.full_name?.trim().split(" ")[0] || "friend";
  const canOpenStudio = profile?.role === "admin" && profile.is_active !== false;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 pb-28 text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-5 flex justify-end">
          <Link href="/dashboard" className="inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15">
            Open Lost & Found Platform
          </Link>
        </div>
        <header className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">My Emmaus</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Keep walking, {firstName}.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Review your journey, continue a discovery, or bring what is on your heart to prayer.</p>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-2">
          <Metric value={inProgress} label="Discoveries in progress" />
          <Metric value={completed} label="Discoveries completed" />
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <Action href="/emmaus/walk" title="Continue Your Journey" description="Return to the next meaningful step in your walk." />
          <Action href="/emmaus/profile/learning" title="Learning Profile" description="See study patterns without turning growth into a spiritual score." />
          <Action href="/emmaus/prayer" title="Prayer" description="Share a request or pray with the wider community." />
        </section>

        {canOpenStudio && (
          <section className="mt-10 rounded-[2rem] border border-amber-300/25 bg-amber-300/10 p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-200">Administrative tools</p>
            <h2 className="mt-2 text-2xl font-black">Founder Studio</h2>
            <p className="mt-3 max-w-2xl leading-7 text-amber-50/75">Content-building and review tools are kept outside the learner path.</p>
            <Link href="/emmaus/admin/dashboard" className="mt-6 inline-flex rounded-full bg-amber-300 px-5 py-3 font-black text-slate-950">Open Founder Studio</Link>
          </section>
        )}
      </div>
    </main>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6"><p className="text-4xl font-black text-amber-300">{value}</p><p className="mt-2 font-black">{label}</p></div>;
}

function Action({ href, title, description }: { href: string; title: string; description: string }) {
  return <Link href={href} className="rounded-3xl border border-white/10 bg-black/20 p-6 transition hover:border-indigo-300/40 hover:bg-white/10"><h2 className="text-xl font-black">{title}</h2><p className="mt-3 text-sm leading-6 text-indigo-100/65">{description}</p><p className="mt-5 text-sm font-black text-amber-300">Open →</p></Link>;
}
