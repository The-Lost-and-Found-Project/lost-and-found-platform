import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScriptureChapter, ScriptureProvider } from "@/lib/scripture/types";

export function createKjvSupabaseProvider(supabase: SupabaseClient): ScriptureProvider {
  return {
    id: "emmaus-kjv-supabase",
    translations: ["KJV"] as const,
    async getChapter({ book, chapter, translation }) {
      if (translation !== "KJV") {
        throw new Error(`Translation ${translation} is not supported by this provider.`);
      }

      if (!book.trim() || book.length > 40) {
        throw new Error("A valid Bible book is required.");
      }

      if (!Number.isInteger(chapter) || chapter < 1 || chapter > 150) {
        throw new Error("Chapter must be an integer between 1 and 150.");
      }

      const { data, error } = await supabase
        .from("emmaus_scripture_nodes")
        .select("reference_key, reference_label, book, chapter, verse_start, text_content")
        .eq("translation", "KJV")
        .eq("book", book.trim())
        .eq("chapter", chapter)
        .eq("status", "published")
        .order("verse_start", { ascending: true });

      if (error) {
        throw new Error(`Emmaus KJV corpus query failed: ${error.message}`);
      }

      if (!data?.length) {
        throw new Error(`No published KJV text found for ${book} ${chapter}.`);
      }

      const result: ScriptureChapter = {
        translation: "KJV",
        translationName: "King James Version",
        book: data[0].book,
        chapter: data[0].chapter,
        verses: data.map((verse) => ({
          number: verse.verse_start,
          text: verse.text_content,
          canonicalKey: verse.reference_key,
          reference: verse.reference_label,
        })),
        source: "Emmaus verified KJV corpus",
        attribution: "King James Version · public-domain text in the United States",
      };

      return result;
    },
  };
}
