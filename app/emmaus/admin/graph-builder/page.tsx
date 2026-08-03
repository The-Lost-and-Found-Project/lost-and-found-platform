import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FounderGraphBuilder from "@/components/emmaus/FounderGraphBuilder";
import FounderGraphNavigator from "@/components/emmaus/FounderGraphNavigator";

export default async function EmmausFounderGraphBuilderPage() {
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
      <div className="mx-auto max-w-[1800px] px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Emmaus Founder Studio</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Build the Scripture graph visually.</h1>
              <p className="mt-4 text-lg leading-8 text-indigo-100/70">Create and arrange nodes, draw relationships, document evidence, monitor graph health, and publish connections directly into the learner-facing Knowledge Graph.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/emmaus/admin/graph" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-black text-white">Preview Explorer</Link>
              <Link href="/emmaus/admin/dashboard" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">← Founder Dashboard</Link>
            </div>
          </div>
        </header>

        <FounderGraphNavigator />
        <FounderGraphBuilder />
      </div>
    </main>
  );
}
