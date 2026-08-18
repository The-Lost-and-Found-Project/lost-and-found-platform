import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createKjvSupabaseProvider } from "@/lib/scripture/kjv-supabase-provider";

export default async function BiblePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/study/bible");
  }

  const provider = createKjvSupabaseProvider(supabase);
  const chapter = await provider.getChapter({
    translation: "KJV",
    book: "John",
    chapter: 1,
  });

  return (
    <main className="bible-shell">
      <article className="bible-reader">
        <header className="bible-header">
          <div>
            <p className="eyebrow">Emmaus Bible</p>
            <h1>{chapter.book} {chapter.chapter}</h1>
            <p className="lede">Read first. Study deeper when you are ready.</p>
          </div>
          <div className="translation-badge">
            <strong>{chapter.translation}</strong>
            <span>{chapter.translationName}</span>
          </div>
        </header>

        <section className="scripture-reader" aria-label={`${chapter.book} ${chapter.chapter}`}>
          {chapter.verses.map((verse) => (
            <p key={verse.canonicalKey} id={verse.canonicalKey} className="scripture-verse">
              <sup>{verse.number}</sup>
              <span>{verse.text}</span>
            </p>
          ))}
        </section>

        <footer className="scripture-source">
          <p>{chapter.source}</p>
          {chapter.attribution && <p>{chapter.attribution}</p>}
        </footer>
      </article>
    </main>
  );
}
