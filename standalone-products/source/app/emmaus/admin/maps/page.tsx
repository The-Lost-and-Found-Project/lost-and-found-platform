import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FounderMapStudio from "@/components/emmaus/FounderMapStudio";

export default async function EmmausFounderMapStudioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-indigo-50/60 pb-28 lg:pb-12">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Emmaus Founder Studio</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Build guided Discovery Maps.</h1>
              <p className="mt-4 text-lg leading-8 text-indigo-100/70">Create structured journeys, optional branches, challenge stops, prerequisites, reflection prompts, and publish-ready pathways without editing code.</p>
            </div>
            <Link href="/emmaus/admin/dashboard" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white">← Founder Dashboard</Link>
          </div>
        </header>

        <FounderMapStudio />
      </div>
    </main>
  );
}
