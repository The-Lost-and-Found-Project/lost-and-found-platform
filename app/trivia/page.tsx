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
        get started.
      </p>

      <TriviaClient userId={user.id} bestScores={bestScores} />
    </div>
  );
}
