import ScriptureImporter from "@/components/emmaus/ScriptureImporter";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ImporterPageProps = {
  searchParams: Promise<{
    book?: string;
    chapter?: string;
    translation?: string;
  }>;
};

export default async function EmmausScriptureImporterPage({ searchParams }: ImporterPageProps) {
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
  const initialBook = cleanBook(params.book);
  const initialChapter = cleanChapter(params.chapter);
  const initialTranslation = params.translation === "WEB" ? "WEB" : "KJV";

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-white to-indigo-50/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <ScriptureImporter
          initialBook={initialBook}
          initialChapter={initialChapter}
          initialTranslation={initialTranslation}
        />
      </div>
    </main>
  );
}

function cleanBook(value?: string) {
  const decoded = value?.trim();
  return decoded && decoded.length <= 40 ? decoded : "John";
}

function cleanChapter(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 150 ? parsed : 1;
}
