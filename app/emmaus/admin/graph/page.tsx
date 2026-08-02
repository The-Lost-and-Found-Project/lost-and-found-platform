import ScriptureGraphExplorer from "@/components/emmaus/ScriptureGraphExplorer";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type GraphPageProps = {
  searchParams: Promise<{
    reference?: string;
    translation?: string;
  }>;
};

export default async function EmmausScriptureGraphPage({ searchParams }: GraphPageProps) {
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

  const params = await searchParams;
  const initialReference = cleanReference(params.reference);
  const initialTranslation = params.translation === "WEB" ? "WEB" : "KJV";

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-indigo-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <ScriptureGraphExplorer
          initialReference={initialReference}
          initialTranslation={initialTranslation}
        />
      </div>
    </main>
  );
}

function cleanReference(value?: string) {
  const reference = value?.trim();
  if (!reference || reference.length > 60) return "John 1:1";
  return /^.+?\s+\d+:\d+(?:[-–]\d+)?$/.test(reference) ? reference : "John 1:1";
}
