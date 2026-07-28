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
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Access Restricted
        </h1>
        <p className="mt-4 text-gray-600">
          This area is reserved for Community Admins. If you believe you
          should have access, please contact your ministry admin.
        </p>
      </div>
    );
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
