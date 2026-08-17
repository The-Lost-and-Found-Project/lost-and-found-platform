import Link from "next/link";
import { redirect } from "next/navigation";
import DiscoveryComposer from "@/components/emmaus/DiscoveryComposer";
import { createClient } from "@/lib/supabase/server";

export default async function DiscoveryComposerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/emmaus/walk");

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-7 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Emmaus Founder Studio</p>
              <h1 className="mt-3 text-4xl font-black sm:text-6xl">Discovery Composer</h1>
              <p className="mt-4 text-lg leading-8 text-indigo-100/75">
                Compose a structured, adaptive Discovery from Scripture, approved graph connections, learner depth, study length, and ministry competencies.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/emmaus/admin/dashboard" className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                Founder Dashboard
              </Link>
              <Link href="/emmaus/discovery/demo" className="rounded-full bg-amber-300 px-4 py-2 text-sm font-black text-slate-950">
                Preview Learner Walk
              </Link>
            </div>
          </div>
        </header>

        <DiscoveryComposer />
      </div>
    </main>
  );
}
