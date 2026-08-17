import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TriviaClient from "@/components/TriviaClient";

export default async function TriviaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const { data: categoryRows } = await supabase
    .from("trivia_categories")
    .select("id, name, description")
    .eq("is_active", true)
    .order("sort_order");

  const { data: approvedRows } = await supabase
    .from("trivia_questions")
    .select("category_id")
    .eq("status", "approved");

  const approvedCounts: Record<string, number> = {};
  (approvedRows ?? []).forEach((row) => {
    approvedCounts[row.category_id] = (approvedCounts[row.category_id] ?? 0) + 1;
  });

  const categories = (categoryRows ?? []).map((category) => ({
    ...category,
    approvedCount: approvedCounts[category.id] ?? 0,
  }));

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("category, score, total_questions")
    .eq("user_id", user.id);

  const bestScores: Record<string, { score: number; totalQuestions: number }> = {};
  (attempts ?? []).forEach((attempt) => {
    const existing = bestScores[attempt.category];
    if (!existing || attempt.score > existing.score) {
      bestScores[attempt.category] = {
        score: attempt.score,
        totalQuestions: attempt.total_questions,
      };
    }
  });

  const playableCategories = categories.filter((category) => category.approvedCount > 0).length;
  const totalQuestions = categories.reduce((sum, category) => sum + category.approvedCount, 0);
  const completedCategories = Object.keys(bestScores).length;
  const firstName = profile?.full_name?.trim().split(" ")[0] || "friend";

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(124,58,237,0.34),transparent_32rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-14 sm:py-20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Bible Trivia</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">Learn the Word by testing what you know, {firstName}.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Choose a category, answer a fresh set of shuffled questions, and use every result as an opportunity to strengthen biblical understanding.</p>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            <TriviaStat label="Playable categories" value={String(playableCategories)} />
            <TriviaStat label="Approved questions" value={String(totalQuestions)} />
            <TriviaStat label="Categories attempted" value={String(completedCategories)} />
          </div>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <section className="grid gap-5 md:grid-cols-3">
          <TriviaValue icon="🧠" title="Recall" text="Strengthen biblical memory through repeated exposure to people, places, events, themes, and Scripture." />
          <TriviaValue icon="📖" title="Learn" text="Treat every missed question as a doorway into deeper understanding rather than a failure." />
          <TriviaValue icon="✦" title="Grow" text="Track your best scores without turning spiritual formation into a competition or popularity system." />
        </section>

        <section className="mt-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/92 p-5 shadow-2xl sm:p-8">
          <div className="mb-8 max-w-3xl">
            <p className="lfp-eyebrow">Choose a challenge</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Where do you want to test yourself?</h2>
            <p className="mt-3 text-lg leading-8 text-slate-600">Questions are shuffled each time. Categories without approved questions remain unavailable until their content is ready.</p>
          </div>
          <TriviaClient userId={user.id} categories={categories} bestScores={bestScores} />
        </section>
      </div>
    </main>
  );
}

function TriviaStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur"><p className="text-3xl font-black">{value}</p><p className="mt-1 text-sm text-indigo-100/60">{label}</p></div>;
}

function TriviaValue({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <article className="lfp-card p-6"><span className="text-3xl" aria-hidden="true">{icon}</span><h2 className="mt-5 text-xl font-black text-slate-950">{title}</h2><p className="mt-3 leading-7 text-slate-600">{text}</p></article>;
}
