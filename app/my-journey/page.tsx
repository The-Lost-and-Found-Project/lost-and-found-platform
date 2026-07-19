import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MyJourneyClient from "@/components/MyJourneyClient";

export default async function MyJourneyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("date_of_salvation, date_of_baptism")
    .eq("id", user.id)
    .single();

  const { data: requests } = await supabase
    .from("prayer_requests")
    .select(
      "id, created_at, request_text, status, category_id, is_public, is_anonymous, moderation_status"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: categories } = await supabase
    .from("prayer_categories")
    .select("id, name");

  const { data: entries } = await supabase
    .from("journey_entries")
    .select("id, entry_type, title, notes, entry_date, created_at")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false });

  const { data: testimony } = await supabase
    .from("testimonies")
    .select("content_text, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const categoryMap: Record<string, string> = {};
  (categories ?? []).forEach((c) => {
    categoryMap[c.id] = c.name;
  });

  return (
    <MyJourneyClient
      email={user.email ?? ""}
      dateOfSalvation={profile?.date_of_salvation ?? ""}
      dateOfBaptism={profile?.date_of_baptism ?? ""}
      requests={requests ?? []}
      categoryMap={categoryMap}
      entries={entries ?? []}
      testimony={testimony ?? null}
    />
  );
}
