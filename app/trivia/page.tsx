import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TriviaClient from "@/components/TriviaClient";

export default async function TriviaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: categoryRows } = await supabase
    .from("trivia_categories")
    .select("id, name, description")
    .eq("is_active", true)
    .order("sort_order");

  // Only approved questions are ever shown to members, so count those per
  // category to know which categories are actually playable right now (a
  // brand new category can exist with only pending questions awaiting
  // admin review).
  const { data: approvedRows } = await supabase
    .from("trivia_questions")
    .select("category_id")
    .eq("status", "approved");

  const approvedCounts: Record<string, number> = {};
  (approvedRows ?? []).forEach((r) => {
    approvedCounts[r.category_id] = (approvedCounts[r.category_id] ?? 0) + 1;
  });

  const categories = (categoryRows ?? []).map((c) => ({
    ...c,
    approvedCount: approvedCounts[c.id] ?? 0,
  }));

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("category, score, total_questions")
    .eq("user_id", user.id);

  const bestScores: Record<string, { score: number; totalQuestions: number }> = {};
  (attempts ?? []).forEach((a) => {
    const existing = bestScores[a.category];
    if (!existing || a.score > existing.score) {
      bestScores[a.category] = {
        score: a.score,
        totalQuestions: a.total_questions,
      };
    }
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Bible Trivia Challenge</h1>
      <p className="mt-2 text-gray-600">
        Test your Bible knowledge, learn Scripture, and discover how
        God&rsquo;s Word speaks into everyday life. Pick a category below to
        get started &mdash; questions are shuffled fresh each time you play.
      </p>

      <TriviaClient userId={user.id} categories={categories} bestScores={bestScores} />
    </div>
  );
}
