import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function StudyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/study");

  return (
    <main className="shell">
      <section className="hero" aria-labelledby="study-title">
        <p className="eyebrow">Emmaus Study</p>
        <h1 id="study-title">Welcome back</h1>
        <p className="lede">Read Scripture cleanly, then move into guided discovery when you are ready.</p>
        <div className="study-list">
          <article className="study-card"><p className="eyebrow">Bible</p><h2>Read John 1</h2><p>Open the first provider-backed Bible reader checkpoint using the verified Emmaus KJV corpus.</p><Link className="primary-action" href="/study/bible">Open Bible</Link></article>
          <article className="study-card"><p className="eyebrow">Saved Material</p><h2>Your study library</h2><p>Review your verse notes, bookmarks, and highlights in one private place.</p><Link className="primary-action" href="/study/saved">View saved material</Link></article>
          <article className="study-card"><p className="eyebrow">John 1:1</p><h2>The Eternal Word</h2><p>Read, observe, wonder, connect, apply, and pray through John&apos;s opening claim about Jesus.</p><Link className="primary-action" href="/study/discover/john-1">Begin discovery</Link></article>
        </div>
      </section>
    </main>
  );
}
