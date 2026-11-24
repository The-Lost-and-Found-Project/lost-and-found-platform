import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEffectiveRole } from "@/lib/effective-role";

export default async function AdminPrayerReviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=%2Fadmin%2Fprayer-review");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, preview_role, is_active")
    .eq("id", user.id)
    .single();

  if (profile?.is_active !== true || getEffectiveRole(profile?.role, profile?.preview_role) !== "admin") {
    redirect("/dashboard");
  }

  const { data: submissions, error } = await supabase
    .from("prayer_requests")
    .select("id, request_text, created_at, status")
    .is("user_id", null)
    .eq("is_public", true)
    .eq("moderation_status", "pending")
    .order("created_at", { ascending: true });

  return (
    <main className="lfp-page">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="border-b border-slate-200 pb-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Prayer &amp; Community</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Visitor prayer review</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Public prayer submissions from visitors waiting for review. Member prayer requests are not included here.
          </p>
        </header>

        {error ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-900">
            The prayer review queue could not be loaded. Please try again later.
          </div>
        ) : submissions?.length ? (
          <ol className="divide-y divide-slate-200 border-y border-slate-200">
            {submissions.map((submission) => (
              <li key={submission.id} className="space-y-3 py-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <time dateTime={submission.created_at} className="text-xs font-semibold text-slate-500">
                    Submitted {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(submission.created_at))}
                  </time>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
                    {submission.status || "Submitted"}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">{submission.request_text}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
            There are no visitor prayer submissions waiting for review.
          </p>
        )}

        <p className="text-xs leading-5 text-slate-500">
          This queue is read-only. Approval actions remain unavailable until the moderation audit trail is in place.
        </p>
      </div>
    </main>
  );
}
