import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminTriviaClient from "@/components/AdminTriviaClient";
import { getEffectiveRole } from "@/lib/effective-role";

export default async function AdminTriviaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, preview_role")
    .eq("id", user.id)
    .single();

  const effectiveRole = getEffectiveRole(profile?.role, profile?.preview_role);

  // Managing quiz content (adding categories, approving AI-authored
  // questions) is admin-only, same restriction as Manage Users / Content.
  if (effectiveRole !== "admin") {
    redirect("/dashboard");
  }

  const { data: categories } = await supabase
    .from("trivia_categories")
    .select("id, name, description, sort_order, is_active")
    .order("sort_order");

  const { data: questions } = await supabase
    .from("trivia_questions")
    .select(
      "id, category_id, question, choices, correct, ref, note, status, source, created_at"
    )
    .order("created_at", { ascending: false });

  return (
    <AdminTriviaClient
      categories={categories ?? []}
      questions={questions ?? []}
    />
  );
}
