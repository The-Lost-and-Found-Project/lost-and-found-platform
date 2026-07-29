import { createClient } from "@/lib/supabase/server";
import DevotionsClient from "@/components/DevotionsClient";

export default async function DevotionsPage() {
  const supabase = await createClient();

  const { data: weeks } = await supabase
    .from("devotion_weeks")
    .select("id, week_number, title, days, published_at")
    .eq("status", "published")
    .order("week_number", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Daily Devotions</h1>
      <p className="mt-2 text-gray-600">
        Start your day rooted in God&rsquo;s Word, encouraged by truth, and
        reminded that you are never too far gone for God&rsquo;s grace. A new
        week publishes every week -- work through the current one below in
        any order, or revisit a past week further down.
      </p>

      <DevotionsClient weeks={weeks ?? []} />
    </div>
  );
}
