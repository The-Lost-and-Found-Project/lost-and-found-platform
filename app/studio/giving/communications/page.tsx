import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CommunicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <main className="lfp-page">
      <div className="lfp-shell py-10">
        <Link href="/studio/giving">← Giving &amp; Stewardship</Link>
        <h1 className="mt-6 text-4xl font-black">Email &amp; Communications</h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Manage stewardship communications while keeping transaction receipts with Zeffy.
        </p>
      </div>
    </main>
  );
}
