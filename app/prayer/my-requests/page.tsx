import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MyPrayerRequestsClient from "@/components/MyPrayerRequestsClient";

export default async function MyPrayerRequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/prayer/my-requests");

  const [{ data: requests }, { data: categories }] = await Promise.all([
    supabase
      .from("prayer_requests")
      .select("id, created_at, request_text, status, category_id, is_public, is_anonymous, moderation_status, answered, answered_update, archived, prayer_count")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("prayer_categories").select("id, name").order("sort_order"),
  ]);

  return (
    <main className="lfp-page pb-20">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(79,70,229,0.34),transparent_32rem),radial-gradient(circle_at_10%_100%,rgba(245,190,67,0.2),transparent_28rem)]" />
        <div className="lfp-shell relative py-12 sm:py-16">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">Prayer</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">My Prayer Requests</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-indigo-100/75">Review what you have shared, make an update, or mark a prayer answered. Your requests are never assigned to another member.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/prayer/submit" className="lfp-button bg-amber-300 text-slate-950">Share a New Request</Link>
            <Link href="/prayer" className="lfp-button border border-white/20 bg-white/10 text-white">Open Prayer Wall</Link>
          </div>
        </div>
      </section>

      <div className="lfp-shell py-10 sm:py-14">
        <MyPrayerRequestsClient requests={requests ?? []} categories={categories ?? []} />
      </div>
    </main>
  );
}
