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
          Your protected study space is connected to your Emmaus session.
        </p>
        <p className="status">
          Authentication checkpoint only. Bible and discovery features have not been migrated into this route yet.
        </p>
      </section>
    </main>
  );
}
