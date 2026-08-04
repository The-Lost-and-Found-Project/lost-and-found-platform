import DiscoveryBuilder from "@/components/emmaus/DiscoveryBuilder";
import EmmausCommandCenter from "@/components/emmaus/EmmausCommandCenter";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EmmausAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-indigo-50/50">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 sm:py-12">
        <EmmausCommandCenter />

        <section id="discovery-builder" className="scroll-mt-8">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">
              Content Production
            </p>
            <h2 className="mt-1 text-3xl font-black text-slate-950">
              Discovery Builder
            </h2>
            <p className="mt-2 max-w-3xl text-slate-600">
              Build and maintain discovery paths after reviewing whole-canon progress in the Command Center.
            </p>
          </div>
          <DiscoveryBuilder />
        </section>
      </div>
    </main>
  );
}
