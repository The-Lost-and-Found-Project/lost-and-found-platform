import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SavedStudyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/study/saved");

  const [{ data: notes }, { data: bookmarks }, { data: highlights }] = await Promise.all([
    supabase.from("emmaus_verse_notes").select("canonical_key, reference_label, translation, note_text, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("emmaus_verse_bookmarks").select("canonical_key, reference_label, translation, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("emmaus_verse_highlights").select("canonical_key, reference_label, translation, highlight_style, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }),
  ]);

  return (
    <main className="shell">
      <section className="hero saved-material" aria-labelledby="saved-title">
        <p className="eyebrow">Emmaus Study</p>
        <h1 id="saved-title">Saved Study Material</h1>
        <p className="lede">Your notes, bookmarks, and highlights in one place.</p>
        <div className="saved-grid">
          <section className="saved-section"><h2>Notes</h2>{notes?.length ? notes.map((item) => <article className="saved-item" key={`${item.translation}:${item.canonical_key}`}><p className="saved-reference">{item.reference_label} · {item.translation}</p><p>{item.note_text || "Empty note"}</p></article>) : <p className="saved-empty">No verse notes yet.</p>}</section>
          <section className="saved-section"><h2>Bookmarks</h2>{bookmarks?.length ? bookmarks.map((item) => <article className="saved-item" key={`${item.translation}:${item.canonical_key}`}><p className="saved-reference">★ {item.reference_label} · {item.translation}</p></article>) : <p className="saved-empty">No bookmarks yet.</p>}</section>
          <section className="saved-section"><h2>Highlights</h2>{highlights?.length ? highlights.map((item) => <article className="saved-item" key={`${item.translation}:${item.canonical_key}`}><p className="saved-reference">{item.reference_label} · {item.translation}</p><p>Highlight: {item.highlight_style}</p></article>) : <p className="saved-empty">No highlights yet.</p>}</section>
        </div>
        <div className="actions"><Link className="secondary-action" href="/study">Back to study</Link><Link className="primary-action" href="/study/bible">Open Bible</Link></div>
      </section>
    </main>
  );
}
