import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function StudyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/study");
  }

  return (
    <main className="shell">
      <section className="hero" aria-labelledby="study-title">
        <p className="eyebrow">Emmaus Study</p>
        <h1 id="study-title">Welcome back</h1>
        <p className="lede">
          Continue with a focused guided discovery. We are migrating one proven study flow at a time.
        </p>
        <div className="study-list">
          <article className="study-card">
            <p className="eyebrow">John 1:1</p>
            <h2>The Eternal Word</h2>
            <p>Read, observe, wonder, connect, apply, and pray through John&apos;s opening claim about Jesus.</p>
            <Link className="primary-action" href="/study/discover/john-1">
              Begin discovery
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
