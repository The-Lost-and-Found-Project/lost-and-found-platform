import ThreadGraphBuilder from "@/components/emmaus/ThreadGraphBuilder";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EmmausThreadGraphPage() {
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
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <ThreadGraphBuilder />
      </div>
    </main>
  );
}
